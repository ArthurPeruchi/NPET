from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "NPET API"
    APP_ENV: str = "development"
    PORT: int = 8000
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_EXPIRE_MINUTES: int = 30
    # Senha dos usuários criados por scripts/db_seed_instituicoes.py (apenas desenvolvimento).
    SEED_PASSWORD: str | None = None

    # Redefinição de senha: o link enviado aponta para FRONTEND_URL + RESET_PASSWORD_PATH.
    FRONTEND_URL: str = "http://localhost:5173"
    RESET_PASSWORD_PATH: str = "/redefinir-senha"
    RESET_TOKEN_EXPIRE_MINUTES: int = 15

    # SMTP. Sem SMTP_HOST, o e-mail não é enviado: o conteúdo vai para o log (desenvolvimento).
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str = "NPET <nao-responda@npet.com.br>"
    SMTP_STARTTLS: bool = True

    # Mercado Pago (todas as doações caem na conta da NPET). Use credenciais TEST-... no sandbox.
    MP_ACCESS_TOKEN: str | None = None
    MP_WEBHOOK_SECRET: str | None = None
    MP_NOTIFICATION_URL: str | None = None  # URL pública de /pagamentos/webhook; vazia em dev
    MP_API_URL: str = "https://api.mercadopago.com"
    MP_PIX_EXPIRATION_MINUTES: int = 30
    # Só sandbox: envia payer.first_name="APRO" para o MP aprovar o PIX sozinho. Ignorada em produção.
    MP_PIX_TEST_APPROVAL: bool = False
    # Timeout e retry das chamadas ao Mercado Pago (RNF-012). O retry vale para falhas de rede,
    # 429 e 5xx; a chave de idempotência por doação impede cobrança em dobro ao repetir a criação.
    MP_TIMEOUT_SECONDS: float = 20.0
    MP_CONNECT_TIMEOUT_SECONDS: float = 5.0
    MP_MAX_RETRIES: int = 2
    MP_RETRY_BACKOFF_SECONDS: float = 0.5

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Retorna uma instância única de Settings (cacheada)."""
    return Settings()


settings = get_settings()
