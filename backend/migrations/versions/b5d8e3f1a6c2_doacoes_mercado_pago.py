"""doações: criada_em, feedback_visto e dados do pagamento no Mercado Pago

Revision ID: b5d8e3f1a6c2
Revises: 9a4f2c6e8b11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b5d8e3f1a6c2'
down_revision: Union[str, None] = '9a4f2c6e8b11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('doacoes', sa.Column('feedback_visto', sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column('doacoes', sa.Column('criada_em', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))

    op.add_column('doacoes_dinheiro', sa.Column('cartao_final', sa.CHAR(length=4), nullable=True))
    op.add_column('doacoes_dinheiro', sa.Column('mp_payment_id', sa.String(length=30), nullable=True))
    op.add_column('doacoes_dinheiro', sa.Column('mp_status', sa.String(length=30), nullable=True))
    op.add_column('doacoes_dinheiro', sa.Column('mp_status_detail', sa.String(length=60), nullable=True))
    op.add_column('doacoes_dinheiro', sa.Column('pix_qr_code', sa.Text(), nullable=True))
    op.add_column('doacoes_dinheiro', sa.Column('pix_expira_em', sa.DateTime(timezone=True), nullable=True))
    op.create_unique_constraint('uq_doacoes_dinheiro_mp_payment_id', 'doacoes_dinheiro', ['mp_payment_id'])


def downgrade() -> None:
    op.drop_constraint('uq_doacoes_dinheiro_mp_payment_id', 'doacoes_dinheiro', type_='unique')
    for coluna in ('pix_expira_em', 'pix_qr_code', 'mp_status_detail', 'mp_status', 'mp_payment_id', 'cartao_final'):
        op.drop_column('doacoes_dinheiro', coluna)
    op.drop_column('doacoes', 'criada_em')
    op.drop_column('doacoes', 'feedback_visto')
