"""create_events_table

Revision ID: 104784b8cd08
Revises: db99fd2a07e2
Create Date: 2026-03-03 14:53:34.682771

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '104784b8cd08'
down_revision: Union[str, None] = 'db99fd2a07e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("location", sa.String(500), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_events_owner_id"), "events", ["owner_id"], unique=False)
    op.create_index(op.f("ix_events_start_time"), "events", ["start_time"], unique=False)
    op.create_index(op.f("ix_events_end_time"), "events", ["end_time"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_events_end_time"), table_name="events")
    op.drop_index(op.f("ix_events_start_time"), table_name="events")
    op.drop_index(op.f("ix_events_owner_id"), table_name="events")
    op.drop_table("events")
