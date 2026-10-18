"""schema inicial

Revision ID: 521eeafa0ea9
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# Identificadores da revisão, usados pelo Alembic.
revision: str = '521eeafa0ea9'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Comandos gerados pelo Alembic e ajustados manualmente para o PostgreSQL
    op.create_table('usuarios',
    sa.Column('id_usuario', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=45), nullable=False),
    sa.Column('email', sa.String(length=150), nullable=False),
    sa.Column('senha', sa.String(length=255), nullable=True),
    sa.Column('provider', sa.String(length=20), server_default='local', nullable=False),
    sa.Column('provider_id', sa.String(length=100), nullable=True),
    sa.Column('telefone', sa.String(length=20), nullable=True),
    sa.Column('cpf', sa.String(length=11), nullable=True),
    sa.Column('tipo_usuario', sa.Enum('administrador', 'doador', 'instituicao', name='tipo_usuario'), nullable=False),
    sa.PrimaryKeyConstraint('id_usuario'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('provider', 'provider_id')
    )
    op.create_table('instituicoes',
    sa.Column('id_instituicao', sa.Integer(), nullable=False),
    sa.Column('id_usuario', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=150), nullable=True),
    sa.Column('telefone', sa.String(length=20), nullable=True),
    sa.Column('logo', sa.String(length=255), nullable=True),
    sa.Column('cnpj', sa.String(length=14), nullable=True),
    sa.Column('cidade', sa.String(length=100), nullable=False),
    sa.Column('uf', sa.CHAR(length=2), nullable=False),
    sa.Column('endereco', sa.String(length=255), nullable=True),
    sa.Column('descricao', sa.String(length=500), nullable=True),
    sa.Column('hora_abertura', sa.Time(), nullable=True),
    sa.Column('hora_fechamento', sa.Time(), nullable=True),
    sa.Column('qtd_animais', sa.Integer(), nullable=True),
    sa.Column('aceita_voluntarios', sa.Boolean(), server_default=sa.false(), nullable=False),
    sa.Column('aceita_doacoes', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.ForeignKeyConstraint(['id_usuario'], ['usuarios.id_usuario'], ),
    sa.PrimaryKeyConstraint('id_instituicao'),
    sa.UniqueConstraint('cnpj'),
    sa.UniqueConstraint('id_usuario')
    )
    op.create_table('doacoes',
    sa.Column('id_doacao', sa.Integer(), nullable=False),
    sa.Column('id_usuario', sa.Integer(), nullable=False),
    sa.Column('id_instituicao', sa.Integer(), nullable=False),
    sa.Column('tipo_doacao', sa.Enum('monetaria', 'produto', name='tipo_doacao'), nullable=False),
    sa.Column('status', sa.Enum('pendente', 'confirmada', 'cancelada', name='status_doacao'), server_default='pendente', nullable=False),
    sa.Column('feedback_doacao', sa.String(length=300), nullable=True),
    sa.ForeignKeyConstraint(['id_instituicao'], ['instituicoes.id_instituicao'], ),
    sa.ForeignKeyConstraint(['id_usuario'], ['usuarios.id_usuario'], ),
    sa.PrimaryKeyConstraint('id_doacao')
    )
    op.create_table('necessidades',
    sa.Column('id_necessidade', sa.Integer(), nullable=False),
    sa.Column('id_instituicao', sa.Integer(), nullable=False),
    sa.Column('nome_item', sa.String(length=100), nullable=False),
    sa.Column('descricao', sa.String(length=255), nullable=True),
    sa.Column('prioridade', sa.Enum('baixa', 'media', 'alta', name='prioridade'), nullable=False),
    sa.Column('quantidade_meta', sa.Numeric(precision=8, scale=2), nullable=True),
    sa.Column('unidade', sa.Enum('unidade', 'kg', 'g', 'l', 'ml', 'caixa', 'pacote', 'outro', name='unidade'), nullable=True),
    sa.ForeignKeyConstraint(['id_instituicao'], ['instituicoes.id_instituicao'], ),
    sa.PrimaryKeyConstraint('id_necessidade')
    )
    op.create_table('redes_sociais',
    sa.Column('id_rede_social', sa.Integer(), nullable=False),
    sa.Column('id_instituicao', sa.Integer(), nullable=False),
    sa.Column('plataforma', sa.Enum('facebook', 'instagram', 'email', 'linkedin', 'whatsapp', 'site', name='plataforma'), nullable=False),
    sa.Column('contato', sa.String(length=255), nullable=False),
    sa.ForeignKeyConstraint(['id_instituicao'], ['instituicoes.id_instituicao'], ),
    sa.PrimaryKeyConstraint('id_rede_social'),
    sa.UniqueConstraint('id_instituicao', 'plataforma')
    )
    op.create_table('doacoes_dinheiro',
    sa.Column('id_doacao_dinheiro', sa.Integer(), nullable=False),
    sa.Column('id_doacao', sa.Integer(), nullable=False),
    sa.Column('valor', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('forma_pagamento', sa.Enum('pix', 'cartao_credito', name='forma_pagamento'), nullable=False),
    sa.Column('recorrente', sa.Boolean(), server_default=sa.false(), nullable=False),
    sa.ForeignKeyConstraint(['id_doacao'], ['doacoes.id_doacao'], ),
    sa.PrimaryKeyConstraint('id_doacao_dinheiro'),
    sa.UniqueConstraint('id_doacao')
    )
    op.create_table('doacoes_produto',
    sa.Column('id_doacao_produto', sa.Integer(), nullable=False),
    sa.Column('id_doacao', sa.Integer(), nullable=False),
    sa.Column('forma_entrega', sa.Enum('visita', 'compra_parceiro', name='forma_entrega'), nullable=False),
    sa.ForeignKeyConstraint(['id_doacao'], ['doacoes.id_doacao'], ),
    sa.PrimaryKeyConstraint('id_doacao_produto'),
    sa.UniqueConstraint('id_doacao')
    )
    op.create_table('itens_doacao_produto',
    sa.Column('id_item_doacao', sa.Integer(), nullable=False),
    sa.Column('id_doacao_produto', sa.Integer(), nullable=False),
    sa.Column('nome_produto', sa.String(length=100), nullable=False),
    sa.Column('descricao', sa.String(length=255), nullable=True),
    sa.Column('quantidade', sa.Numeric(precision=8, scale=2), nullable=False),
    # O tipo ENUM 'unidade' já foi criado em 'necessidades'; create_type=False evita criá-lo de novo.
    sa.Column('unidade', postgresql.ENUM(name='unidade', create_type=False), nullable=False),
    sa.ForeignKeyConstraint(['id_doacao_produto'], ['doacoes_produto.id_doacao_produto'], ),
    sa.PrimaryKeyConstraint('id_item_doacao')
    )
    op.create_table('visitas',
    sa.Column('id_visita', sa.Integer(), nullable=False),
    sa.Column('id_doacao_produto', sa.Integer(), nullable=False),
    sa.Column('data_visita', sa.Date(), nullable=False),
    sa.Column('hora_visita', sa.Time(), nullable=False),
    sa.ForeignKeyConstraint(['id_doacao_produto'], ['doacoes_produto.id_doacao_produto'], ),
    sa.PrimaryKeyConstraint('id_visita'),
    sa.UniqueConstraint('id_doacao_produto')
    )


def downgrade() -> None:
    op.drop_table('visitas')
    op.drop_table('itens_doacao_produto')
    op.drop_table('doacoes_produto')
    op.drop_table('doacoes_dinheiro')
    op.drop_table('redes_sociais')
    op.drop_table('necessidades')
    op.drop_table('doacoes')
    op.drop_table('instituicoes')
    op.drop_table('usuarios')

    for enum_name in (
        'tipo_usuario', 'tipo_doacao', 'status_doacao', 'forma_pagamento',
        'forma_entrega', 'unidade', 'plataforma', 'prioridade',
    ):
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
