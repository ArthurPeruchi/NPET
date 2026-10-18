from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.schemas import LoginRequest, LoginResponse, UsuarioCreate, UsuarioOut
from app.modules.auth.usuarios.repository import AuthRepository
from app.modules.auth.usuarios.service import AuthService

router = APIRouter(prefix="/users/auth", tags=["users-auth"])
auth_router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(AuthRepository(db))


@router.post("/register", response_model=UsuarioOut, status_code=201)
def register(data: UsuarioCreate, service: AuthService = Depends(get_auth_service)):
    return service.register(data)


@auth_router.post("/login", response_model=LoginResponse, summary="Autentica qualquer usuário e devolve o token e a role")
def login(data: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return service.login(data.email, data.senha)


@auth_router.post("/token", response_model=LoginResponse, summary="Login via formulário OAuth2 (usado pelo Authorize do Swagger)")
def token(form: OAuth2PasswordRequestForm = Depends(), service: AuthService = Depends(get_auth_service)):
    return service.login(form.username, form.password)
