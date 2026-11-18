"""adiciona usuarios.ativo e a tabela tokens_redefinicao_senha

Revision ID: 9a4f2c6e8b11
Revises: 7c3e1a9d4b20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '9a4f2c6e8b11'
down_revision: Union[str, None] = '7c3e1a9d4b20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'usuarios',
        sa.Column('ativo', sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.create_table('tokens_redefinicao_senha',
    sa.Column('id_token', sa.Integer(), nullable=False),
    sa.Column('id_usuario', sa.Integer(), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('expira_em', sa.DateTime(timezone=True), nullable=False),
    sa.Column('usado_em', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['id_usuario'], ['usuarios.id_usuario'], ),
    sa.PrimaryKeyConstraint('id_token'),
    sa.UniqueConstraint('token_hash')
    )
    op.create_index(
        op.f('ix_tokens_redefinicao_senha_id_usuario'),
        'tokens_redefinicao_senha', ['id_usuario'], unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_tokens_redefinicao_senha_id_usuario'), table_name='tokens_redefinicao_senha')
    op.drop_table('tokens_redefinicao_senha')
    op.drop_column('usuarios', 'ativo')
