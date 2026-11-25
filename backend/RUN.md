# Como rodar o backend NPET (modo desenvolvimento)

Pré-requisitos: **Python 3.10+** (testado com 3.11.9) e um **PostgreSQL** acessível (como subir um: [STARTUP.md](STARTUP.md#2-subindo-o-postgresql)).

Todos os comandos abaixo rodam dentro da pasta `backend/`.

## 1. Criar e ativar o ambiente virtual

```bash
# criar
python -m venv .venv

# ativar (Windows, PowerShell)
.venv\Scripts\Activate.ps1

# ativar (Windows, CMD)
.venv\Scripts\activate.bat
```

> Se o PowerShell recusar o `Activate.ps1` (erro de "execution policy"), pule a ativação e chame o Python do ambiente direto: troque `python` por `.venv\Scripts\python.exe` nos comandos abaixo.

## 2. Instalar as dependências

```bash
pip install -r requirements.txt
```

## 3. Configurar as variáveis de ambiente

```bash
copy .env.example .env
```

No `.env`, ajuste pelo menos:

| Variável | O que colocar |
|---|---|
| `DATABASE_URL` | Endereço do seu PostgreSQL, ex.: `postgresql+psycopg2://npet:npet@localhost:5432/npet` |
| `JWT_SECRET_KEY` | Uma chave aleatória: `python -c "import secrets; print(secrets.token_hex(32))"` (sem ela a API não sobe) |
| `SEED_PASSWORD` | Senha dos usuários criados pelo seed, ex.: `Senha1234` (opcional; veja o passo 5) |
| `MP_ACCESS_TOKEN` | Access token de teste do Mercado Pago (`TEST-...`); só é preciso para testar doações |

A lista completa está em [README.md](README.md#variáveis-de-ambiente).

## 4. Criar/atualizar as tabelas

```bash
python -m alembic upgrade head
```

Aplica todas as migrations de `migrations/versions/`. Rode de novo sempre que puxar mudanças do repositório; se o banco já estiver atualizado, não faz nada.

## 5. Popular as instituições (seed)

```bash
python -m scripts.db_seed_instituicoes
```

O script [scripts/db_seed_instituicoes.py](scripts/db_seed_instituicoes.py) cadastra as **9 instituições de exemplo**, com redes sociais e necessidades. Os logos ficam em `app/static/instituicoes/`.

- Rode como módulo (`-m scripts.db_seed_instituicoes`, sem `.py`); chamando o arquivo direto, os imports de `app` falham.
- Cada instituição ganha um usuário para login: `<slug>@seed.npet.example.com` (ex.: `aspaan@seed.npet.example.com`), com a senha de `SEED_PASSWORD`. Se a variável estiver vazia, o script pede a senha no terminal.
- É idempotente: pode rodar de novo sem duplicar nada.
- Não roda com `APP_ENV=production`.

## 6. Subir a API

```bash
python -m uvicorn app.main:app --reload
```

A API sobe em `http://localhost:8000`.

> **Porta ocupada?** O erro `[WinError 10013]` (ou "address already in use") indica que outro programa já usa a porta 8000; por exemplo, um PostgreSQL configurado nela. Suba em outra porta com `--port 8001` e troque `8000` por `8001` nos endereços abaixo (e no `VITE_API_URL` do frontend).

## 7. Usar a API pelo Swagger

Abra **http://localhost:8000/docs**: cada rota tem o botão **Try it out** para enviar requisições pelo navegador.

1. **Cadastre um doador** em `POST /auth/register`:
   ```json
   {"nome": "Doador Teste", "email": "doador@email.com.br", "senha": "Senha1234", "tipo_usuario": "doador"}
   ```
   A senha precisa de 8 caracteres ou mais, com letra maiúscula, minúscula e número.
2. **Faça login** em `POST /auth/login` com `{"email": "...", "senha": "..."}`. A resposta traz o token e também grava um cookie de sessão; a partir daí, o Swagger já envia o cookie nas rotas protegidas.
3. Chame as rotas protegidas, ex.: `GET /users/me`.

> Não use o botão **Authorize** (cadeado) do Swagger: ele depende de `POST /auth/token`, que está desativado no momento.

Outros endereços:

- ReDoc: http://localhost:8000/redoc
- Healthcheck: http://localhost:8000/api/v1/health

## 8. Usar a API pelo terminal (curl)

```bash
# cadastro de doador
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"nome\": \"Doador\", \"email\": \"doador@email.com.br\", \"senha\": \"Senha1234\", \"tipo_usuario\": \"doador\"}"

# cadastro de instituição (cria o usuário e o perfil da instituição)
curl -X POST http://localhost:8000/api/v1/institutions/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"nome\": \"ASPAAN\", \"email\": \"instituicao@email.com.br\", \"senha\": \"Senha1234\", \"cidade\": \"Anápolis\", \"uf\": \"GO\"}"

# login (vale para todos os tipos) → {"access_token": "...", "token_type": "bearer", "tipo_usuario": "..."}
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"doador@email.com.br\", \"senha\": \"Senha1234\"}"

# rotas protegidas: token no cabeçalho Authorization
curl http://localhost:8000/api/v1/users/me -H "Authorization: Bearer SEU_TOKEN"

# rota pública: lista as instituições (as do seed aparecem aqui)
curl http://localhost:8000/api/v1/instituicoes
```

Credencial certa → `200`; errada → `401`. Sem token, com token inválido ou expirado → `401`.

Para testar doações (PIX e cartão no sandbox do Mercado Pago), veja [README.md](README.md#doações-e-pagamentos-mercado-pago).

## 9. Rodar os testes automatizados

```bash
python -m pytest scripts
```

Os testes usam SQLite em memória e um Mercado Pago falso; não precisam do PostgreSQL nem de credenciais. Se aparecer `ModuleNotFoundError: No module named 'app'`, defina antes `$env:PYTHONPATH = "."` (PowerShell).
