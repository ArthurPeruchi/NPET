from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.database.database import get_db
from app.database.models import TipoUsuario, Usuario
from app.modules.auth.usuarios.repository import AuthRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/token", auto_error=False)


def get_current_user(token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    if token is None:
        raise UnauthorizedError("Token de acesso ausente.")

    usuario = AuthRepository(db).get_by_id(decode_access_token(token))
    if usuario is None:
        raise UnauthorizedError("Token inválido ou expirado.")

    return usuario


def require_role(*roles: TipoUsuario):
    def dependency(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.tipo_usuario not in roles:
            raise ForbiddenError("Acesso não permitido para este tipo de usuário.")
        return usuario

    return dependency
