"""usuários: data da anonimização (exclusão de conta com doações)

Revision ID: d3f8b6a1c5e7
Revises: c7a2e9d4f1b3
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3f8b6a1c5e7'
down_revision: Union[str, None] = 'c7a2e9d4f1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('anonimizado_em', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('usuarios', 'anonimizado_em')
