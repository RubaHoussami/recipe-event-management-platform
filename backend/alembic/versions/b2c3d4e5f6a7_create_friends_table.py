"""create_friends_table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "friends",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("friend_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("user_id", "friend_id"),
        sa.UniqueConstraint("user_id", "friend_id", name="uq_friends_user_friend"),
    )
    op.create_index(op.f("ix_friends_user_id"), "friends", ["user_id"], unique=False)
    op.create_index(op.f("ix_friends_friend_id"), "friends", ["friend_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_friends_friend_id"), table_name="friends")
    op.drop_index(op.f("ix_friends_user_id"), table_name="friends")
    op.drop_table("friends")
