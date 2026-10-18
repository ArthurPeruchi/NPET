from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import hash_password, verify_password
from app.database.models import TipoUsuario, Usuario
from app.database.schemas import UsuarioCreate
from app.modules.auth.instituicoes.repository import InstitutionAuthRepository


class InstitutionAuthService:
    def __init__(self, repository: InstitutionAuthRepository) -> None:
        self._repository = repository

    def login(self, email: str, password: str) -> str:
        usuario = self._repository.find_credential(email)

        if usuario is None or usuario.senha is None:
            raise UnauthorizedError("E-mail ou senha inválidos.")

        if not verify_password(password, usuario.senha):
            raise UnauthorizedError("E-mail ou senha inválidos.")

        return "Autenticação realizada com sucesso."

    def register(self, data: UsuarioCreate) -> Usuario:
        if data.tipo_usuario != TipoUsuario.instituicao:
            raise UnauthorizedError("Este cadastro é exclusivo para instituições.")

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
