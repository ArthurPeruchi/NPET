# NPET — Frontend

Aplicação web do NPET, plataforma que conecta doadores a ONGs e instituições de proteção animal.

> **"Por trás de cada doação, um focinho feliz."**

O frontend consome a API REST do backend (FastAPI) e integra o **Mercado Pago** para doações por PIX e cartão. Para a visão geral do projeto, a arquitetura e a subida do backend, veja o [README da raiz](../README.md).

## Páginas e rotas

| Rota | Página | Acesso |
|---|---|---|
| `/` | Home (banner, instituições parceiras, busca) | Público |
| `/login` | Login | Somente anônimo |
| `/cadastro` | Cadastro de doador | Somente anônimo |
| `/esqueci-senha` | Solicitação de redefinição de senha | Somente anônimo |
| `/redefinir-senha` | Nova senha (link recebido por e-mail, `?token=`) | Público |
| `/doacoes` | Fluxo de doação: instituição, método e detalhes, confirmação | Logado |
| `/historico` | Histórico de doações | Logado |
| `/perfil` | Dados pessoais, troca de senha e desativação de conta | Logado |
| `/sair` | Encerra a sessão | — |
| `*` | Redireciona para `/` | — |

Instituições logadas veem o painel (`DashboardInstituicao`) na Home.

## Funcionalidades

- **Autenticação:** login e cadastro de doador, sessão com token JWT e encerramento automático quando o token expira.
- **Inatividade:** a sessão é encerrada após 15 minutos sem interação, com aviso 3 minutos antes. A espera de um PIX conta como atividade, e a atividade é compartilhada entre abas.
- **Redefinição de senha** por e-mail.
- **Perfil:** edição de dados, troca de senha e desativação da conta.
- **Doação monetária:** escolha da instituição, do método e do valor, com a taxa estimada do Mercado Pago exibida no campo de valor (PIX 0,99% e cartão 4,98%, configuráveis em `utils/taxas.ts`).
- **Cartão:** campos seguros do SDK do Mercado Pago (iframes); os dados do cartão nunca passam pelo nosso código, só o token.
- **PIX:** QR Code e Copia e Cola, com consulta do pagamento a cada 5 segundos.
- **Histórico:** busca, filtro "Ocultar doações canceladas", status, feedback, recorrência, repetir ou retentar uma doação e reabrir o QR Code de um PIX pendente até vencer.

## Tecnologias

| Tecnologia | Versão | Descrição |
|---|---|---|
| React | 19 | Biblioteca para construção de interfaces |
| React Router | 7 | Roteamento e rotas protegidas |
| TypeScript | 6.0 | Superset tipado do JavaScript |
| Vite | 8.0 | Bundler e servidor de desenvolvimento |
| @mercadopago/sdk-js | 0.0.x | Campos seguros de cartão do Mercado Pago |
| qrcode.react | 4.x | QR Code do PIX |
| ESLint | 9 | Análise estática do código |

## Estrutura do projeto

```
src/
├── assets/                  # imagens e logos
├── auth/                    # sessão e segurança
│   ├── AuthContext.tsx      # AuthProvider: sessão, expiração do token e inatividade
│   ├── AvisoInatividade.tsx # aviso "Sua sessão vai expirar"
│   ├── RotaProtegida.tsx    # exige login
│   ├── RotaAnonima.tsx      # só para quem não está logado
│   ├── Sair.tsx             # rota /sair
│   ├── atividade.ts         # evento de atividade (ex.: espera do PIX)
│   ├── auth_storage.ts      # leitura e escrita da sessão no navegador
│   ├── useAuth.ts           # hook de acesso à sessão
│   └── useInatividade.ts    # contagem de inatividade
│
├── components/              # componentes globais reutilizáveis
│   ├── BarraBusca/  BarraProgresso/  Botao/  CampoTexto/
│   ├── IconePagamento/  InstituicaoCard/  MenuDropdown/
│   ├── ModalConfirmacao/  ModalInstituicao/  NavBar/  Rodape/
│   └── TaxaMercadoPago/     # taxa estimada e explicação
│
├── hooks/
│   ├── useAcompanharPagamento.ts  # consulta o pagamento a cada 5 s
│   ├── useCartaoSeguro.ts         # campos seguros do cartão
│   ├── useHistoricoDoacoes.ts     # histórico de doações
│   ├── useInstituicoes.ts         # lista de instituições
│   ├── usePerfil.ts               # dados do perfil
│   ├── useIsMobile.ts  useScrollToTop.ts
│
├── pages/
│   ├── Home/  Login/  Cadastro/  EsqueciSenha/  RedefinirSenha/
│   ├── Doacoes/             # etapas: instituição, método, detalhes e confirmação
│   ├── Historico/           # CardDoacao e ModalPixPendente
│   ├── Perfil/
│   └── DashboardInstituicao/
│
├── services/                # comunicação com a API
│   ├── apiClient.ts         # cliente HTTP único (token e tratamento do 401)
│   ├── authService.ts  usuariosService.ts  instituicoesService.ts
│   ├── doacoesService.ts
│   └── mercadoPagoService.ts
│
├── types/domain.ts          # tipos de domínio
├── utils/                   # datas, filtroBusca, formatacao, moeda, taxas, validacao
├── App.tsx                  # rotas
├── main.tsx
└── index.css
```

## Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/) v20 ou superior
- npm (já incluído com o Node.js)
- Backend em execução (veja o [README da raiz](../README.md#como-rodar-modo-desenvolvimento))

### Instalação

```bash
cd frontend
npm install
copy .env.example .env
```

### Variáveis de ambiente (`frontend/.env`)

| Variável | Exemplo | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api/v1` | Endereço da API |
| `VITE_MP_PUBLIC_KEY` | `TEST-...` | Chave **pública** do Mercado Pago (necessária para doar com cartão) |

O Vite só lê o `.env` ao iniciar: depois de alterar uma variável, reinicie o `npm run dev`.

### Comandos

```bash
npm run dev       # servidor de desenvolvimento com HMR (http://localhost:5173)
npm run build     # verificação de tipos (tsc) e build de produção
npm run preview   # pré-visualiza o build localmente
npm run lint      # análise com ESLint
```

## Convenções

- Funções, variáveis e arquivos de utilitários em `snake_case`; componentes em `PascalCase`; constantes em `UPPER_SNAKE_CASE`.
- Chamadas à API passam sempre por `services/apiClient.ts`.
- Dados sensíveis de cartão nunca são lidos nem armazenados pelo frontend.

## Próximos passos

- Telas de cadastro de instituição e painel da instituição.
- Doação de produtos e necessidades das instituições.
- Feedback das instituições e motivo de cancelamento nos cards do histórico.
- Página de termos de uso e exclusão de conta.
- Testes automatizados do frontend.