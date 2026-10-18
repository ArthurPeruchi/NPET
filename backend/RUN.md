# Como rodar o backend NPET (modo desenvolvimento)

Pré-requisito: **Python 3.10+** (testado com 3.11.9).

## 1. Criar e ativar o ambiente virtual:

```bash
# criar
python -m venv .venv

# ativar (Windows, PowerShell)
.venv\Scripts\Activate.ps1

# ativar (Windows, CMD)
.venv\Scripts\activate.bat
```

## 2. Instalar as dependências:

```bash
pip install -r requirements.txt
```

## 3. Configurar variáveis de ambiente:

```bash
copy .env.example .env
```

Ajuste `DATABASE_URL` no `.env` e defina `JWT_SECRET_KEY` (gere com `python -c "import secrets; print(secrets.token_hex(32))"`); sem ela a API não sobe. `DATABASE_URL` deve apontar para o seu PostgreSQL (como subir um: [STARTUP.md](STARTUP.md#2-subindo-o-postgresql)).

## Criação/atualização das tabelas
```bash
python -m alembic upgrade head
```

> A migration inicial já está versionada em `migrations/versions/`. Só rode `alembic revision --autogenerate -m "..."` depois de alterar `app/database/models.py`.

## 4. Rodar a aplicação com hot-reload:

```bash
uvicorn app.main:app --reload
```

A API sobe em `http://localhost:8000`.

## 5. Acessar a documentação automática (Swagger):

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Healthcheck: http://localhost:8000/api/v1/health

## 6. Testar o login:

### Como usuário:

Cadastre o usuário no banco e faça login com ele:

```bash
curl -X POST http://localhost:8000/api/v1/users/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"nome\": \"Doador\", \"email\": \"doador@email.com.br\", \"senha\": \"senha1234\", \"tipo_usuario\": \"doador\"}"

curl -X POST http://localhost:8000/api/v1/users/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"doador@email.com.br\", \"senha\": \"senha1234\"}"
```

Credencial certa → `200` com `{"access_token": "...", "token_type": "bearer"}`; errada → `401`.

### Como instituição:

Cadastre a instituição e faça login com ela:

```bash
curl -X POST http://localhost:8000/api/v1/institutions/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"nome\": \"ASPAAN\", \"email\": \"instituicao@email.com.br\", \"senha\": \"senha1234\", \"tipo_usuario\": \"instituicao\"}"

curl -X POST http://localhost:8000/api/v1/institutions/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"instituicao@email.com.br\", \"senha\": \"senha1234\"}"
```

Credencial certa → `200` com `{"access_token": "...", "token_type": "bearer"}`; errada → `401`.

## 7. Acessar rotas protegidas e rodar os testes:

```bash
curl http://localhost:8000/api/v1/instituicoes -H "Authorization: Bearer SEU_TOKEN"
python -m pytest test
```

No Swagger, use o botão **Authorize**: e-mail em `username`, senha em `password`, `client_id` e `client_secret` em branco.
