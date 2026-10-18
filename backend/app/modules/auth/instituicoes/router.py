from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.schemas import InstituicaoRegister, UsuarioOut
from app.modules.auth.instituicoes.repository import InstitutionAuthRepository
from app.modules.auth.instituicoes.service import InstitutionAuthService

router = APIRouter(prefix="/institutions/auth", tags=["institutions-auth"])


def get_institution_auth_service(db: Session = Depends(get_db)) -> InstitutionAuthService:
    return InstitutionAuthService(InstitutionAuthRepository(db))


@router.post("/register", response_model=UsuarioOut, status_code=201, summary="Cadastra uma instituição (usuário + perfil)")
def register(data: InstituicaoRegister, service: InstitutionAuthService = Depends(get_institution_auth_service)):
    return service.register(data)
