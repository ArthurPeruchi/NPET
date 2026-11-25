class AppError(Exception):

    status_code: int = 400

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class UnauthorizedError(AppError):
    status_code = 401


class ForbiddenError(AppError):
    status_code = 403


class NotFoundError(AppError):
    status_code = 404


class ConflictError(AppError):
    status_code = 409


class UnprocessableError(AppError):
    status_code = 422


class PaymentRequiredError(AppError):
    """Pagamento recusado pela operadora (ex.: cartão sem saldo)."""

    status_code = 402


class PaymentGatewayError(AppError):
    """Falha de comunicação com o Mercado Pago."""

    status_code = 502
