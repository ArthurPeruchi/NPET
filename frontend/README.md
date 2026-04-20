# NPET — Núcleo de Proteção e Engajamento para Tutores

> **"Por trás de cada doação, um focinho feliz."**

O NPET é uma plataforma digital que conecta doadores a ONGs e instituições parceiras de proteção animal, facilitando contribuições financeiras e físicas de forma simples, transparente e acessível.

---

## 📋 Sobre o Projeto

O NPET é um projeto acadêmico desenvolvido no curso de Engenharia de Software da UniEVANGÉLICA, em Anápolis - GO. A plataforma tem como objetivo resolver a dificuldade de conexão entre pessoas que desejam ajudar animais em situação de vulnerabilidade e as instituições que os acolhem, oferecendo um canal centralizado para doações monetárias e físicas, agendamento de visitas e acompanhamento transparente do uso das contribuições.

### Funcionalidades previstas

- Cadastro e autenticação de usuários doadores e instituições parceiras
- Visualização de instituições parceiras e suas necessidades prioritárias
- Realização de doações financeiras (PIX e cartão) e físicas (com agendamento de visita)
- Histórico de doações com status e feedback das instituições
- Publicação de prestação de contas pelas instituições
- Sistema de avaliações e suporte ao usuário

---

## 🖥️ Protótipos

Os protótipos da interface foram desenvolvidos no Figma e estão disponíveis nos links abaixo:

- **Desktop (Wireframe + Hi-Fi):** [Projeto NPET — Desktop](https://www.figma.com/design/38NAOxWGvT52AtsqFvCz6l/Projeto-NPET?node-id=0-1&p=f&t=ixDFyp1U1it1eMRK-0)
- **Mobile (Hi-Fi):** [Projeto NPET — Versão Mobile](https://www.figma.com/design/bg8Ykc4vs30HpZiqTp3duV/Projeto-NPET---Versão-Mobile?node-id=162-2453&p=f&t=rTs8vIctY6AQUtTB-0)

---

## 🛠️ Tecnologias

### Frontend
| Tecnologia | Versão | Descrição |
|---|---|---|
| React | 19 | Biblioteca para construção de interfaces |
| TypeScript | 6.0 | Superset tipado do JavaScript |
| Vite | 8.0 | Bundler e servidor de desenvolvimento |

### Backend *(planejado)*
| Tecnologia | Descrição |
|---|---|
| Python + FastAPI | API REST do servidor |
| PostgreSQL | Banco de dados relacional |
| JWT + OAuth 2.0 | Autenticação e autorização |
| Mercado Pago API | Processamento de pagamentos (PIX e cartão) |

---

## 📁 Estrutura do Projeto

```
src/
├── assets/
│   ├── logos-mockadas-instituicoes/   # Logos das instituições parceiras
│   ├── imagem-heroi.avif              # Imagem de destaque da Home
│   └── logoNpet.png                   # Logo do NPET
│
├── components/                        # Componentes globais reutilizáveis
│   ├── Botao/
│   ├── InstituicaoCard/
│   ├── NavBar/
│   └── Rodape/
│
├── pages/
│   └── Home/
│       └── sections/                  # Seções da página inicial
│           ├── BannerHeroi/
│           ├── CTAFinal/
│           ├── Instituicoes/
│           ├── ProvaSocial/
│           └── Sobre/
│
├── App.tsx
├── App.css
├── main.tsx
└── index.css
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) v20 ou superior
- npm (já incluído com o Node.js)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/ArthurPeruchi/NPET.git

# Entre na pasta do projeto
cd NPET

# Instale as dependências
npm install
```

### Desenvolvimento

```bash
# Inicia o servidor de desenvolvimento com HMR
npm run dev
```

Acesse **http://localhost:5173** no navegador.

### Build para produção

```bash
# Gera a versão otimizada para produção
npm run build

# Pré-visualiza o build localmente
npm run preview
```

---

## 👥 Equipe

| Nome | Função |
|---|---|
| Arthur Gabriel Peruchi Trindade | Product Designer e Desenvolvedor Frontend |
| Guilherme Quaglio e Silva | Desenvolvedor Full Stack |
| Luana Silva Freitas | Desenvolvedor Backend |
| Matheus Antônio da Silva | Desenvolvedor Backend |

**Orientadores:** Luan Cardoso de Jesus e Eder José Almeida da Silva

---

## 🏫 Instituição

Desenvolvido na **Universidade Evangélica de Goiás — UniEVANGÉLICA**  
Curso de Engenharia de Software — Anápolis, GO  
© 2026 NPET. Projeto acadêmico.
