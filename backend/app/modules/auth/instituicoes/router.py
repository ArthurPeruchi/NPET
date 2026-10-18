from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.schemas import LoginRequest, UsuarioCreate, UsuarioOut
from app.modules.auth.instituicoes.repository import InstitutionAuthRepository
from app.modules.auth.instituicoes.service import InstitutionAuthService

router = APIRouter(prefix="/institutions/auth", tags=["institutions-auth"])


def get_institution_auth_service(db: Session = Depends(get_db)) -> InstitutionAuthService:
    return InstitutionAuthService(InstitutionAuthRepository(db))


@router.post("/register", response_model=UsuarioOut, status_code=201, summary="Cadastra o usuário de uma instituição")
def register(data: UsuarioCreate, service: InstitutionAuthService = Depends(get_institution_auth_service)):
    return service.register(data)


@router.post("/login", summary="Autentica uma instituição com e-mail e senha")
def login(data: LoginRequest, service: InstitutionAuthService = Depends(get_institution_auth_service)):
    return {"access_token": service.login(data.email, data.senha), "token_type": "bearer"}
