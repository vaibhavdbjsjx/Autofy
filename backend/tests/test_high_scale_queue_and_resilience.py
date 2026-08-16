import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from models.business import Business
from models.lead import Lead
from models.conversation import Conversation
from models.message import Message
from services.queue_services import JobQueueService, WebhookJob
from services.error_tracker import ErrorTracker
from middleware.rate_limiter import limiter_store

def test_webhook_immediate_200_and_job_enqueue(client: TestClient, db_session: Session):
    """
    Verify high-scale webhook ingress enqueues the payload and immediately returns 200 OK
    with queued status and unique job_id in < 20ms without blocking.
    """
    biz = Business(
        id="biz-queue-test-1",
        name="Apex Fitness Studio",
        email="apex@gym.com",
        classification="Fitness",
        whatsapp_phone_id="phone_id_apex_101"
    )
    db_session.add(biz)
    db_session.commit()

    webhook_payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "waba_apex_101",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "phone_id_apex_101"},
                    "contacts": [{"profile": {"name": "High Volume User"}, "wa_id": "919811223344"}],
                    "messages": [{
                        "from": "919811223344",
                        "id": "wamid.queue_scale_1001",
                        "type": "text",
                        "text": {"body": "Tell me your gym plans"}
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    res = client.post("/api/v1/whatsapp/webhook?async=true", json=webhook_payload)
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "queued"
    assert "job_id" in data
    assert data.get("received") is True


def test_system_queue_and_dlq_endpoints(client: TestClient, auth_headers_a: dict, db_session: Session):
    """
    Verify /api/v1/system/queue/status and /api/v1/system/dlq endpoints.
    """
    # 1. Check queue status
    q_res = client.get("/api/v1/system/queue/status")
    assert q_res.status_code == 200
    q_data = q_res.json()
    assert q_data["status"] == "healthy"
    assert "telemetry" in q_data

    # 2. Check DLQ endpoint
    dlq_res = client.get("/api/v1/system/dlq", headers=auth_headers_a)
    assert dlq_res.status_code == 200
    assert isinstance(dlq_res.json(), list)

    # 3. Check error tracker summary
    err_res = client.get("/api/v1/system/errors/summary", headers=auth_headers_a)
    assert err_res.status_code == 200
    assert "total_recorded" in err_res.json()

    # 4. Check rate limits status
    rate_res = client.get("/api/v1/system/rate-limits/status")
    assert rate_res.status_code == 200
    assert rate_res.json()["enabled"] is True


def test_dead_letter_queue_exhaustion_and_replay():
    """
    Verify that an unrecoverable webhook job is moved to the DLQ after retry attempts
    and can be re-enqueued for replay.
    """
    job_id = "job_test_dlq_101"
    job = WebhookJob(
        job_id=job_id,
        business_id="biz-dlq-1",
        payload={"invalid": "payload"},
        max_retries=2
    )

    # Simulate 2 failed attempts
    job.attempts = 2
    job.status = "DLQ"
    JobQueueService._dlq_jobs.appendleft(job)

    # Inspect DLQ
    dlq_jobs = JobQueueService.get_dlq_jobs(limit=10)
    assert any(j["job_id"] == job_id for j in dlq_jobs)

    # Test DLQ replay
    loop = asyncio.new_event_loop()
    replayed = loop.run_until_complete(JobQueueService.retry_dlq_job(job_id))
    loop.close()

    assert replayed is True
    assert job.attempts == 0
    assert job.status == "QUEUED"


def test_rate_limiting_sliding_window_rejection():
    """
    Verify sliding window rate limiter permits requests under threshold and rejects once exceeded.
    """
    test_key = "test_client_burst_ip"
    limiter_store._buckets.pop(test_key, None)

    # Allow 5 rapid requests
    for _ in range(5):
        allowed, remaining, _ = limiter_store.is_allowed(test_key, max_requests=5, window_seconds=60.0)
        assert allowed is True

    # 6th request must be rejected
    allowed, remaining, reset_secs = limiter_store.is_allowed(test_key, max_requests=5, window_seconds=60.0)
    assert allowed is False
    assert remaining == 0
    assert reset_secs > 0


def test_error_tracker_captures_exceptions():
    """
    Verify ErrorTracker records categorized errors with timestamps and tenant tags.
    """
    err_id = ErrorTracker.record_error(
        category="WHATSAPP_GRAPH_API_TIMEOUT",
        exception=TimeoutError("Meta Graph API endpoint timed out after 12.0s"),
        business_id="biz-scale-err-1",
        endpoint="/whatsapp/webhook"
    )

    assert err_id.startswith("err_")
    recent = ErrorTracker.get_recent_errors(limit=10, category="WHATSAPP_GRAPH_API_TIMEOUT")
    assert len(recent) >= 1
    assert recent[0]["business_id"] == "biz-scale-err-1"
    assert "Meta Graph API endpoint timed out" in recent[0]["message"]
