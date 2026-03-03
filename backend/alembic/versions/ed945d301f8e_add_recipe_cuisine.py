"""add_recipe_cuisine

Revision ID: ed945d301f8e
Revises: fc8790546629
Create Date: 2026-03-03 16:01:36.834610

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ed945d301f8e'
down_revision: Union[str, None] = 'fc8790546629'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("recipes", sa.Column("cuisine", sa.String(100), nullable=True))
    op.create_index(op.f("ix_recipes_cuisine"), "recipes", ["cuisine"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_recipes_cuisine"), table_name="recipes")
    op.drop_column("recipes", "cuisine")
