"""SMTP email sender for password recovery and notifications.
Reads SMTP config from the database (smtp_config table), falls back to env vars.
"""

from email.message import EmailMessage
from html import escape

import aiosmtplib
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.models import SmtpConfig


async def _get_smtp_config(db: AsyncSession | None = None) -> dict:
    """Get SMTP config from DB, falling back to environment config."""
    if db is not None:
        try:
            result = await db.execute(select(SmtpConfig).limit(1))
            config = result.scalar_one_or_none()
            # La fila DB manda si existe con host; user/password son OPCIONALES
            # (relay interno sin auth: 100.111.166.119:25)
            if config and config.host:
                return {
                    "host": config.host,
                    "port": config.port or 25,
                    "user": config.user or "",
                    "password": config.password or "",
                    "from_email": config.from_email or settings.smtp_from,
                    "from_name": config.from_name or settings.smtp_from_name,
                }
        except Exception:
            pass

    # Fallback to env vars
    return {
        "host": settings.smtp_host,
        "port": settings.smtp_port,
        "user": settings.smtp_user,
        "password": settings.smtp_password,
        "from_email": settings.smtp_from,
        "from_name": settings.smtp_from_name,
    }


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: str | None = None,
    db: AsyncSession | None = None,
) -> bool:
    """Send an HTML email via SMTP."""
    cfg = await _get_smtp_config(db)
    msg = EmailMessage()
    msg["From"] = f"{cfg['from_name']} <{cfg['from_email']}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text or _strip_html(html))
    msg.add_alternative(html, subtype="html")

    try:
        # Relay interno (25) sin auth ni TLS; 587 con STARTTLS; 465 TLS implícito.
        # aiosmtplib omite AUTH si username/password son None.
        await aiosmtplib.send(
            msg,
            hostname=cfg["host"],
            port=cfg["port"],
            username=cfg["user"] or None,
            password=cfg["password"] or None,
            start_tls=cfg["port"] not in (25, 465),
            use_tls=(cfg["port"] == 465),
        )
        return True
    except Exception:
        return False


async def send_password_reset_email(
    to: str,
    name: str,
    token: str,
    db: AsyncSession | None = None,
) -> bool:
    """Send a password reset email with a one-time link."""
    reset_url = f"{settings.frontend_url}/reset-password?token={token}"
    subject = "Recuperación de contraseña - Gastos App"

    html = f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px;">
    <h2 style="margin-top: 0; color: #1a1a2e;">Recuperar contraseña</h2>
    <p style="color: #555; line-height: 1.6;">Hola <strong>{name}</strong>,</p>
    <p style="color: #555; line-height: 1.6;">
      Has solicitado restablecer tu contraseña de <strong>Gastos App</strong>.
      Haz clic en el botón de abajo para crear una nueva:
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{reset_url}" style="display: inline-block; background: #1a1a2e; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold;">
        Restablecer contraseña
      </a>
    </div>
    <p style="color: #888; font-size: 13px;">
      Este enlace expirará en <strong>1 hora</strong>.
      Si no has solicitado este cambio, ignora este mensaje.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="color: #aaa; font-size: 12px; text-align: center;">Gastos App &mdash; cabrasky.net</p>
  </div>
</body>
</html>"""

    text = (
        f"Hola {name},\n\n"
        f"Has solicitado restablecer tu contraseña de Gastos App.\n\n"
        f"Abre el siguiente enlace para crear una nueva contraseña:\n"
        f"{reset_url}\n\n"
        f"Este enlace expirará en 1 hora.\n"
        f"Si no has solicitado este cambio, ignora este mensaje.\n\n"
        f"Gastos App — cabrasky.net"
    )

    return await send_email(to, subject, html, text, db=db)


def _strip_html(html: str) -> str:
    """Crude HTML-to-text fallback."""
    import re
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── Soporte y pruebas (panel de admin) ───────────────────────────────────────

def _card(title: str, intro: str, quote: str = "", button_url: str = "", button_label: str = "") -> str:
    """Plantilla simple. `intro` es HTML propio; `quote` es texto del usuario (se escapa)."""
    quote_html = (
        f'<blockquote style="margin: 16px 0; padding: 12px 16px; background: #F5F2EA; border-left: 3px solid #FF5A36; '
        f'border-radius: 6px; color: #2E3F36; white-space: pre-wrap;">{escape(quote)}</blockquote>'
    ) if quote else ""
    button_html = (
        f'<div style="text-align: center; margin: 24px 0 8px;"><a href="{escape(button_url)}" '
        f'style="display: inline-block; background: #1E4D3A; color: #F6F2E8; text-decoration: none; '
        f'padding: 12px 28px; border-radius: 10px; font-weight: bold;">{escape(button_label)}</a></div>'
    ) if button_url else ""
    return f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #F1EEE6; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #FBFAF6; border-radius: 14px; padding: 28px;">
    <h2 style="margin-top: 0; color: #14261E;">{escape(title)}</h2>
    <p style="color: #56645C; line-height: 1.6;">{intro}</p>
    {quote_html}
    {button_html}
    <hr style="border: none; border-top: 1px solid #E2DDD0; margin: 24px 0 12px;">
    <p style="color: #8C978F; font-size: 12px; text-align: center;">miBolsillo &mdash; mibolsillo.cabrasky.net</p>
  </div>
</body></html>"""


async def send_support_new_ticket(
    admins: list[str], user_name: str, user_email: str, subject: str, body: str,
    db: AsyncSession | None = None,
) -> bool:
    """Aviso a los admins de una consulta nueva (o de una respuesta del usuario)."""
    url = f"{settings.frontend_url}/admin?tab=support"
    html = _card(
        f"Consulta de soporte: {subject}",
        f"<strong>{escape(user_name)}</strong> ({escape(user_email)}) ha escrito:",
        body, url, "Abrir en el panel",
    )
    ok = True
    for to in admins:
        ok = await send_email(to, f"[miBolsillo] Soporte: {subject}", html, db=db) and ok
    return ok


async def send_support_reply(
    to: str, name: str, subject: str, body: str, db: AsyncSession | None = None,
) -> bool:
    """Respuesta del admin al usuario."""
    url = f"{settings.frontend_url}/support"
    html = _card(
        "Respuesta a tu consulta",
        f"Hola <strong>{escape(name)}</strong>, hemos respondido a tu consulta «{escape(subject)}»:",
        body, url, "Ver la consulta",
    )
    return await send_email(to, f"Respuesta a tu consulta: {subject}", html, db=db)


async def send_test_email(to: str, db: AsyncSession | None = None) -> bool:
    html = _card("Correo de prueba", "Si lees esto, el envío de correo de miBolsillo funciona.")
    return await send_email(to, "[miBolsillo] Correo de prueba", html, db=db)
