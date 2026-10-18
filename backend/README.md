# NPET-backend

Backend da aplicação **NPET** — plataforma que conecta doadores a ONGs e instituições de proteção animal.

> **Estado atual:** persistência em **PostgreSQL** via SQLAlchemy 2.0 + Alembic. Entregues: cadastro e login de usuários e de instituições (`/auth/*` e `/institutions/auth/*`) (senha com hash bcrypt). A listagem de instituições (`/instituicoes`) segue servida por dados mockados (`fake_db.py`).

## Stack

- **Python 3.10+** (testado com 3.11.9)
- **FastAPI** `0.115.6` / **Uvicorn** `0.34.0`
- **Pydantic** `2.10.4` / **Pydantic Settings** `2.7.1`
- **SQLAlchemy** `2.0.36` (ORM) / **psycopg2-binary** `2.9.10` (driver PostgreSQL)
- **Alembic** `1.14.0` (migrations)
- **bcrypt** `5.0.0` (hash de senha)

## Arquitetura

O fluxo de requisição atravessa três camadas:

```
HTTP → Router (Controller) → Service (regra) → Repository (dados) → PostgreSQL (SQLAlchemy Session)
```

- **Router**: expõe os endpoints HTTP. Recebe o DTO já validado, monta o Service (injetando a `Session` via `Depends(get_db)`) e devolve a resposta.
- **Schemas** (`app/database/schemas.py`): DTOs Pydantic de entrada (`*Create`, `*Update`) e saída (`*Out`), compartilhados entre os módulos.
- **Service**: regra de negócio. Não conhece HTTP nem a `Session`; lança exceções de domínio (`NotFoundError`, `ConflictError`, `UnauthorizedError`), convertidas em JSON pelo handler global de `app/main.py`.
- **Repository**: única camada que acessa a `Session` do SQLAlchemy (consultas, `commit`, `refresh`).
- **Models** (`app/database/models.py`): tabelas mapeadas via ORM. Toda alteração de schema vira uma migration Alembic em `migrations/versions/`.

| Módulo | Rotas | Camadas |
|---|---|---|
| Usuários | `POST /api/v1/auth/register` · `POST /api/v1/auth/login` | `app/modules/auth/usuarios/` |
| Instituições (listagem, mock) | `GET /api/v1/instituicoes` · `GET /api/v1/instituicoes/{id}` | `app/modules/instituicoes/` |
| Cadastro e login de instituição | `POST /api/v1/institutions/auth/register` · `POST /api/v1/institutions/auth/login` | `app/modules/auth/instituicoes/` |

## Estrutura de diretórios

```
backend/
├── app/
│   ├── main.py                  # cria o app FastAPI, CORS, handler de erros, /static
│   ├── core/
│   │   ├── config.py            # configuração global (lê o .env, inclui DATABASE_URL)
│   │   ├── exceptions.py        # AppError e subclasses (401, 403, 404, 409)
│   │   └── security.py          # hash/verificação de senha (bcrypt)
│   ├── database/
│   │   ├── database.py          # engine, SessionLocal, Base e get_db()
│   │   ├── models.py            # models SQLAlchemy (tabelas)
│   │   ├── schemas.py           # schemas Pydantic (Create/Update/Out)
│   │   └── test_conn.py         # diagnóstico de conexão com o PostgreSQL
│   ├── api/router.py            # junta os routers
│   ├── health/router.py         # GET /health
│   └── modules/
│       ├── auth/
│       │   ├── usuarios/        # register/login (ORM)
│       │   └── instituicoes/    # register/login de instituição (ORM, tabela usuarios)
│       └── instituicoes/        # listagem de instituições (fake_db)
│           ├── repository.py
│           ├── service.py
│           └── router.py
├── migrations/                  # Alembic (env.py + versions/)
├── alembic.ini
├── .env.example                 # modelo de variáveis de ambiente
├── requirements.txt
├── RUN.md                       # como rodar (resumido)
└── STARTUP.md                   # guia detalhado (setup do banco incluso)
```

## Como rodar (modo desenvolvimento)

Pré-requisitos: **Python 3.10+** e um **PostgreSQL** acessível (local ou em container; veja [STARTUP.md](./STARTUP.md#2-subindo-o-postgresql)).

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows (PowerShell) — ou .venv\Scripts\activate.bat no CMD
pip install -r requirements.txt
copy .env.example .env              # e ajuste DATABASE_URL
alembic upgrade head                # cria/atualiza as tabelas
uvicorn app.main:app --reload
```

A API sobe em `http://localhost:8000`.

> Se o PowerShell recusar rodar `Activate.ps1` (erro de "execution policy"), use o `activate.bat` pelo CMD, ou chame os executáveis de `.venv\Scripts\` diretamente (ex.: `.venv\Scripts\python.exe -m alembic upgrade head`).

### Variáveis de ambiente

| Variável | Obrigatória | Exemplo | Descrição |
|---|---|---|---|
| `DATABASE_URL` | **sim** | `postgresql+psycopg2://npet:npet@localhost:5432/npet` | Conexão com o PostgreSQL (usada pela API e pelo Alembic) |
| `APP_NAME` | não | `NPET API` | Título no Swagger |
| `APP_ENV` | não | `development` | Ambiente de execução |
| `PORT` | não | `8000` | Porta do Uvicorn |
| `API_PREFIX` | não | `/api/v1` | Prefixo das rotas |
| `DEBUG` | não | `true` | Com `true`, o SQLAlchemy loga todo SQL executado |

### Comandos do Alembic

```bash
alembic upgrade head                                  # aplica todas as migrations pendentes
alembic downgrade -1                                  # desfaz a última migration
alembic current                                       # mostra a revisão aplicada no banco
alembic history                                       # lista as migrations
alembic revision --autogenerate -m "descricao"        # gera migration após alterar models.py
```

> Revise sempre o arquivo gerado pelo `--autogenerate` antes de versioná-lo.

## Documentação automática

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Healthcheck: `http://localhost:8000/api/v1/health`

## Próximos passos

- Gerar/validar um token real (JWT) nas rotas autenticadas.
- Migrar `modules/instituicoes` (hoje com dados mockados) para a ORM.
- CRUD de redes sociais, necessidades e doações (models já existem).

## Documentação adicional

- [RUN.md](./RUN.md) — guia rápido de execução
- [STARTUP.md](./STARTUP.md) — guia detalhado da arquitetura e do setup do banco
