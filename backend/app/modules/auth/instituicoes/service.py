from app.core.exceptions import ConflictError
from app.core.security import hash_password
from app.database.models import Instituicao, TipoUsuario, Usuario
from app.database.schemas import InstituicaoRegister
from app.modules.auth.instituicoes.repository import InstitutionAuthRepository


class InstitutionAuthService:
    def __init__(self, repository: InstitutionAuthRepository) -> None:
        self._repository = repository

    def register(self, data: InstituicaoRegister) -> Usuario:
        if self._repository.email_exists(data.email):
            raise ConflictError("E-mail já cadastrado.")

        if data.cnpj and self._repository.cnpj_exists(data.cnpj):
            raise ConflictError("CNPJ já cadastrado.")

        usuario = Usuario(
            nome=data.nome,
            email=data.email,
            senha=hash_password(data.senha),
            telefone=data.telefone,
            tipo_usuario=TipoUsuario.instituicao,
            instituicao=Instituicao(
                nome=data.nome,
                email=data.email,
                telefone=data.telefone,
                cnpj=data.cnpj,
                cidade=data.cidade,
                uf=data.uf,
            ),
        )
        return self._repository.create(usuario)
