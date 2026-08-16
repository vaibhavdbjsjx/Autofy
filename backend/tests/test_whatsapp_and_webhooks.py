import hmac
import hashlib
import pytest
from fastapi.testclient import TestClient
from config import settings
from models.business import Business
from models.lead import Lead
from models.conversation import Conversation
from models.message import Message

def test_whatsapp_webhook_handshake_success(client: TestClient):
    res = client.get(f"/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token={settings.WHATSAPP_VERIFY_TOKEN}&hub.challenge=test_challenge_123")
    assert res.status_code == 200
    assert res.text == "test_challenge_123"

def test_whatsapp_webhook_handshake_invalid_token(client: TestClient):
    res = client.get("/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test_challenge_123")
    assert res.status_code == 403

def test_webhook_signature_verification_valid(client: TestClient, monkeypatch):
    monkeypatch.setattr("config.settings.META_APP_SECRET", "test_app_secret_321")

    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "waba_1",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "phone_id_a"},
                    "messages": [{
                        "from": "+919999900001",
                        "id": "wamid.test_valid_sig_1",
                        "type": "text",
                        "text": {"body": "Hello Autofy"}
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    import json
    raw_body = json.dumps(payload).encode("utf-8")
    sig = hmac.new("test_app_secret_321".encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    headers = {
        "X-Hub-Signature-256": f"sha256={sig}",
        "Content-Type": "application/json"
    }

    res = client.post("/api/v1/whatsapp/webhook", content=raw_body, headers=headers)
    assert res.status_code == 200

def test_webhook_signature_verification_invalid(client: TestClient, monkeypatch):
    monkeypatch.setattr("config.settings.META_APP_SECRET", "test_app_secret_321")

    payload = {"object": "whatsapp_business_account"}
    import json
    raw_body = json.dumps(payload).encode("utf-8")

    headers = {
        "X-Hub-Signature-256": "sha256=invalid_signature_hash",
        "Content-Type": "application/json"
    }

    res = client.post("/api/v1/whatsapp/webhook", content=raw_body, headers=headers)
    assert res.status_code == 401

def test_webhook_signature_verification_missing(client: TestClient, monkeypatch):
    monkeypatch.setattr("config.settings.META_APP_SECRET", "test_app_secret_321")

    payload = {"object": "whatsapp_business_account"}
    import json
    raw_body = json.dumps(payload).encode("utf-8")

    res = client.post("/api/v1/whatsapp/webhook", content=raw_body, headers={"Content-Type": "application/json"})
    assert res.status_code == 401

def test_inbound_whatsapp_tenant_resolution_and_lead_creation(client: TestClient, db_session, monkeypatch):
    biz_a = Business(
        id="biz-alpha-123",
        name="Alpha Auto Garage",
        classification="Automotive",
        email="alpha_wa@auto.com",
        phone="+919876543210",
        whatsapp_phone_id="phone_id_alpha_123"
    )
    db_session.add(biz_a)
    db_session.commit()

    # Mock external WhatsApp message send API call
    async def mock_send_msg(*args, **kwargs):
        return {"messaging_product": "whatsapp", "messages": [{"id": "wamid.outbound_mock_1"}]}
    monkeypatch.setattr("services.whatsapp_services.WhatsAppService.send_whatsapp_message", mock_send_msg)

    # Mock Gemini AI response generator
    def mock_ai_reply(*args, **kwargs):
        return {
            "reply": "Hello! Welcome to Alpha Auto Garage.",
            "confidence": 0.95,
            "matched_faqs": [],
            "escalate": False
        }
    monkeypatch.setattr("services.conversation_services.ConversationalAIService.reply_with_ai", mock_ai_reply)

    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "waba_alpha",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "phone_id_alpha_123"},
                    "contacts": [{"profile": {"name": "Customer Charlie"}, "wa_id": "919876500001"}],
                    "messages": [{
                        "from": "919876500001",
                        "id": "wamid.inbound_msg_charlie_1",
                        "type": "text",
                        "text": {"body": "What are your garage hours?"}
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    res = client.post("/api/v1/whatsapp/webhook", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "ai_replied"

    # Verify Lead creation under Business A
    lead = db_session.query(Lead).filter(Lead.phone == "919876500001", Lead.business_id == biz_a.id).first()
    assert lead is not None
    assert lead.name == "Customer Charlie"

    # Verify Conversation thread creation under Business A
    conv = db_session.query(Conversation).filter(Conversation.business_id == biz_a.id, Conversation.lead_id == lead.id).first()
    assert conv is not None
    assert conv.channel == "WhatsApp"

def test_unmapped_phone_number_id_rejection(client: TestClient):
    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "waba_unknown",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "non_existent_phone_id_99999"},
                    "messages": [{
                        "from": "919999999999",
                        "id": "wamid.unknown_1",
                        "type": "text",
                        "text": {"body": "Test message to unmapped phone"}
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    res = client.post("/api/v1/whatsapp/webhook", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "unmapped_tenant"

def test_webhook_idempotency_duplicate_message_prevention(client: TestClient, db_session, monkeypatch):
    biz_idem = Business(
        id="biz-idem-456",
        name="Idempotent Garage",
        classification="Automotive",
        email="idem_wa@auto.com",
        phone="+919876543211",
        whatsapp_phone_id="phone_id_idempotent_456"
    )
    db_session.add(biz_idem)
    db_session.commit()

    async def mock_send_msg(*args, **kwargs):
        return {"messaging_product": "whatsapp", "messages": [{"id": "wamid.outbound_mock_2"}]}
    monkeypatch.setattr("services.whatsapp_services.WhatsAppService.send_whatsapp_message", mock_send_msg)

    def mock_ai_reply(db, conversation_id, incoming_message, whatsapp_message_id=None):
        if whatsapp_message_id:
            from schemas.conversations import MessageCreate
            from services.conversation_services import MessageCRUD
            cust_msg = MessageCreate(
                sender_type="Customer",
                sender_id="919876500002",
                message_type="text",
                content=incoming_message,
                whatsapp_message_id=whatsapp_message_id,
                status="read"
            )
            MessageCRUD.create(db, conversation_id, cust_msg)
        return {"reply": "Hi!", "confidence": 0.9, "matched_faqs": [], "escalate": False}
    monkeypatch.setattr("services.whatsapp_services.ConversationalAIService.reply_with_ai", mock_ai_reply)

    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "waba_idem",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "phone_id_idempotent_456"},
                    "contacts": [{"profile": {"name": "Idempotent User"}, "wa_id": "919876500002"}],
                    "messages": [{
                        "from": "919876500002",
                        "id": "wamid.duplicate_id_777",
                        "type": "text",
                        "text": {"body": "Idempotency check message"}
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    # First delivery -> Processed
    res1 = client.post("/api/v1/whatsapp/webhook", json=payload)
    assert res1.status_code == 200
    assert res1.json().get("status") == "ai_replied"

    # Duplicate delivery with same wamid -> Ignored cleanly
    res2 = client.post("/api/v1/whatsapp/webhook", json=payload)
    assert res2.status_code == 200
    assert res2.json().get("status") == "ignored"

def test_same_customer_phone_across_two_businesses_isolation(client: TestClient, db_session, monkeypatch):
    biz_a = Business(
        id="biz-iso-a",
        name="Iso Business A",
        classification="Retail",
        email="iso_a@retail.com",
        phone="+919000000001",
        whatsapp_phone_id="phone_id_tenant_a_1"
    )
    biz_b = Business(
        id="biz-iso-b",
        name="Iso Business B",
        classification="Fitness",
        email="iso_b@fitness.com",
        phone="+919000000002",
        whatsapp_phone_id="phone_id_tenant_b_2"
    )
    db_session.add(biz_a)
    db_session.add(biz_b)
    db_session.commit()

    async def mock_send_msg(*args, **kwargs):
        return {"messaging_product": "whatsapp", "messages": [{"id": "wamid.outbound_mock_3"}]}
    monkeypatch.setattr("services.whatsapp_services.WhatsAppService.send_whatsapp_message", mock_send_msg)

    def mock_ai_reply(*args, **kwargs):
        return {"reply": "Welcome!", "confidence": 0.9, "matched_faqs": [], "escalate": False}
    monkeypatch.setattr("services.conversation_services.ConversationalAIService.reply_with_ai", mock_ai_reply)

    shared_customer_phone = "919000000000"

    payload_a = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "waba_a",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "phone_id_tenant_a_1"},
                    "contacts": [{"profile": {"name": "Shared Customer"}, "wa_id": shared_customer_phone}],
                    "messages": [{
                        "from": shared_customer_phone,
                        "id": "wamid.shared_a_1",
                        "type": "text",
                        "text": {"body": "Hello Business A"}
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    payload_b = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "waba_b",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "phone_id_tenant_b_2"},
                    "contacts": [{"profile": {"name": "Shared Customer"}, "wa_id": shared_customer_phone}],
                    "messages": [{
                        "from": shared_customer_phone,
                        "id": "wamid.shared_b_1",
                        "type": "text",
                        "text": {"body": "Hello Business B"}
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    client.post("/api/v1/whatsapp/webhook", json=payload_a)
    client.post("/api/v1/whatsapp/webhook", json=payload_b)

    lead_a = db_session.query(Lead).filter(Lead.phone == shared_customer_phone, Lead.business_id == biz_a.id).first()
    lead_b = db_session.query(Lead).filter(Lead.phone == shared_customer_phone, Lead.business_id == biz_b.id).first()

    assert lead_a is not None
    assert lead_b is not None
    assert lead_a.id != lead_b.id
    assert lead_a.business_id != lead_b.business_id

def test_message_status_update_webhook(client: TestClient, db_session):
    biz_status = Business(
        id="biz-status-789",
        name="Status Business",
        classification="Services",
        email="status_wa@serv.com",
        phone="+919000000003",
        whatsapp_phone_id="phone_id_status"
    )
    db_session.add(biz_status)
    db_session.commit()

    msg = Message(
        conversation_id="conv_dummy_1",
        sender_type="AI",
        message_type="text",
        content="Hello!",
        whatsapp_message_id="wamid.status_test_100",
        status="sent"
    )
    db_session.add(msg)
    db_session.commit()

    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "waba_status",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "phone_id_status"},
                    "statuses": [{
                        "id": "wamid.status_test_100",
                        "status": "delivered",
                        "timestamp": "1700000000",
                        "recipient_id": "919876500001"
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    res = client.post("/api/v1/whatsapp/webhook", json=payload)
    assert res.status_code == 200
    assert res.json().get("status") == "receipt_processed"

    db_session.refresh(msg)
    assert msg.status == "delivered"


def test_extract_clean_reply_formats():
    from services.whatsapp_services import extract_clean_reply
    from schemas.conversations import AIResponseOutput

    # 1. Plain string
    assert extract_clean_reply("Hello customer!") == "Hello customer!"

    # 2. Dictionary with reply key
    dict_resp = {
        "reply": "Welcome to Vaibhav's Studio! How can I help?",
        "confidence": 0.95,
        "escalate": False,
        "matched_faqs": []
    }
    assert extract_clean_reply(dict_resp) == "Welcome to Vaibhav's Studio! How can I help?"

    # 3. JSON string
    json_str = '{"reply": "We are open from 9 AM to 6 PM.", "confidence": 0.9}'
    assert extract_clean_reply(json_str) == "We are open from 9 AM to 6 PM."

    # 4. Markdown code fenced JSON string
    fenced_json = """```json
{
  "reply": "Fenced markdown reply to customer.",
  "confidence": 0.98,
  "escalate": false
}
```"""
    assert extract_clean_reply(fenced_json) == "Fenced markdown reply to customer."

    # 5. Pydantic Model
    pydantic_obj = AIResponseOutput(
        content="Pydantic response message content.",
        confidence_score=0.92,
        matched_faqs=[],
        escalated_to_human=False
    )
    assert extract_clean_reply(pydantic_obj) == "Pydantic response message content."

    # 6. Malformed JSON with regex fallback
    malformed = '{"reply": "Parsed with regex successfully!", "confidence": 0.85, broken_json_here'
    assert extract_clean_reply(malformed) == "Parsed with regex successfully!"


def test_webhook_dispatches_only_plain_text_reply(client: TestClient, db_session, monkeypatch):
    """
    Verifies that when AI returns a full metadata dictionary, the outgoing WhatsApp message
    sent to the customer contains ONLY the clean text reply and not JSON keys or metadata.
    """
    biz = Business(
        id="biz-clean-reply-1",
        name="Clean Studio",
        classification="Studio",
        email="studio@autofy.com",
        phone="+919999988888",
        whatsapp_phone_id="phone_id_clean_studio"
    )
    db_session.add(biz)
    db_session.commit()

    captured_outbound = {}

    async def mock_send_whatsapp_message(phone_number_id, to_phone, message_body, **kwargs):
        captured_outbound["phone_number_id"] = phone_number_id
        captured_outbound["to_phone"] = to_phone
        captured_outbound["message_body"] = message_body
        return {
            "messaging_product": "whatsapp",
            "messages": [{"id": "wamid.outbound_clean_test"}]
        }

    monkeypatch.setattr("services.whatsapp_services.WhatsAppService.send_whatsapp_message", mock_send_whatsapp_message)

    # Return full AI dictionary from ConversationalAIService
    def mock_full_ai_dict(*args, **kwargs):
        return {
            "reply": "Hello! Welcome to Clean Studio. How can I assist you?",
            "confidence": 0.97,
            "escalate": False,
            "matched_faqs": ["Hours FAQ"]
        }

    monkeypatch.setattr("services.conversation_services.ConversationalAIService.reply_with_ai", mock_full_ai_dict)

    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "waba_clean",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "phone_id_clean_studio"},
                    "contacts": [{"profile": {"name": "Test User"}, "wa_id": "919988776655"}],
                    "messages": [{
                        "from": "919988776655",
                        "id": "wamid.inbound_clean_1",
                        "type": "text",
                        "text": {"body": "Hi there!"}
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    res = client.post("/api/v1/whatsapp/webhook", json=payload)
    assert res.status_code == 200
    res_data = res.json()

    # The webhook response retains internal metadata
    assert res_data["status"] == "ai_replied"
    assert res_data["confidence"] == 0.97
    assert res_data["escalate"] is False

    # The outbound WhatsApp message sent to the customer MUST be strictly the plain text string
    assert captured_outbound["message_body"] == "Hello! Welcome to Clean Studio. How can I assist you?"
    assert "{" not in captured_outbound["message_body"]
    assert "confidence" not in captured_outbound["message_body"]
    assert "escalate" not in captured_outbound["message_body"]


def test_whatsapp_enterprise_connection_lifecycle(client: TestClient, auth_headers_a: dict, db_session):
    # 1. Check initial status
    status_res = client.get("/api/v1/whatsapp/status", headers=auth_headers_a)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert "connection_status" in status_data
    assert "token_health" in status_data
    assert "webhook_health" in status_data
    assert "messaging_health" in status_data

    # 2. Connect with full enterprise payload
    connect_payload = {
        "phone_number_id": "meta_phone_ent_999",
        "business_account_id": "waba_ent_999",
        "phone_number": "+91 98765 43210",
        "display_name": "Autofy Prime Salon",
        "access_token": "EAAX_test_permanent_token_999",
        "token_duration_days": 90,
        "signup_type": "MANUAL_CLOUD_API"
    }
    connect_res = client.post("/api/v1/whatsapp/connect", json=connect_payload, headers=auth_headers_a)
    assert connect_res.status_code == 200
    assert connect_res.json()["status"] == "connected"
    assert connect_res.json()["whatsapp_phone_id"] == "meta_phone_ent_999"

    # 3. Verify status updated to CONNECTED and token health computed
    status_res2 = client.get("/api/v1/whatsapp/status", headers=auth_headers_a)
    assert status_res2.status_code == 200
    data2 = status_res2.json()
    assert data2["is_connected"] is True
    assert data2["connection_status"] == "CONNECTED"
    assert data2["token_health"]["status"] in ("VALID", "PERMANENT_OR_MANAGED")
    assert data2["token_health"]["days_until_expiry"] >= 80

    # 4. Test connection diagnostics endpoint
    test_res = client.post("/api/v1/whatsapp/test-connection", headers=auth_headers_a)
    assert test_res.status_code == 200
    assert test_res.json()["status"] == "healthy"
    assert test_res.json()["diagnostics"]["graph_api_ping"] == "SUCCESS"

    # 5. Replace WhatsApp Number
    replace_payload = {
        "new_phone_number_id": "meta_phone_ent_1000",
        "new_phone_number": "+91 99999 88888",
        "new_display_name": "Autofy Prime Grand",
        "reason": "Upgraded business SIM"
    }
    replace_res = client.post("/api/v1/whatsapp/replace-number", json=replace_payload, headers=auth_headers_a)
    assert replace_res.status_code == 200
    assert replace_res.json()["status"] == "number_replaced"
    assert replace_res.json()["new_phone_number_id"] == "meta_phone_ent_1000"

    # 6. Reconnect / Refresh Token
    reconnect_res = client.post("/api/v1/whatsapp/reconnect", json={
        "access_token": "EAAX_refreshed_token_1000",
        "token_duration_days": 60
    }, headers=auth_headers_a)
    assert reconnect_res.status_code == 200
    assert reconnect_res.json()["status"] == "reconnected"

    # 7. Disconnect WhatsApp
    dc_res = client.post("/api/v1/whatsapp/disconnect", headers=auth_headers_a)
    assert dc_res.status_code == 200
    assert dc_res.json()["status"] == "disconnected"

    # Verify status reflects DISCONNECTED
    status_res3 = client.get("/api/v1/whatsapp/status", headers=auth_headers_a)
    assert status_res3.status_code == 200
    assert status_res3.json()["is_connected"] is False


def test_whatsapp_embedded_signup_endpoints(client: TestClient, auth_headers_a: dict):
    # 1. Fetch Embedded Signup Config
    config_res = client.get("/api/v1/whatsapp/embedded-signup/config", headers=auth_headers_a)
    assert config_res.status_code == 200
    config_data = config_res.json()
    assert "app_id" in config_data
    assert "config_id" in config_data
    assert "scopes" in config_data
    assert "whatsapp_business_messaging" in config_data["scopes"]

    # 2. Callback from Meta Popup
    callback_payload = {
        "code": "meta_oauth_auth_code_xyz123",
        "waba_id": "waba_embed_123",
        "phone_number_id": "phone_embed_123"
    }
    cb_res = client.post("/api/v1/whatsapp/embedded-signup/callback", json=callback_payload, headers=auth_headers_a)
    assert cb_res.status_code == 200
    assert cb_res.json()["status"] == "connected"
    assert cb_res.json()["signup_type"] == "EMBEDDED_SIGNUP"

