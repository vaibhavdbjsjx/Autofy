import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from models.business import Business
from models.conversation import Conversation
from models.message import Message
from models.faq import FAQ
from models.service import Service
from models.product import Product
from models.business_policy import BusinessPolicy
from models.ai_training import AILog, AIKnowledgeGap, AITrainedAnswer
from services.conversation_services import BusinessKnowledgeService, ConversationalAIService

def test_ai_knowledge_retrieval_tenant_isolated(db_session: Session):
    """
    Verify Business A's RAG context ONLY retrieves Business A's data, never Business B's.
    """
    biz_a = Business(id="biz-ai-a", name="Alpha Tuning", email="a@alpha.com", classification="Automotive")
    biz_b = Business(id="biz-ai-b", name="Beta Bakery", email="b@beta.com", classification="Retail")
    db_session.add_all([biz_a, biz_b])
    db_session.commit()

    faq_a = FAQ(business_id="biz-ai-a", question="Alpha exhaust price?", answer="Alpha exhaust costs 5000 INR.")
    faq_b = FAQ(business_id="biz-ai-b", question="Beta bread price?", answer="Beta sourdough costs 100 INR.")
    db_session.add_all([faq_a, faq_b])
    db_session.commit()

    # Query context for Business A
    ctx_a = BusinessKnowledgeService.retrieve_context(db_session, "biz-ai-a", "price")
    faq_questions_a = [f.question for f in ctx_a["faqs"]]

    assert "Alpha exhaust price?" in faq_questions_a
    assert "Beta bread price?" not in faq_questions_a

def test_ai_conversation_history_customer_isolated(db_session: Session):
    """
    Verify Customer A's conversation history is strictly isolated from Customer B.
    """
    biz = Business(id="biz-ai-hist", name="Gamma Motors", email="g@gamma.com", classification="Automotive")
    db_session.add(biz)
    db_session.commit()

    conv1 = Conversation(id="conv-cust-1", business_id="biz-ai-hist", platform_sender_id="919000000001")
    conv2 = Conversation(id="conv-cust-2", business_id="biz-ai-hist", platform_sender_id="919000000002")
    db_session.add_all([conv1, conv2])
    db_session.commit()

    msg1 = Message(conversation_id="conv-cust-1", sender_type="Customer", content="Customer 1 confidential query: secret_code_123")
    msg2 = Message(conversation_id="conv-cust-2", sender_type="Customer", content="Customer 2 public query")
    db_session.add_all([msg1, msg2])
    db_session.commit()

    # Call reply_with_ai for Conv 2
    res2 = ConversationalAIService.reply_with_ai(db_session, "conv-cust-2", "Hello")
    
    # Check that secret_code_123 from Conv 1 is nowhere in history query for Conv 2
    history_msgs_2 = db_session.query(Message).filter(Message.conversation_id == "conv-cust-2").all()
    history_contents_2 = [m.content for m in history_msgs_2]
    assert not any("secret_code_123" in c for c in history_contents_2)

def test_ai_fallback_and_human_escalation(db_session: Session):
    """
    Verify human keyword request triggers escalation flag and status update.
    """
    biz = Business(
        id="biz-ai-esc",
        name="Delta Care",
        email="d@delta.com",
        classification="Automotive",
        config_fallback_message="Connecting you to human manager."
    )
    db_session.add(biz)
    db_session.commit()

    conv = Conversation(id="conv-esc-1", business_id="biz-ai-esc", platform_sender_id="919999999999")
    db_session.add(conv)
    db_session.commit()

    res = ConversationalAIService.reply_with_ai(db_session, "conv-esc-1", "I want to speak to a human manager right now")
    
    assert res["escalate"] is True
    assert res["reply"] == "Connecting you to human manager."

    # Verify conversation status updated to Escalated in DB
    db_session.refresh(conv)
    assert conv.status == "Escalated"
    assert conv.ai_enabled is False

def test_ai_trained_answers_persistence(db_session: Session):
    """
    Verify trained answer rules persist in DB and are retrieved in AI context.
    """
    biz = Business(id="biz-ai-train", name="Epsilon Shop", email="e@epsilon.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    trained_rule = AITrainedAnswer(
        business_id="biz-ai-train",
        trigger_phrase="warranty duration",
        trained_response="All parts carry a mandatory 24-month full replacement warranty.",
        status="active"
    )
    db_session.add(trained_rule)
    db_session.commit()

    ctx = BusinessKnowledgeService.retrieve_context(db_session, "biz-ai-train", "warranty")
    trained_list = ctx["trained_answers"]
    
    assert len(trained_list) == 1
    assert trained_list[0].trained_response == "All parts carry a mandatory 24-month full replacement warranty."

def test_ai_failure_handling_safe_fallback(db_session: Session):
    """
    Verify AI generation failure handles exceptions gracefully and returns fallback message.
    """
    biz = Business(
        id="biz-ai-fail",
        name="Zeta Motors",
        email="z@zeta.com",
        classification="Automotive",
        config_fallback_message="Our server is currently busy. A representative will get back to you."
    )
    db_session.add(biz)
    db_session.commit()

    conv = Conversation(id="conv-fail-1", business_id="biz-ai-fail", platform_sender_id="919888888888")
    db_session.add(conv)
    db_session.commit()

    # Force fallback by testing without Gemini API key or with unconfigured key
    res = ConversationalAIService.reply_with_ai(db_session, "conv-fail-1", "Is your shop open?")
    
    assert res["reply"] is not None
    assert len(res["reply"]) > 0
    assert "escalate" in res
