# REDE — Integração Front ↔ Backend (design)

**Data:** 2026-10-01
**Status:** aprovado em conversa, aguardando revisão da spec escrita
**Repositórios:** `RedeStore-FrontEnd` (este) e `RedeStore-BackEnd` (somente leitura — nenhuma mudança nele)

## 1. Objetivo

Substituir a camada de dados mockada do front (mock-stores + `mockLatency`) por chamadas HTTP reais à
API .NET do `RedeStore-BackEnd`, para permitir testes ponta a ponta do site com dados reais
(PostgreSQL local). Ao final, todas as telas existentes (Fundação, Loja, Eventos, Admin) funcionam
contra a API, e o fluxo de recuperação de senha fica completo.

### Critérios de sucesso

- Nenhum serviço de `core/` importa mock-store ou `mockLatency`; esses arquivos não existem mais.
- Login/cadastro devolvem e persistem um JWT; toda requisição autenticada envia `Authorization: Bearer`.
- Os fluxos do roteiro manual (seção 9) passam com a API rodando em `http://localhost:5052`.
- Erros de negócio do backend aparecem nas telas como mensagens específicas (seção 6).

### Fora de escopo

- Qualquer mudança no repositório do backend.
- Upload de imagem (admin continua digitando URL), gateway de pagamento, paginação.
- Refresh token (o backend não tem; JWT dura 8 h).
- Configuração de deploy/produção além de um `environment.prod.ts` placeholder.
- CI/CD.

## 2. Contexto e referências

- Backend: .NET 10 Minimal APIs + EF Core + PostgreSQL 17, JWT HS256, erros em ProblemDetails.
- Referência dos endpoints: `RedeStore-BackEnd/docs/API.md` e `RedeStore-BackEnd/docs/openapi.json`
  (28 operações, conferidas — batem entre si).
- CORS do backend já libera `http://localhost:4200` (`Cors:AllowedOrigin`).
- JSON em camelCase; enums em minúsculas, idênticos aos tipos do front (`'camisetas'`, `'em_preparo'`,
  `'confirmada'`, `'jovem'`/`'admin'`...). IDs são GUID (string) — compatível com `id: string`.

## 3. Decisões

| # | Decisão | Alternativas descartadas |
|---|---|---|
| D1 | **Mocks substituídos de vez** — serviços só usam `HttpClient`; mock-stores e `mock-latency.ts` removidos | Alternar mock/HTTP por ambiente (duplica cada serviço); remover depois |
| D2 | **Serviços continuam baseados em `Promise`** (`firstValueFrom(http...)`), mesmas assinaturas sempre que o backend permite | Migrar para Observables (reescreve ~25 telas); cliente gerado do OpenAPI (dependência nova + camada adaptadora) |
| D3 | **`environment.apiUrl` com URL direta** (`http://localhost:5052`), usando o CORS do backend | Proxy do `ng serve` (backend não tem prefixo `/api`; produção exigiria outra solução) |
| D4 | **Erros HTTP viram `Error(código)`** onde código = `ProblemDetails.title` — mesmo contrato que as telas já usam com o mock | Expor `HttpErrorResponse` às telas |
| D5 | **Seed por script SQL** rodado manualmente; contas criadas pela tela de cadastro e promovidas por e-mail | Criação manual pelo painel; seeder no backend (fora do repo) |
| D6 | Escopo extra incluído: tela Redefinir senha, mensagens de erro novas, tratamento de 401, correção de fuso no `EventoForm` | — |

## 4. Arquitetura

```
Tela ──await──► Serviço (core/*) ──firstValueFrom──► HttpClient
                                                      │
                                         authInterceptor (Bearer + 401)
                                                      │
                                                      ▼
                                          API  http://localhost:5052
Erros: HttpErrorResponse ──paraErroApi()──► Error('ESTOQUE_INSUFICIENTE') ──► tela decide mensagem
```

### 4.1 Infra (`src/environments/`, `core/api/`)

- **`src/environments/environment.ts`**: `export const environment = { apiUrl: 'http://localhost:5052' };`
- **`src/environments/environment.prod.ts`**: mesmo formato, `apiUrl` placeholder (`''` com comentário
  indicando que deve ser preenchido no deploy). `angular.json` ganha `fileReplacements` na configuração
  `production`.
- **`core/api/api-error.ts`** — `paraErroApi(erro: unknown): Error`:
  - `HttpErrorResponse` com `status === 0` → `Error('SEM_CONEXAO')`
  - corpo com `errors` (ValidationProblem, 400) → `Error('VALIDACAO')`
  - corpo com `title` string → `Error(title)` (ex.: `EMAIL_EM_USO`, `TOKEN_INVALIDO`)
  - `401` sem corpo → `Error('NAO_AUTENTICADO')`; `403` sem corpo → `Error('ACESSO_NEGADO')`;
    `404` sem corpo → `Error('NAO_ENCONTRADO')`
  - qualquer outro → `Error('ERRO_INTERNO')`
- **`core/api/api.ts`** — helper usado por todos os serviços:
  `async function requisitar<T>(obs: Observable<T>): Promise<T>` = `firstValueFrom(obs)` com
  `catch → throw paraErroApi(e)`. Mais a constante `API = environment.apiUrl`.
- **`core/api/auth.interceptor.ts`** (funcional, `HttpInterceptorFn`):
  - Lê o token de `SessaoStore` (ver 4.2) e adiciona `Authorization: Bearer <token>` se existir e a
    URL começar com `environment.apiUrl`.
  - Se a resposta for `401` **e** havia token **e** a URL não é `/auth/login` nem `/auth/cadastro`:
    limpa a sessão (via `AuthService.encerrarSessaoExpirada()`), navega para `/login`, e repropaga o erro.
- **`app.config.ts`**: adiciona `provideHttpClient(withInterceptors([authInterceptor]))`.

### 4.2 Sessão e Auth

- Para evitar dependência circular (interceptor → `AuthService` → `HttpClient` → interceptor), o
  token fica num store mínimo **`core/auth/sessao.store.ts`** (`providedIn: 'root'`, sem dependências):
  sinal `{ usuario, token } | null`, persistido em `localStorage` na chave `rede_sessao` (a chave
  antiga `rede_sessao_usuario` é ignorada/removida ao carregar — sessão mock antiga não tem token).
- **`AuthService`** passa a ler `usuarioAtual` desse store (API pública das telas inalterada:
  `usuarioAtual`, `estaAutenticado`, `isAdmin`).

| Método | Antes (mock) | Depois |
|---|---|---|
| `login(email, senha)` | busca em `USUARIOS_MOCK` | `POST /auth/login` → salva `{usuario, token}` |
| `cadastrar(dados)` | push em mock | `POST /auth/cadastro` → salva `{usuario, token}` |
| `atualizarPerfil(dados)` | merge local | `PATCH /auth/perfil` → atualiza usuário na sessão (token mantido) |
| `buscarPorId(id)` | busca mock | `GET /usuarios/{id}`; `NAO_ENCONTRADO`/`ACESSO_NEGADO` → `undefined` |
| `recuperarSenha(email)` | no-op | `POST /auth/recuperar-senha` |
| `redefinirSenha(token, novaSenha)` | — (novo) | `POST /auth/redefinir-senha` |
| `validarSessao()` | — (novo) | se há token: `GET /auth/me` e atualiza usuário; chamado uma vez no bootstrap via `provideAppInitializer` **sem bloquear** (fire-and-forget) |
| `encerrarSessaoExpirada()` | — (novo) | mesmo efeito de `logout()` (usado pelo interceptor) |
| `logout()` | limpa sessão + carrinho + último pedido | igual |

### 4.3 Modelos

- `Evento` ganha `vagasRestantes: number` (vem calculado da API).
- `Variacao` ganha `id?: string` (vem da API; opcional para o formulário do admin continuar criando sem id).
- `Usuario.telefone` pode vir `null` da API → tipo `telefone?: string | null`.
- `Pedido.endereco` pode vir `null` → `endereco?: Endereco | null`.
- `Pedido.itens` continua `ItemCarrinho[]` (o `ItemPedidoDto` tem os mesmos campos menos
  `estoqueDisponivel`, que já é opcional).
- `ResultadoInscricao`: inalterado (`criada` | `ja_inscrito` | `esgotado`), mapeado do
  `ResultadoInscricaoDto`.

### 4.4 Serviços de domínio

**`ProductService`** (assinaturas inalteradas)
- `listar(filtro)` → `GET /produtos?categoria=&busca=` (só envia params definidos/não vazios)
- `listarDestaques()` → `GET /produtos/destaques`
- `buscarPorId(id)` → `GET /produtos/{id}`; `NAO_ENCONTRADO`/`PRODUTO_NAO_ENCONTRADO` → `undefined`
- `criar(dados)` → `POST /produtos` com `{nome, categoria, preco, descricao, fotos, destaque, variacoes:[{tamanho,cor,estoque}]}` — **não envia** `tamanhos`/`cores`/`id`s
- `atualizar(id, dados)` → `PATCH /produtos/{id}` com o mesmo filtro de campos
- `remover(id)` → `DELETE /produtos/{id}`

**`EventService`** (assinaturas inalteradas)
- `listar()` → `GET /eventos`; `buscarPorId` → `GET /eventos/{id}` (404 → `undefined`)
- `criar`/`atualizar` → `POST`/`PATCH` sem enviar `id`/`vagasRestantes`; `remover` → `DELETE`

**`RegistrationService`** (assinaturas mudam)
| Antes | Depois |
|---|---|
| `inscrever({eventoId, usuarioId, valorPago, vagasTotais})` | `inscrever(eventoId)` → `POST /eventos/{eventoId}/inscricoes` |
| `listarPorUsuario(usuarioId)` | `listarMinhas()` → `GET /usuarios/me/inscricoes` |
| `listarPorEvento(eventoId)` | igual → `GET /eventos/{eventoId}/inscricoes` |
| `cancelar(id)` | igual → `PATCH /inscricoes/{id}/cancelar` |
| `vagasRestantes(eventoId, vagasTotais)` | `vagasRestantes(eventoId)` → `GET /eventos/{id}/vagas-restantes` |

**`OrderService`** (assinaturas mudam)
| Antes | Depois |
|---|---|
| `criar({usuarioId, itens, formaEntrega, endereco})` | `criar({itens, formaEntrega, endereco})` → `POST /pedidos` com `itens: [{produtoId, tamanho, cor, quantidade}]`; mantém `ultimoPedido.set(pedido)` |
| `listarPorUsuario(usuarioId)` | `listarMeus()` → `GET /usuarios/me/pedidos` |
| `listarTodos()` | igual → `GET /pedidos` |
| `atualizarStatus(id, novoStatus)` | `avancarStatus(id)` → `PATCH /pedidos/{id}/avancar-status` |

`proximoStatus()` em `pedido.model.ts` continua existindo (a tela de Admin usa para rotular o botão).

**`CartService`**: inalterado (carrinho segue local).

**Removidos:** `auth-mock-store.ts`, `product-mock-store.ts`, `event-mock-store.ts`,
`order-mock-store.ts`, `registration-mock-store.ts`, `core/mock/mock-latency.ts`.

## 5. Telas

| Tela | Mudança |
|---|---|
| Perfil | `listarMeus()` / `listarMinhas()` no lugar de `listarPorUsuario(id)` |
| Loja › Meus pedidos | `listarMeus()` |
| Loja › Checkout | `criar()` sem `usuarioId`; mensagens de erro (seção 6) |
| Eventos › Agenda | usa `evento.vagasRestantes` direto; remove as N chamadas a `vagasRestantes` |
| Eventos › Detalhes | `vagasRestantes` do próprio evento; `listarMinhas()` quando logado |
| Eventos › Confirmação | `inscrever(evento.id)` |
| Eventos › Minhas inscrições | `listarMinhas()` |
| Admin › Eventos | contagem de inscritos = `vagasTotais - vagasRestantes` do evento; mensagens de erro em salvar/remover |
| Admin › EventoForm | **fix de fuso**: pré-preenchimento converte o ISO UTC para `YYYY-MM-DDTHH:mm` **local** (hoje faz `slice(0,16)` do UTC); envio continua `new Date(local).toISOString()` |
| Admin › ProdutoForm | **sem mudança** — continua emitindo `tamanhos`/`cores`; o `ProductService` (fronteira HTTP) descarta esses campos ao montar o corpo (4.4) |
| Admin › Pedidos | `avancarStatus(id)`; mensagem para `PEDIDO_EM_ESTADO_FINAL` |
| Admin › Inscrições | sem mudança de assinatura |
| Auth › Login | sem mudança (já trata qualquer erro como credencial inválida); adiciona mensagem própria para `SEM_CONEXAO` |
| **Auth › Redefinir senha (nova)** | ver 5.1 |

### 5.1 Tela Redefinir senha

- Rota pública `/redefinir-senha` em `auth.routes.ts`, lazy, componente `RedefinirSenha` em
  `features/auth/redefinir-senha/`.
- Lê `token` da query string (`withComponentInputBinding` já está ligado → `token = input<string>()`).
- Sem token → estado de erro "Link inválido" com link para `/recuperar-senha`.
- Formulário: `novaSenha` + `confirmarSenha`, validadores existentes `senhaForte()` e
  `senhasIguais()`; reaproveita `TextField`, `Button` e o layout/SCSS de `RecuperarSenha`.
- Sucesso (`204`) → estado de sucesso com botão para `/login`.
- `TOKEN_INVALIDO` → "Esse link expirou ou já foi usado" + link para pedir outro.
- Visual: aplicar a skill `frontend-design` dentro dos tokens existentes (sem tokens novos).

## 6. Mapa de erros por tela

| Código | Tela | Mensagem (tom do projeto) |
|---|---|---|
| `SEM_CONEXAO` | qualquer submit | "Não conseguimos falar com o servidor. Confere sua conexão e tenta de novo." |
| `EMAIL_EM_USO` | Cadastro, Perfil | (já existe no cadastro; adicionar no perfil) |
| `ESTOQUE_INSUFICIENTE` | Checkout | "Algum item do carrinho acabou de esgotar. Revisa as quantidades e tenta de novo." |
| `PRODUTO_NAO_ENCONTRADO` / `VARIACAO_NAO_ENCONTRADA` | Checkout | "Um dos produtos do carrinho não está mais disponível." |
| `EVENTO_COM_INSCRICOES_CONFIRMADAS` | Admin › Eventos (remover) | "Esse evento tem inscrições confirmadas. Cancele-as antes de remover." |
| `EVENTO_VAGAS_TOTAIS_INSUFICIENTES` | Admin › Eventos (salvar) | "O total de vagas não pode ficar abaixo das inscrições já confirmadas." |
| `PEDIDO_EM_ESTADO_FINAL` | Admin › Pedidos | "Esse pedido já foi finalizado." (e recarrega a lista) |
| `TOKEN_INVALIDO` | Redefinir senha | ver 5.1 |
| `VALIDACAO` | formulários | "Algum campo não passou na validação do servidor. Confere os dados." |

Telas que hoje não mostram erro (ex.: Admin › Pedidos) ganham uma linha de erro simples no mesmo
padrão visual de `erroGeral` já usado em Login/Checkout.

## 7. Seed de desenvolvimento

**Arquivo:** `docs/backend/seed-dev.sql` (neste repositório).

Fatos do schema (EF Core, migrations do backend):
- Tabelas com aspas e PascalCase: `"Usuarios"`, `"Produtos"`, `"Variacoes"`, `"Eventos"`.
- **Enums são gravados pelo nome C#** (`HasConversion<string>()`): `'Admin'`/`'Jovem'`,
  `'Camisetas'`/`'Moletons'`/`'Acessorios'` — diferente do JSON, que usa minúsculas.
- `"Produtos"."Fotos"` é `text[]`; ids são `uuid` (usar `gen_random_uuid()`); `"Eventos"."DataHora"`
  é `timestamptz` (UTC).
- Senha usa o `PasswordHasher` do ASP.NET Identity — **não dá para criar usuário por SQL**.

Conteúdo do script (idempotente, dentro de `BEGIN/COMMIT`):
1. `UPDATE "Usuarios" SET "Papel" = 'Admin' WHERE lower("Email") = 'admin@rede.com';`
2. Inserção dos 7 produtos + variações equivalentes ao antigo `product-mock-store.ts`, só se
   `"Produtos"` estiver vazia.
3. Inserção dos 6 eventos equivalentes ao antigo `event-mock-store.ts` com datas **futuras**
   (relativas a `now()`, ex.: `now() + interval '10 days'`), só se `"Eventos"` estiver vazia.

Colunas (do `RedeStoreDbContextModelSnapshot`): `"Produtos"(Id, Nome, Categoria, Preco, Descricao,
Fotos, Destaque)`, `"Variacoes"(Id, ProdutoId, Tamanho, Cor, Estoque)`, `"Eventos"(Id, Titulo,
Descricao, DataHora, Local, Preco, VagasTotais, Foto)`, `"Usuarios"(…, Email, Papel)`.

## 8. Testes automatizados

- Specs de serviço reescritas com `provideHttpClient()` + `provideHttpClientTesting()` +
  `HttpTestingController`: verificam método, URL, query params, corpo enviado e mapeamento de erro.
- Specs novas: `api-error.spec.ts`, `auth.interceptor.spec.ts`, `sessao.store.spec.ts`,
  `redefinir-senha.spec.ts`.
- Specs de tela: só ajustam mocks de serviço onde a assinatura mudou (seções 4.4/5).
- Specs que importavam mock-stores diretamente são adaptadas para fixtures locais.
- Política de execução (preferência do usuário): cada task faz seu ciclo TDD focado; **sem suíte
  completa, build ou reviewer por task** sem pedido explícito.

## 9. Roteiro de teste manual

**Arquivo:** `docs/backend/roteiro-integracao.md`.

1. Backend: `docker compose up -d db`, user-secrets conforme README do backend (incluindo
   `Frontend:ResetPasswordUrl = http://localhost:4200/redefinir-senha` e uma chave Resend válida
   para testar o e-mail), `dotnet run`. Conferir `GET http://localhost:5052/health`.
2. Front: `npm start` → `http://localhost:4200`.
3. Cadastrar `admin@rede.com` e `jovem@rede.com` pela tela (senha 8+ caracteres).
4. Rodar o seed: `docker compose exec -T db psql -U postgres -d redestore < <caminho>/seed-dev.sql`.
5. Fazer logout/login com `admin@rede.com` (o papel fica gravado no token).
6. Checklists por fluxo: Loja (vitrine, filtro, detalhe, carrinho, checkout retirada/entrega,
   estoque insuficiente, meus pedidos), Eventos (agenda, detalhe, inscrição, esgotado, cancelar),
   Admin (CRUD produto, CRUD evento com edição de data, inscrições, avançar pedido até estado final),
   Conta (perfil, recuperar/redefinir senha, sessão expirada simulada apagando/alterando o token).

## 10. Entrega e git

- Commitar no `main`: esta spec, o plano, e `docs/backend/2026-08-26-rede-backend-requisitos.md`
  (hoje untracked). A mudança de `analytics` no `angular.json` **não** entra.
- Implementação na branch normal `feature/rede-integracao-backend` (sem worktree), push + PR via
  compare URL, merge pelo usuário no GitHub.
- README do front atualizado com a seção "Rodando com o backend".

## 11. Riscos

- **Datas antigas dos mocks** ficariam no passado → seed usa datas relativas a `now()`.
- **Papel no token**: promover a admin exige novo login — documentado no roteiro.
- **N+1 no Admin** (`buscarPorId` por usuário em Pedidos/Inscrições) continua; aceitável para o
  volume de teste, registrado como melhoria futura.
- **Cores com caixa diferente** (`'Preto'` vs `'preto'`): checkout compara exato no backend — o
  carrinho usa o valor vindo do próprio produto da API, então é consistente.
