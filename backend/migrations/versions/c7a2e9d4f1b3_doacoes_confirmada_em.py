"""doações: data da confirmação do pagamento (RNE-013)

Revision ID: c7a2e9d4f1b3
Revises: b5d8e3f1a6c2
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c7a2e9d4f1b3'
down_revision: Union[str, None] = 'b5d8e3f1a6c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('doacoes', sa.Column('confirmada_em', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('doacoes', 'confirmada_em')
