from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header, Request
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user
from models.user import User
from services.whatsapp_services import WhatsAppService

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp Webhooks & Outbox Channels"])

@router.get("/webhook")
def whatsapp_webhook_handshake(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    """
    Public handshake GET validation endpoint for registering webhook with Facebook Graph Developer Console.
    Verifies token and echoes challenge token back to verification servers.
    """
    try:
        challenge = WhatsAppService.handle_webhook_verification(hub_mode, hub_verify_token, hub_challenge)
        # Returns raw string response / challenge text directly
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(content=challenge, status_code=200)
    except Exception as err:
        raise HTTPException(status_code=403, detail=str(err))

import hmac
import hashlib
import json
from config import settings

def verify_meta_signature(raw_body: bytes, signature_header: Optional[str]) -> bool:
    if not settings.META_APP_SECRET:
        # If META_APP_SECRET is not configured in env, allow webhook processing
        return True
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    received_sig = signature_header.split("sha256=")[1]
    expected_sig = hmac.new(
        settings.META_APP_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_sig, received_sig)

@router.post("/webhook")
async def whatsapp_webhook_inbound_listener(
    request: Request,
    business_id: Optional[str] = Query(None, description="Optional Business ID override (otherwise resolved via phone_number_id)"),
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256"),
    db: Session = Depends(get_db)
):
    """
    Public post webhook endpoint listening to incoming WhatsApp.
    Validates Meta HMAC SHA-256 signature, dynamically resolves tenant using phone_number_id metadata,
    captures customer questions, processes Gemini replies, logs status updates, and handles media attachments safely.
    """
    raw_body = await request.body()
    if not verify_meta_signature(raw_body, x_hub_signature_256):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Meta webhook signature (X-Hub-Signature-256 mismatch)."
        )

    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
        result = await WhatsAppService.process_incoming_webhook(db, business_id, payload)
        return result
    except Exception as err:
        import logging
        logging.getLogger("autofy_whatsapp_webhook").error(f"Inbound webhook processing error: {err}")
        return {"status": "error_captured", "detail": str(err)}

@router.post("/message/send", status_code=status.HTTP_200_OK)
async def send_custom_whatsapp(
    to_phone: str = Query(..., description="Target phone number with country code, e.g. 919876543210"),
    phone_number_id: str = Query(..., description="Meta Phone number ID from Graph API"),
    message_body: str = Query(..., description="Content of the message"),
    media_url: Optional[str] = Query(None, description="Direct URL of media attachment"),
    media_type: Optional[str] = Query(None, description="Type of attachment: 'image', 'document', 'audio', 'video'"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Authorized outbox trigger endpoint to transmit rich media messages manually via WhatsApp Cloud API.
    """
    try:
        response = await WhatsAppService.send_whatsapp_message(
            phone_number_id=phone_number_id,
            to_phone=to_phone,
            message_body=message_body,
            media_url=media_url,
            media_type=media_type
        )
        return {
            "status": "success",
            "metadata": response
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))
