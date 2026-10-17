import os
import logging
from typing import Dict, Any, Optional
import httpx
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables (.env in root or backend/.env)
root_env = Path(__file__).resolve().parent.parent / ".env"
backend_env = Path(__file__).resolve().parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
load_dotenv()

logger = logging.getLogger("neuroforge.email")

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

def get_brevo_config():
    api_key = os.getenv("BREVO_API_KEY") or os.getenv("SENDINBLUE_API_KEY") or os.getenv("BREVO_KEY")
    sender_email = (
        os.getenv("BREVO_SENDER_EMAIL")
        or os.getenv("SENDER_EMAIL")
        or os.getenv("BREVO_FROM_EMAIL")
        or "verify@neuroforge.ai"
    )
    sender_name = os.getenv("BREVO_SENDER_NAME") or "NeuroForge Security"
    return api_key, sender_email, sender_name

def render_verification_html(code: str, email: str) -> str:
    """Renders a responsive, modern HTML template for the 6-digit OTP code."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your NeuroForge Verification Code</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }}
    .email-wrapper {{
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 16px;
    }}
    .email-card {{
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      padding: 36px 32px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      border: 1px solid #e2e8f0;
    }}
    .brand-row {{
      text-align: center;
      margin-bottom: 24px;
    }}
    .brand-title {{
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0f172a;
      margin: 8px 0 0;
    }}
    .headline {{
      font-size: 22px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 10px;
      text-align: center;
    }}
    .lead-text {{
      font-size: 15px;
      color: #475569;
      line-height: 1.55;
      text-align: center;
      margin: 0 0 28px;
    }}
    .code-container {{
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1.5px dashed #cbd5e1;
      border-radius: 14px;
      padding: 20px 16px;
      text-align: center;
      margin-bottom: 26px;
    }}
    .code-digits {{
      font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #0284c7;
      display: inline-block;
      margin-left: 10px;
    }}
    .code-expiry {{
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
      font-weight: 500;
    }}
    .security-note {{
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      border-top: 1px solid #f1f5f9;
      padding-top: 20px;
      margin-bottom: 16px;
    }}
    .footer-text {{
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 24px;
    }}
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">
      <div class="brand-row">
        <div style="display:inline-block;width:44px;height:44px;border-radius:12px;background:#0f172a;line-height:44px;color:#38bdf8;font-size:22px;font-weight:bold;text-align:center;">
          ⚡
        </div>
        <h1 class="brand-title">NeuroForge</h1>
      </div>

      <h2 class="headline">Verify your email address</h2>
      <p class="lead-text">
        Welcome to NeuroForge Customer Intelligence! Use the one-time code below to complete your registration for <strong>{email}</strong>.
      </p>

      <div class="code-container">
        <div class="code-digits">{code}</div>
        <div class="code-expiry">Expires in 10 minutes &bull; Single-use only</div>
      </div>

      <div class="security-note">
        If you did not request this verification code, please ignore this email or contact support if you have concerns. Never share this code with anyone.
      </div>
    </div>

    <div class="footer-text">
      &copy; 2026 NeuroForge AI Inc. Powered by Evolus AI &amp; AMD ROCm Platform.
    </div>
  </div>
</body>
</html>"""

async def send_verification_email(to_email: str, code: str) -> Dict[str, Any]:
    """
    Sends the 6-digit verification code to the recipient using Brevo Transactional Email API v3.
    Gracefully handles missing keys in local test environments.
    """
    api_key, sender_email, sender_name = get_brevo_config()

    if not api_key:
        logger.warning(
            f"[BREVO CONFIG NOTICE] BREVO_API_KEY not configured. Verification code for {to_email} is: {code}"
        )
        print(f"\n=======================================================")
        print(f" [DEV MODE] Verification Code for {to_email}: {code}")
        print(f" (Set BREVO_API_KEY & BREVO_SENDER_EMAIL on Vercel for live emails)")
        print(f"=======================================================\n")
        return {
            "success": True,
            "simulated": True,
            "message": "Verification code logged (BREVO_API_KEY not set locally)",
            "code": code
        }

    headers = {
        "accept": "application/json",
        "api-key": api_key.strip(),
        "content-type": "application/json",
    }

    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email.strip()
        },
        "to": [
            {
                "email": to_email.strip(),
                "name": to_email.split("@")[0]
            }
        ],
        "subject": f"{code} is your NeuroForge verification code",
        "htmlContent": render_verification_html(code, to_email),
        "textContent": f"Your NeuroForge verification code is: {code}. It expires in 10 minutes."
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(BREVO_API_URL, headers=headers, json=payload)

        if response.status_code in (200, 201, 202):
            data = response.json()
            logger.info(f"Brevo email dispatched successfully: {data.get('messageId')}")
            return {
                "success": True,
                "message_id": data.get("messageId"),
                "message": "Verification code dispatched via Brevo"
            }
        else:
            err_body = response.text
            logger.error(f"Brevo API error (HTTP {response.status_code}): {err_body}")
            print(f"Brevo API error: {response.status_code} - {err_body}")
            return {
                "success": False,
                "error": f"Brevo API error ({response.status_code}): {err_body}",
                "status_code": response.status_code
            }
    except Exception as exc:
        logger.error(f"Failed to connect to Brevo API: {exc}")
        return {
            "success": False,
            "error": f"Network error sending email via Brevo: {str(exc)}"
        }
