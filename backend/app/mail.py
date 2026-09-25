"""Envío de correos (recuperar contraseña, soporte, prueba).

La configuración SMTP sale de la BD (tabla smtp_config) y, si no hay, del entorno.
Todos los correos usan la plantilla de app/email_layout.py.
"""

from datetime import datetime
from email.message import EmailMessage
from email.utils import make_msgid
from html import escape

import aiosmtplib
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.email_layout import LOGO_CID, LOGO_PATH, Email, render
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


def build_message(cfg: dict, to: str, subject: str, html: str, text: str) -> EmailMessage:
    """Mensaje multipart: texto + HTML, con el logo incrustado si la plantilla lo usa."""
    msg = EmailMessage()
    msg["From"] = f"{cfg['from_name']} <{cfg['from_email']}>"
    msg["To"] = to
    msg["Subject"] = " ".join(subject.split())  # sin saltos de línea (texto del usuario en el asunto)
    msg["Message-ID"] = make_msgid(domain=(cfg.get("from_email") or "mibolsillo").split("@")[-1])
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")
    if f"cid:{LOGO_CID}" in html and LOGO_PATH.exists():
        html_part = msg.get_payload()[1]
        html_part.add_related(LOGO_PATH.read_bytes(), maintype="image", subtype="png",
                              cid=f"<{LOGO_CID}>", filename="mibolsillo.png")
    return msg


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: str | None = None,
    db: AsyncSession | None = None,
) -> bool:
    """Send an HTML email via SMTP."""
    cfg = await _get_smtp_config(db)
    msg = build_message(cfg, to, subject, html, text or _strip_html(html))

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


async def send_rendered(to: str, email: Email, db: AsyncSession | None = None) -> bool:
    html, text = render(email)
    return await send_email(to, email.subject, html, text, db=db)


def _strip_html(html: str) -> str:
    """Crude HTML-to-text fallback."""
    import re
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _links() -> list[tuple[str, str]]:
    return [("Ayuda y soporte", f"{settings.frontend_url}/support"),
            ("Privacidad", f"{settings.frontend_url}/legal/privacidad")]


# ── Correos ───────────────────────────────────────────────────────────────────

def password_reset_email(to: str, name: str, token: str) -> Email:
    url = f"{settings.frontend_url}/reset-password?token={token}"
    return Email(
        subject="Restablece tu contraseña de miBolsillo",
        eyebrow="Tu cuenta",
        title="Restablece tu contraseña",
        preheader="El enlace caduca en 1 hora.",
        paragraphs=[
            f"Hola <strong>{escape(name)}</strong>,",
            "Hemos recibido una petición para restablecer la contraseña de tu cuenta de miBolsillo. "
            "Pulsa el botón para elegir una nueva.",
        ],
        button=("Crear una contraseña nueva", url),
        note="El enlace caduca en <strong>1 hora</strong> y solo sirve una vez. Si no lo has pedido tú, "
             "ignora este correo: tu contraseña no cambia.",
        reason=f"Te escribimos porque se pidió restablecer la contraseña de {escape(to)}.",
        footer_links=_links(),
    )


def support_new_ticket_email(user_name: str, user_email: str, subject: str, body: str,
                             ticket_id: str = "", is_reply: bool = False) -> Email:
    url = f"{settings.frontend_url}/admin?tab=support" + (f"&ticket={ticket_id}" if ticket_id else "")
    who = f"<strong>{escape(user_name)}</strong> ({escape(user_email)})"
    return Email(
        subject=f"[miBolsillo] Soporte: {subject}",
        eyebrow="Soporte",
        title=f"Respuesta de {user_name}" if is_reply else "Consulta nueva",
        preheader=body[:120],
        paragraphs=[f"{who} ha {'contestado en' if is_reply else 'escrito una consulta sobre'} «{escape(subject)}»:"],
        quote=body,
        button=("Abrir en el panel", url),
        reason="Recibes este aviso porque eres administrador de miBolsillo.",
    )


def support_reply_email(name: str, subject: str, body: str) -> Email:
    return Email(
        subject=f"Respuesta a tu consulta: {subject}",
        eyebrow="Soporte",
        title="Te hemos respondido",
        preheader=body[:120],
        paragraphs=[f"Hola <strong>{escape(name)}</strong>, tenemos respuesta a tu consulta «{escape(subject)}»:"],
        quote=body,
        quote_by="Soporte de miBolsillo",
        button=("Ver la consulta", f"{settings.frontend_url}/support"),
        note="Puedes contestar desde la web o la app, en <strong>Ayuda y soporte</strong>.",
        reason="Te escribimos porque enviaste una consulta al soporte de miBolsillo.",
        footer_links=_links(),
    )


def smtp_test_email() -> Email:
    return Email(
        subject="[miBolsillo] Correo de prueba",
        eyebrow="Sistema",
        title="Correo de prueba",
        preheader="El envío de correo funciona.",
        paragraphs=[
            "Si lees esto, el envío de correo de miBolsillo funciona.",
            f"Enviado el {datetime.utcnow():%d/%m/%Y a las %H:%M} (UTC) desde el panel de administración.",
        ],
        reason="Lo has enviado tú desde Administración → Sistema.",
    )


async def send_password_reset_email(to: str, name: str, token: str, db: AsyncSession | None = None) -> bool:
    """Send a password reset email with a one-time link."""
    return await send_rendered(to, password_reset_email(to, name, token), db=db)


async def send_support_new_ticket(
    admins: list[str], user_name: str, user_email: str, subject: str, body: str,
    db: AsyncSession | None = None, ticket_id: str = "", is_reply: bool = False,
) -> bool:
    """Aviso a los admins de una consulta nueva (o de una respuesta del usuario)."""
    email = support_new_ticket_email(user_name, user_email, subject, body, ticket_id, is_reply)
    ok = True
    for to in admins:
        ok = await send_rendered(to, email, db=db) and ok
    return ok


async def send_support_reply(to: str, name: str, subject: str, body: str, db: AsyncSession | None = None) -> bool:
    """Respuesta del admin al usuario."""
    return await send_rendered(to, support_reply_email(name, subject, body), db=db)


async def send_test_email(to: str, db: AsyncSession | None = None) -> bool:
    return await send_rendered(to, smtp_test_email(), db=db)
