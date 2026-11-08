"""adiciona horario_funcionamento em instituicoes

Revision ID: 7c3e1a9d4b20
Revises: 521eeafa0ea9
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '7c3e1a9d4b20'
down_revision: Union[str, None] = '521eeafa0ea9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'instituicoes',
        sa.Column('horario_funcionamento', sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('instituicoes', 'horario_funcionamento')
