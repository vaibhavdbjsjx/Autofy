import os
import logging
from typing import Optional, Dict, Any, List
import httpx
from sqlalchemy.orm import Session
from services.conversation_services import ConversationCRUD, MessageCRUD, ConversationalAIService
from schemas.conversations import ConversationCreate, MessageCreate
from models.lead import Lead

logger = logging.getLogger("autofy_whatsapp_services")

class WhatsAppService:
    @staticmethod
    def get_token() -> str:
        from config import settings
        return (
            os.environ.get("WHATSAPP_TOKEN")
            or os.environ.get("WHATSAPP_ACCESS_TOKEN")
            or getattr(settings, "WHATSAPP_TOKEN", "")
        )

    @staticmethod
    def get_headers() -> Dict[str, str]:
        token = WhatsAppService.get_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    @staticmethod
    async def send_whatsapp_message(
        phone_number_id: Optional[str],
        to_phone: str,
        message_body: str,
        media_url: Optional[str] = None,
        media_type: Optional[str] = None # 'image', 'document', 'audio', 'video'
    ) -> Dict[str, Any]:
        """
        Transmits outgoing messages to the WhatsApp Business Graph API endpoints.
        """
        from config import settings
        token = WhatsAppService.get_token()
        pid = phone_number_id or getattr(settings, "WHATSAPP_PHONE_ID", "1256189660910549")

        # If token is missing, log message and return dev fallback
        if not token or "MOCK" in pid:
            logger.info(f"[WHATSAPP MOCK] Outgoing message to {to_phone}: {message_body} (Media: {media_url})")
            import uuid
            return {
                "messaging_product": "whatsapp",
                "contacts": [{"input": to_phone, "wa_id": to_phone}],
                "messages": [{"id": f"wamid.{uuid.uuid4().hex}"}],
                "status": "sent"
            }

        url = f"https://graph.facebook.com/v19.0/{pid}/messages"
        headers = WhatsAppService.get_headers()

        payload: Dict[str, Any] = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone
        }

        if media_url:
            if media_type == "image":
                payload["type"] = "image"
                payload["image"] = {"link": media_url, "caption": message_body}
            elif media_type == "document":
                payload["type"] = "document"
                payload["document"] = {"link": media_url, "caption": message_body, "filename": "DocumentFile"}
            elif media_type == "video":
                payload["type"] = "video"
                payload["video"] = {"link": media_url, "caption": message_body}
            else:
                # Default text messaging
                payload["type"] = "text"
                payload["text"] = {"preview_url": True, "body": f"{message_body}\nAttachment: {media_url}"}
        else:
            payload["type"] = "text"
            payload["text"] = {"preview_url": True, "body": message_body}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=12.0)
                if response.status_code not in (200, 201):
                    error_details = response.text
                    logger.error(f"WhatsApp Cloud API returned error status {response.status_code}: {error_details}")
                    raise Exception(f"WhatsApp Cloud API error (HTTP {response.status_code}): {error_details}")
                return response.json()
            except httpx.HTTPError as err:
                logger.error(f"WhatsApp Cloud API HTTP transport failure: {err}")
                raise Exception(f"WhatsApp API delivery transport failure: {err}")

    @staticmethod
    def handle_webhook_verification(hub_mode: Optional[str], hub_token: Optional[str], hub_challenge: Optional[str]) -> str:
        """
        Validates the handshake verification request for security validation on webhook setup.
        """
        from config import settings
        verify_token = os.environ.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") or settings.WHATSAPP_VERIFY_TOKEN
        if hub_mode == "subscribe" and hub_token == verify_token:
            logger.info("WhatsApp Webhook subscription verified successfully.")
            return hub_challenge or ""
        logger.error("WhatsApp Webhook token validation handshake mismatch.")
        raise Exception("Invalid verification token")

    @staticmethod
    async def process_incoming_webhook(db: Session, business_id_param: Optional[str], payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses WhatsApp Business payload updates, dynamically resolves the owning tenant via phone_number_id,
        records communications, and runs AI automated replies.
        Supports status receipts (sent, delivered, read) and message triggers.
        """
        db.expire_all()
        # 1. Parse Status updates
        # Payload updates format can contain statuses inside entries
        entry = payload.get("entry", [])
        if not entry:
            return {"status": "ignored", "reason": "No entries found"}

        changes = entry[0].get("changes", [])
        if not changes:
            return {"status": "ignored", "reason": "No changes found"}

        value = changes[0].get("value", {})

        # Dynamic Tenant Resolution via phone_number_id metadata
        phone_metadata = value.get("metadata", {})
        phone_number_id = str(phone_metadata.get("phone_number_id") or "").strip()
        logger.info(f"[WHATSAPP WEBHOOK] Received incoming webhook payload with phone_number_id='{phone_number_id}'")

        from models.business import Business
        from config import settings

        target_business = None

        # 1. Exact match in database by whatsapp_phone_id
        if phone_number_id:
            target_business = db.query(Business).filter(Business.whatsapp_phone_id == phone_number_id).first()
            if target_business:
                logger.info(f"[WHATSAPP WEBHOOK] Database lookup result: Matched by exact whatsapp_phone_id='{phone_number_id}' -> Business ID '{target_business.id}' ({target_business.name})")

        # 2. Query param override (e.g. /api/v1/whatsapp/webhook?business_id=xxx)
        if not target_business and business_id_param:
            target_business = db.query(Business).filter(Business.id == business_id_param).first()
            if target_business:
                logger.info(f"[WHATSAPP WEBHOOK] Database lookup result: Matched by query param business_id='{business_id_param}' -> Business ID '{target_business.id}' ({target_business.name})")
                if phone_number_id and not target_business.whatsapp_phone_id:
                    target_business.whatsapp_phone_id = phone_number_id
                    db.commit()

        # 3. Match against server settings.WHATSAPP_PHONE_ID / env
        env_phone_id = str(getattr(settings, "WHATSAPP_PHONE_ID", "") or os.environ.get("WHATSAPP_PHONE_ID") or "").strip()
        if not target_business and env_phone_id:
            target_business = db.query(Business).filter(Business.whatsapp_phone_id == env_phone_id).first()
            if target_business:
                logger.info(f"[WHATSAPP WEBHOOK] Database lookup result: Matched by env WHATSAPP_PHONE_ID='{env_phone_id}' -> Business ID '{target_business.id}' ({target_business.name})")
                if phone_number_id and target_business.whatsapp_phone_id != phone_number_id:
                    target_business.whatsapp_phone_id = phone_number_id
                    db.commit()

        # 4. Fallback: Auto-bind to primary/owner or first business with unassigned whatsapp_phone_id
        if not target_business:
            owner_biz = db.query(Business).filter(Business.email.in_(["vaibhav.sg18@gmail.com"])).first()
            if owner_biz:
                target_business = owner_biz
                logger.info(f"[WHATSAPP WEBHOOK] Database lookup result: Auto-binding to owner workspace '{owner_biz.name}' (ID: {owner_biz.id})")
            else:
                target_business = db.query(Business).order_by(Business.created_at.asc()).first()
                if target_business:
                    logger.info(f"[WHATSAPP WEBHOOK] Database lookup result: Auto-binding to default workspace '{target_business.name}' (ID: {target_business.id})")

            if target_business and phone_number_id:
                target_business.whatsapp_phone_id = phone_number_id
                db.commit()

        if not target_business:
            logger.warning(f"[WHATSAPP WEBHOOK] Unmapped WhatsApp webhook received for phone_number_id='{phone_number_id}'. Database lookup result: No business found in database.")
            return {"status": "unmapped_tenant", "detail": "No registered business matches this WhatsApp phone_number_id"}

        logger.info(f"[WHATSAPP WEBHOOK] Matched tenant ID: '{target_business.id}' (Business Name: '{target_business.name}', Phone Number ID: '{target_business.whatsapp_phone_id}')")

        business_id = target_business.id
        
        # Checking Status Receipt tracking
        statuses = value.get("statuses", [])
        if statuses:
            status_obj = statuses[0]
            wamid = status_obj.get("id")
            delivery_status = status_obj.get("status") # sent, delivered, read, failed
            
            # Update database status logs
            MessageCRUD.update_status_by_whatsapp_id(db, wamid, delivery_status)
            return {"status": "receipt_processed", "wamid": wamid, "delivery": delivery_status}

        # 2. Parse Messages Inbound
        messages = value.get("messages", [])
        if not messages:
            return {"status": "ignored", "reason": "No messages in webhook payload"}

        msg_data = messages[0]
        from_phone = msg_data.get("from")
        sender_profile = value.get("contacts", [{}])[0].get("profile", {})
        sender_name = sender_profile.get("name", "WhatsApp Customer")
        
        msg_id = msg_data.get("id")
        msg_type = msg_data.get("type", "text")

        # Deduplication check
        if msg_id:
            from models.message import Message
            existing_msg = db.query(Message).filter(Message.whatsapp_message_id == msg_id).first()
            if existing_msg:
                return {"status": "ignored", "reason": f"Duplicate webhook event for message ID {msg_id}"}
        
        # Format textual contents or media URLs
        message_content = ""
        media_url = None

        if msg_type == "text":
            message_content = msg_data.get("text", {}).get("body", "")
        elif msg_type == "image":
            image_data = msg_data.get("image", {})
            message_content = image_data.get("caption", "[Received Image]")
            media_url = image_data.get("id") # Link reference identifier in FB storage
        elif msg_type == "document":
            doc_data = msg_data.get("document", {})
            message_content = doc_data.get("caption", f"[Received Document: {doc_data.get('filename')}]")
            media_url = doc_data.get("id")
        else:
            message_content = f"[Received {msg_type} entry]"
            media_url = msg_data.get(msg_type, {}).get("id")

        # 3. Match or Create the Lead record based on phone
        lead = db.query(Lead).filter(Lead.phone == from_phone, Lead.business_id == business_id).first()
        if not lead:
            # Create a brand new lead
            lead = Lead(
                business_id=business_id,
                name=sender_name,
                phone=from_phone,
                source="WhatsApp",
                status="New",
                notes=f"Auto-created on inbound WhatsApp text: '{message_content[:100]}...'"
            )
            db.add(lead)
            db.commit()
            db.refresh(lead)

        # 4. Find or Create active Conversation thread
        conv = ConversationCRUD.get_by_platform_sender(db, business_id, from_phone, "WhatsApp")
        if not conv:
            # Create new thread
            conv_in = ConversationCreate(
                lead_id=lead.id,
                channel="WhatsApp",
                platform_sender_id=from_phone,
                status="Active",
                ai_enabled=True,
                summary=f"WhatsApp chat thread with {lead.name}"
            )
            conv = ConversationCRUD.create(db, business_id, conv_in)

        # Ensure the Conversation's lead is correctly bound if previously empty
        if not conv.lead_id:
            conv.lead_id = lead.id
            db.commit()

        # Update Lead scores as they talk
        lead.score = min(100, lead.score + 5)
        # Check buying keywords inside incoming message
        intent_signals = ["price", "buy", "join", "sign", "cost", "membership", "quote", "interested"]
        if any(sig in message_content.lower() for sig in intent_signals):
            lead.score = min(100, lead.score + 15)
            lead.status = "Qualified"
        db.commit()

        # 5. Process AI automated reply — enforce global and per-number controls
        # Check 1: Global AI master switch on the business
        import json as _json
        if not getattr(target_business, 'ai_auto_reply_enabled', True):
            logger.info(f"AI auto-reply globally disabled for Business {business_id}. Skipping AI reply.")
            cust_msg_in = MessageCreate(
                sender_type="Customer",
                sender_id=from_phone,
                message_type=msg_type,
                content=message_content,
                media_url=media_url,
                whatsapp_message_id=msg_id,
                status="read"
            )
            MessageCRUD.create(db, conv.id, cust_msg_in)
            return {
                "status": "ai_globally_disabled",
                "conversation_id": conv.id,
                "message": message_content
            }

        # Check 2: Per-number AI exceptions list
        exception_phones = []
        if getattr(target_business, 'ai_reply_exceptions', None):
            try:
                exception_phones = _json.loads(target_business.ai_reply_exceptions)
            except (ValueError, TypeError):
                exception_phones = []
        if from_phone in exception_phones:
            logger.info(f"AI reply skipped for excluded phone {from_phone} in Business {business_id}.")
            cust_msg_in = MessageCreate(
                sender_type="Customer",
                sender_id=from_phone,
                message_type=msg_type,
                content=message_content,
                media_url=media_url,
                whatsapp_message_id=msg_id,
                status="read"
            )
            MessageCRUD.create(db, conv.id, cust_msg_in)
            return {
                "status": "ai_exception_skipped",
                "conversation_id": conv.id,
                "excluded_phone": from_phone,
                "message": message_content
            }

        # Check 3: Per-conversation AI toggle
        if conv.ai_enabled:
            # Generates reply using our ConversationalAIService with full business and memory context
            ai_data = ConversationalAIService.reply_with_ai(db, conv.id, message_content, whatsapp_message_id=msg_id)

            # Retrieve phone ID and send actual outgoing REST WhatsApp message back
            phone_metadata = value.get("metadata", {})
            phone_number_id = phone_metadata.get("phone_number_id", "MOCK_PHONE_ID")

            try:
                # Dispatch real API POST request to WhatsApp
                whatsapp_res = await WhatsAppService.send_whatsapp_message(
                    phone_number_id=phone_number_id,
                    to_phone=from_phone,
                    message_body=ai_data["reply"]
                )
                
                # Fetch output message records to update the WhatsApp message ID
                sent_msg = db.query(Message).filter(
                    Message.conversation_id == conv.id,
                    Message.sender_type == "AI"
                ).order_by(Message.created_at.desc()).first()

                if sent_msg and whatsapp_res.get("messages"):
                    sent_msg.whatsapp_message_id = whatsapp_res["messages"][0]["id"]
                    db.commit()
            except Exception as send_err:
                logger.error(f"Failed to transmit WhatsApp reply to Graph APIs: {send_err}")
            
            return {
                "status": "ai_replied",
                "conversation_id": conv.id,
                "reply": ai_data["reply"],
                "confidence": ai_data["confidence"],
                "escalate": ai_data["escalate"]
            }
        else:
            # If AI is disabled (e.g. human representative took over / escalated state)
            # We record client messages for human review, and keep wait
            logger.info(f"AI disabled for Conversation {conv.id}. Received message recorded for live agent.")
            cust_msg_in = MessageCreate(
                sender_type="Customer",
                sender_id=from_phone,
                message_type=msg_type,
                content=message_content,
                media_url=media_url,
                whatsapp_message_id=msg_id,
                status="read"
            )
            MessageCRUD.create(db, conv.id, cust_msg_in)
            
            # Send notification update to manager view or trigger alarm
            conv.status = "Escalated"
            db.commit()

            return {
                "status": "human_handling_logged",
                "conversation_id": conv.id,
                "message": message_content
            }
