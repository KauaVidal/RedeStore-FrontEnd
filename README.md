# RedeStore-FrontEnd

Site da REDE — ministério de jovens da Primeira Igreja Batista de Vila Maria. Une loja de produtos (camisetas, moletons, acessórios) e inscrição em eventos (retiros, encontros).

Este repositório está no subprojeto **Fundação**: design system, autenticação (mockada), navegação e as telas base (login, cadastro, recuperar senha, perfil, sobre a REDE). Loja, Eventos e Admin vêm em subprojetos seguintes — veja [Documentação do projeto](#documentação-do-projeto).

## Pré-requisitos

- [Node.js](https://nodejs.org/) 24.x
- npm 11.x (vem junto com o Node)

Verifique o que você tem instalado:

```bash
node -v
npm -v
```

## Como rodar

```bash
# 1. Instalar as dependências
npm install

# 2. Subir o servidor de desenvolvimento
npm start
```

Acesse `http://localhost:4200/` — a página recarrega sozinha a cada alteração salva.

### Login de teste

Não existe backend ainda — a autenticação é mockada em memória (`src/app/core/auth/auth-mock-store.ts`). Use uma dessas contas pra testar o login:

| Papel | E-mail | Senha |
|---|---|---|
| Jovem | `jovem@rede.com` | `jovem123` |
| Admin | `admin@rede.com` | `admin123` |

A sessão fica salva no `localStorage` do navegador — um F5 não desloga. Cadastros feitos pela tela de Cadastro também funcionam, mas somem quando o servidor reinicia (é tudo em memória).

## Comandos do Angular CLI

Os comandos abaixo já estão configurados no `package.json` (rode com `npm run <comando>`, exceto `start`/`test`/`build` que também funcionam sem o `run`):

| Comando | O que faz |
|---|---|
| `npm start` | Sobe o servidor de desenvolvimento (`ng serve`) em `localhost:4200` |
| `npm test` | Roda a suíte de testes (Karma + Jasmine, abre um Chrome de verdade) |
| `npm run build` | Gera o build de produção em `dist/rede-store/` |
| `npm run watch` | Build em modo desenvolvimento, recompilando a cada mudança (sem servidor) |

Outros comandos úteis do `ng` (CLI já instalado como dependência do projeto, use `npx ng ...`):

```bash
# Rodar só um arquivo de teste específico
npx ng test --watch=false --include='**/login.spec.ts'

# Rodar a suíte inteira uma vez só (sem watch, como no CI)
npx ng test --watch=false

# Gerar um componente novo seguindo os padrões do projeto
npx ng generate component features/nome-da-tela --skip-tests

# Ver a versão do Angular/CLI instalada
npx ng version
```

> **Nota:** este projeto é **zoneless** (sem `zone.js` no build de produção/desenvolvimento) — é o padrão desta versão do Angular CLI. O `zone.js` só é carregado durante os testes (`npm test`), pra viabilizar `fakeAsync`/`tick`; não afeta o app rodando de verdade. Se escrever um teste que muda um `input()` signal *depois* do primeiro `detectChanges()`, adicione `await fixture.whenStable();` antes de conferir o resultado — sem isso a atualização pode não refletir a tempo da asserção.

## Estrutura do projeto

```
src/app/
  core/           # AuthService mockado, guards de rota, modelos
  shared/
    ui/           # Componentes reutilizáveis: Logo, Button, TextField, SectionDivider, EmptyState
    validators/   # Validadores de formulário (senha forte, confirmação)
    em-breve/     # Placeholder das rotas ainda não construídas (Loja/Eventos)
  layout/         # Header, BottomNav, Footer e o Shell que os une
  features/
    auth/         # Login, Cadastro, Recuperar senha
    perfil/       # Perfil do usuário
    institucional/ # Sobre a REDE
  app.routes.ts   # Rotas do app
  app.config.ts   # Providers globais (router, etc.)
src/styles/       # Design tokens (cores, tipografia, espaçamento), mixins, parcial de auth
```

### Convenções do projeto

- **Sem sufixo `Component`** nos nomes de classe (`Login`, não `LoginComponent`) — segue o style guide atual do Angular.
- **Signals** para inputs/outputs (`input()`, `output()`) e estado (`signal()`, `computed()`) — sem `@Input()`/`@Output()` decorators, sem NgRx.
- **Cores, fontes e espaçamentos** sempre via custom properties de `src/styles/_tokens.scss` (`var(--rede-yellow)`, `var(--espaco-4)`, etc.) — nunca hexadecimal solto no meio do SCSS.
- **Standalone components** — sem NgModules em lugar nenhum do projeto.

## Documentação do projeto

- [`docs/superpowers/specs/2026-08-24-rede-fundacao-design.md`](docs/superpowers/specs/2026-08-24-rede-fundacao-design.md) — spec de design (paleta, tipografia, telas)
- [`docs/superpowers/plans/2026-08-24-rede-fundacao.md`](docs/superpowers/plans/2026-08-24-rede-fundacao.md) — plano de implementação, task a task
