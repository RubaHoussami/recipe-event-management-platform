"""create_recipe_shares_table

Revision ID: db99fd2a07e2
Revises: 9109e432f8b0
Create Date: 2026-03-03 14:44:13.727408

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'db99fd2a07e2'
down_revision: Union[str, None] = '9109e432f8b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recipe_shares",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("recipe_id", UUID(as_uuid=True), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("shared_with_user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("permission", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_recipe_shares_recipe_id"), "recipe_shares", ["recipe_id"], unique=False)
    op.create_index(op.f("ix_recipe_shares_shared_with_user_id"), "recipe_shares", ["shared_with_user_id"], unique=False)
    op.create_unique_constraint("uq_recipe_shares_recipe_user", "recipe_shares", ["recipe_id", "shared_with_user_id"])


def downgrade() -> None:
    op.drop_constraint("uq_recipe_shares_recipe_user", "recipe_shares", type_="unique")
    op.drop_index(op.f("ix_recipe_shares_shared_with_user_id"), table_name="recipe_shares")
    op.drop_index(op.f("ix_recipe_shares_recipe_id"), table_name="recipe_shares")
    op.drop_table("recipe_shares")
