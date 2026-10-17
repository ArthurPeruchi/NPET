class AppError(Exception):
    """Erro base da aplicação."""

    status_code: int = 400

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class UnauthorizedError(AppError):
    status_code = 401


class NotFoundError(AppError):
    status_code = 404
