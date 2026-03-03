"""create_recipe_tags_and_statuses

Revision ID: 9109e432f8b0
Revises: 4287df8ced8e
Create Date: 2026-03-03 14:30:36.574823

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '9109e432f8b0'
down_revision: Union[str, None] = '4287df8ced8e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recipe_tags",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("recipe_id", UUID(as_uuid=True), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tag", sa.String(255), nullable=False),
    )
    op.create_index(op.f("ix_recipe_tags_recipe_id"), "recipe_tags", ["recipe_id"], unique=False)
    op.create_index(op.f("ix_recipe_tags_tag"), "recipe_tags", ["tag"], unique=False)
    op.create_unique_constraint("uq_recipe_tags_recipe_id_tag", "recipe_tags", ["recipe_id", "tag"])

    op.create_table(
        "recipe_statuses",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("recipe_id", UUID(as_uuid=True), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
    )
    op.create_index(op.f("ix_recipe_statuses_recipe_id"), "recipe_statuses", ["recipe_id"], unique=False)
    op.create_unique_constraint("uq_recipe_statuses_recipe_id_status", "recipe_statuses", ["recipe_id", "status"])


def downgrade() -> None:
    op.drop_constraint("uq_recipe_statuses_recipe_id_status", "recipe_statuses", type_="unique")
    op.drop_index(op.f("ix_recipe_statuses_recipe_id"), table_name="recipe_statuses")
    op.drop_table("recipe_statuses")
    op.drop_constraint("uq_recipe_tags_recipe_id_tag", "recipe_tags", type_="unique")
    op.drop_index(op.f("ix_recipe_tags_tag"), table_name="recipe_tags")
    op.drop_index(op.f("ix_recipe_tags_recipe_id"), table_name="recipe_tags")
    op.drop_table("recipe_tags")
