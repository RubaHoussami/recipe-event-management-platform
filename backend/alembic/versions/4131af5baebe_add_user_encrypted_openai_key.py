"""add_user_encrypted_openai_key

Revision ID: 4131af5baebe
Revises: ed945d301f8e
Create Date: 2026-03-03 16:11:18.899040

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4131af5baebe'
down_revision: Union[str, None] = 'ed945d301f8e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("encrypted_openai_api_key", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "encrypted_openai_api_key")
