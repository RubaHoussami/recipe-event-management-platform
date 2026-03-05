"""add_email_verification_otp

Revision ID: e5f6a7b8c9d0
Revises: 4131af5baebe
Create Date: 2026-03-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "4131af5baebe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("email_otp_code", sa.String(10), nullable=True))
    op.add_column("users", sa.Column("email_otp_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("email_otp_sent_at", sa.DateTime(timezone=True), nullable=True))
    # Existing users: treat as already verified so they are not blocked
    op.execute(
        "UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL"
    )


def downgrade() -> None:
    op.drop_column("users", "email_otp_sent_at")
    op.drop_column("users", "email_otp_expires_at")
    op.drop_column("users", "email_otp_code")
    op.drop_column("users", "email_verified_at")
