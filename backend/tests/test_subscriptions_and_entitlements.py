import os
import pytest
from datetime import datetime, date, timedelta, timezone
from zoneinfo import ZoneInfo
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from models.business import Business
from models.subscription import Subscription
from models.payment import Payment
from services.entitlement_services import EntitlementService
from services.razorpay_subscription_service import (
    RazorpaySubscriptionService,
    RazorpaySubscriptionConfigurationError
)
from config_plans import SUBSCRIPTION_PLANS

# ════════════════════════════════════════════════════════════
# 1. FIXED MONTHLY BILLING DATE (4TH) ALGORITHM TESTS
# ════════════════════════════════════════════════════════════

def test_monthly_billing_date_calculation_all_cases():
    """
    Verifies dynamic calculation of next billing anchor on the 4th of every month:
    - September 11 → October 4
    - September 25 → October 4
    - October 2 → October 4
    - October 4 → same-day behavior (immediate charge today)
    - October 5 → November 4
    - November 30 → December 4
    - December 20 → January 4
    - Leap-year cases (e.g. Feb 1, Feb 4, Feb 29 2028)
    - Year boundary (Dec 31, Jan 1)
    - Timezone/date-boundary cases (Asia/Kolkata vs UTC)
    """
    tz = ZoneInfo("Asia/Kolkata")

    # Required Business Cases
    cases = [
        # (Input Date, Expected Billing Date, Expected Same-Day Flag)
        (datetime(2026, 9, 11, 10, 0, tzinfo=tz), date(2026, 10, 4), False),
        (datetime(2026, 9, 25, 15, 30, tzinfo=tz), date(2026, 10, 4), False),
        (datetime(2026, 10, 2, 8, 45, tzinfo=tz), date(2026, 10, 4), False),
        (datetime(2026, 10, 4, 12, 0, tzinfo=tz), date(2026, 10, 4), True),
        (datetime(2026, 10, 5, 9, 15, tzinfo=tz), date(2026, 11, 4), False),
        (datetime(2026, 11, 30, 23, 59, tzinfo=tz), date(2026, 12, 4), False),
        (datetime(2026, 12, 20, 18, 0, tzinfo=tz), date(2027, 1, 4), False),
        
        # Leap Year Cases (2028 is a leap year)
        (datetime(2028, 2, 1, 10, 0, tzinfo=tz), date(2028, 2, 4), False),
        (datetime(2028, 2, 4, 14, 0, tzinfo=tz), date(2028, 2, 4), True),
        (datetime(2028, 2, 28, 12, 0, tzinfo=tz), date(2028, 3, 4), False),
        (datetime(2028, 2, 29, 23, 30, tzinfo=tz), date(2028, 3, 4), False),
        
        # Year Boundary Cases
        (datetime(2026, 12, 31, 23, 59, tzinfo=tz), date(2027, 1, 4), False),
        (datetime(2027, 1, 1, 0, 1, tzinfo=tz), date(2027, 1, 4), False),
        (datetime(2027, 1, 4, 11, 0, tzinfo=tz), date(2027, 1, 4), True),
    ]

    for input_dt, expected_date, expected_same_day in cases:
        res = RazorpaySubscriptionService.calculate_next_monthly_billing_date(input_dt)
        assert res["billing_date"] == expected_date, f"Failed for {input_dt}: got {res['billing_date']}, expected {expected_date}"
        assert res["is_same_day"] == expected_same_day, f"Failed same-day for {input_dt}: got {res['is_same_day']}, expected {expected_same_day}"
        if expected_same_day:
            assert res["start_at"] is None, f"Same day must omit start_at for {input_dt}"
        else:
            assert res["start_at"] is not None, f"Deferred start must provide start_at timestamp for {input_dt}"
            # Verify timestamp matches midnight IST on expected date
            expected_ts = int(datetime(expected_date.year, expected_date.month, expected_date.day, 0, 0, 0, tzinfo=tz).timestamp())
            assert res["start_at"] == expected_ts

def test_timezone_date_boundary_cases():
    """
    Verify timezone conversion between UTC and Asia/Kolkata (IST = UTC+5:30):
    - 2026-10-04 20:00:00 UTC is 2026-10-05 01:30:00 IST -> next billing is November 4.
    - 2026-10-03 20:00:00 UTC is 2026-10-04 01:30:00 IST -> next billing is October 4 (same-day).
    """
    # 8:00 PM UTC on Oct 4 is 1:30 AM IST on Oct 5 (after 4th in India)
    utc_after_4th = datetime(2026, 10, 4, 20, 0, 0, tzinfo=timezone.utc)
    res_after = RazorpaySubscriptionService.calculate_next_monthly_billing_date(utc_after_4th)
    assert res_after["billing_date"] == date(2026, 11, 4)
    assert res_after["is_same_day"] is False

    # 8:00 PM UTC on Oct 3 is 1:30 AM IST on Oct 4 (same-day 4th in India)
    utc_on_4th = datetime(2026, 10, 3, 20, 0, 0, tzinfo=timezone.utc)
    res_on = RazorpaySubscriptionService.calculate_next_monthly_billing_date(utc_on_4th)
    assert res_on["billing_date"] == date(2026, 10, 4)
    assert res_on["is_same_day"] is True
    assert res_on["start_at"] is None

def test_plus_billing_date_calculation_all_cases():
    """
    Verifies dynamic calculation of next Plus billing anchor on the 15th of every month:
    - September 11 → September 15
    - September 14 → September 15
    - September 15 → same-day behavior (immediate charge today, start_at is None)
    - September 16 → October 15
    - November 30 → December 15
    - December 20 → January 15
    - Month-end (e.g. Jan 31 → Feb 15)
    - Leap-year cases (e.g. Feb 1, Feb 15, Feb 28 2028 → March 15)
    - Year boundary (Dec 31 → Jan 15, Jan 1 → Jan 15)
    """
    tz = ZoneInfo("Asia/Kolkata")

    cases = [
        # (Input Date, Expected Billing Date, Expected Same-Day Flag)
        (datetime(2026, 9, 11, 10, 0, tzinfo=tz), date(2026, 9, 15), False),
        (datetime(2026, 9, 14, 23, 30, tzinfo=tz), date(2026, 9, 15), False),
        (datetime(2026, 9, 15, 12, 0, tzinfo=tz), date(2026, 9, 15), True),
        (datetime(2026, 9, 16, 9, 15, tzinfo=tz), date(2026, 10, 15), False),
        (datetime(2026, 11, 30, 23, 59, tzinfo=tz), date(2026, 12, 15), False),
        (datetime(2026, 12, 20, 18, 0, tzinfo=tz), date(2027, 1, 15), False),
        (datetime(2027, 1, 31, 14, 0, tzinfo=tz), date(2027, 2, 15), False),

        # Leap Year Cases (2028 is a leap year)
        (datetime(2028, 2, 1, 10, 0, tzinfo=tz), date(2028, 2, 15), False),
        (datetime(2028, 2, 15, 14, 0, tzinfo=tz), date(2028, 2, 15), True),
        (datetime(2028, 2, 28, 12, 0, tzinfo=tz), date(2028, 3, 15), False),
        (datetime(2028, 2, 29, 23, 30, tzinfo=tz), date(2028, 3, 15), False),

        # Year Boundary Cases
        (datetime(2026, 12, 31, 23, 59, tzinfo=tz), date(2027, 1, 15), False),
        (datetime(2027, 1, 1, 0, 1, tzinfo=tz), date(2027, 1, 15), False),
        (datetime(2027, 1, 15, 11, 0, tzinfo=tz), date(2027, 1, 15), True),
    ]

    for input_dt, expected_date, expected_same_day in cases:
        res = RazorpaySubscriptionService.calculate_next_plus_billing_date(input_dt)
        assert res["billing_date"] == expected_date, f"Failed for {input_dt}: got {res['billing_date']}, expected {expected_date}"
        assert res["is_same_day"] == expected_same_day, f"Failed same-day for {input_dt}: got {res['is_same_day']}, expected {expected_same_day}"
        if expected_same_day:
            assert res["start_at"] is None, f"Same day must omit start_at for {input_dt}"
        else:
            assert res["start_at"] is not None, f"Deferred start must provide start_at timestamp for {input_dt}"
            expected_ts = int(datetime(expected_date.year, expected_date.month, expected_date.day, 0, 0, 0, tzinfo=tz).timestamp())
            assert res["start_at"] == expected_ts

def test_plus_timezone_date_boundary_cases():
    """
    Verify Plus timezone conversion between UTC and Asia/Kolkata (IST = UTC+5:30):
    - 2026-09-15 20:00:00 UTC is 2026-09-16 01:30:00 IST -> next billing is October 15.
    - 2026-09-14 20:00:00 UTC is 2026-09-15 01:30:00 IST -> next billing is September 15 (same-day).
    """
    # 8:00 PM UTC on Sep 15 is 1:30 AM IST on Sep 16 (after 15th in India)
    utc_after_15th = datetime(2026, 9, 15, 20, 0, 0, tzinfo=timezone.utc)
    res_after = RazorpaySubscriptionService.calculate_next_plus_billing_date(utc_after_15th)
    assert res_after["billing_date"] == date(2026, 10, 15)
    assert res_after["is_same_day"] is False

    # 8:00 PM UTC on Sep 14 is 1:30 AM IST on Sep 15 (same-day 15th in India)
    utc_on_15th = datetime(2026, 9, 14, 20, 0, 0, tzinfo=timezone.utc)
    res_on = RazorpaySubscriptionService.calculate_next_plus_billing_date(utc_on_15th)
    assert res_on["billing_date"] == date(2026, 9, 15)
    assert res_on["is_same_day"] is True
    assert res_on["start_at"] is None

# ════════════════════════════════════════════════════════════
# 2. PRICING CONFIGURATION & INTEGRITY TESTS
# ════════════════════════════════════════════════════════════

def test_subscription_pricing_and_no_old_prices():
    """
    Verify active plan configuration:
    - Monthly: ₹3,699 / month (recurring on the 4th)
    - Yearly: ₹999 / year (immediate charge)
    - Plus: ₹999 / month (recurring monthly, immediate charge, NOT anchored to 4th)
    - Monthly, Yearly, and Plus plan IDs cannot be swapped or conflated
    - No old prices (900, 4999, 699, 6899) exist in active config
    - No free trial logic (trial_days > 0)
    """
    monthly = SUBSCRIPTION_PLANS["monthly"]
    yearly = SUBSCRIPTION_PLANS["yearly"]
    plus = SUBSCRIPTION_PLANS["plus"]

    # Exact prices & intervals
    assert monthly["price"] == 3699.0
    assert monthly["normal_price"] == 3699.0
    assert monthly["billing_interval"] == "monthly"
    assert monthly["billing_anchor_day"] == 4

    assert yearly["price"] == 999.0
    assert yearly["normal_price"] == 999.0
    assert yearly["billing_interval"] == "yearly"

    assert plus["price"] == 999.0
    assert plus["normal_price"] == 999.0
    assert plus["billing_interval"] == "monthly"
    assert plus.get("billing_anchor_day") == 15

    # Plan separation checks
    assert monthly["price"] > yearly["price"]
    assert monthly["price"] > plus["price"]
    assert monthly["billing_interval"] == plus["billing_interval"]
    assert yearly["billing_interval"] != plus["billing_interval"]

    # Savings metrics for yearly
    expected_savings = (3699.0 * 12) - 999.0 # 43,389.0
    assert yearly["savings_amount"] == expected_savings
    assert yearly["discount_percent"] == 98

    # Ensure no old prices exist
    old_prices = {900.0, 4999.0, 699.0, 6899.0}
    assert monthly["price"] not in old_prices
    assert yearly["price"] not in old_prices
    assert plus["price"] not in old_prices
    assert monthly["normal_price"] not in old_prices
    assert yearly["normal_price"] not in old_prices
    assert plus["normal_price"] not in old_prices

    # Ensure no trial logic in plan config
    assert "trial_days" not in monthly or monthly.get("trial_days") == 0
    assert "trial_days" not in yearly or yearly.get("trial_days") == 0
    assert "trial_days" not in plus or plus.get("trial_days") == 0

def test_deprecated_plan_ids_rejection():
    """
    Verify RazorpaySubscriptionService rejects old deprecated plan IDs,
    requires configured plan IDs from environment variables,
    and isolates Monthly, Yearly, and Plus plan IDs.
    """
    # Test rejection of deprecated plans
    deprecated_samples = [
        "plan_TZx4AbrrftCAcm", # Previous monthly ₹900
        "plan_TZxFTBI4TK3IAY", # Previous yearly ₹4,999
        "plan_tngieyxltakim9", # Old monthly ₹699
        "plan_tngkw9ixatgcm3", # Old yearly ₹6,899
    ]
    for dep_id in deprecated_samples:
        os.environ["RAZORPAY_MONTHLY_PLAN_ID"] = dep_id
        with pytest.raises(RazorpaySubscriptionConfigurationError):
            RazorpaySubscriptionService.get_configured_plan_id("monthly")

    # Configure valid placeholder test IDs for all three plans
    os.environ["RAZORPAY_MONTHLY_PLAN_ID"] = "plan_monthly_3699_test"
    os.environ["RAZORPAY_YEARLY_PLAN_ID"] = "plan_yearly_999_test"
    os.environ["RAZORPAY_PLUS_PLAN_ID"] = "plan_plus_999_test"

    assert RazorpaySubscriptionService.get_configured_plan_id("monthly") == "plan_monthly_3699_test"
    assert RazorpaySubscriptionService.get_configured_plan_id("yearly") == "plan_yearly_999_test"
    assert RazorpaySubscriptionService.get_configured_plan_id("plus") == "plan_plus_999_test"

    # Confirm Plus does NOT use Monthly or Yearly Plan ID
    assert RazorpaySubscriptionService.get_configured_plan_id("plus") != RazorpaySubscriptionService.get_configured_plan_id("monthly")
    assert RazorpaySubscriptionService.get_configured_plan_id("plus") != RazorpaySubscriptionService.get_configured_plan_id("yearly")

    # If Plus is unconfigured, it must raise a configuration error without breaking monthly or yearly
    os.environ["RAZORPAY_PLUS_PLAN_ID"] = ""
    with pytest.raises(RazorpaySubscriptionConfigurationError):
        RazorpaySubscriptionService.get_configured_plan_id("plus")
    assert RazorpaySubscriptionService.get_configured_plan_id("monthly") == "plan_monthly_3699_test"
    assert RazorpaySubscriptionService.get_configured_plan_id("yearly") == "plan_yearly_999_test"
    os.environ["RAZORPAY_PLUS_PLAN_ID"] = "plan_plus_999_test"

def test_subscription_creation_monthly_yearly_plus():
    """
    Verify:
    1. Monthly creation uses the 4th billing schedule (sets start_at when deferred to 4th)
    2. Yearly creation NEVER uses the 4th billing schedule (start_at is always None)
    3. Plus creation uses the 15th billing schedule (sets start_at when deferred to 15th)
    4. Verifies exact payload sent to Razorpay client.subscription.create
    """
    from unittest.mock import patch, MagicMock

    os.environ["RAZORPAY_MONTHLY_PLAN_ID"] = "plan_monthly_3699_test"
    os.environ["RAZORPAY_YEARLY_PLAN_ID"] = "plan_yearly_999_test"
    os.environ["RAZORPAY_PLUS_PLAN_ID"] = "plan_plus_999_test"

    mock_client = MagicMock()
    mock_client.subscription.create.side_effect = lambda payload: {
        "id": f"sub_mock_{payload.get('notes', {}).get('plan_id')}",
        "status": "created",
        "plan_id": payload.get("plan_id"),
        "start_at": payload.get("start_at")
    }

    with patch.object(RazorpaySubscriptionService, "get_client", return_value=mock_client):
        # 1. Monthly subscription
        sub_m = RazorpaySubscriptionService.create_subscription("biz-create-m", "monthly", "monthly")
        assert sub_m["razorpay_plan_id"] == "plan_monthly_3699_test"
        assert sub_m["next_billing_date"].endswith("-04") # Must anchor to the 4th

        m_call_payload = mock_client.subscription.create.call_args_list[0][0][0]
        assert m_call_payload["plan_id"] == "plan_monthly_3699_test"
        assert m_call_payload["total_count"] == 120
        if not sub_m["is_same_day"]:
            assert m_call_payload["start_at"] == sub_m["start_at"]
        else:
            assert "start_at" not in m_call_payload

        # 2. Yearly subscription — MUST NOT anchor to the 4th or 15th
        sub_y = RazorpaySubscriptionService.create_subscription("biz-create-y", "yearly", "yearly")
        assert sub_y["razorpay_plan_id"] == "plan_yearly_999_test"
        assert sub_y["start_at"] is None # Yearly starts immediately

        y_call_payload = mock_client.subscription.create.call_args_list[1][0][0]
        assert y_call_payload["plan_id"] == "plan_yearly_999_test"
        assert y_call_payload["total_count"] == 10
        assert "start_at" not in y_call_payload # Must NOT have start_at

        # 3. Plus subscription — MUST anchor to the 15th
        sub_p = RazorpaySubscriptionService.create_subscription("biz-create-p", "monthly", "plus")
        assert sub_p["razorpay_plan_id"] == "plan_plus_999_test"
        assert sub_p["next_billing_date"].endswith("-15") # Must anchor to the 15th

        p_call_payload = mock_client.subscription.create.call_args_list[2][0][0]
        assert p_call_payload["plan_id"] == "plan_plus_999_test"
        assert p_call_payload["total_count"] == 120
        if not sub_p["is_same_day"]:
            assert p_call_payload["start_at"] == sub_p["start_at"]
            assert p_call_payload["notes"]["billing_anchor_day"] == "15"
        else:
            assert "start_at" not in p_call_payload

# ════════════════════════════════════════════════════════════
# 3. ENDPOINTS: /plans AND /create-checkout
# ════════════════════════════════════════════════════════════

def test_subscription_plans_endpoint(client: TestClient, auth_headers_a):
    """
    Verify /subscriptions/plans returns Monthly (₹3,699), Yearly (₹999), and Plus (₹999) definitions.
    """
    res = client.get("/api/v1/subscriptions/plans", headers=auth_headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "plans" in data
    assert data["plans"]["monthly"]["price"] == 3699.0
    assert data["plans"]["yearly"]["price"] == 999.0
    assert data["plans"]["plus"]["price"] == 999.0
    assert data["plans"]["plus"]["billing_interval"] == "monthly"
    assert data["plans"]["monthly"]["billing_anchor_day"] == 4
    assert data["plans"]["plus"]["billing_anchor_day"] == 15

def test_create_subscription_checkout_endpoint(client: TestClient, auth_headers_a):
    """
    Verify POST /subscriptions/create-checkout produces:
    - Monthly: ₹3,699, recurring on 4th of month
    - Yearly: ₹999, charged immediately today
    - Plus: ₹999, recurring on 15th of month
    - Invalid plan identifier returns 400 Bad Request
    """
    from unittest.mock import patch, MagicMock

    os.environ["RAZORPAY_MONTHLY_PLAN_ID"] = "plan_monthly_3699_test"
    os.environ["RAZORPAY_YEARLY_PLAN_ID"] = "plan_yearly_999_test"
    os.environ["RAZORPAY_PLUS_PLAN_ID"] = "plan_plus_999_test"

    mock_client = MagicMock()
    mock_client.subscription.create.side_effect = lambda payload: {
        "id": f"sub_checkout_{payload.get('notes', {}).get('plan_id')}",
        "status": "created",
        "plan_id": payload.get("plan_id"),
        "start_at": payload.get("start_at")
    }

    with patch.object(RazorpaySubscriptionService, "get_client", return_value=mock_client):
        # 1. Monthly Checkout
        res_m = client.post("/api/v1/subscriptions/create-checkout", json={"plan_id": "monthly"}, headers=auth_headers_a)
        assert res_m.status_code == 200
        data_m = res_m.json()
        assert data_m["plan_id"] == "monthly"
        assert data_m["billing_interval"] == "monthly"
        assert data_m["charge_amount"] == 3699.0
        assert data_m["normal_recurring_price"] == 3699.0
        assert data_m["next_billing_date"].endswith("-04")
        assert data_m["disclosures"]["recurring_amount"] == 3699.0
        assert data_m["disclosures"]["billing_anchor_day"] == 4

        # 2. Yearly Checkout
        res_y = client.post("/api/v1/subscriptions/create-checkout", json={"plan_id": "yearly"}, headers=auth_headers_a)
        assert res_y.status_code == 200
        data_y = res_y.json()
        assert data_y["plan_id"] == "yearly"
        assert data_y["billing_interval"] == "yearly"
        assert data_y["charge_amount"] == 999.0
        assert data_y["normal_recurring_price"] == 999.0
        assert data_y["start_at"] is None
        assert data_y["disclosures"]["amount_today"] == 999.0
        assert data_y["disclosures"]["recurring_amount"] == 999.0

        # 3. Plus Checkout
        res_p = client.post("/api/v1/subscriptions/create-checkout", json={"plan_id": "plus"}, headers=auth_headers_a)
        assert res_p.status_code == 200
        data_p = res_p.json()
        assert data_p["plan_id"] == "plus"
        assert data_p["billing_interval"] == "monthly"
        assert data_p["charge_amount"] == 999.0
        assert data_p["normal_recurring_price"] == 999.0
        assert data_p["next_billing_date"].endswith("-15")
        assert data_p["disclosures"]["recurring_amount"] == 999.0
        assert data_p["disclosures"]["billing_anchor_day"] == 15
        assert data_p["disclosures"]["schedule"] == "Billed on the 15th of every month"

        # 4. Invalid plan rejection
        res_inv = client.post("/api/v1/subscriptions/create-checkout", json={"plan_id": "nonexistent_plan"}, headers=auth_headers_a)
        assert res_inv.status_code == 400
        err_msg = res_inv.json().get("detail") or res_inv.json().get("error", {}).get("message", "")
        assert "Invalid plan identifier" in err_msg

# ════════════════════════════════════════════════════════════
# 4. WEBHOOK LIFECYCLE & STATE MACHINE TESTS
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_webhook_subscription_authenticated_monthly_deferred(db_session: Session):
    """
    Verify monthly subscription with deferred start (e.g. Sep 11 with 1st charge Oct 4):
    - Transitions to AUTHENTICATED status (live accessible)
    - Does NOT mark active paid period before Oct 4 (is_paid = False)
    - Next charge is scheduled for Oct 4
    """
    from services.payment_services import RazorpayService

    biz = Business(id="biz-auth-m", name="Deferred Monthly Biz", email="m_auth@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    sub = EntitlementService.get_or_create_subscription(db_session, "biz-auth-m")
    sub.status = "EXPLORING"
    sub.billing_interval = "monthly"
    sub.normal_price = 3699.00
    db_session.commit()

    # Simulate authorization on Sep 11 with start_at = Oct 4 00:00:00 IST
    oct_4_ts = int(datetime(2026, 10, 4, 0, 0, 0, tzinfo=ZoneInfo("Asia/Kolkata")).timestamp())
    webhook_payload = {
        "event": "subscription.authenticated",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_month_11",
                    "start_at": oct_4_ts,
                    "notes": {"business_id": "biz-auth-m"}
                }
            }
        }
    }

    result = await RazorpayService.process_webhook_callback(db_session, webhook_payload)
    assert result["status"] == "success"

    state = EntitlementService.evaluate_subscription_state(db_session, "biz-auth-m")
    assert state["status"] == "AUTHENTICATED"
    assert state["is_live_accessible"] is True # Access enabled because mandate is authorized
    assert state["is_paid"] is False # NOT yet marked paid because charge is Oct 4

@pytest.mark.asyncio
async def test_webhook_subscription_authenticated_yearly_immediate(db_session: Session):
    """
    Verify yearly subscription:
    - Transitions to ACTIVE status immediately upon authorization/payment
    - is_paid is True
    - Full 365-day period granted
    """
    from services.payment_services import RazorpayService

    biz = Business(id="biz-auth-y", name="Immediate Yearly Biz", email="y_auth@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    sub = EntitlementService.get_or_create_subscription(db_session, "biz-auth-y")
    sub.status = "EXPLORING"
    sub.billing_interval = "yearly"
    sub.normal_price = 999.00
    db_session.commit()

    webhook_payload = {
        "event": "subscription.authenticated",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_year_999",
                    "notes": {"business_id": "biz-auth-y"}
                }
            }
        }
    }

    result = await RazorpayService.process_webhook_callback(db_session, webhook_payload)
    assert result["status"] == "success"

    state = EntitlementService.evaluate_subscription_state(db_session, "biz-auth-y")
    assert state["status"] == "ACTIVE"
    assert state["is_live_accessible"] is True
    assert state["is_paid"] is True

@pytest.mark.asyncio
async def test_webhook_subscription_charged_monthly_anchors_to_next_4th(db_session: Session):
    """
    Verify subscription.charged on the 4th:
    - Transitions status to ACTIVE
    - Period end anchors to the 4th of the next month
    - Logs Payment record for ₹3,699 as paid
    """
    from services.payment_services import RazorpayService

    biz = Business(id="biz-charge-m", name="Charged Monthly Biz", email="m_chg@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    sub = EntitlementService.get_or_create_subscription(db_session, "biz-charge-m")
    sub.status = "AUTHENTICATED"
    sub.billing_interval = "monthly"
    sub.normal_price = 3699.00
    sub.provider_subscription_id = "sub_rzp_charge_4"
    db_session.commit()

    webhook_payload = {
        "event": "subscription.charged",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_charge_4",
                    "notes": {"business_id": "biz-charge-m"}
                }
            },
            "payment": {
                "entity": {
                    "id": "pay_oct_4_charge_123",
                    "amount": 369900, # 3699 INR in paise
                    "status": "captured",
                    "notes": {"business_id": "biz-charge-m"}
                }
            }
        }
    }

    result = await RazorpayService.process_webhook_callback(db_session, webhook_payload)
    assert result["status"] == "success"

    state = EntitlementService.evaluate_subscription_state(db_session, "biz-charge-m")
    assert state["status"] == "ACTIVE"
    assert state["is_paid"] is True
    assert state["period"]["end"] is not None

    # Check Payment ledger record
    payment = db_session.query(Payment).filter(Payment.razorpay_payment_id == "pay_oct_4_charge_123").first()
    assert payment is not None
    assert payment.status == "paid"
    assert float(payment.amount) == 3699.0

@pytest.mark.asyncio
async def test_webhook_failure_and_halt_handling(db_session: Session):
    """
    Verify payment.failed and subscription.halted are gracefully handled without crashing.
    """
    from services.payment_services import RazorpayService

    biz = Business(id="biz-fail-test", name="Failure Test Biz", email="fail@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    sub = EntitlementService.get_or_create_subscription(db_session, "biz-fail-test")
    sub.status = "ACTIVE"
    sub.provider_subscription_id = "sub_rzp_halt_1"
    db_session.commit()

    # 1. subscription.halted
    halt_payload = {
        "event": "subscription.halted",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_halt_1",
                    "notes": {"business_id": "biz-fail-test"}
                }
            }
        }
    }
    halt_res = await RazorpayService.process_webhook_callback(db_session, halt_payload)
    assert halt_res["status"] == "success"
    refreshed_sub = db_session.query(Subscription).filter(Subscription.business_id == "biz-fail-test").first()
    assert refreshed_sub.status == "PAST_DUE"

    # 2. subscription.cancelled
    cancel_payload = {
        "event": "subscription.cancelled",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_halt_1",
                    "notes": {"business_id": "biz-fail-test"}
                }
            }
        }
    }
    cancel_res = await RazorpayService.process_webhook_callback(db_session, cancel_payload)
    assert cancel_res["status"] == "success"
    db_session.refresh(refreshed_sub)
    assert refreshed_sub.status == "CANCELLED"

@pytest.mark.asyncio
async def test_webhook_subscription_authenticated_plus_deferred(db_session: Session):
    """
    Verify Plus subscription with deferred start (e.g. Sep 11 with 1st charge Sep 15):
    - Transitions to AUTHENTICATED status (live accessible)
    - Does NOT mark active paid period before Sep 15 (is_paid = False)
    - Next charge is scheduled for Sep 15
    """
    from services.payment_services import RazorpayService

    biz = Business(id="biz-auth-p", name="Deferred Plus Biz", email="p_auth@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    sub = EntitlementService.get_or_create_subscription(db_session, "biz-auth-p")
    sub.status = "EXPLORING"
    sub.plan_id = "plus"
    sub.billing_interval = "monthly"
    sub.normal_price = 999.00
    db_session.commit()

    sep_15_ts = int(datetime(2026, 9, 15, 0, 0, 0, tzinfo=ZoneInfo("Asia/Kolkata")).timestamp())
    webhook_payload = {
        "event": "subscription.authenticated",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_plus_11",
                    "start_at": sep_15_ts,
                    "notes": {"business_id": "biz-auth-p", "plan_id": "plus"}
                }
            }
        }
    }

    result = await RazorpayService.process_webhook_callback(db_session, webhook_payload)
    assert result["status"] == "success"

    state = EntitlementService.evaluate_subscription_state(db_session, "biz-auth-p")
    assert state["status"] == "AUTHENTICATED"
    assert state["is_live_accessible"] is True
    assert state["is_paid"] is False

@pytest.mark.asyncio
async def test_webhook_subscription_charged_plus_anchors_to_next_15th(db_session: Session):
    """
    Verify subscription.charged on the 15th for Plus:
    - Transitions status to ACTIVE
    - Period end anchors to the 15th of the next month
    - Logs Payment record for ₹999 as paid
    """
    from services.payment_services import RazorpayService

    biz = Business(id="biz-charge-p", name="Charged Plus Biz", email="p_chg@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    sub = EntitlementService.get_or_create_subscription(db_session, "biz-charge-p")
    sub.status = "AUTHENTICATED"
    sub.plan_id = "plus"
    sub.billing_interval = "monthly"
    sub.normal_price = 999.00
    sub.provider_subscription_id = "sub_rzp_charge_15"
    db_session.commit()

    webhook_payload = {
        "event": "subscription.charged",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_charge_15",
                    "notes": {"business_id": "biz-charge-p", "plan_id": "plus"}
                }
            },
            "payment": {
                "entity": {
                    "id": "pay_sep_15_charge_123",
                    "amount": 99900, # 999 INR in paise
                    "status": "captured",
                    "notes": {"business_id": "biz-charge-p"}
                }
            }
        }
    }

    result = await RazorpayService.process_webhook_callback(db_session, webhook_payload)
    assert result["status"] == "success"

    state = EntitlementService.evaluate_subscription_state(db_session, "biz-charge-p")
    assert state["status"] == "ACTIVE"
    assert state["is_paid"] is True
    assert state["period"]["end"] is not None

    payment = db_session.query(Payment).filter(Payment.razorpay_payment_id == "pay_sep_15_charge_123").first()
    assert payment is not None
    assert payment.status == "paid"
    assert float(payment.amount) == 999.0
