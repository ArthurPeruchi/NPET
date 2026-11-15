# NPET-backend

Backend da aplicação **NPET** — plataforma que conecta doadores a ONGs e instituições de proteção animal.

> **Estado atual:** persistência em **PostgreSQL** via SQLAlchemy 2.0 + Alembic. Entregues: cadastro de usuários e de instituições (`/auth/register` e `/institutions/auth/register`) e login único (`/auth/login`), com senha em bcrypt e token JWT; perfil, redefinição de senha e desativação de conta; a leitura de `/instituicoes` (listagem e detalhe) é pública; criar, editar, excluir e `/instituicoes/me` exigem o token. As instituições ficam no banco (com redes sociais e necessidades); os dados iniciais vêm do seed `scripts/db_seed_instituicoes.py`. Doações em dinheiro (PIX e cartão) são cobradas pelo **Mercado Pago** (Checkout Transparente), com histórico em `/doacoes/me`.

## Stack

- **Python 3.10+** (testado com 3.11.9)
- **FastAPI** `0.115.6` / **Uvicorn** `0.34.0`
- **Pydantic** `2.10.4` / **Pydantic Settings** `2.7.1`
- **SQLAlchemy** `2.0.36` (ORM) / **psycopg2-binary** `2.9.10` (driver PostgreSQL)
- **Alembic** `1.14.0` (migrations)
- **bcrypt** `5.0.0` (hash de senha)
- **PyJWT** `2.10.1` (tokens JWT) / **python-multipart** `0.0.20` (formulário OAuth2 do Swagger)
- **httpx** `0.28.1` (cliente da API do Mercado Pago)
- **pytest** `8.3.4` (testes)

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
| Login e logout (todos os tipos) | `POST /api/v1/auth/login` · `POST /api/v1/auth/logout` | `app/modules/auth/usuarios/` |
| Cadastro de usuário | `POST /api/v1/auth/register` | `app/modules/auth/usuarios/` |
| Esqueci minha senha (público) | `POST /api/v1/auth/forgot-password` · `POST /api/v1/auth/reset-password` | `app/modules/auth/usuarios/` |
| Perfil do usuário | `GET/PATCH /api/v1/users/me` (trocar `senha` exige `senha_atual`) · `POST /api/v1/users/me/deactivate` | `app/modules/usuarios/` |
| Usuários (admin) | `GET /api/v1/users` · `GET/PATCH/DELETE /api/v1/users/{id}` · `POST /api/v1/users/{id}/reactivate` | `app/modules/usuarios/` |
| Instituições (CRUD, ORM) | `GET/POST /api/v1/instituicoes` · `GET /api/v1/instituicoes/me` · `GET/PATCH/DELETE /api/v1/instituicoes/{id}` | `app/modules/instituicoes/` |
| Cadastro de instituição (usuário + perfil em `instituicoes`) | `POST /api/v1/institutions/auth/register` | `app/modules/auth/instituicoes/` |
| Doações em dinheiro (Mercado Pago) | `POST /api/v1/doacoes/monetarias` (doador) · `GET /api/v1/doacoes/me` · `GET /api/v1/doacoes/{id}` · `PATCH /api/v1/doacoes/{id}/recorrencia` · `PATCH /api/v1/doacoes/{id}/feedback-visto` | `app/modules/doacoes/` |
| Webhook do Mercado Pago (público, assinado) | `POST /api/v1/pagamentos/webhook` | `app/modules/pagamentos/` |

## Estrutura de diretórios

```
backend/
├── app/
│   ├── main.py                      # cria o app FastAPI, CORS, handler de erros e /static
│   ├── api/
│   │   └── router.py                # junta todos os routers sob /api/v1
│   ├── core/
│   │   ├── config.py                # configurações (lê o .env)
│   │   ├── dependencies.py          # get_current_user (token/cookie), require_role, require_admin
│   │   ├── email.py                 # envio de e-mail (SMTP ou log)
│   │   ├── exceptions.py            # AppError e subclasses (401, 402, 403, 404, 409, 422, 502)
│   │   └── security.py              # bcrypt e geração/validação do JWT
│   ├── database/
│   │   ├── database.py              # engine, SessionLocal, Base e get_db()
│   │   ├── models.py                # models SQLAlchemy (tabelas)
│   │   ├── schemas.py               # schemas Pydantic de usuário e auth
│   │   └── test_conn.py             # diagnóstico de conexão com o PostgreSQL
│   ├── health/
│   │   └── router.py                # GET /health
│   ├── integrations/
│   │   └── mercadopago.py           # cliente da API de Payments e validação do webhook
│   ├── modules/                     # cada módulo: router → service → repository (+ schemas)
│   │   ├── auth/
│   │   │   ├── usuarios/            # cadastro, login, logout, esqueci/redefinir senha
│   │   │   └── instituicoes/        # cadastro de instituição (usuário + perfil)
│   │   ├── usuarios/                # perfil (/users/me), desativação e admin de usuários
│   │   ├── instituicoes/            # CRUD de instituições (leitura pública)
│   │   ├── doacoes/                 # doações em dinheiro (Mercado Pago) e histórico
│   │   └── pagamentos/              # webhook do Mercado Pago
│   └── static/
│       └── instituicoes/            # logos das instituições do seed
├── migrations/
│   ├── env.py
│   └── versions/                    # uma migration por mudança de schema
├── scripts/
│   ├── conftest.py                  # fixtures do pytest (SQLite em memória)
│   ├── db_create_admin.py           # cria um usuário administrador
│   ├── db_seed_instituicoes.py      # seed das 9 instituições de exemplo
│   ├── test_conn.py                 # teste manual de conexão (fora do pytest)
│   ├── test_seguranca.py            # testes de autenticação
│   └── test_doacoes.py              # testes de doações e Mercado Pago
├── .env.example                     # modelo de variáveis de ambiente
├── alembic.ini
├── requirements.txt
├── RUN.md                           # guia rápido de execução e uso da API
└── STARTUP.md                       # guia detalhado (setup do banco incluso)
```

## Como rodar (modo desenvolvimento)

Pré-requisitos: **Python 3.10+** e um **PostgreSQL** acessível (local ou em container; veja [STARTUP.md](./STARTUP.md#2-subindo-o-postgresql)).

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows (PowerShell) — ou .venv\Scripts\activate.bat no CMD
pip install -r requirements.txt
copy .env.example .env              # e ajuste DATABASE_URL e JWT_SECRET_KEY
python -m alembic upgrade head      # cria/atualiza as tabelas
python -m scripts.db_seed_instituicoes   # (opcional) popula as 9 instituições de exemplo
python -m uvicorn app.main:app --reload
```

A API sobe em `http://localhost:8000`. Se a porta estiver ocupada (erro `[WinError 10013]`), use `--port 8001`.

O passo a passo completo, com exemplos de uso da API, está em [RUN.md](./RUN.md).

### Seed das instituições

```bash
python -m scripts.db_seed_instituicoes
```

[scripts/db_seed_instituicoes.py](scripts/db_seed_instituicoes.py) cadastra as 9 instituições de exemplo, com redes sociais, necessidades e logos (`app/static/instituicoes/`). Rode depois do `alembic upgrade head`.

- Rode como módulo (`-m`, sem `.py`), senão os imports de `app` falham.
- Cada instituição ganha um usuário `<slug>@seed.npet.example.com` (ex.: `aspaan@seed.npet.example.com`) com a senha de `SEED_PASSWORD`. Se a variável estiver vazia, o script pede a senha no terminal. Use uma senha que siga a regra da API (ex.: `Senha1234`).
- É idempotente (pode rodar de novo sem duplicar) e não roda com `APP_ENV=production`.

> Se o PowerShell recusar rodar `Activate.ps1` (erro de "execution policy"), use o `activate.bat` pelo CMD, ou chame os executáveis de `.venv\Scripts\` diretamente (ex.: `.venv\Scripts\python.exe -m alembic upgrade head`).

### Variáveis de ambiente

| Variável | Obrigatória | Exemplo | Descrição |
|---|---|---|---|
| `DATABASE_URL` | **sim** | `postgresql+psycopg2://npet:npet@localhost:5432/npet` | Conexão com o PostgreSQL (usada pela API e pelo Alembic) |
| `APP_NAME` | não | `NPET API` | Título no Swagger |
| `APP_ENV` | não | `development` | Ambiente de execução |
| `PORT` | não | `8000` | Porta do Uvicorn |
| `API_PREFIX` | não | `/api/v1` | Prefixo das rotas |
| `JWT_SECRET_KEY` | **sim** | `python -c "import secrets; print(secrets.token_hex(32))"` | Chave que assina os tokens |
| `JWT_EXPIRE_MINUTES` | não | `30` | Validade do token |
| `DEBUG` | não | `true` | Com `true`, o SQLAlchemy loga todo SQL executado |
| `SEED_PASSWORD` | não | `Senha1234` | Senha dos usuários criados pelo seed (se vazia, o script pede no terminal) |
| `FRONTEND_URL` / `RESET_PASSWORD_PATH` | não | `http://localhost:5173` / `/redefinir-senha` | Base do link enviado no e-mail de redefinição (`...?token=`) |
| `RESET_TOKEN_EXPIRE_MINUTES` | não | `15` | Validade do link de redefinição |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_STARTTLS` | não | `smtp.gmail.com`, `587`, ... | Envio de e-mail. Sem `SMTP_HOST`, o e-mail (com o link) só aparece no log da API |
| `MP_ACCESS_TOKEN` | para doar | `TEST-...` | Access token da conta Mercado Pago da NPET (sem ele, criar doação responde `502`) |
| `MP_WEBHOOK_SECRET` | para o webhook | — | "Assinatura secreta" da seção Webhooks do painel do MP (sem ela, o webhook responde `503`) |
| `MP_NOTIFICATION_URL` | não | `https://xxxx.ngrok.app/api/v1/pagamentos/webhook` | URL pública enviada ao MP em cada pagamento |
| `MP_API_URL` / `MP_PIX_EXPIRATION_MINUTES` | não | `https://api.mercadopago.com` / `30` | Endereço da API e validade do QR Code PIX |

### Conta do usuário

- **Esqueci minha senha:** `forgot-password` sempre responde `202` (não revela se o e-mail existe). Para contas ativas, gera um token de uso único (só o hash SHA-256 fica no banco, tabela `tokens_redefinicao_senha`), invalida links anteriores e envia o e-mail em segundo plano. `reset-password` recebe `{token, nova_senha}`; token inválido, expirado ou já usado → `400`.
- **Desativação:** `POST /users/me/deactivate` com `{senha}` marca `usuarios.ativo = false`. Login e tokens já emitidos passam a responder `401` ("Esta conta está desativada."), a instituição some da listagem e o histórico é preservado. Só um admin reativa.

### Doações e pagamentos (Mercado Pago)

Todo pagamento cai na conta Mercado Pago da NPET; a doação registra a instituição de destino.

- **Criar:** `POST /doacoes/monetarias` (só doador) com `{idInstituicao, valor, formaPagamento, recorrente}`. Valor de R$ 1,00 a R$ 10.000,00, com 2 casas. A instituição precisa existir, estar com a conta ativa e com `aceita_doacoes`.
  - **PIX:** responde `201` com `status: "pendente"` e `pix: {qrCode, expiraEm}` (o "copia e cola"; o frontend gera a imagem do QR).
  - **Cartão:** envie também `cardToken` e `paymentMethodId` (e opcionalmente `issuerId`), gerados pelo SDK JS do Mercado Pago no navegador. **Número, validade e CVV nunca chegam ao backend**; só os 4 últimos dígitos ficam guardados (`cartaoFinal`). Aprovado → `201` com `status: "confirmada"`. Recusado → `402` com o motivo (a doação fica no histórico como `cancelada`).
  - Falha de comunicação com o Mercado Pago → `502` (doação `cancelada`).
- **Confirmação do PIX:** chega pelo webhook. Além disso, `GET /doacoes/{id}` de uma doação pendente consulta o Mercado Pago antes de responder (o frontend pode consultar a cada poucos segundos).
- **Webhook:** `POST /pagamentos/webhook` valida o header `x-signature` (HMAC-SHA256 com `MP_WEBHOOK_SECRET`; inválido → `401`) e nunca confia no corpo: busca o pagamento na API do MP e atualiza a doação. Pagamento desconhecido → `200`.
- **Recorrência:** `recorrente` é só um lembrete (o frontend monta uma nova doação pré-preenchida e o doador confirma); não há cobrança automática.
- **Status do MP → status da doação:** `approved` → `confirmada`; `pending`/`in_process`/`authorized` → `pendente`; `rejected`/`cancelled`/`refunded`/`charged_back` → `cancelada`.

**Testando no sandbox:** use as credenciais de teste da conta (`MP_ACCESS_TOKEN=TEST-...`). Para cartão, gere um token com a public key de teste (`POST https://api.mercadopago.com/v1/card_tokens?public_key=...` com um cartão de teste do Mercado Pago; titular `APRO` aprova, `OTHE` recusa) e chame `POST /doacoes/monetarias`. Para receber o webhook em dev, exponha a API (ex.: `ngrok http 8000`), configure a URL no painel do MP e copie a assinatura secreta para `MP_WEBHOOK_SECRET`.

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

## Autenticação (OAuth2 + JWT)

O login é único para todos os tipos (`POST /auth/login`) e devolve o token JWT (HS256) junto com o `tipo_usuario`. O token carrega o `id_usuario` em `sub`, o tipo em `tipo_usuario` e a validade em `exp`. As rotas protegidas usam a dependência `get_current_user` ([app/core/dependencies.py](app/core/dependencies.py)), que lê o cabeçalho `Authorization: Bearer <token>` ou, na falta dele, o cookie `access_token` gravado pelo login. Token ausente, inválido, expirado ou de usuário inexistente → `401`. Para restringir uma rota por tipo, use `Depends(require_role(TipoUsuario.instituicao))`, que responde `403` aos demais tipos (`require_admin` é o atalho para administradores). A senha precisa ter de 8 a 72 bytes (limite do bcrypt) e conter ao menos uma letra maiúscula, uma minúscula e um número; fora disso, cadastro, troca e redefinição de senha respondem `422`.

No Swagger (`/docs`), faça login em `POST /auth/login` (**Try it out**): o cookie gravado na resposta passa a ser enviado nas rotas protegidas. Para sair, use `POST /auth/logout`. O botão **Authorize** (cadeado) não funciona no momento, porque depende de `POST /auth/token`, que está desativado. O passo a passo está em [RUN.md](./RUN.md#7-usar-a-api-pelo-swagger).

```bash
# o login devolve {"access_token": "...", "token_type": "bearer", "tipo_usuario": "doador"}
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"doador@email.com.br\", \"senha\": \"Senha1234\"}"

# rotas protegidas exigem o token no cabeçalho Authorization
curl http://localhost:8000/api/v1/users/me -H "Authorization: Bearer SEU_TOKEN"
```

## Testes

```bash
python -m pytest scripts
```

A suíte fica em `scripts/` (`test_seguranca.py` e `test_doacoes.py`), usa SQLite em memória e um Mercado Pago falso; não precisa do PostgreSQL nem de credenciais.

## Próximos passos

- Atualizar `scripts/test_seguranca.py` para as rotas atuais (7 testes ainda chamam `/users/auth/register` e `/auth/token`).
- Reativar `POST /auth/token` (botão **Authorize** do Swagger).
- CRUD de redes sociais e necessidades (hoje só entram pelo seed) e doação de produtos (models já existem).

## Documentação adicional

- [RUN.md](./RUN.md) — guia rápido de execução, seed e uso da API (Swagger e curl)
- [STARTUP.md](./STARTUP.md) — guia detalhado da arquitetura e do setup do banco
