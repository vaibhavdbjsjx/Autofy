"""sync_all_schema_columns

Revision ID: d8b4e2f31a05
Revises: c7a3f9e12d01
Create Date: 2026-08-17 19:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d8b4e2f31a05"
down_revision: Union[str, None] = "c7a3f9e12d01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update businesses table
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_biz_cols = {col["name"] for col in inspector.get_columns("businesses")}

    biz_cols_to_add = [
        ("description", sa.Column("description", sa.Text(), nullable=True)),
        ("currency", sa.Column("currency", sa.String(10), nullable=True, server_default="INR (₹)")),
        ("language", sa.Column("language", sa.String(50), nullable=True, server_default="English")),
        ("whatsapp_business_account_id", sa.Column("whatsapp_business_account_id", sa.String(100), nullable=True)),
        ("whatsapp_phone_number", sa.Column("whatsapp_phone_number", sa.String(50), nullable=True)),
        ("whatsapp_display_name", sa.Column("whatsapp_display_name", sa.String(255), nullable=True)),
        ("whatsapp_access_token", sa.Column("whatsapp_access_token", sa.Text(), nullable=True)),
        ("whatsapp_token_expires_at", sa.Column("whatsapp_token_expires_at", sa.DateTime(), nullable=True)),
        ("whatsapp_connection_status", sa.Column("whatsapp_connection_status", sa.String(50), nullable=False, server_default="DISCONNECTED")),
        ("whatsapp_quality_rating", sa.Column("whatsapp_quality_rating", sa.String(50), nullable=False, server_default="GREEN")),
        ("whatsapp_message_tier", sa.Column("whatsapp_message_tier", sa.String(50), nullable=False, server_default="TIER_1K")),
        ("whatsapp_webhook_verified", sa.Column("whatsapp_webhook_verified", sa.Boolean(), nullable=False, server_default=sa.text("true"))),
        ("whatsapp_last_webhook_at", sa.Column("whatsapp_last_webhook_at", sa.DateTime(), nullable=True)),
        ("whatsapp_last_error", sa.Column("whatsapp_last_error", sa.Text(), nullable=True)),
        ("whatsapp_signup_type", sa.Column("whatsapp_signup_type", sa.String(50), nullable=False, server_default="MANUAL_CLOUD_API")),
        ("whatsapp_connected_at", sa.Column("whatsapp_connected_at", sa.DateTime(), nullable=True)),
        ("ai_personality", sa.Column("ai_personality", sa.String(100), nullable=True, server_default="Professional & Helpful")),
        ("ai_tone", sa.Column("ai_tone", sa.String(100), nullable=True, server_default="Warm & Concise")),
        ("ai_sales_behavior", sa.Column("ai_sales_behavior", sa.String(100), nullable=True, server_default="Consultative & Solution-Oriented")),
        ("ai_reply_style", sa.Column("ai_reply_style", sa.String(100), nullable=True, server_default="Structured with Bullet Points")),
        ("ai_escalation_rules", sa.Column("ai_escalation_rules", sa.Text(), nullable=True)),
    ]
    for col_name, col_obj in biz_cols_to_add:
        if col_name not in existing_biz_cols:
            op.add_column("businesses", col_obj)

    # 2. Update leads table
    existing_lead_cols = {col["name"] for col in inspector.get_columns("leads")}
    lead_cols_to_add = [
        ("deal_value", sa.Column("deal_value", sa.Numeric(10, 2), nullable=True)),
        ("pipeline_stage", sa.Column("pipeline_stage", sa.String(50), nullable=True, server_default="New Lead")),
        ("assigned_to_user_id", sa.Column("assigned_to_user_id", sa.String(36), nullable=True)),
        ("assigned_to_name", sa.Column("assigned_to_name", sa.String(255), nullable=True)),
        ("tags", sa.Column("tags", sa.Text(), nullable=True)),
        ("follow_up_at", sa.Column("follow_up_at", sa.DateTime(), nullable=True)),
        ("follow_up_notes", sa.Column("follow_up_notes", sa.Text(), nullable=True)),
        ("converted_at", sa.Column("converted_at", sa.DateTime(), nullable=True)),
    ]
    for col_name, col_obj in lead_cols_to_add:
        if col_name not in existing_lead_cols:
            op.add_column("leads", col_obj)

    # 3. Update subscriptions table
    existing_sub_cols = {col["name"] for col in inspector.get_columns("subscriptions")}
    sub_cols_to_add = [
        ("price_locked_at", sa.Column("price_locked_at", sa.DateTime(), nullable=True)),
        ("grandfathered_price", sa.Column("grandfathered_price", sa.Numeric(10, 2), nullable=True)),
        ("billing_email", sa.Column("billing_email", sa.String(255), nullable=True)),
        ("tax_id", sa.Column("tax_id", sa.String(100), nullable=True)),
        ("payment_method_summary", sa.Column("payment_method_summary", sa.String(255), nullable=True)),
        ("last_payment_status", sa.Column("last_payment_status", sa.String(50), nullable=True)),
        ("last_payment_error", sa.Column("last_payment_error", sa.Text(), nullable=True)),
        ("retry_count", sa.Column("retry_count", sa.Integer(), nullable=True, server_default="0")),
    ]
    for col_name, col_obj in sub_cols_to_add:
        if col_name not in existing_sub_cols:
            op.add_column("subscriptions", col_obj)

    # 4. Update oauth_states table
    if inspector.has_table("oauth_states"):
        existing_oauth_cols = {col["name"] for col in inspector.get_columns("oauth_states")}
        if "user_intent" not in existing_oauth_cols:
            op.add_column("oauth_states", sa.Column("user_intent", sa.String(50), nullable=True, server_default="login"))

    # 5. Create invoices table if missing
    if not inspector.has_table("invoices"):
        op.create_table(
            "invoices",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("business_id", sa.String(36), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("invoice_number", sa.String(50), nullable=False, unique=True, index=True),
            sa.Column("amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
            sa.Column("status", sa.String(30), nullable=False, server_default="PAID"),
            sa.Column("billing_reason", sa.String(50), nullable=True),
            sa.Column("period_start", sa.DateTime(), nullable=False),
            sa.Column("period_end", sa.DateTime(), nullable=False),
            sa.Column("pdf_url", sa.Text(), nullable=True),
            sa.Column("line_items", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )

    # 6. Create activity_logs table if missing
    if not inspector.has_table("activity_logs"):
        op.create_table(
            "activity_logs",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("business_id", sa.String(36), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("action", sa.String(100), nullable=False, index=True),
            sa.Column("entity_type", sa.String(50), nullable=False),
            sa.Column("entity_id", sa.String(100), nullable=True),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("metadata_json", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, index=True),
        )


def downgrade() -> None:
    pass
