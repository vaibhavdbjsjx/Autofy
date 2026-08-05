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
    def get_headers() -> Dict[str, str]:
        token = os.environ.get("WHATSAPP_ACCESS_TOKEN", "MOCK_WHATSAPP_TOKEN")
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    @staticmethod
    async def send_whatsapp_message(
        phone_number_id: str,
        to_phone: str,
        message_body: str,
        media_url: Optional[str] = None,
        media_type: Optional[str] = None # 'image', 'document', 'audio', 'video'
    ) -> Dict[str, Any]:
        """
        Transmits outgoing messages to the WhatsApp Business graph endpoints.
        """
        # If running in mock mode or values are default
        if "MOCK" in phone_number_id or not os.environ.get("WHATSAPP_ACCESS_TOKEN"):
            logger.info(f"[WHATSAPP MOCK] Outgoing message to {to_phone}: {message_body} (Media: {media_url})")
            import uuid
            return {
                "messaging_product": "whatsapp",
                "contacts": [{"input": to_phone, "wa_id": to_phone}],
                "messages": [{"id": f"wamid.{uuid.uuid4().hex}"}],
                "status": "sent"
            }

        url = f"https://graph.facebook.com/v19.0/{phone_number_id}/messages"
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
                response.raise_for_status()
                return response.json()
            except Exception as err:
                logger.error(f"WhatsApp Cloud API post failed: {err}")
                raise Exception(f"WhatsApp message delivery failed: {err}")

    @staticmethod
    def handle_webhook_verification(hub_mode: Optional[str], hub_token: Optional[str], hub_challenge: Optional[str]) -> str:
        """
        Validates the handshake verification request for security validation on webhook setup.
        """
        verify_token = os.environ.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "autofy_secret_token")
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
        phone_number_id = phone_metadata.get("phone_number_id")

        from models.business import Business
        from config import settings

        target_business = None
        if phone_number_id:
            target_business = db.query(Business).filter(Business.whatsapp_phone_id == phone_number_id).first()
        if not target_business and business_id_param:
            target_business = db.query(Business).filter(Business.id == business_id_param).first()

        if not target_business:
            # Fallback for dev convenience if only 1 business exists in dev DB
            all_biz = db.query(Business).all()
            if settings.ENVIRONMENT != "production" and len(all_biz) == 1:
                target_business = all_biz[0]
            else:
                logger.warning(f"Unmapped WhatsApp webhook received for phone_number_id={phone_number_id or 'missing'}. No tenant assigned.")
                return {"status": "unmapped_tenant", "detail": "No registered business matches this WhatsApp phone_number_id"}

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
            from models.conversations import Message
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

        # 5. Process AI automated reply if AI capability is toggled ON
        if conv.ai_enabled:
            # Generates reply using our ConversationalAIService with full business and memory context
            ai_data = ConversationalAIService.reply_with_ai(db, conv.id, message_content)
            
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
