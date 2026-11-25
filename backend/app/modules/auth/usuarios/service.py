import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from app.core.config import settings
from app.core.exceptions import AppError, ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.database.models import TipoUsuario, TokenRedefinicaoSenha, Usuario
from app.database.schemas import LoginResponse, UsuarioCreate
from app.modules.auth.usuarios.repository import AuthRepository


@dataclass(frozen=True)
class EmailRedefinicao:
    destinatario: str
    assunto: str
    corpo: str


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _as_utc(valor: datetime) -> datetime:
    # SQLite (testes) devolve datetimes sem fuso; o PostgreSQL devolve com fuso.
    return valor if valor.tzinfo else valor.replace(tzinfo=timezone.utc)


class AuthService:
    def __init__(self, repository: AuthRepository) -> None:
        self._repository = repository

    def login(self, email: str, password: str) -> LoginResponse:
        usuario = self._repository.find_credential(email)

        if usuario is None or usuario.senha is None:
            raise UnauthorizedError("E-mail ou senha inválidos.")

        if not verify_password(password, usuario.senha):
            raise UnauthorizedError("E-mail ou senha inválidos.")

        # Só revela que a conta está desativada para quem acertou a senha.
        if not usuario.ativo:
            raise UnauthorizedError("Esta conta está desativada.")

        return LoginResponse(
            access_token=create_access_token(usuario.id_usuario, usuario.tipo_usuario.value),
            tipo_usuario=usuario.tipo_usuario,
        )

    def register(self, data: UsuarioCreate) -> Usuario:
        if data.tipo_usuario == TipoUsuario.administrador:
            raise UnauthorizedError("Não é permitido criar administradores por este cadastro.")

        if self._repository.email_exists(data.email):
            raise ConflictError("E-mail já cadastrado.")

        usuario = Usuario(
            nome=data.nome,
            email=data.email,
            senha=hash_password(data.senha),
            telefone=data.telefone,
            cpf=data.cpf,
            tipo_usuario=data.tipo_usuario,
        )
        return self._repository.create(usuario)

    # ---------- Redefinição de senha ----------

    def request_password_reset(self, email: str) -> EmailRedefinicao | None:
        """Gera o token e devolve o e-mail a enviar, ou None se não houver conta elegível.

        A rota responde igual nos dois casos, para não revelar quais e-mails existem.
        """
        usuario = self._repository.find_credential(email)
        if usuario is None or not usuario.ativo or usuario.senha is None:
            return None

        agora = datetime.now(timezone.utc)
        token = secrets.token_urlsafe(32)

        # Um pedido novo invalida os links anteriores.
        self._repository.invalidate_reset_tokens(usuario.id_usuario, agora)
        self._repository.add_reset_token(
            TokenRedefinicaoSenha(
                id_usuario=usuario.id_usuario,
                token_hash=_hash_token(token),
                expira_em=agora + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES),
            )
        )

        link = (
            f"{settings.FRONTEND_URL.rstrip('/')}{settings.RESET_PASSWORD_PATH}"
            f"?{urlencode({'token': token})}"
        )
        corpo = (
            f"Olá, {usuario.nome}!\n\n"
            "Recebemos um pedido para redefinir a senha da sua conta no NPET.\n"
            f"Para criar uma nova senha, acesse o link abaixo (válido por "
            f"{settings.RESET_TOKEN_EXPIRE_MINUTES} minutos):\n\n{link}\n\n"
            "Se você não fez esse pedido, ignore este e-mail: sua senha continua a mesma.\n"
        )
        return EmailRedefinicao(usuario.email, "NPET - Redefinição de senha", corpo)

    def reset_password(self, token: str, nova_senha: str) -> None:
        registro = self._repository.find_reset_token(_hash_token(token))
        agora = datetime.now(timezone.utc)

        if (
            registro is None
            or registro.usado_em is not None
            or _as_utc(registro.expira_em) <= agora
            or not registro.usuario.ativo
        ):
            raise AppError("Link de redefinição inválido ou expirado. Solicite um novo.")

        registro.usuario.senha = hash_password(nova_senha)
        registro.usado_em = agora
        self._repository.invalidate_reset_tokens(registro.id_usuario, agora)
        self._repository.commit()
