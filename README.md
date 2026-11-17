# NPET

Plataforma que conecta doadores a ONGs e instituições de proteção animal, facilitando doações monetárias e de produtos de forma simples, transparente e acessível.

> **"Por trás de cada doação, um focinho feliz."**

> **Estado atual:** frontend (React + TypeScript) e backend (FastAPI + PostgreSQL) estão integrados. Já funcionam: cadastro de doadores, login com token JWT, redefinição de senha por e-mail, perfil (edição, troca de senha e desativação de conta), desconexão automática por inatividade, listagem de instituições e o **fluxo completo de doação monetária** (PIX e cartão via Mercado Pago, com acompanhamento do pagamento e histórico de doações). Ainda em construção: doação de produtos, necessidades das instituições, feedback das instituições e painel da instituição.

## Sobre o projeto

O NPET é um projeto acadêmico do curso de Engenharia de Software da **UniEVANGÉLICA** (Anápolis - GO). Ele busca resolver a dificuldade de conexão entre quem deseja ajudar animais em situação de vulnerabilidade e as instituições que os acolhem, com um canal único para doações, agendamento de visitas e acompanhamento do uso das contribuições.

Protótipos no Figma: [Desktop (Wireframe + Hi-Fi)](https://www.figma.com/design/38NAOxWGvT52AtsqFvCz6l/Projeto-NPET?node-id=0-1&p=f&t=ixDFyp1U1it1eMRK-0) · [Mobile (Hi-Fi)](https://www.figma.com/design/bg8Ykc4vs30HpZiqTp3duV/Projeto-NPET---Versão-Mobile?node-id=162-2453&p=f&t=rTs8vIctY6AQUtTB-0)

## Funcionalidades

| Funcionalidade | Situação |
|---|---|
| Cadastro e login de doadores (JWT) | ✅ Pronto |
| Redefinição de senha por e-mail | ✅ Pronto |
| Perfil: editar dados, trocar senha, desativar conta | ✅ Pronto |
| Desconexão automática por inatividade | ✅ Pronto |
| Listagem e busca de instituições parceiras | ✅ Pronto |
| Doação monetária por PIX (QR Code e Copia e Cola) | ✅ Pronto |
| Doação monetária por cartão (Checkout Transparente) | ✅ Pronto |
| Histórico de doações, com recorrência e feedback | ✅ Pronto |
| Cadastro de instituição e painel da instituição | 🚧 Backend pronto; telas em andamento |
| Necessidades prioritárias das instituições | 🔜 Planejado |
| Doação de produtos com agendamento de visita | 🔜 Planejado |
| Prestação de contas e avaliações | 🔜 Planejado |

## Stack

**Frontend**

- **React** `19` / **React Router** `7`
- **TypeScript** `6.0`
- **Vite** `8.0` (bundler e servidor de desenvolvimento)
- **Mercado Pago SDK JS** (campos seguros de cartão) e **qrcode.react** (QR Code do PIX)

**Backend**

- **Python 3.10+** / **FastAPI** `0.115.6` / **Uvicorn** `0.34.0`
- **PostgreSQL** com **SQLAlchemy** `2.0.36` (ORM) e **Alembic** `1.14.0` (migrations)
- **bcrypt** (hash de senha) / **PyJWT** (tokens JWT, OAuth2 Bearer)
- **Mercado Pago API** (PIX e cartão, Checkout Transparente) e **SMTP** (e-mails)
- **pytest** (testes)

## Arquitetura

```
Navegador → Frontend React (Vite, :5173) → API REST FastAPI (:8000/api/v1) → PostgreSQL
                 │                               │
                 │                               ├─→ Mercado Pago (cobranças e webhook)
                 │                               └─→ Servidor SMTP (e-mails)
                 └─ token JWT no cabeçalho ──────┘
                    Authorization: Bearer <token>
```

Os dados do cartão nunca passam pelos nossos servidores: o SDK do Mercado Pago os tokeniza no navegador e a API recebe apenas o token.

**Frontend** (`frontend/src/`):

- **pages**: telas (Home, Login, Cadastro, EsqueciSenha, RedefinirSenha, Doações, Histórico, Perfil, Painel da instituição).
- **components**: componentes reutilizáveis (botão, campo de texto, cards, NavBar, modais, menus, taxa do Mercado Pago).
- **services**: chamadas à API (`apiClient.ts` centraliza o envio do token e o tratamento do `401`).
- **hooks**: lógica compartilhada (instituições, histórico, perfil, acompanhamento do pagamento, cartão seguro).
- **auth**: sessão (`AuthProvider`), expiração do token, inatividade e guardas de rota (`RotaProtegida`, `RotaAnonima`).

**Backend** (`backend/app/`): fluxo em três camadas — **Router** (HTTP) → **Service** (regras de negócio) → **Repository** (acesso ao banco via SQLAlchemy). Detalhes em [backend/README.md](backend/README.md).

| Funcionalidade | Frontend (rota) | API |
|---|---|---|
| Página inicial e instituições parceiras | `/` | `GET /instituicoes` · `GET /instituicoes/{id}` (públicas) |
| Login (todos os tipos) | `/login` | `POST /auth/login` |
| Cadastro de doador | `/cadastro` | `POST /auth/register` |
| Cadastro de instituição (usuário + perfil) | — | `POST /institutions/auth/register` |
| Esqueci minha senha | `/esqueci-senha` | `POST /auth/forgot-password` |
| Redefinição de senha (link do e-mail) | `/redefinir-senha?token=...` | `POST /auth/reset-password` |
| Perfil, troca de senha e desativação | `/perfil` (exige login) | `GET/PATCH /users/me` · `POST /users/me/deactivate` |
| Fluxo de doação | `/doacoes` (exige login) | `POST /doacoes/monetarias` |
| Acompanhamento do PIX | `/doacoes` e `/historico` | `GET /doacoes/{id}` (consulta a cada 5 s) |
| Histórico de doações | `/historico` (exige login) | `GET /doacoes/me` · `PATCH /doacoes/{id}/feedback-visto` |
| Confirmação de pagamento (Mercado Pago) | — | `POST /pagamentos/webhook` (assinado) |
| Painel da instituição | `/` com perfil de instituição | `GET /instituicoes/me` |
| Encerrar sessão | `/sair` | `POST /auth/logout` |

A lista completa de rotas está em [backend/README.md](backend/README.md#arquitetura).

## Estrutura de diretórios

```
NPET/
├── frontend/                    # aplicação React (Vite)
│   ├── src/
│   │   ├── auth/                # AuthProvider, guardas de rota, sessão, inatividade
│   │   ├── components/          # componentes reutilizáveis
│   │   ├── hooks/               # useInstituicoes, useHistoricoDoacoes, usePerfil, ...
│   │   ├── pages/               # Home, Login, Cadastro, Doacoes, Historico, Perfil, ...
│   │   ├── services/            # chamadas à API e ao Mercado Pago
│   │   ├── types/               # tipos de domínio (domain.ts)
│   │   ├── utils/               # datas, moeda, taxas, validação, filtro de busca
│   │   └── App.tsx              # rotas da aplicação
│   ├── .env.example             # VITE_API_URL e VITE_MP_PUBLIC_KEY
│   ├── package.json
│   └── README.md
├── backend/                     # API FastAPI
│   ├── app/
│   │   ├── core/                # configuração, exceções, segurança (bcrypt + JWT)
│   │   ├── database/            # engine, models e schemas
│   │   ├── integrations/        # cliente do Mercado Pago
│   │   ├── modules/             # auth, usuários, instituições, doações e pagamentos
│   │   └── static/              # logos das instituições
│   ├── migrations/              # Alembic
│   ├── scripts/                 # seed das instituições, criação de admin e testes (pytest)
│   ├── .env.example
│   ├── requirements.txt
│   ├── README.md
│   ├── RUN.md
│   └── STARTUP.md
└── README.md                    # este arquivo
```

## Como rodar (modo desenvolvimento)

Pré-requisitos: **Node.js 20+**, **Python 3.10+** e um **PostgreSQL** acessível (local ou em container; veja [backend/STARTUP.md](backend/STARTUP.md#2-subindo-o-postgresql)).

```bash
git clone https://github.com/ArthurPeruchi/NPET.git
cd NPET
```

**1. Backend** (em um terminal, dentro de `backend/`)

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows (PowerShell) ou .venv\Scripts\activate.bat no CMD
pip install -r requirements.txt
copy .env.example .env              # e ajuste as variáveis (veja a tabela abaixo)
python -m alembic upgrade head      # cria/atualiza as tabelas
python -m scripts.db_seed_instituicoes   # popula as 9 instituições de exemplo
python -m uvicorn app.main:app --reload
```

A API sobe em `http://localhost:8000`. O seed é opcional, mas sem ele a Home fica sem instituições. Ele pode rodar mais de uma vez sem duplicar dados, e cada instituição ganha um login `<slug>@seed.npet.example.com` com a senha de `SEED_PASSWORD`. Detalhes e exemplos de uso da API em [backend/RUN.md](backend/RUN.md).

**2. Frontend** (em outro terminal, dentro de `frontend/`)

```bash
npm install
copy .env.example .env              # ajuste VITE_API_URL e VITE_MP_PUBLIC_KEY
npm run dev
```

O site abre em `http://localhost:5173`.

> O Vite só lê o `.env` ao iniciar: depois de alterar uma variável `VITE_*`, reinicie o `npm run dev`. Se a API não subir na porta 8000 (ex.: porta ocupada), rode `uvicorn ... --port 8001` e ajuste o `VITE_API_URL`.

### Variáveis de ambiente

| Onde | Variável | Obrigatória | Exemplo | Descrição |
|---|---|---|---|---|
| `backend/.env` | `DATABASE_URL` | **sim** | `postgresql+psycopg2://npet:npet@localhost:5432/npet` | Conexão com o PostgreSQL |
| `backend/.env` | `JWT_SECRET_KEY` | **sim** | `python -c "import secrets; print(secrets.token_hex(32))"` | Chave que assina os tokens |
| `backend/.env` | `JWT_EXPIRE_MINUTES` | não | `30` | Validade do token (considere valores maiores em desenvolvimento, pois a sessão também encerra por inatividade) |
| `backend/.env` | `FRONTEND_URL` | para e-mails | `http://localhost:5173` | Base do link de redefinição de senha |
| `backend/.env` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | para e-mails | — | Envio de e-mails. Com `SMTP_HOST` vazio, os e-mails apenas aparecem no log |
| `backend/.env` | `MP_ACCESS_TOKEN` | para doações | `TEST-...` | Credencial privada do Mercado Pago |
| `backend/.env` | `MP_WEBHOOK_SECRET` | para doações | — | Assinatura do webhook do Mercado Pago |
| `backend/.env` | `MP_NOTIFICATION_URL` | para o webhook | `https://<ngrok>/api/v1/pagamentos/webhook` | URL pública que recebe as notificações |
| `frontend/.env` | `VITE_API_URL` | **sim** | `http://localhost:8000/api/v1` | Endereço da API |
| `frontend/.env` | `VITE_MP_PUBLIC_KEY` | para doações | `TEST-...` | Chave pública do Mercado Pago (campos seguros do cartão) |

As demais variáveis do backend (prazo do PIX, tentativas e tempo limite do Mercado Pago, etc.) estão em [backend/README.md](backend/README.md#variáveis-de-ambiente).

### Testando pagamentos localmente

- Use as credenciais de **teste** do Mercado Pago (`TEST-...`).
- O webhook precisa de uma URL pública. Em desenvolvimento, exponha a API com uma ferramenta como o ngrok e informe a URL em `MP_NOTIFICATION_URL`. Sem ele, o pagamento só é atualizado quando o histórico ou a doação são consultados.
- Nos testes de cartão, o nome do titular `APRO` simula um pagamento aprovado.

### Build do frontend

```bash
npm run build       # gera a versão de produção
npm run preview     # pré-visualiza o build localmente
```

## Documentação automática da API

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Healthcheck: `http://localhost:8000/api/v1/health`

## Autenticação e sessão

1. O usuário entra em `/login`; o frontend envia `POST /auth/login` com `email` e `senha`.
2. A API valida a senha (bcrypt) e devolve `{"access_token", "token_type": "bearer", "tipo_usuario"}`. O token JWT carrega o id do usuário, o tipo e a validade.
3. O `AuthProvider` guarda a sessão e a encerra quando o token expira. O tipo do usuário vem do backend e define a experiência: instituições veem o painel; doadores, a Home e o fluxo de doação.
4. As requisições protegidas levam `Authorization: Bearer <token>`. Se a API responder `401`, a sessão é limpa e o usuário volta ao login.
5. **Inatividade:** após 15 minutos sem interação, a sessão é encerrada. Aos 12 minutos (3 minutos antes), um aviso permite continuar conectado. A espera de um PIX conta como atividade, e a atividade é compartilhada entre abas.
6. **Redefinição de senha:** `/esqueci-senha` envia um e-mail com um link para `/redefinir-senha?token=...`. O link vale 15 minutos e só pode ser usado uma vez.

No backend, a dependência `get_current_user` protege as rotas e `require_role(...)` restringe por tipo de usuário (`403`). No Swagger, faça login em `POST /auth/login`; o cookie da resposta passa a valer nas rotas protegidas. O botão **Authorize** está temporariamente sem uso, porque depende de `POST /auth/token`, hoje desativado.

## Fluxo de doação

1. O doador escolhe a instituição, o método (PIX ou cartão) e o valor. A taxa estimada do Mercado Pago aparece dentro do campo de valor.
2. **Cartão:** o SDK do Mercado Pago tokeniza os dados no navegador; o frontend envia apenas o token. **PIX:** a API devolve o QR Code e o código Copia e Cola, válidos por 30 minutos.
3. O backend valida as regras (valor de R$ 1,00 a R$ 10.000,00, instituição ativa, usuário doador), grava a doação e cobra no Mercado Pago com chave de idempotência.
4. A confirmação chega pelo webhook assinado; o frontend acompanha o PIX consultando `GET /doacoes/{id}` a cada 5 segundos.
5. Ao aprovar, o doador recebe um e-mail de confirmação (uma única vez) e a doação aparece no histórico. Um PIX pendente pode ser reaberto no histórico até vencer; depois disso, a doação passa a **cancelada**.

## Testes

```bash
cd backend
python -m pytest scripts    # usa SQLite em memória e um Mercado Pago falso; não precisa do PostgreSQL
```

```bash
cd frontend
npm run lint                # ESLint
npm run build               # verificação de tipos (tsc) e build
```

## Próximos passos

- Telas de cadastro e painel da instituição.
- Endpoints de necessidades, redes sociais e doação de produtos (os models já existem).
- Feedback das instituições sobre as doações.
- Exclusão de conta com anonimização dos dados (LGPD), página de termos de uso e política de privacidade.
- Refresh token e armazenamento da sessão mais seguro que o `localStorage`.
- Integração contínua (testes, `tsc` e migrations a cada push).

## Documentação adicional

- [frontend/README.md](frontend/README.md) — frontend: tecnologias, estrutura e comandos
- [backend/README.md](backend/README.md) — backend: arquitetura, rotas, variáveis e autenticação
- [backend/STARTUP.md](backend/STARTUP.md) — guia detalhado, incluindo a subida do PostgreSQL
- [backend/RUN.md](backend/RUN.md) — guia rápido do backend: execução, seed e uso da API

## Equipe

| Nome | Função |
|---|---|
| Arthur Gabriel Peruchi Trindade | Product Designer e Desenvolvedor Frontend |
| Guilherme Quaglio e Silva | Desenvolvedor Full Stack |
| Luana Silva Freitas | Desenvolvedor Backend |
| Matheus Antônio da Silva | Desenvolvedor Backend |

**Orientadores:** Luan Cardoso de Jesus e Eder José Almeida da Silva

Desenvolvido na **Universidade Evangélica de Goiás — UniEVANGÉLICA**, curso de Engenharia de Software, Anápolis - GO. © 2026 NPET. Projeto acadêmico.