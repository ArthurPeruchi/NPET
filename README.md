# NPET

Plataforma que conecta doadores a ONGs e instituições de proteção animal, facilitando doações monetárias e de produtos de forma simples, transparente e acessível.

> **"Por trás de cada doação, um focinho feliz."**

> **Estado atual:** o frontend (React + TypeScript) consome uma API REST (FastAPI) com persistência em **PostgreSQL**. Entregues: cadastro de doadores e instituições, login único com token JWT, sessão com expiração no frontend, rotas protegidas e o fluxo de doação em construção (seleção de instituição, método e detalhes). As instituições ficam no PostgreSQL, com dados iniciais carregados pelo seed `backend/scripts/db_seed_instituicoes.py`. No backend, a API de doações em dinheiro (PIX e cartão via Mercado Pago, com histórico) está pronta; a integração com o frontend está em andamento.

## Sobre o projeto

O NPET é um projeto acadêmico do curso de Engenharia de Software da **UniEVANGÉLICA** (Anápolis - GO). Ele busca resolver a dificuldade de conexão entre quem deseja ajudar animais em situação de vulnerabilidade e as instituições que os acolhem, com um canal único para doações, agendamento de visitas e acompanhamento do uso das contribuições.

Funcionalidades previstas:

- Cadastro e autenticação de doadores e instituições parceiras
- Visualização das instituições e de suas necessidades prioritárias
- Doações monetárias (PIX e cartão) e de produtos (com agendamento de visita)
- Histórico de doações com status e feedback das instituições
- Prestação de contas pelas instituições
- Avaliações e suporte ao usuário

Protótipos no Figma: [Desktop (Wireframe + Hi-Fi)](https://www.figma.com/design/38NAOxWGvT52AtsqFvCz6l/Projeto-NPET?node-id=0-1&p=f&t=ixDFyp1U1it1eMRK-0) · [Mobile (Hi-Fi)](https://www.figma.com/design/bg8Ykc4vs30HpZiqTp3duV/Projeto-NPET---Versão-Mobile?node-id=162-2453&p=f&t=rTs8vIctY6AQUtTB-0)

## Stack

**Frontend**

- **React** `19` / **React Router** `7`
- **TypeScript** `6.0`
- **Vite** `8.0` (bundler e servidor de desenvolvimento)

**Backend**

- **Python 3.10+** / **FastAPI** `0.115.6` / **Uvicorn** `0.34.0`
- **PostgreSQL** com **SQLAlchemy** `2.0.36` (ORM) e **Alembic** `1.14.0` (migrations)
- **bcrypt** (hash de senha) / **PyJWT** (tokens JWT, OAuth2 Bearer)
- **Mercado Pago API** (pagamentos PIX e cartão, Checkout Transparente)
- **pytest** (testes)

## Arquitetura

```
Navegador → Frontend React (Vite, :5173) → API REST FastAPI (:8000/api/v1) → PostgreSQL
                 │                               │
                 └─ token JWT no cabeçalho ──────┘
                    Authorization: Bearer <token>
```

**Frontend** (`frontend/src/`):

- **pages**: telas (Home, Login, Cadastro, Doações, Painel da instituição).
- **components**: componentes reutilizáveis (botão, campo de texto, cards, NavBar, menus).
- **services**: chamadas à API (ex.: `instituicoesService.ts`, que envia o token e trata o `401`).
- **hooks**: lógica compartilhada (ex.: `useInstituicoes`).
- **auth**: sessão do usuário (`AuthProvider`), expiração do token e guardas de rota (`RotaProtegida`, `RotaAnonima`).

**Backend** (`backend/app/`): fluxo em três camadas — **Router** (HTTP) → **Service** (regras de negócio) → **Repository** (acesso ao banco via SQLAlchemy). Detalhes em [backend/README.md](backend/README.md).

| Funcionalidade | Frontend (rota) | API |
|---|---|---|
| Página inicial e instituições parceiras | `/` | `GET /instituicoes` · `GET /instituicoes/{id}` (públicas) |
| Login (todos os tipos) | `/login` | `POST /auth/login` |
| Cadastro de doador | `/cadastro` | `POST /auth/register` |
| Cadastro de instituição (usuário + perfil) | — | `POST /institutions/auth/register` |
| Perfil, troca de senha e desativação | — | `GET/PATCH /users/me` · `POST /users/me/deactivate` |
| Esqueci minha senha | — | `POST /auth/forgot-password` · `POST /auth/reset-password` |
| Fluxo de doação | `/doacoes` (exige login) | `POST /doacoes/monetarias` (backend pronto; frontend ainda simula) |
| Histórico de doações | — | `GET /doacoes/me` · `GET /doacoes/{id}` |
| Painel da instituição | `/` com perfil de instituição | `GET /instituicoes/me` |
| Encerrar sessão | `/sair` | `POST /auth/logout` |

A lista completa de rotas está em [backend/README.md](backend/README.md#arquitetura).

## Estrutura de diretórios

```
NPET/
├── frontend/                    # aplicação React (Vite)
│   ├── src/
│   │   ├── auth/                # AuthProvider, guardas de rota, sessão e expiração do token
│   │   ├── components/          # componentes reutilizáveis
│   │   ├── hooks/               # useInstituicoes, useIsMobile, useScrollToTop
│   │   ├── pages/               # Home, Login, Cadastro, Doacoes, DashboardInstituicao
│   │   ├── services/            # chamadas à API
│   │   ├── types/               # tipos de domínio (domain.ts)
│   │   ├── utils/               # funções auxiliares (ex.: filtro de busca)
│   │   └── App.tsx              # rotas da aplicação
│   ├── .env.example             # VITE_API_URL
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

Pré-requisitos: **Node.js 20+**, **Python 3.10+** e um **PostgreSQL** acessível (instalado localmente ou em container; veja [backend/STARTUP.md](backend/STARTUP.md#2-subindo-o-postgresql)).

```bash
git clone https://github.com/ArthurPeruchi/NPET.git
cd NPET
```

**1. Backend** (em um terminal, dentro de `backend/`)

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows (PowerShell) ou .venv\Scripts\activate.bat no CMD
pip install -r requirements.txt
copy .env.example .env              # e ajuste DATABASE_URL, JWT_SECRET_KEY e SEED_PASSWORD
python -m alembic upgrade head      # cria/atualiza as tabelas
python -m scripts.db_seed_instituicoes   # popula as 9 instituições de exemplo
python -m uvicorn app.main:app --reload
```

A API sobe em `http://localhost:8000`. O seed é opcional, mas sem ele a Home fica sem instituições. Ele pode rodar mais de uma vez sem duplicar dados, e cada instituição ganha um login `<slug>@seed.npet.example.com` com a senha de `SEED_PASSWORD`. Detalhes e exemplos de uso da API em [backend/RUN.md](backend/RUN.md).

**2. Frontend** (em outro terminal, dentro de `frontend/`)

```bash
npm install
copy .env.example .env              # VITE_API_URL deve apontar para a API
npm run dev
```

O site abre em `http://localhost:5173`.

> O Vite só lê o `.env` ao iniciar: depois de alterar `VITE_API_URL`, reinicie o `npm run dev`. Se a API não subir na porta 8000 (ex.: porta ocupada), rode `uvicorn ... --port 8001` e ajuste o `VITE_API_URL`.

### Variáveis de ambiente

| Onde | Variável | Obrigatória | Exemplo | Descrição |
|---|---|---|---|---|
| `backend/.env` | `DATABASE_URL` | **sim** | `postgresql+psycopg2://npet:npet@localhost:5432/npet` | Conexão com o PostgreSQL |
| `backend/.env` | `JWT_SECRET_KEY` | **sim** | `python -c "import secrets; print(secrets.token_hex(32))"` | Chave que assina os tokens |
| `backend/.env` | `JWT_EXPIRE_MINUTES` | não | `30` | Validade do token |
| `frontend/.env` | `VITE_API_URL` | **sim** | `http://localhost:8000/api/v1` | Endereço da API |

As demais variáveis do backend estão em [backend/README.md](backend/README.md#variáveis-de-ambiente).

### Build do frontend

```bash
npm run build       # gera a versão de produção
npm run preview     # pré-visualiza o build localmente
```

## Documentação automática da API

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Healthcheck: `http://localhost:8000/api/v1/health`

## Autenticação

1. O usuário entra em `/login`; o frontend envia `POST /auth/login` com `email` e `senha`.
2. A API valida a senha (bcrypt) e devolve `{"access_token", "token_type": "bearer", "tipo_usuario"}`. O token JWT carrega o id do usuário, o tipo e a validade.
3. O `AuthProvider` guarda a sessão e encerra-a quando o token expira. O tipo do usuário vem do backend e define a experiência: instituições veem o painel; doadores, a Home e o fluxo de doação.
4. As requisições protegidas levam `Authorization: Bearer <token>`. Se a API responder `401`, a sessão é limpa e o usuário volta ao login.
 
No backend, a dependência `get_current_user` protege as rotas e `require_role(...)` restringe por tipo de usuário (`403`). No Swagger, faça login em `POST /auth/login`; o cookie da resposta passa a valer nas rotas protegidas. Outra opção é o botão **Authorize** (cadeado): informe o e-mail em *username* e a senha em *password* (ele usa `POST /auth/token`).

## Testes

```bash
cd backend
python -m pytest scripts    # usa SQLite em memória e um Mercado Pago falso; não precisa do PostgreSQL
```

## Próximos passos

- Integrar o fluxo de doação do frontend à API (campos seguros de cartão do Mercado Pago no lugar da simulação).
- Endpoints de necessidades, redes sociais e doação de produtos (os models já existem).
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
