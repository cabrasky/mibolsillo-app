"""Authentication router: register, login, Google OAuth, JWT."""
import secrets
import re
import base64
import hashlib
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.models import User, ApiKey, OAuthConfig, SmtpConfig
from app.schemas.schemas import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserOut,
    UserUpdate,
    PasswordChangeRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
    SmtpConfigOut,
    SmtpConfigUpdate,
    OAuthConfigUpdate,
    OAuthConfigOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _is_allowed_redirect(url: str) -> bool:
    """Solo destinos propios: la web o el deep link de la app móvil."""
    return bool(url) and (
        url.startswith(settings.frontend_url)
        or url.startswith("mibolsilloapp://")
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_jwt(user_id: str, email: str, is_admin: bool = False) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "admin": is_admin,
        "exp": datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _verify_jwt(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except Exception:
        return None


def _generate_code(length: int = 16) -> str:
    return secrets.token_hex(length // 2).upper()[:length]


def _validate_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract current user from Bearer JWT or X-API-Key header. Raises 401 if invalid."""
    api_key = request.headers.get("X-API-Key", "").strip()
    if api_key:
        return await _user_from_api_key(api_key, db)

    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth.split(" ", 1)[1]
    payload = _verify_jwt(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def _hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


async def _user_from_api_key(key: str, db: AsyncSession) -> User:
    """Resolve a user from an API key (X-API-Key header). 401 si inválida o revocada."""
    key_hash = _hash_api_key(key)
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.key_hash == key_hash,
            ApiKey.revoked_at.is_(None),
        )
    )
    api_key_row = result.scalar_one_or_none()
    if api_key_row is None:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")

    result = await db.execute(select(User).where(User.id == api_key_row.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    api_key_row.last_used_at = datetime.utcnow()
    await db.flush()
    return user


async def require_admin(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Require admin role. Raises 403 if not admin."""
    user = await get_current_user(request, db)
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    return user


async def require_developer(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Require developer mode (or admin). Raises 403 if not enabled.

    Autoservicio: el propio usuario activa el modo desde la web. Los admins
    pasan siempre (acceso implícito).
    """
    user = await get_current_user(request, db)
    if not (user.is_developer or user.is_admin):
        raise HTTPException(status_code=403, detail="Developer mode is not enabled")
    return user


# ── Auth Endpoints ────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with email + password."""
    email = body.email.strip().lower()
    password = body.password
    name = body.name.strip()

    if not _validate_email(email):
        raise HTTPException(status_code=400, detail="Invalid email")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(
        email=email,
        password_hash=password_hash,
        name=name,
        code=_generate_code(16),
    )
    db.add(user)
    await db.flush()

    token = _make_jwt(user.id, user.email, user.is_admin)
    return AuthResponse(
        token=token,
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email + password."""
    email = body.email.strip().lower()
    password = body.password

    if not _validate_email(email) or not password:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    user.last_login = datetime.utcnow()
    token = _make_jwt(user.id, user.email, user.is_admin)
    return AuthResponse(
        token=token,
        user=UserOut.model_validate(user),
    )


@router.get("/google")
async def google_login(
    request: Request,
    redirect_to: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Redirect to Google OAuth consent screen.

    redirect_to (opcional): destino tras el login (web por defecto;
    la app móvil pasa su deep link, p.ej. gastosapp://oauth).
    """
    result = await db.execute(
        select(OAuthConfig).where(
            OAuthConfig.provider == "google",
            OAuthConfig.enabled == True,
        )
    )
    config = result.scalar_one_or_none()
    if not config or not config.client_id:
        raise HTTPException(status_code=400, detail="Google OAuth is not configured")

    redirect_uri = config.redirect_uri or f"{settings.app_url}/api/auth/google/callback"

    # El destino final viaja en `state` (Google solo devuelve state + code)
    target = redirect_to if _is_allowed_redirect(redirect_to) else settings.frontend_url
    state = f"{secrets.token_urlsafe(16)}.{base64.urlsafe_b64encode(target.encode()).decode()}"

    params = {
        "client_id": config.client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
    }
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{qs}")


@router.get("/google/callback")
async def google_callback(
    code: str = "",
    state: str = "",
    error: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback."""
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is missing")

    result = await db.execute(
        select(OAuthConfig).where(OAuthConfig.provider == "google")
    )
    config = result.scalar_one_or_none()
    if not config or not config.client_id:
        raise HTTPException(status_code=400, detail="Google OAuth is not configured")

    redirect_uri = config.redirect_uri or f"{settings.app_url}/api/auth/google/callback"

    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for tokens
            resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": config.client_id,
                    "client_secret": config.client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            token_data = resp.json()
            if "error" in token_data:
                raise HTTPException(status_code=400, detail="Could not obtain Google token")

            # Get user info
            resp2 = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            user_info = resp2.json()
            if "error" in user_info:
                raise HTTPException(status_code=400, detail="Could not obtain Google user data")

            google_id = user_info["sub"]
            email = user_info.get("email", "").lower()
            name = user_info.get("name", email.split("@")[0])
            avatar = user_info.get("picture", "")

            if not email:
                raise HTTPException(status_code=400, detail="Google did not provide an email")

            # Find or create user
            result = await db.execute(
                select(User).where(
                    (User.google_id == google_id) | (User.email == email)
                )
            )
            user = result.scalar_one_or_none()

            if user:
                user.last_login = datetime.utcnow()
                user.name = name
                if not user.google_id:
                    user.google_id = google_id
                if avatar:
                    user.avatar_url = avatar
            else:
                user = User(
                    email=email,
                    name=name,
                    google_id=google_id,
                    avatar_url=avatar,
                    code=_generate_code(16),
                )
                db.add(user)

            await db.flush()
            token = _make_jwt(user.id, user.email, user.is_admin)
            # Redirect back to the caller (web o deep link de la app) with token
            target = settings.frontend_url
            if state:
                try:
                    _, payload = state.split(".", 1)
                    decoded = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)).decode()
                    if _is_allowed_redirect(decoded):
                        target = decoded
                except Exception:
                    pass
            sep = "&" if "?" in target else "?"
            return RedirectResponse(f"{target}{sep}token={token}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google authentication failed: {e}")


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """Get current user profile."""
    return UserOut.model_validate(current_user)


@router.put("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edit current user profile (name, avatar)."""
    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")
        current_user.name = name
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url.strip()
    await db.flush()
    return UserOut.model_validate(current_user)


@router.put("/me/password", response_model=MessageResponse)
async def change_password(
    body: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password (asks for the current one if set)."""
    new_password = body.new_password
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if current_user.password_hash:
        if not bcrypt.checkpw(body.current_password.encode(), current_user.password_hash.encode()):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    current_user.reset_token = None
    current_user.reset_token_expires = None
    await db.flush()
    return MessageResponse(message="Contraseña actualizada correctamente")


# ── Password Recovery ─────────────────────────────────────────────────────────

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send password reset email with one-time token."""
    from app.mail import send_password_reset_email

    email = body.email.strip().lower()

    # Always return success to prevent email enumeration
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user and user.password_hash:
        token = secrets.token_urlsafe(48)
        user.reset_token = token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        await db.flush()

        sent = await send_password_reset_email(user.email, user.name, token, db=db)
        if not sent:
            raise HTTPException(status_code=500, detail="Could not send email")

    return MessageResponse(message="Si el email está registrado, recibirás un enlace para restablecer tu contraseña")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using a valid one-time token."""
    token = body.token.strip()
    new_password = body.password

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    result = await db.execute(
        select(User).where(
            User.reset_token == token,
            User.reset_token_expires > datetime.utcnow(),
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user.password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    user.reset_token = None
    user.reset_token_expires = None
    await db.flush()

    return MessageResponse(message="Contraseña actualizada correctamente")


# ═══════════════════════════════════════════════════════════════════════════════
#  ADMIN ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/admin/oauth")
async def get_oauth_config(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get OAuth configuration (admin only)."""
    result = await db.execute(
        select(OAuthConfig).order_by(OAuthConfig.provider)
    )
    configs = result.scalars().all()
    return {"configs": [OAuthConfigOut.model_validate(c) for c in configs]}


@router.put("/admin/oauth")
async def update_oauth_config(
    body: OAuthConfigUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update OAuth configuration (admin only)."""
    result = await db.execute(
        select(OAuthConfig).where(OAuthConfig.provider == body.provider)
    )
    config = result.scalar_one_or_none()

    if config:
        config.client_id = body.client_id
        config.client_secret = body.client_secret
        config.redirect_uri = body.redirect_uri
        config.enabled = body.enabled
        config.updated_at = datetime.utcnow()
    else:
        config = OAuthConfig(
            provider=body.provider,
            client_id=body.client_id,
            client_secret=body.client_secret,
            redirect_uri=body.redirect_uri,
            enabled=body.enabled,
        )
        db.add(config)

    await db.flush()
    return {"status": "updated"}

# Deprecated alias — kept for backward compatibility with existing router imports
get_user_from_bearer = get_current_user


# ── SMTP Admin ─────────────────────────────────────────────────────────────────

@router.get("/admin/smtp", response_model=SmtpConfigOut)
async def get_smtp_config(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get SMTP configuration (admin only, password masked)."""
    result = await db.execute(select(SmtpConfig).limit(1))
    config = result.scalar_one_or_none()
    if config:
        return SmtpConfigOut(
            host=config.host,
            port=config.port,
            user=config.user,
            from_email=config.from_email,
            from_name=config.from_name,
            password_set=bool(config.password),
        )
    # Return defaults
    return SmtpConfigOut(
        host=settings.smtp_host,
        port=settings.smtp_port,
        user=settings.smtp_user,
        from_email=settings.smtp_from,
        from_name=settings.smtp_from_name,
        password_set=False,
    )


@router.put("/admin/smtp")
async def update_smtp_config(
    body: SmtpConfigUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update SMTP configuration (admin only)."""
    result = await db.execute(select(SmtpConfig).limit(1))
    config = result.scalar_one_or_none()

    if config:
        config.host = body.host
        config.port = body.port
        config.user = body.user
        config.from_email = body.from_email
        config.from_name = body.from_name
        if body.password:
            config.password = body.password
        config.updated_at = datetime.utcnow()
    else:
        config = SmtpConfig(
            host=body.host,
            port=body.port,
            user=body.user,
            password=body.password,
            from_email=body.from_email,
            from_name=body.from_name,
        )
        db.add(config)

    await db.flush()
    return {"status": "updated"}
