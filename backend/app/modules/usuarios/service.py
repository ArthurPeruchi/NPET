from collections.abc import Sequence
from datetime import datetime, timezone

from app.core.exceptions import AppError, ConflictError, ForbiddenError, NotFoundError
from app.core.security import hash_password, verify_password
from app.database.models import TipoUsuario, Usuario
from app.database.schemas import UsuarioUpdate
from app.modules.instituicoes.service import MENSAGEM_INSTITUICAO_COM_DOACOES
from app.modules.usuarios.repository import UsuarioRepository


class UsuarioService:
    def __init__(self, repository: UsuarioRepository) -> None:
        self._repository = repository

    @staticmethod
    def _is_admin(user: Usuario) -> bool:
        return user.tipo_usuario == TipoUsuario.administrador

    def _check_access(self, current_user: Usuario, id_usuario: int) -> None:
        if not self._is_admin(current_user) and current_user.id_usuario != id_usuario:
            raise ForbiddenError("Você não tem permissão para acessar este usuário.")

    def list_users(self, skip: int, limit: int) -> Sequence[Usuario]:
        return self._repository.list_all(skip, limit)

    def get_user(self, id_usuario: int, current_user: Usuario) -> Usuario:
        self._check_access(current_user, id_usuario)
        usuario = self._repository.get_by_id(id_usuario)
        if usuario is None:
            raise NotFoundError("Usuário não encontrado.")
        return usuario

    def update_user(
        self, id_usuario: int, data: UsuarioUpdate, current_user: Usuario
    ) -> Usuario:
        usuario = self.get_user(id_usuario, current_user)
        changes = data.model_dump(exclude_none=True)
        senha_atual = changes.pop("senha_atual", None)

        # Quem troca a própria senha confirma a atual; o admin editando outro usuário não precisa.
        if "senha" in changes and current_user.id_usuario == usuario.id_usuario:
            if not senha_atual:
                raise AppError("Informe a senha atual para definir uma nova senha.")
            if usuario.senha is None or not verify_password(senha_atual, usuario.senha):
                raise AppError("Senha atual incorreta.")

        new_email = changes.get("email")
        if new_email and new_email != usuario.email:
            if self._repository.email_exists(new_email):
                raise ConflictError("E-mail já cadastrado.")

        new_cpf = changes.get("cpf")
        if new_cpf and str(new_cpf) != str(usuario.cpf):
            if self._repository.cpf_exists(str(new_cpf)):
                raise ConflictError("CPF já cadastrado.")

        if "senha" in changes:
            changes["senha"] = hash_password(changes["senha"])

        for field, value in changes.items():
            setattr(usuario, field, value)

        return self._repository.update(usuario)

    @staticmethod
    def _confirmar_senha(current_user: Usuario, senha: str) -> None:
        # 400 (e não 401) para a senha errada: o frontend trata 401 como sessão expirada.
        if current_user.senha is None or not verify_password(senha, current_user.senha):
            raise AppError("Senha incorreta.")

    def deactivate_me(self, current_user: Usuario, senha: str) -> None:
        self._confirmar_senha(current_user, senha)
        current_user.ativo = False
        self._repository.update(current_user)

    def set_active(self, id_usuario: int, ativo: bool, current_user: Usuario) -> Usuario:
        usuario = self.get_user(id_usuario, current_user)
        if usuario.anonimizado_em is not None:
            raise ConflictError("Conta excluída não pode ser reativada.")
        if usuario.id_usuario == current_user.id_usuario and not ativo:
            raise AppError("Use a desativação da própria conta em /users/me/deactivate.")
        usuario.ativo = ativo
        return self._repository.update(usuario)

    def delete_me(self, current_user: Usuario, senha: str) -> None:
        self._confirmar_senha(current_user, senha)
        self._excluir(current_user)

    def delete_user(self, id_usuario: int, current_user: Usuario) -> None:
        usuario = self.get_user(id_usuario, current_user)
        self._excluir(usuario)

    def _excluir(self, usuario: Usuario) -> None:
        """Exclusão de conta (pelo próprio usuário ou pelo admin).

        - Instituição que já recebeu doações: recusada (409); o histórico dos doadores depende dela.
        - Usuário com doações: anonimizado, para o histórico continuar íntegro sem dados pessoais.
        - Sem doações: apagado de vez (a instituição sem doações sai junto).
        """
        instituicao = usuario.instituicao
        if instituicao is not None and self._repository.instituicao_tem_doacoes(
            instituicao.id_instituicao
        ):
            raise ConflictError(MENSAGEM_INSTITUICAO_COM_DOACOES)

        if self._repository.tem_doacoes(usuario.id_usuario):
            self._anonimizar(usuario)
        else:
            self._repository.delete(usuario)

    def _anonimizar(self, usuario: Usuario) -> None:
        usuario.nome = "Usuário removido"
        # Único por usuário (a coluna é unique) e fora de qualquer caixa de e-mail real;
        # libera o e-mail original para um novo cadastro.
        usuario.email = f"removido-{usuario.id_usuario}@usuario-removido.npet.com.br"
        usuario.senha = None
        usuario.telefone = None
        usuario.cpf = None
        usuario.provider = "local"
        usuario.provider_id = None
        usuario.ativo = False
        usuario.anonimizado_em = datetime.now(timezone.utc)
        usuario.tokens_redefinicao.clear()
        self._repository.desligar_recorrencias(usuario.id_usuario)
        self._repository.update(usuario)