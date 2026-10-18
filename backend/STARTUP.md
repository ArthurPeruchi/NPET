# NPET Backend — Guia de Construção (passo a passo)

Este documento explica, de forma simples, o que existe hoje no backend do NPET, por quê, e como um novo desenvolvedor sobe o ambiente do zero.

> **Estado atual:** os dados ficam em **PostgreSQL**, acessado pela ORM do **SQLAlchemy 2.0**; o schema do banco é versionado com **Alembic**. Entregues: cadastro/login de usuários (senha com hash bcrypt) com token JWT; as rotas de `/instituicoes` exigem o token. O cadastro e o login de instituições (`/institutions/auth/register` e `/login`) reutilizam a tabela `usuarios`, filtrando `tipo_usuario = instituicao`. A listagem de instituições (`/instituicoes`) ainda usa dados mockados (`modules/instituicoes/fake_db.py`), mas dessa vez, é requisitado no backend.

---

## 1. Arquitetura em 3 camadas

```
HTTP → Router (Controller) → Service (regra) → Repository (dados) → PostgreSQL
       router.py             service.py        repository.py        (Session do SQLAlchemy)
```

Exemplo com o módulo de cadastro/login de instituições ([app/modules/auth/instituicoes/](app/modules/auth/instituicoes/)), que espelha o de usuários ([app/modules/auth/usuarios/](app/modules/auth/usuarios/)):

- **Router** ([router.py](app/modules/auth/instituicoes/router.py)): expõe `POST /register` e `POST /login`. A função `get_institution_auth_service` recebe a `Session` via `Depends(get_db)` e monta `InstitutionAuthService(InstitutionAuthRepository(db))`. O Router só cuida de HTTP.
- **Schemas** ([app/database/schemas.py](app/database/schemas.py)): `UsuarioCreate` (entrada do cadastro), `LoginRequest` (entrada do login) e `UsuarioOut` (saída, sem senha).
- **Service** ([service.py](app/modules/auth/instituicoes/service.py)): regras de negócio. Só aceita `tipo_usuario = instituicao`, e-mail único, hash e verificação de senha com bcrypt. Lança `ConflictError` (409) ou `UnauthorizedError` (401). Não conhece HTTP nem a `Session`.
- **Repository** ([repository.py](app/modules/auth/instituicoes/repository.py)): a única camada que usa a `Session` (`select`, `add`, `commit`, `refresh`). Devolve objetos do model, nunca a sessão.
- **Model** ([app/database/models.py](app/database/models.py)): a classe `Usuario` mapeia a tabela `usuarios`; instituições e usuários compartilham a tabela, diferenciados por `tipo_usuario`.

A conexão está em [app/database/database.py](app/database/database.py): `engine` (lê `DATABASE_URL`), `SessionLocal` e `get_db()`, que abre uma sessão por requisição e a fecha ao final.

## 2. Subindo o PostgreSQL

**Requer PostgreSQL instalado localmente:** crie usuário e banco (via `psql` ou pgAdmin):

```sql
CREATE USER npet WITH PASSWORD 'npet';
CREATE DATABASE npet OWNER npet;
```

## 3. Setup inicial

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edite o `.env`: aponte `DATABASE_URL` para o banco do passo 2 e defina a chave que assina os tokens JWT (sem ela a API não sobe):

```env
DATABASE_URL=postgresql+psycopg2://npet:npet@localhost:5432/npet
JWT_SECRET_KEY=valor-gerado-abaixo
```

Para gerar a chave: `python -c "import secrets; print(secrets.token_hex(32))"`.

> Senhas com caracteres especiais (`@`, `:`, `/`, `#`) precisam ser URL-encoded (ex.: `@` → `%40`).

Teste a conexão (opcional) e crie as tabelas:

```bash
python -m app.database.test_conn      # deve imprimir "OK, conectou"
alembic upgrade head                  # aplica migrations/versions/*
```

Suba a API:

```bash
uvicorn app.main:app --reload
```

## 4. Migrations (Alembic)

- A configuração fica em [alembic.ini](alembic.ini) e [migrations/env.py](migrations/env.py). O `env.py` lê `DATABASE_URL` do `.env` e usa `Base.metadata` dos models; a URL do `alembic.ini` é ignorada.
- A primeira migration ([migrations/versions/521eeafa0ea9_schema_inicial.py](migrations/versions/521eeafa0ea9_schema_inicial.py)) cria todas as tabelas e tipos ENUM; o `downgrade` remove ambos.
- Ao alterar `models.py`:

```bash
alembic revision --autogenerate -m "descricao da mudanca"
alembic upgrade head
```

Pontos de atenção no PostgreSQL ao revisar migrations autogeradas:
- Um mesmo ENUM usado em mais de uma tabela deve ser criado uma vez só (`postgresql.ENUM(name=..., create_type=False)` nas demais).
- `drop_table` não remove os tipos ENUM; inclua o `DROP TYPE` no `downgrade`.

## 5. Estrutura de diretórios

```
backend/
├── app/
│   ├── main.py                  # cria o app FastAPI, CORS, handler de erros, /static
│   ├── core/
│   │   ├── config.py            # configuração global (lê o .env)
│   │   ├── exceptions.py        # AppError, Unauthorized/Forbidden/NotFound/Conflict
│   │   └── security.py          # bcrypt e JWT
│   ├── database/
│   │   ├── database.py          # engine, SessionLocal, Base, get_db()
│   │   ├── models.py            # tabelas (SQLAlchemy)
│   │   ├── schemas.py           # DTOs (Pydantic)
│   │   └── test_conn.py         # diagnóstico de conexão
│   ├── api/router.py            # junta os routers
│   ├── health/router.py         # GET /health
│   └── modules/
│       ├── auth/dependencies.py # get_current_user (valida o JWT)
│       ├── auth/usuarios/       # POST /users/auth/register, /login, /token
│       ├── auth/instituicoes/   # POST /institutions/auth/register, /login (ORM)
│       └── instituicoes/        # GET /instituicoes (fake_db, exige token)
├── migrations/
│   ├── env.py
│   └── versions/                # uma migration por mudança de schema
├── test/                        # conftest.py + test_seguranca.py (pytest)
├── alembic.ini
├── .env.example
├── requirements.txt
├── RUN.md
└── STARTUP.md                   # este arquivo
```

## 6. Testando o fluxo

```bash
# Cadastra uma Instituição (grava em usuarios, com a senha em hash bcrypt)
curl -X POST http://localhost:8000/api/v1/institutions/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"nome\": \"ASPAAN\", \"email\": \"contato@aspaan.org\", \"senha\": \"senha1234\", \"tipo_usuario\": \"instituicao\"}"

# Faz login
curl -X POST http://localhost:8000/api/v1/institutions/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"contato@aspaan.org\", \"senha\": \"senha1234\"}"
```

Respostas esperadas: cadastro `201`; login `200` com `{"access_token": "...", "token_type": "bearer"}`; `401` para senha errada, e-mail inexistente ou `tipo_usuario` diferente de `instituicao` no cadastro; `409` para e-mail já cadastrado; `422` para payload inválido (ex.: senha com menos de 8 caracteres).

Com o token, acesse as rotas protegidas:

```bash
curl http://localhost:8000/api/v1/instituicoes -H "Authorization: Bearer SEU_TOKEN"
```

Sem token, com token inválido ou expirado → `401`.

No Swagger (`/docs`), clique em **Authorize** (cadeado no topo), informe o e-mail em `username` e a senha em `password` e deixe `client_id` e `client_secret` em branco. O botão usa `POST /users/auth/token` (formulário padrão do OAuth2), que vale para usuários e instituições. Para testar o `401`, use **Logout** no mesmo cadeado.

A suíte automatizada fica em `test/` e roda com `python -m pytest test` (usa SQLite em memória, não precisa do PostgreSQL).

## 7. Próximos passos

- Migrar `modules/instituicoes` (hoje com dados mockados) para a ORM.
- CRUD de redes sociais, necessidades e doações.
