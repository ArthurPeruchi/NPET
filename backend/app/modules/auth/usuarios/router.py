from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.schemas import LoginRequest, UsuarioCreate, UsuarioOut
from app.modules.auth.usuarios.repository import AuthRepository
from app.modules.auth.usuarios.service import AuthService

router = APIRouter(prefix="/users/auth", tags=["users-auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(AuthRepository(db))


@router.post("/register", response_model=UsuarioOut, status_code=201)
def register(data: UsuarioCreate, service: AuthService = Depends(get_auth_service)):
    return service.register(data)


@router.post("/login")
def login(data: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return {"access_token": service.login(data.email, data.senha), "token_type": "bearer"}


@router.post("/token", summary="Login via formulário OAuth2 (usado pelo Authorize do Swagger)")
def token(form: OAuth2PasswordRequestForm = Depends(), service: AuthService = Depends(get_auth_service)):
    return {"access_token": service.login(form.username, form.password), "token_type": "bearer"}
