"""Send email via SMTP. If SMTP is not configured, logs and no-ops."""
from __future__ import annotations

import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body_plain: str) -> None:
    """Send an email. If SMTP is not configured (smtp_host empty), log and return."""
    settings = get_settings()
    if not (settings.smtp_host and settings.smtp_host.strip()):
        logger.info("Email not sent (SMTP not configured): to=%s subject=%s", to, subject)
        return
    try:
        import smtplib
        from email.mime.text import MIMEText

        msg = MIMEText(body_plain, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = settings.email_from
        msg["To"] = to

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
            smtp.starttls()
            if settings.smtp_user and settings.smtp_password:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.sendmail(settings.email_from, [to], msg.as_string())
        logger.info("Email sent to %s: %s", to, subject)
    except Exception as e:
        logger.exception("Failed to send email to %s: %s", to, e)
        raise
