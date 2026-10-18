Assessment: Request changes — medium/high risk

PR #2 introduces PostgreSQL persistence, JWT authentication, Alembic migrations, and frontend API consumption. The overall direction is reasonable, but I found two important correctness issues before merge. The PR has 54 changed files (+1,847/−519); CI status was not available from the data retrieved.
What changed

    Replaced hardcoded login credentials with PostgreSQL/SQLAlchemy repositories.
    Added bcrypt password hashing and JWT authentication.
    Added Alembic schema with users, institutions, donations, needs, and social networks.
    Added protected institution-listing endpoints.
    Moved institution mock data from the frontend to a backend mock repository.
    Updated frontend institution screens to fetch data through the API.
    Added security-focused tests.

Blocking issues

    Institution registration never creates an Instituicao record. InstitutionAuthService.register() only inserts a Usuario, even though the database model separates usuarios and instituicoes, and the endpoint is documented as registering an institution. As a result, a newly registered institution has no profile row, cannot appear in the institution domain, and its id_usuario is never associated with an institution. Either create the corresponding Instituicao in the same transaction or explicitly scope this endpoint to account creation only and add a separate institution-profile creation flow.
    backend/app/modules/auth/instituicoes/service.py:23-38
    Diff

    -        usuario = Usuario(
    -            nome=data.nome,
    -            email=data.email,
    -            senha=hash_password(data.senha),
    -            telefone=data.telefone,
    -            cpf=data.cpf,
    -            tipo_usuario=data.tipo_usuario,
    -        )
    -        return self._repository.create(usuario)
    +        usuario = Usuario(...)
    +        # Also create Instituicao(id_usuario=usuario.id_usuario, ...)
    +        # in the same transaction, or change the endpoint contract.
    +        return self._repository.create(usuario)

    The frontend now requires authentication to render the institution listing, but the 401 handler redirects to / unconditionally. Home/Instituicoes.tsx consumes this service, so if the home page is accessible before login, an unauthenticated visit can produce a 401, redirect back to /, reload the same page, and repeat indefinitely. The service should either use a public endpoint, render the section only after authentication, or redirect to the actual login route while preventing redirect loops.
    frontend/src/services/instituicoesService.ts:15-20
    Diff

    -        window.location.href = "/";
    +        window.location.href = "/login";

    More importantly, the endpoint visibility and frontend behavior should be made consistent: public institution browsing should not require a bearer token, while private pages should handle authentication at the route level.

Additional review comments

    The new database models are not used by the institution listing. The PR adds a complete Instituicao ORM model and migration, but GET /instituicoes still returns fake_db.py. This means the application can create database users while showing unrelated static institutions, and changes made to the database will not be visible in the UI. If this is intentionally incremental, the API/PR description should clearly state that the listing remains mock-backed; otherwise, migrate this repository before merging the frontend integration.
    backend/app/modules/instituicoes/repository.py:1-21

    The test suite does not cover the institution-registration contract. Add a test that registers an institution and verifies both the Usuario and Instituicao records—or, if the endpoint is intentionally account-only, assert and document that behavior. The current tests only validate authentication and static institution listing.
    backend/test/test_seguranca.py

    bcrypt’s byte-length limit is not handled. UsuarioCreate allows 72 characters, but bcrypt limits passwords to 72 bytes; passwords containing multibyte UTF-8 characters can exceed that limit and cause bcrypt.hashpw() to raise ValueError, producing a 500 response. Validate the UTF-8 byte length explicitly or normalize/reject such passwords with a 422 response.
    backend/app/core/security.py

    The frontend service sends Authorization: Bearer null when no token exists. Although the backend eventually returns 401, omit the header when there is no token. This makes requests more conventional and avoids confusing proxy/auth middleware behavior.
    frontend/src/services/instituicoesService.ts:10-12

Merge readiness

    Architecture: reasonable separation between router, service, repository, ORM, and migration layers.
    Security: substantially improved over the previous hardcoded credentials, but token lifetime should be reduced as already noted in the existing PR comments.
    Data consistency: currently the largest concern; institution authentication data and institution profile data are disconnected.
    Frontend behavior: needs clarification around whether institution browsing is public or authenticated.
    Testing: useful initial security coverage, but insufficient coverage for registration, migrations, database persistence, and frontend/API compatibility.
    CI: no check results were available, so the test suite should be run explicitly before approval.

Want me to…

    Review the institution registration and ORM flow in detail and propose a concrete fix.
    Audit the JWT/authentication changes for security issues.
    Review the frontend API integration and identify all route, token, and response-shape problems.

Outra questão: há endpoints separados para logar como doador e logar como instituição? Se sim, o correto deve ser um único endpoint para logar, com redirecionamento conforme a role do usuário
Gathered additional information

Scope: endpoints de autenticação (backend/app/modules/auth/usuarios/router.py e backend/app/modules/auth/instituicoes/router.py)
Text

Atualmente existem dois endpoints JSON para login: `POST /users/auth/login` e `POST /institutions/auth/login`. Como ambos autenticam registros da mesma tabela `usuarios` e retornam o mesmo formato de JWT, acredito que deveríamos expor um único endpoint, por exemplo `POST /auth/login`.

Esse endpoint pode autenticar o usuário, incluir a role/tipo no retorno (e idealmente também no JWT) e deixar o frontend redirecionar para o fluxo correto:

- `doador` → área de doador;
- `instituicao` → área de instituição.

Também seria importante que a role viesse do banco, e não do tipo de login escolhido pelo cliente. Assim evitamos duplicação entre os services e impedimos que o frontend trate a role selecionada localmente como fonte de autorização.

O endpoint `/users/auth/token` já segue parcialmente essa ideia ao aceitar usuários e instituições; seria melhor padronizar também o login JSON em torno de um único fluxo.

Why this matters

Sim, a PR cria endpoints separados:

    POST /api/v1/users/auth/login
    POST /api/v1/institutions/auth/login

Além deles, existe POST /api/v1/users/auth/token, usado pelo Swagger/OAuth2, que já autentica ambos os tipos.

Unificar os endpoints reduz duplicação e torna o fluxo mais consistente. O ponto principal é que redirecionamento é responsabilidade do frontend, mas a role deve ser determinada pelo backend. Atualmente o frontend salva role com base na opção escolhida no formulário de login, enquanto o JWT contém apenas sub; isso pode gerar inconsistência entre o papel escolhido pelo cliente e o papel real armazenado no banco.
quais arquivos que precisam ser alterados no backend para ser um único login?
Using results of get file and 5 other tool calls

Para transformar o login em um único endpoint no backend, os arquivos principais são estes:
Arquivos que precisam ser alterados
1. backend/app/modules/auth/usuarios/router.py

Transformar o endpoint atual:
Text

POST /users/auth/login

em um endpoint comum, por exemplo:
Text

POST /auth/login

Esse router deve continuar expondo:

    POST /auth/login para login JSON;
    POST /auth/token para o formulário OAuth2/Swagger;
    possivelmente POST /users/auth/register para cadastro de doador;
    possivelmente POST /institutions/auth/register para cadastro de instituição.

Exemplo de estrutura:
Python

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(
    data: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    return service.login(data.email, data.senha)


@router.post("/token")
def token(
    form: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(get_auth_service),
):
    return service.login(form.username, form.password)

O endpoint não deve receber tipo_usuario. Ele deve consultar o usuário pelo e-mail e descobrir a role no banco.
2. backend/app/modules/auth/usuarios/service.py

O método login() deve deixar de retornar apenas o token:
Python

return create_access_token(usuario.id_usuario)

Ele deve:

    localizar o usuário pelo e-mail;
    validar a senha;
    gerar o token;
    retornar o token e a role do usuário.

Por exemplo:
Python

def login(self, email: str, senha: str) -> dict[str, str]:
    usuario = self._repository.find_credential(email)

    if usuario is None or usuario.senha is None:
        raise UnauthorizedError("E-mail ou senha inválidos.")

    if not verify_password(senha, usuario.senha):
        raise UnauthorizedError("E-mail ou senha inválidos.")

    return {
        "access_token": create_access_token(
            usuario.id_usuario,
            usuario.tipo_usuario.value,
        ),
        "token_type": "bearer",
        "tipo_usuario": usuario.tipo_usuario.value,
    }

Assim, a resposta pode ser:
JSON

{
  "access_token": "...",
  "token_type": "bearer",
  "tipo_usuario": "doador"
}

ou:
JSON

{
  "access_token": "...",
  "token_type": "bearer",
  "tipo_usuario": "instituicao"
}

3. backend/app/database/schemas.py

Criar um schema específico para a resposta do login. Atualmente o login retorna um dicionário sem response_model.

Adicionar algo como:
Python

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tipo_usuario: TipoUsuario

O LoginRequest existente pode continuar sendo usado:
Python

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

4. backend/app/core/security.py

Alterar a criação do JWT para incluir o tipo do usuário no payload.

Hoje:
Python

def create_access_token(id_usuario: int) -> str:
    return jwt.encode(
        {"sub": str(id_usuario), "exp": expira_em},
        settings.JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

Sugestão:
Python

def create_access_token(id_usuario: int, tipo_usuario: str) -> str:
    payload = {
        "sub": str(id_usuario),
        "tipo_usuario": tipo_usuario,
        "exp": expira_em,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

O backend não deve confiar na role enviada pelo frontend. A role precisa ser obtida de Usuario.tipo_usuario.
5. backend/app/modules/auth/dependencies.py

Esse arquivo deve continuar validando o token, mas pode passar a validar também a role quando necessário.

Por exemplo, futuramente:
Python

def require_instituicao(
    usuario: Usuario = Depends(get_current_user),
) -> Usuario:
    if usuario.tipo_usuario != TipoUsuario.instituicao:
        raise ForbiddenError("Acesso exclusivo para instituições.")

    return usuario

O get_current_user() pode continuar buscando o usuário pelo sub do token. Para autorização, é melhor consultar a role atual no banco, em vez de confiar somente no valor salvo no JWT.
6. backend/app/modules/auth/instituicoes/router.py

Esse arquivo atualmente expõe:
Text

POST /institutions/auth/login

Esse endpoint deve ser removido para evitar dois logins diferentes.

O cadastro de instituição pode permanecer:
Text

POST /institutions/auth/register

Mas o login() desse arquivo deve ser excluído.

Alternativamente, o router pode ser mantido apenas para cadastro:
Python

router = APIRouter(
    prefix="/institutions/auth",
    tags=["institutions-auth"],
)

Com apenas:
Python

@router.post("/register")
def register(...):
    ...

7. backend/app/modules/auth/instituicoes/service.py

Remover o método específico:
Python

def login(self, email: str, password: str) -> str:
    ...

O login de instituições passará a usar o AuthService comum de usuários.

O método register() pode continuar existindo, mas há um ponto importante: atualmente ele cria somente um registro em usuarios. Ele não cria o registro correspondente em instituicoes.
8. backend/app/api/router.py

Atualmente ele inclui os dois routers:
Python

api_router.include_router(auth_router)
api_router.include_router(institutions_auth_router)

Depois da unificação, você deve decidir entre estas opções:
Opção recomendada

Criar um router comum:
Python

from app.modules.auth.router import router as auth_router

api_router.include_router(auth_router)

E manter os routers de cadastro separados, caso necessário.
Opção mínima

Manter usuarios/router.py como router de autenticação comum, mas alterar o prefixo para /auth:
Python

router = APIRouter(prefix="/auth", tags=["auth"])

Nesse caso, remover o endpoint de login de instituicoes/router.py, mas manter o router para /institutions/auth/register.
9. backend/test/test_seguranca.py

Os testes atuais ainda fazem login usando prefixes diferentes:
Python

client.post("/api/v1/users/auth/login", ...)
client.post("/api/v1/institutions/auth/login", ...)

Eles devem passar a usar um único endpoint:
Python

client.post(
    "/api/v1/auth/login",
    json={"email": email, "senha": "senha1234"},
)

Também é importante testar que a role correta foi retornada:
Python

assert resposta.json()["tipo_usuario"] == tipo_usuario

E testar ambos os casos:

    login de usuário doador;
    login de usuário instituicao.

O teste do OAuth2 também deve usar o endpoint comum:
Python

client.post(
    "/api/v1/auth/token",
    data={
        "username": email,
        "password": "senha1234",
    },
)

Arquivos que provavelmente não precisam ser alterados
backend/app/modules/auth/usuarios/repository.py

O repository já busca o usuário apenas pelo e-mail:
Python

select(Usuario).where(Usuario.email == email)

Isso é exatamente o que o login unificado precisa.
backend/app/database/models.py

Não é necessário alterar o model para unificar o login, porque Usuario já possui:
Python

tipo_usuario: Mapped[TipoUsuario]

Migration do Alembic

Também não é necessária uma nova migration apenas para unificar os endpoints. A coluna tipo_usuario já existe no banco.
Resumo da alteração
Arquivo	Alteração
auth/usuarios/router.py	Criar o endpoint único /auth/login
auth/usuarios/service.py	Autenticar qualquer usuário e retornar a role
database/schemas.py	Adicionar LoginResponse
core/security.py	Opcionalmente incluir a role no JWT
auth/dependencies.py	Adicionar dependências de autorização por role
auth/instituicoes/router.py	Remover o login específico; manter cadastro
auth/instituicoes/service.py	Remover o método de login específico
api/router.py	Ajustar os routers incluídos
test/test_seguranca.py	Atualizar testes para um único endpoint

O frontend seria alterado depois para chamar somente:
Text

POST /api/v1/auth/login

e redirecionar conforme tipo_usuario retornado pelo backend.