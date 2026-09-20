import os
import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")
        sys.stderr.reconfigure(encoding="utf-8", errors="backslashreplace")
    except Exception:
        pass


def get_smtp_config():
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = (
        os.getenv("SMTP_USER")
        or os.getenv("SMTP_EMAIL")
        or os.getenv("MAIL_USERNAME")
        or ""
    ).strip()
    password = (
        os.getenv("SMTP_PASSWORD")
        or os.getenv("SMTP_PASS")
        or os.getenv("MAIL_PASSWORD")
        or ""
    ).strip()
    sender = (
        os.getenv("SMTP_FROM")
        or os.getenv("MAIL_FROM")
        or user
        or "noreply@rakshak-ai.org"
    ).strip()
    return host, port, user, password, sender


def send_reset_code_email(to_email: str, recipient_name: str, code: str) -> dict:
    host, port, user, password, sender = get_smtp_config()
    clean_to = to_email.strip().lower()
    clean_name = (recipient_name or "User").strip()

    subject = f"Rakshak Ai - Password Reset Code: {code}"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1329; color: #f8fafc; margin: 0; padding: 20px; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
    .logo {{ display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }}
    .logo-badge {{ background: #2563eb; color: #fff; font-size: 22px; width: 44px; height: 44px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 44px; }}
    .logo-title {{ font-size: 20px; font-weight: bold; color: #ffffff; margin: 0; }}
    .logo-sub {{ font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #60a5fa; margin: 2px 0 0 0; }}
    .code-box {{ background: #1e293b; border: 2px dashed #3b82f6; border-radius: 12px; text-align: center; padding: 20px; margin: 28px 0; }}
    .code {{ font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; margin: 0; }}
    .note {{ font-size: 13px; color: #94a3b8; line-height: 1.6; margin-top: 16px; }}
    .footer {{ font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-badge">🛡️</div>
      <div>
        <h1 class="logo-title">Rakshak Ai</h1>
        <p class="logo-sub">Emergency Response & Disaster Management</p>
      </div>
    </div>
    <h2 style="font-size: 18px; font-weight: 600; color: #f1f5f9; margin-top: 0;">Password Reset Request</h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Hello <strong>{clean_name}</strong>,<br>
      We received a request to reset the password for your Rakshak Ai account. Use the 6-digit verification code below to proceed:
    </p>
    <div class="code-box">
      <div class="code">{code}</div>
      <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0 0;">Valid for 15 minutes</p>
    </div>
    <p class="note">
      If you did not request a password reset, please ignore this email or contact your administrator immediately. Your password will remain unchanged.
    </p>
    <div class="footer">
      © 2026 Rakshak Ai Platform • Secure Emergency Operations System
    </div>
  </div>
</body>
</html>
"""

    text_content = f"""Rakshak Ai - Password Reset Verification Code

Hello {clean_name},

We received a request to reset the password for your Rakshak Ai account.
Your 6-digit verification code is:

{code}

This code is valid for 15 minutes.
If you did not request this password reset, please ignore this message.

Rakshak Ai Team
"""

    if not user or not password:
        print(
            f"ℹ️ [EMAIL SERVICE] SMTP credentials not set. Reset code for {clean_to} is: {code}"
        )
        return {
            "sent": False,
            "simulated": True,
            "code": code,
            "message": "SMTP not configured. Verification code logged to server output.",
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = clean_to

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(user, password)
        server.sendmail(sender, [clean_to], msg.as_string())
        server.quit()

        print(f"✅ [EMAIL SERVICE] Verification email sent to {clean_to}")
        return {
            "sent": True,
            "simulated": False,
            "code": code,
            "message": f"Verification code sent to {clean_to}.",
        }

    except Exception as err:
        print(
            f"⚠️ [EMAIL SERVICE] Failed to send email to {clean_to}: {err}. Reset code is: {code}"
        )
        return {
            "sent": False,
            "simulated": True,
            "code": code,
            "error": str(err),
            "message": f"Could not dispatch email via SMTP ({err}). Code logged to server output.",
        }
