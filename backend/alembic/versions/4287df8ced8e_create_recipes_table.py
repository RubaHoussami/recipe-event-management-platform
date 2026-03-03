"""create_recipes_table

Revision ID: 4287df8ced8e
Revises: 35736d926e98
Create Date: 2026-03-03 14:21:07.742637

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


# revision identifiers, used by Alembic.
revision: str = '4287df8ced8e'
down_revision: Union[str, None] = '35736d926e98'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recipes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("ingredients", JSONB, nullable=False, server_default="[]"),
        sa.Column("steps", JSONB, nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_recipes_owner_id"), "recipes", ["owner_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_recipes_owner_id"), table_name="recipes")
    op.drop_table("recipes")
