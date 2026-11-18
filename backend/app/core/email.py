import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("npet.email")


def send_email(to: str, subject: str, body: str) -> None:
    """Envia um e-mail em texto puro via SMTP.

    Sem SMTP_HOST configurado (desenvolvimento), apenas registra o conteúdo no log.
    Falhas de envio são logadas e não propagadas: quem chama costuma rodar em
    BackgroundTasks, depois que a resposta HTTP já foi enviada.
    """
    if not settings.SMTP_HOST:
        logger.warning("SMTP não configurado; e-mail não enviado.\nPara: %s\nAssunto: %s\n\n%s", to, subject, body)
        return

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            if settings.SMTP_STARTTLS:
                smtp.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)
    except (smtplib.SMTPException, OSError):
        logger.exception("Falha ao enviar e-mail para %s", to)
