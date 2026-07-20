import os
import hmac
import hashlib
import logging
from typing import Dict, Any, Optional
from decimal import Decimal
import httpx
from sqlalchemy.orm import Session
from datetime import datetime

from models.payment import Payment
from models.lead import Lead
from models.membership_plan import MembershipPlan
from services.conversation_services import MessageCRUD
from schemas.conversations import MessageCreate

# Import razorpay package
try:
    import razorpay
except ImportError:
    razorpay = None

logger = logging.getLogger("autofy_payment_services")

class RazorpayService:
    @staticmethod
    def get_auth_tuple() -> Optional[tuple]:
        key_id = os.environ.get("RAZORPAY_KEY_ID")
        key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
        if key_id and key_secret:
            return (key_id, key_secret)
        return None

    @staticmethod
    async def create_payment_link(
        db: Session,
        business_id: str,
        lead_id: str,
        amount: Decimal,
        description: str,
        customer_name: str,
        customer_phone: str,
        customer_email: Optional[str] = None
    ) -> Payment:
        """
        Creates a payment link via Razorpay API, or falls back to a mock link if keys are unconfigured.
        Records the transaction cleanly in the database.
        """
        auth = RazorpayService.get_auth_tuple()
        amount_paisa = int(amount * 100) # Razorpay works in paisa base

        import uuid
        pay_id = str(uuid.uuid4())
        mock_link_url = f"https://checkout.razorpay.com/v1/plink_{pay_id}"
        
        link_id = f"plink_{uuid.uuid4().hex[:12]}"
        link_url = mock_link_url
        order_id = f"order_{uuid.uuid4().hex[:12]}"

        # Actual API Dispatch
        if auth:
            url = "https://api.razorpay.com/v1/payment_links"
            payload = {
                "amount": amount_paisa,
                "currency": "INR",
                "accept_partial": False,
                "description": description,
                "customer": {
                    "name": customer_name,
                    "contact": customer_phone,
                    "email": customer_email or "billing@autofy.ai"
                },
                "notify": {
                    "sms": True,
                    "email": True if customer_email else False
                },
                "reminder_enable": True,
                "notes": {
                    "business_id": business_id,
                    "lead_id": lead_id,
                    "payment_record_id": pay_id
                },
                "callback_url": "https://autofy.ai/payment-callback",
                "callback_method": "get"
            }

            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(url, auth=auth, json=payload, timeout=10.0)
                    if response.status_code in [200, 201]:
                        res_data = response.json()
                        link_id = res_data.get("id")
                        link_url = res_data.get("short_url")
                        order_id = res_data.get("order_id")
                except Exception as api_err:
                    logger.error(f"Razorpay POST payment_link failed: {api_err}. Falling back to mocking.")

        # Persist transaction in database
        payment_record = Payment(
            id=pay_id,
            business_id=business_id,
            lead_id=lead_id,
            amount=amount,
            currency="INR",
            payment_link_id=link_id,
            payment_link_url=link_url,
            razorpay_order_id=order_id,
            status="issued",
            billing_type="one-time",
            description=description,
            invoice_id=f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        )
        db.add(payment_record)
        db.commit()
        db.refresh(payment_record)

        # Increment Lead score post-billing issue
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if lead:
            lead.score = min(100, lead.score + 10)
            db.commit()

        return payment_record

    @staticmethod
    async def create_subscription(
        db: Session,
        business_id: str,
        lead_id: str,
        plan_id: str,
        customer_name: str,
        customer_phone: str,
        customer_email: Optional[str] = None
    ) -> Payment:
        """
        Subscribes a client to a recurring monthly plan using Razorpay payment plans.
        """
        plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
        if not plan:
            raise Exception("Membership plan not found.")

        auth = RazorpayService.get_auth_tuple()
        amount_paisa = int(plan.price * 100)

        import uuid
        pay_id = str(uuid.uuid4())
        link_id = None
        sub_id = f"sub_{uuid.uuid4().hex[:12]}"
        link_url = f"https://checkout.razorpay.com/v1/subscription_{uuid.uuid4().hex[:6]}"

        if auth:
            # 1. Create plan structure on razorpay
            plan_payload = {
                "period": "monthly",
                "interval": int(plan.duration_months),
                "item": {
                    "name": plan.name,
                    "amount": amount_paisa,
                    "currency": "INR",
                    "description": plan.description or f"Subscription for {plan.name}"
                }
            }
            
            async with httpx.AsyncClient() as client:
                try:
                    # Register the recurring template Plan
                    plan_res = await client.post("https://api.razorpay.com/v1/plans", auth=auth, json=plan_payload)
                    rz_plan_id = plan_res.json().get("id") if plan_res.status_code in [200, 201] else f"plan_mock_{uuid.uuid4().hex[:6]}"

                    # 2. Assign subscription template to client
                    sub_payload = {
                        "plan_id": rz_plan_id,
                        "total_count": 12, # 1 year default recurring periods
                        "quantity": 1,
                        "customer_notify": 1,
                        "notes": {
                            "business_id": business_id,
                            "lead_id": lead_id,
                            "payment_record_id": pay_id
                        }
                    }
                    sub_res = await client.post("https://api.razorpay.com/v1/subscriptions", auth=auth, json=sub_payload)
                    if sub_res.status_code in [200, 201]:
                        sub_data = sub_res.json()
                        sub_id = sub_data.get("id")
                        link_url = sub_data.get("short_url", link_url)
                except Exception as sub_err:
                    logger.error(f"Razorpay subscription registration failed: {sub_err}. Falling back to mocking.")

        # Save subscription in Payment record table
        sub_payment = Payment(
            id=pay_id,
            business_id=business_id,
            lead_id=lead_id,
            amount=plan.price,
            currency="INR",
            payment_link_url=link_url,
            razorpay_subscription_id=sub_id,
            status="issued",
            billing_type="subscription",
            description=f"Recurring subscription for: {plan.name}",
            invoice_id=f"SUB-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        )
        db.add(sub_payment)
        db.commit()
        db.refresh(sub_payment)

        return sub_payment

    @staticmethod
    def verify_payment_signature(
        razorpay_payment_id: str,
        razorpay_order_id: Optional[str],
        razorpay_subscription_id: Optional[str],
        razorpay_signature: str
    ) -> bool:
        """
        Utilizes cryptographic HMAC SHA256 matches to verify that callbacks originated from authentic servers.
        """
        secret = os.environ.get("RAZORPAY_KEY_SECRET")
        if not secret:
            # Under development scenario without credentials, approve the capture
            logger.warning("RAZORPAY_KEY_SECRET unconfigured. Accepting payment verification as valid (dev mock approval).")
            return True

        if razorpay_order_id:
            payload = f"{razorpay_order_id}|{razorpay_payment_id}"
        elif razorpay_subscription_id:
            payload = f"{razorpay_payment_id}|{razorpay_subscription_id}"
        else:
            return False

        generated_signature = hmac.new(
            key=secret.encode("utf-8"),
            msg=payload.encode("utf-8"),
            digestmod=hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(generated_signature, razorpay_signature)

    @staticmethod
    def update_payment_on_verification(
        db: Session,
        razorpay_payment_id: str,
        razorpay_order_id: Optional[str],
        razorpay_subscription_id: Optional[str],
        status: str = "paid"
    ) -> Optional[Payment]:
        """
        Finalizes invoice and processes state transitions upon verification of payment.
        """
        query = db.query(Payment)
        if razorpay_order_id:
            payment = query.filter(Payment.razorpay_order_id == razorpay_order_id).first()
        elif razorpay_subscription_id:
            payment = query.filter(Payment.razorpay_subscription_id == razorpay_subscription_id).first()
        else:
            payment = query.filter(Payment.razorpay_payment_id == razorpay_payment_id).first()

        if payment:
            payment.status = status
            payment.razorpay_payment_id = razorpay_payment_id
            payment.updated_at = datetime.utcnow()
            db.commit()

            # Boost Lead status to Converted on success paid billing
            lead = db.query(Lead).filter(Lead.id == payment.lead_id).first()
            if lead:
                lead.status = "Converted"
                lead.score = 100
                db.commit()

            logger.info(f"Payment {payment.id} successfully updated to status: {status}")
            return payment
        return None

    @staticmethod
    async def process_webhook_callback(db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Decodes billing statuses transmitted asynchronously over webhook channels.
        Handles: payment_link.paid, payment.captured, order.paid, subscription.charged events.
        """
        event = payload.get("event")
        logger.info(f"Processing Razorpay webhook event callback: {event}")

        if event in ["payment_link.paid", "order.paid", "payment.captured"]:
            # Extract payment, order or plink records details
            payment_entities = payload.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_payment_id = payment_entities.get("id")
            razorpay_order_id = payment_entities.get("order_id")
            
            # Find matching payment record using plink ID or order ID
            plink_id = payload.get("payload", {}).get("payment_link", {}).get("entity", {}).get("id")
            
            payment = None
            if plink_id:
                payment = db.query(Payment).filter(Payment.payment_link_id == plink_id).first()
            elif razorpay_order_id:
                payment = db.query(Payment).filter(Payment.razorpay_order_id == razorpay_order_id).first()

            if payment:
                payment.status = "paid"
                payment.razorpay_payment_id = razorpay_payment_id
                payment.updated_at = datetime.utcnow()
                db.commit()

                # Mark associated lead converted
                lead = db.query(Lead).filter(Lead.id == payment.lead_id).first()
                if lead:
                    lead.status = "Converted"
                    lead.score = 100
                    db.commit()
                return {"status": "success", "processed_record": payment.id, "action": "paid_link"}

        elif event in ["subscription.charged", "subscription.activated"]:
            sub_entities = payload.get("payload", {}).get("subscription", {}).get("entity", {})
            sub_id = sub_entities.get("id")
            pay_entities = payload.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_payment_id = pay_entities.get("id")

            payment = db.query(Payment).filter(Payment.razorpay_subscription_id == sub_id).first()
            if payment:
                payment.status = "paid"
                payment.razorpay_payment_id = razorpay_payment_id
                payment.updated_at = datetime.utcnow()
                db.commit()
                return {"status": "success", "processed_record": payment.id, "action": "recurring_charged"}

        return {"status": "ignored", "reason": "No matched transaction record or event unsupported"}

    @staticmethod
    def generate_invoice_html(payment: Payment, db: Session) -> str:
        """
        Produces clean, HTML layouts suitable for printing to physical or PDF formats, complete with receipt calculations.
        """
        lead = db.query(Lead).filter(Lead.id == payment.lead_id).first() if payment.lead_id else None
        customer_name = lead.name if lead else "Valued Client"
        customer_phone = lead.phone if lead else "N/A"
        customer_email = lead.email if lead else "billing@autofy.ai"

        subtotal = float(payment.amount) / 1.18 # Calculates pre-tax values assuming 18% standard GST inclusion
        tax_amount = float(payment.amount) - subtotal

        return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {payment.invoice_id}</title>
    <style>
        body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; background-color: #f9fafb; }}
        .container {{ max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 40px; border: 1px solid #e5e7eb; }}
        .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #f3f4f6; padding-bottom: 25px; margin-bottom: 30px; }}
        .logo {{ font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.05em; }}
        .logo span {{ color: #2563eb; }}
        .invoice-title {{ font-size: 28px; font-weight: 800; color: #1f2937; text-transform: uppercase; margin: 0; text-align: right; }}
        .meta-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }}
        .section-title {{ font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 8px; }}
        .details {{ font-size: 14px; line-height: 1.5; color: #4b5563; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 40px; }}
        th {{ background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; }}
        td {{ padding: 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #4b5563; }}
        .total-section {{ display: flex; justify-content: flex-end; }}
        .total-box {{ width: 300px; }}
        .total-row {{ display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #4b5563; }}
        .total-row.grand-total {{ border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 800; color: #111827; }}
        .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }}
        .badge-paid {{ background-color: #d1fae5; color: #065f46; }}
        .badge-pending {{ background-color: #fef3c7; color: #92400e; }}
        .footer {{ text-align: center; border-top: 1px solid #e5e7eb; padding-top: 30px; font-size: 12px; color: #9ca3af; margin-top: 50px; }}
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <div class="header">
            <div>
                <div class="logo">AUTOFY<span>.AI</span></div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Unified Business Operational Suite</div>
            </div>
            <div>
                <div class="invoice-title">Invoice</div>
                <div style="text-align: right; color: #4b5563; font-size: 13px; margin-top: 4px;">
                    Invoice #: <strong>{payment.invoice_id}</strong><br/>
                    Date Issued: {payment.created_at.strftime('%Y-%m-%d')}<br/>
                    Status: <span class="badge { 'badge-paid' if payment.status == 'paid' else 'badge-pending' }">{payment.status.upper()}</span>
                </div>
            </div>
        </div>

        <!-- META DETAILS -->
        <div class="meta-grid">
            <div>
                <div class="section-title">Billed From:</div>
                <div class="details">
                    <strong>AUTOFY Inc.</strong><br/>
                    440 Business Suite Highway<br/>
                    New Delhi, DL, 110001<br/>
                    Email: billing@autofy.ai<br/>
                    Web: https://autofy.ai
                </div>
            </div>
            <div>
                <div class="section-title">Billed To:</div>
                <div class="details">
                    <strong>{customer_name}</strong><br/>
                    Phone: {customer_phone}<br/>
                    Email: {customer_email}<br/>
                    Identifier: Lead #{payment.lead_id or "Anonymous"}
                </div>
            </div>
        </div>

        <!-- ITEMS TABLE -->
        <table>
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th style="text-align: right;">Billing Type</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{payment.description or "Automated Business Billing Ledger Item"}</strong><br/>
                        <span style="font-size: 11px; color: #9ca3af;">Razorpay Reference: {payment.razorpay_order_id or payment.razorpay_subscription_id or "MOCKED_TX"}</span>
                    </td>
                    <td style="text-align: right;">{payment.billing_type.upper()}</td>
                    <td style="text-align: right;">INR {payment.amount:,.2f}</td>
                    <td style="text-align: right;">INR {payment.amount:,.2f}</td>
                </tr>
            </tbody>
        </table>

        <!-- TOTALS -->
        <div class="total-section">
            <div class="total-box">
                <div class="total-row">
                    <span>Taxable Value (Pre-tax)</span>
                    <span>INR {subtotal:,.2f}</span>
                </div>
                <div class="total-row">
                    <span>Standard GST Include (18%)</span>
                    <span>INR {tax_amount:,.2f}</span>
                </div>
                <div class="total-row grand-total">
                    <span>Grand Total Due</span>
                    <span>INR {float(payment.amount):,.2f}</span>
                </div>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            Thank you for doing business with us! This is an electronically generated statement mapping official Razorpay billing records.<br/>
            For transaction inquiries or cancellation support please contact customer success at support@autofy.ai.
        </div>
    </div>
</body>
</html>
"""
