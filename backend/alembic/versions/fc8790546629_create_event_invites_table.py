"""create_event_invites_table

Revision ID: fc8790546629
Revises: 104784b8cd08
Create Date: 2026-03-03 15:04:39.231409

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'fc8790546629'
down_revision: Union[str, None] = '104784b8cd08'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "event_invites",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("event_id", UUID(as_uuid=True), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invited_email", sa.String(255), nullable=False),
        sa.Column("invited_user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("token", sa.String(255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_event_invites_event_id"), "event_invites", ["event_id"], unique=False)
    op.create_index(op.f("ix_event_invites_invited_email"), "event_invites", ["invited_email"], unique=False)
    op.create_index(op.f("ix_event_invites_invited_user_id"), "event_invites", ["invited_user_id"], unique=False)
    op.create_index(op.f("ix_event_invites_token"), "event_invites", ["token"], unique=True)
    op.create_unique_constraint("uq_event_invites_event_email", "event_invites", ["event_id", "invited_email"])


def downgrade() -> None:
    op.drop_constraint("uq_event_invites_event_email", "event_invites", type_="unique")
    op.drop_index(op.f("ix_event_invites_token"), table_name="event_invites")
    op.drop_index(op.f("ix_event_invites_invited_user_id"), table_name="event_invites")
    op.drop_index(op.f("ix_event_invites_invited_email"), table_name="event_invites")
    op.drop_index(op.f("ix_event_invites_event_id"), table_name="event_invites")
    op.drop_table("event_invites")
