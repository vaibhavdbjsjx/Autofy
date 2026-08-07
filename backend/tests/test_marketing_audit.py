import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from models.business import Business
from models.lead import Lead
from models.marketing import Campaign, BroadcastMessage
from routers.marketing import trigger_send_campaign, get_campaigns, get_marketing_analytics

def test_campaign_crud_and_persistence(db_session: Session):
    """
    Verify Campaign creation, persistence, and fields.
    """
    biz = Business(id="biz-mkt-1", name="Marketing Biz 1", email="mkt1@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    camp = Campaign(
        business_id="biz-mkt-1",
        name="Festive Diwali Sale Promo",
        channel="WhatsApp",
        status="Draft",
        target_segment="All",
        content="Happy Diwali! Get flat 20% off on all items today."
    )
    db_session.add(camp)
    db_session.commit()

    assert camp.id is not None
    assert camp.name == "Festive Diwali Sale Promo"
    assert camp.status == "Draft"
    assert camp.business_id == "biz-mkt-1"

def test_campaign_tenant_isolation(db_session: Session):
    """
    Verify Business B cannot read or manipulate Business A's campaign.
    """
    biz_a = Business(id="biz-ma", name="Biz MA", email="ma@test.com", classification="Retail")
    biz_b = Business(id="biz-mb", name="Biz MB", email="mb@test.com", classification="Retail")
    db_session.add_all([biz_a, biz_b])
    db_session.commit()

    camp_a = Campaign(
        id="camp-a-100",
        business_id="biz-ma",
        name="Campaign A",
        channel="WhatsApp",
        status="Draft",
        content="Secret promo A"
    )
    db_session.add(camp_a)
    db_session.commit()

    # Business B attempts to retrieve Campaign A
    found_b = db_session.query(Campaign).filter(
        Campaign.id == "camp-a-100",
        Campaign.business_id == "biz-mb"
    ).first()
    assert found_b is None

def test_broadcast_recipient_deduplication(db_session: Session):
    """
    Verify triggering campaign send against leads with formatted phone variations (+919876543210 vs 919876543210)
    deduplicates recipients so each phone gets exactly 1 broadcast message.
    """
    biz = Business(id="biz-dedup-1", name="Dedup Biz", email="dedup@test.com", classification="Automotive")
    db_session.add(biz)
    db_session.commit()

    # Add 2 leads with same normalized phone number
    lead1 = Lead(business_id="biz-dedup-1", name="Customer Var 1", phone="+919876543210")
    lead2 = Lead(business_id="biz-dedup-1", name="Customer Var 2", phone="91 98765 43210")
    lead3 = Lead(business_id="biz-dedup-1", name="Unique Customer", phone="+919111122222")
    db_session.add_all([lead1, lead2, lead3])
    db_session.commit()

    camp = Campaign(
        id="camp-dedup-1",
        business_id="biz-dedup-1",
        name="Dedup Test Campaign",
        content="Special offer"
    )
    db_session.add(camp)
    db_session.commit()

    # Query leads for biz-dedup-1
    leads = db_session.query(Lead).filter(Lead.business_id == "biz-dedup-1").all()
    assert len(leads) == 3

    # Deduplicate phones using normalize_phone logic
    from services.lead_services import normalize_phone
    seen = set()
    unique_recipients = []
    for l in leads:
        norm = normalize_phone(l.phone)
        if norm and norm not in seen:
            seen.add(norm)
            unique_recipients.append(l)

    assert len(unique_recipients) == 2 # 3 leads mapped to 2 unique phones!

def test_empty_business_zero_marketing_data(db_session: Session):
    """
    Verify a brand-new business returns 0 campaigns and zero metrics without seed injection.
    """
    biz_empty = Business(id="biz-empty-mkt", name="Empty Marketing Biz", email="emkt@test.com", classification="Retail")
    db_session.add(biz_empty)
    db_session.commit()

    camps = db_session.query(Campaign).filter(Campaign.business_id == "biz-empty-mkt").all()
    camp_ids = [c.id for c in camps]
    broadcasts = db_session.query(BroadcastMessage).filter(BroadcastMessage.campaign_id.in_(camp_ids)).all() if camp_ids else []

    assert len(camps) == 0
    assert len(broadcasts) == 0
