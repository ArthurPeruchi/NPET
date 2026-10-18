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

> Se o PowerShell recusar rodar `Activate.ps1` (erro de "execution policy"),
> use o `activate.bat` pelo CMD, ou simplesmente chame os executáveis de
> dentro de `.venv\Scripts\` diretamente, sem ativar (ex.:
> `.venv\Scripts\python.exe -m uvicorn app.main:app --reload`).

## 2. Instalar as dependências:

```bash
pip install -r requirements.txt
```

## 3. Configurar variáveis de ambiente:

```bash
copy .env.example .env
```
Ajuste `DATABASE_URL` no `.env` para apontar para o seu PostgreSQL (como subir um: [STARTUP.md](STARTUP.md#2-subindo-o-postgresql)).

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
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"nome\": \"Doador\", \"email\": \"doador@email.com.br\", \"senha\": \"senha1234\", \"tipo_usuario\": \"doador\"}"

curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"doador@email.com.br\", \"senha\": \"senha1234\"}"
```

Credencial certa → `200` com `{"message": "Autenticação realizada com sucesso."}`; errada → `401`.

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

Credencial certa → `200` com `{"message": "Autenticação realizada com sucesso."}`; errada → `401`.
