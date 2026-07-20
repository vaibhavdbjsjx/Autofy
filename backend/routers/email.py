from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import settings

router = APIRouter(prefix="/api/email", tags=["email"])

class SubscriptionEmailRequest(BaseModel):
    userEmail: EmailStr
    userName: str
    businessName: str
    planName: str
    planPrice: str
    planDuration: str
    startDate: str
    renewalDate: str
    paymentMethod: str
    transactionId: str

class WelcomeEmailRequest(BaseModel):
    userEmail: EmailStr
    userName: str
    businessName: str

def send_email_smtp(to_email: str, subject: str, html_body: str):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"Autofy <{settings.SMTP_FROM_EMAIL}>"
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html'))
    with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

@router.post("/subscription-confirmation")
async def send_subscription_confirmation(req: SubscriptionEmailRequest):
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Inter', -apple-system, sans-serif;
               background: #F5F4FF; margin: 0; padding: 40px 20px; }}
        .container {{ max-width: 560px; margin: 0 auto;
                     background: #FFFFFF; border-radius: 20px;
                     overflow: hidden;
                     box-shadow: 0 4px 40px rgba(124,58,237,0.12); }}
        .header {{ background: linear-gradient(135deg, #7C3AED, #A855F7);
                  padding: 40px 40px 32px; text-align: center; }}
        .logo {{ color: white; font-size: 24px; font-weight: 900;
                letter-spacing: -0.03em; margin-bottom: 8px; }}
        .header-sub {{ color: rgba(255,255,255,0.8); font-size: 14px; }}
        .body {{ padding: 40px; }}
        .greeting {{ font-size: 22px; font-weight: 700; color: #12002E;
                    margin-bottom: 8px; }}
        .message {{ font-size: 15px; color: #6B7280; line-height: 1.7;
                   margin-bottom: 32px; }}
        .plan-card {{ background: #F5F4FF; border: 1px solid rgba(124,58,237,0.15);
                     border-radius: 16px; padding: 24px; margin-bottom: 32px; }}
        .plan-name {{ font-size: 18px; font-weight: 800; color: #7C3AED;
                     margin-bottom: 16px; }}
        .detail-row {{ display: flex; justify-content: space-between;
                      padding: 8px 0; border-bottom: 1px solid rgba(124,58,237,0.08);
                      font-size: 14px; }}
        .detail-label {{ color: #6B7280; }}
        .detail-value {{ color: #12002E; font-weight: 600; }}
        .success-badge {{ display: inline-block; background: rgba(16,185,129,0.10);
                         color: #10B981; border: 1px solid rgba(16,185,129,0.25);
                         border-radius: 100px; padding: 6px 16px; font-size: 13px;
                         font-weight: 700; margin-bottom: 24px; }}
        .cta-button {{ display: block; background: #7C3AED; color: white;
                      text-decoration: none; text-align: center; padding: 16px 32px;
                      border-radius: 100px; font-weight: 800; font-size: 15px;
                      margin: 0 auto 32px; width: fit-content; }}
        .next-steps {{ background: #FAFAFE; border-radius: 12px; padding: 24px;
                      margin-bottom: 32px; }}
        .next-title {{ font-size: 14px; font-weight: 700; color: #12002E;
                      margin-bottom: 16px; }}
        .step {{ display: flex; align-items: flex-start; gap: 12px;
                margin-bottom: 12px; font-size: 14px; color: #6B7280; }}
        .step-num {{ background: #7C3AED; color: white; border-radius: 50%;
                    width: 22px; height: 22px; display: flex; align-items: center;
                    justify-content: center; font-size: 11px; font-weight: 800;
                    flex-shrink: 0; margin-top: 1px; }}
        .footer {{ background: #F5F4FF; padding: 24px 40px; text-align: center;
                  font-size: 12px; color: #9CA3AF; }}
        .footer a {{ color: #7C3AED; text-decoration: none; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Autofy</div>
          <div class="header-sub">WhatsApp Business Automation</div>
        </div>
        <div class="body">
          <div class="success-badge">Payment Confirmed</div>
          <div class="greeting">Welcome to Autofy, {req.userName}!</div>
          <div class="message">
            Your subscription is active and your AI employee is ready to
            start handling customer inquiries for <strong>{req.businessName}</strong>.
          </div>

          <div class="plan-card">
            <div class="plan-name">{req.planName} Plan</div>
            <div class="detail-row">
              <span class="detail-label">Amount Paid</span>
              <span class="detail-value">{req.planPrice}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration</span>
              <span class="detail-value">{req.planDuration}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Start Date</span>
              <span class="detail-value">{req.startDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Next Renewal</span>
              <span class="detail-value">{req.renewalDate}</span>
            </div>
            <div class="detail-row" style="border-bottom:none">
              <span class="detail-label">Transaction ID</span>
              <span class="detail-value" style="font-family:monospace;font-size:12px">
                {req.transactionId}
              </span>
            </div>
          </div>

          <a href="https://app.autofy.io/dashboard" class="cta-button">
            Go to Your Dashboard
          </a>

          <div class="next-steps">
            <div class="next-title">Your next 3 steps:</div>
            <div class="step">
              <div class="step-num">1</div>
              <div>Connect your WhatsApp Business number in the
              WhatsApp Setup tab</div>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <div>Add your services and pricing in the Knowledge
              Base so your AI knows what to say</div>
            </div>
            <div class="step">
              <div class="step-num">3</div>
              <div>Test your AI in the AI Playground tab before
              going live</div>
            </div>
          </div>
        </div>
        <div class="footer">
          Questions? Reply to this email or contact
          <a href="mailto:hello@autofy.io">hello@autofy.io</a><br><br>
          Autofy Technologies Private Limited · Made with love in India<br>
          <a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a>
        </div>
      </div>
    </body>
    </html>
    """
    try:
        send_email_smtp(req.userEmail, f"Payment Confirmed — {req.planName} Plan Activated", html)
        return {"success": True, "message": "Confirmation email sent"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/welcome")
async def send_welcome_email(req: WelcomeEmailRequest):
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, sans-serif; background: #F5F4FF;
               margin: 0; padding: 40px 20px; }}
        .container {{ max-width: 560px; margin: 0 auto; background: white;
                     border-radius: 20px; overflow: hidden;
                     box-shadow: 0 4px 40px rgba(124,58,237,0.12); }}
        .header {{ background: linear-gradient(135deg,#7C3AED,#A855F7);
                  padding: 40px; text-align: center; color: white; }}
        .logo {{ font-size: 26px; font-weight: 900; letter-spacing:-0.03em; }}
        .body {{ padding: 40px; }}
        h2 {{ color: #12002E; font-size: 22px; margin-bottom: 12px; }}
        p {{ color: #6B7280; font-size: 15px; line-height: 1.7; }}
        .cta {{ display:block; background:#7C3AED; color:white;
               text-decoration:none; text-align:center; padding:16px 32px;
               border-radius:100px; font-weight:800; margin:28px 0; }}
        .footer {{ background:#F5F4FF; padding:20px 40px; text-align:center;
                  font-size:12px; color:#9CA3AF; }}
        .footer a {{ color:#7C3AED; text-decoration:none; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Autofy</div>
          <div style="color:rgba(255,255,255,0.8);margin-top:8px;font-size:14px">
            WhatsApp Business Automation
          </div>
        </div>
        <div class="body">
          <h2>Welcome, {req.userName}!</h2>
          <p>
            Your Autofy account for <strong>{req.businessName}</strong> has been
            created successfully. You are one step away from having a 24/7 AI
            employee handling your WhatsApp inquiries automatically.
          </p>
          <p>
            Complete your setup in under 10 minutes and your AI will be live,
            answering customers while you focus on running your business.
          </p>
          <a href="https://app.autofy.io/onboarding" class="cta">
            Complete Your Setup
          </a>
          <p style="font-size:13px">
            If you have any questions at any time, just reply to this email.
            We respond within a few hours.
          </p>
        </div>
        <div class="footer">
          Autofy Technologies Private Limited · Made with love in India<br>
          <a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a>
        </div>
      </div>
    </body>
    </html>
    """
    try:
        send_email_smtp(req.userEmail,
          f"Welcome to Autofy — Complete Your Setup", html)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
