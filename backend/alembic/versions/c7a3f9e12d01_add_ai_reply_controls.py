"""add_ai_reply_controls

Revision ID: c7a3f9e12d01
Revises: b4c2a18d6f0e
Create Date: 2026-08-09 05:42:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7a3f9e12d01"
down_revision: Union[str, None] = "b4c2a18d6f0e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("businesses", sa.Column("ai_auto_reply_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("businesses", sa.Column("ai_reply_exceptions", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("businesses", "ai_reply_exceptions")
    op.drop_column("businesses", "ai_auto_reply_enabled")
