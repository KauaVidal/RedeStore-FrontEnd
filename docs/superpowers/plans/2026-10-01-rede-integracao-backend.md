# REDE Integração Front ↔ Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a camada de dados mockada do front por chamadas HTTP reais à API .NET do `RedeStore-BackEnd`, com JWT, tratamento de erros por código, tela de redefinir senha e um seed + roteiro para testes manuais.

**Architecture:** Os serviços de `core/` continuam expondo `Promise`s (mesmas assinaturas onde o backend permite) e por dentro usam `HttpClient` via um helper `requisitar()` que converte `HttpErrorResponse` em `Error(código)` — o mesmo contrato que as telas já usam. O token JWT vive num `SessaoStore` sem dependências (evita ciclo interceptor ↔ AuthService); um interceptor funcional injeta o `Bearer` e trata 401. Mock-stores e `mockLatency` são removidos.

**Tech Stack:** Angular 22 (standalone, signals, zoneless), `@angular/common/http` (`provideHttpClient`, `withInterceptors`, `HttpTestingController`), Karma/Jasmine. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-01-rede-integracao-backend-design.md`

## Global Constraints

- **Backend é somente leitura**: nenhuma mudança em `../RedeStore-BackEnd`. Referência de contrato: `../RedeStore-BackEnd/docs/API.md`.
- URL da API em dev: `http://localhost:5052` (via `src/environments/environment.ts`, chave `apiUrl`). Sem proxy.
- Mocks **substituídos de vez**: ao final não existem `*-mock-store.ts` nem `core/mock/mock-latency.ts`.
- Serviços continuam `async`/`Promise` (`firstValueFrom`), nunca expõem `Observable` às telas.
- Erros chegam às telas como `Error(código)`; código = `ProblemDetails.title` (ex.: `ESTOQUE_INSUFICIENTE`), ou um dos sintéticos `SEM_CONEXAO`, `VALIDACAO`, `NAO_AUTENTICADO`, `ACESSO_NEGADO`, `NAO_ENCONTRADO`, `ERRO_INTERNO`.
- Sessão em `localStorage` na chave `rede_sessao` com formato `{ usuario, token }`; a chave antiga `rede_sessao_usuario` é removida ao carregar.
- Convenções do projeto: componentes **sem** sufixo `Component`, serviços **com** sufixo `Service`, signals (`signal`/`computed`/`input`/`output`), textos de UI em português no tom já usado ("Não deu pra… Tenta de novo em instantes.").
- **Padrão de CD em testes (zoneless)**: `ngOnInit` assíncrono → `fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();`. Evento síncrono depois da 1ª renderização → `fixture.detectChanges(); await fixture.whenStable();`.
- Specs de serviço usam `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController`, com `afterEach(() => http.verify())`.
- **Política de execução (preferência do usuário):** cada task roda **só a spec focada** dela (`npx ng test --watch=false --include=<arquivo>`). Sem suíte completa, sem `ng build`, sem reviewer por task, a menos que o usuário peça. Consequência aceita: `src/app/app.routes.spec.ts` fica vermelha entre a Task 3 e a Task 13 (ela é reescrita na Task 13).
- Tokens de design (`src/styles/_tokens.scss`) inalterados — nenhum token novo. Cor de erro: `var(--status-cancel)`.
- **Skill `frontend-design`** obrigatória ao finalizar a tela nova (Task 12) e as linhas de erro novas (Task 10), dentro dos tokens existentes.
- **Pré-condição de git:** o `angular.json` do working tree tem uma linha `"analytics": "…"` não commitada (gerada pelo Angular CLI). Antes da Task 1, o usuário decide: descartar (`git checkout -- angular.json`) ou commitar separado. O plano assume working tree limpo. Trabalhar na branch normal `feature/rede-integracao-backend` criada a partir do `main` (sem worktree).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Refinamento da spec:** `RegistrationService.vagasRestantes()` é **removido** (spec 4.4 o mantinha) — depois desta integração nenhuma tela o usa, pois `Evento.vagasRestantes` já vem da API (YAGNI).
- **Adição à spec:** IDs viram GUID de 36 caracteres; a Task 9 cria `CodigoPedidoPipe` para exibir só os 8 primeiros (`#A1B2C3D4`) em vez do GUID inteiro.

## Review Focus

1. **`ProblemDetails` genérico do ASP.NET** (ex.: `title: "Not Found"` ou `"One or more validation errors occurred."`) não pode virar código de erro — só títulos `^[A-Z_]+$` contam (teste na Task 1).
2. **ID de rota que não é GUID** (`/loja/produto/abc`, `/eventos/1` com links antigos) → backend responde 404 sem corpo; `buscarPorId` deve devolver `undefined`, não lançar (testes nas Tasks 5 e 6).
3. **401 no próprio `/auth/login`** (senha errada) não pode deslogar/redirecionar — tem que chegar na tela como `CREDENCIAIS_INVALIDAS` (teste na Task 4).
4. **Sessão salva pelo mock antigo** (`rede_sessao_usuario`, sem token) não pode deixar o usuário "logado" sem token (teste na Task 2).
5. **Edição de evento sem mexer na data** não pode deslocar o horário pelo fuso (teste na Task 11).

---

## Estrutura de arquivos

```
src/environments/environment.ts, environment.prod.ts          NEW
angular.json                                                   MODIFY — fileReplacements (production)
src/app/app.config.ts                                          MODIFY — HttpClient, interceptor, initializer
src/app/core/api/api-error.ts (+spec)                          NEW — paraErroApi()
src/app/core/api/api.ts (+spec)                                NEW — API, requisitar(), buscarOuIndefinido()
src/app/core/api/mensagem-erro.ts (+spec)                      NEW — mensagemDeErro()
src/app/core/api/auth.interceptor.ts (+spec)                   NEW
src/app/core/auth/sessao.store.ts (+spec)                      NEW
src/app/core/auth/auth.service.ts (+spec)                      MODIFY — HTTP
src/app/core/auth/usuario.model.ts                             MODIFY — telefone null
src/app/core/auth/auth-mock-store.ts                           DELETE
src/app/core/products/product.service.ts (+spec), produto.model.ts   MODIFY
src/app/core/products/product-mock-store.ts                    DELETE
src/app/core/events/event.service.ts (+spec), evento.model.ts  MODIFY
src/app/core/events/event-mock-store.ts                        DELETE
src/app/core/registrations/registration.service.ts (+spec)     MODIFY
src/app/core/registrations/registration-mock-store.ts          DELETE
src/app/core/orders/order.service.ts (+spec), pedido.model.ts  MODIFY
src/app/core/orders/order-mock-store.ts                        DELETE
src/app/core/mock/mock-latency.ts                              DELETE
src/app/shared/pipes/codigo-pedido.pipe.ts (+spec)             NEW
src/app/features/auth/redefinir-senha/*                        NEW
src/app/features/... (telas listadas em cada task)             MODIFY
src/app/app.routes.spec.ts                                     REWRITE
docs/backend/seed-dev.sql, docs/backend/roteiro-integracao.md  NEW
README.md                                                      MODIFY — seção "Rodando com o backend"
```

---

### Task 1: Infra HTTP — environments, `paraErroApi`, `requisitar`

**Files:**
- Create: `src/environments/environment.ts`, `src/environments/environment.prod.ts`
- Modify: `angular.json` (configuração `production` do target `build`)
- Create: `src/app/core/api/api-error.ts`, `src/app/core/api/api-error.spec.ts`
- Create: `src/app/core/api/api.ts`, `src/app/core/api/api.spec.ts`

**Interfaces:**
- Produces: `environment.apiUrl: string`; `paraErroApi(erro: unknown): Error`; `API: string`; `requisitar<T>(obs: Observable<T>): Promise<T>`; `buscarOuIndefinido<T>(obs: Observable<T>): Promise<T | undefined>` (devolve `undefined` quando o código termina em `NAO_ENCONTRADO`).

- [ ] **Step 0: Criar a branch**

```bash
git checkout main
git checkout -b feature/rede-integracao-backend
```

- [ ] **Step 1: Criar os environments**

`src/environments/environment.ts`:
```ts
export const environment = {
  apiUrl: 'http://localhost:5052',
};
```

`src/environments/environment.prod.ts`:
```ts
export const environment = {
  // Preencher com a URL pública da API no momento do deploy.
  apiUrl: '',
};
```

Em `angular.json`, dentro de `projects.rede-store.architect.build.configurations.production`, adicionar (ao lado de `budgets`/`outputHashing`):
```json
"fileReplacements": [
  { "replace": "src/environments/environment.ts", "with": "src/environments/environment.prod.ts" }
],
```

- [ ] **Step 2: Escrever o teste de `paraErroApi` (falhando)**

`src/app/core/api/api-error.spec.ts`:
```ts
import { HttpErrorResponse } from '@angular/common/http';
import { paraErroApi } from './api-error';

function respostaErro(status: number, error: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('paraErroApi', () => {
  it('status 0 (sem resposta do servidor) vira SEM_CONEXAO', () => {
    expect(paraErroApi(respostaErro(0)).message).toBe('SEM_CONEXAO');
  });

  it('ProblemDetails com title em código vira Error(title)', () => {
    const erro = paraErroApi(respostaErro(409, { status: 409, title: 'ESTOQUE_INSUFICIENTE', detail: 'x' }));
    expect(erro.message).toBe('ESTOQUE_INSUFICIENTE');
  });

  it('ValidationProblem (com errors) vira VALIDACAO', () => {
    const erro = paraErroApi(
      respostaErro(400, { title: 'One or more validation errors occurred.', errors: { Email: ['inválido'] } }),
    );
    expect(erro.message).toBe('VALIDACAO');
  });

  it('title genérico do ASP.NET não é tratado como código', () => {
    expect(paraErroApi(respostaErro(404, { title: 'Not Found', status: 404 })).message).toBe('NAO_ENCONTRADO');
  });

  it('401, 403 e 404 sem corpo viram códigos sintéticos', () => {
    expect(paraErroApi(respostaErro(401)).message).toBe('NAO_AUTENTICADO');
    expect(paraErroApi(respostaErro(403)).message).toBe('ACESSO_NEGADO');
    expect(paraErroApi(respostaErro(404)).message).toBe('NAO_ENCONTRADO');
  });

  it('outros status sem código viram ERRO_INTERNO', () => {
    expect(paraErroApi(respostaErro(500)).message).toBe('ERRO_INTERNO');
    expect(paraErroApi(respostaErro(503, 'texto')).message).toBe('ERRO_INTERNO');
  });

  it('um Error comum passa adiante sem mudar', () => {
    const original = new Error('QUALQUER');
    expect(paraErroApi(original)).toBe(original);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/core/api/api-error.spec.ts`
Expected: FAIL de compilação — `Cannot find module './api-error'`.

- [ ] **Step 4: Implementar `paraErroApi`**

`src/app/core/api/api-error.ts`:
```ts
import { HttpErrorResponse } from '@angular/common/http';

const CODIGO = /^[A-Z_]+$/;

/**
 * Converte qualquer erro de requisição em `Error(código)`, o contrato que as telas usam
 * (ex.: `erro.message === 'EMAIL_EM_USO'`). O código vem do `title` do ProblemDetails
 * do backend; quando não há código, usa um sintético por status.
 */
export function paraErroApi(erro: unknown): Error {
  if (!(erro instanceof HttpErrorResponse)) {
    return erro instanceof Error ? erro : new Error('ERRO_INTERNO');
  }
  if (erro.status === 0) return new Error('SEM_CONEXAO');

  const corpo = erro.error as { title?: unknown; errors?: unknown } | null;
  if (corpo && typeof corpo === 'object') {
    if (corpo.errors && typeof corpo.errors === 'object') return new Error('VALIDACAO');
    if (typeof corpo.title === 'string' && CODIGO.test(corpo.title)) return new Error(corpo.title);
  }

  switch (erro.status) {
    case 401:
      return new Error('NAO_AUTENTICADO');
    case 403:
      return new Error('ACESSO_NEGADO');
    case 404:
      return new Error('NAO_ENCONTRADO');
    default:
      return new Error('ERRO_INTERNO');
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/core/api/api-error.spec.ts`
Expected: PASS (7 specs).

- [ ] **Step 6: Escrever o teste de `requisitar`/`buscarOuIndefinido` (falhando)**

`src/app/core/api/api.spec.ts`:
```ts
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { buscarOuIndefinido, requisitar } from './api';

const falha = (status: number, error: unknown = null) =>
  throwError(() => new HttpErrorResponse({ status, error }));

describe('requisitar', () => {
  it('resolve com o primeiro valor emitido', async () => {
    expect(await requisitar(of(42))).toBe(42);
  });

  it('rejeita com Error(código) convertido do ProblemDetails', async () => {
    await expectAsync(requisitar(falha(409, { title: 'EMAIL_EM_USO' }))).toBeRejectedWithError('EMAIL_EM_USO');
  });
});

describe('buscarOuIndefinido', () => {
  it('devolve undefined para 404 sem corpo (ex.: id que não é GUID)', async () => {
    expect(await buscarOuIndefinido(falha(404))).toBeUndefined();
  });

  it('devolve undefined para *_NAO_ENCONTRADO', async () => {
    expect(await buscarOuIndefinido(falha(404, { title: 'PRODUTO_NAO_ENCONTRADO' }))).toBeUndefined();
  });

  it('repassa outros erros', async () => {
    await expectAsync(buscarOuIndefinido(falha(0))).toBeRejectedWithError('SEM_CONEXAO');
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/core/api/api.spec.ts`
Expected: FAIL de compilação — `Cannot find module './api'`.

- [ ] **Step 8: Implementar `api.ts`**

`src/app/core/api/api.ts`:
```ts
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { paraErroApi } from './api-error';

export const API = environment.apiUrl;

export async function requisitar<T>(requisicao: Observable<T>): Promise<T> {
  try {
    return await firstValueFrom(requisicao);
  } catch (erro) {
    throw paraErroApi(erro);
  }
}

/** Igual a `requisitar`, mas trata "não encontrado" (404) como ausência: devolve `undefined`. */
export async function buscarOuIndefinido<T>(requisicao: Observable<T>): Promise<T | undefined> {
  try {
    return await requisitar(requisicao);
  } catch (erro) {
    if (erro instanceof Error && erro.message.endsWith('NAO_ENCONTRADO')) return undefined;
    throw erro;
  }
}
```

- [ ] **Step 9: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/core/api/api.spec.ts`
Expected: PASS (5 specs).

- [ ] **Step 10: Commit**

```bash
git add src/environments angular.json src/app/core/api
git commit -m "feat: infraestrutura HTTP (environments, conversao de erros da API)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `SessaoStore`

**Files:**
- Create: `src/app/core/auth/sessao.store.ts`, `src/app/core/auth/sessao.store.spec.ts`
- Modify: `src/app/core/auth/usuario.model.ts`

**Interfaces:**
- Consumes: `Usuario` de `usuario.model.ts`.
- Produces: `interface Sessao { usuario: Usuario; token: string }`; `class SessaoStore` (`providedIn: 'root'`, sem dependências) com `sessao: Signal<Sessao | null>`, `usuario: Signal<Usuario | null>`, `token: Signal<string | null>`, `definir(sessao: Sessao | null): void`, `atualizarUsuario(usuario: Usuario): void`.

- [ ] **Step 1: Ajustar o modelo**

Em `src/app/core/auth/usuario.model.ts`, trocar `telefone?: string;` por:
```ts
  telefone?: string | null;
```

- [ ] **Step 2: Escrever o teste (falhando)**

`src/app/core/auth/sessao.store.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { Sessao, SessaoStore } from './sessao.store';

const SESSAO: Sessao = {
  usuario: { id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' },
  token: 'jwt-abc',
};

function novoStore(): SessaoStore {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(SessaoStore);
}

describe('SessaoStore', () => {
  beforeEach(() => localStorage.clear());

  it('começa vazio sem nada salvo', () => {
    const store = novoStore();
    expect(store.sessao()).toBeNull();
    expect(store.usuario()).toBeNull();
    expect(store.token()).toBeNull();
  });

  it('definir() expõe usuário e token e persiste em rede_sessao', () => {
    const store = novoStore();
    store.definir(SESSAO);
    expect(store.usuario()?.email).toBe('jovem@rede.com');
    expect(store.token()).toBe('jwt-abc');
    expect(JSON.parse(localStorage.getItem('rede_sessao')!)).toEqual(SESSAO);
  });

  it('restaura a sessão salva numa nova instância', () => {
    novoStore().definir(SESSAO);
    expect(novoStore().token()).toBe('jwt-abc');
  });

  it('definir(null) limpa memória e localStorage', () => {
    const store = novoStore();
    store.definir(SESSAO);
    store.definir(null);
    expect(store.sessao()).toBeNull();
    expect(localStorage.getItem('rede_sessao')).toBeNull();
  });

  it('atualizarUsuario() troca o usuário e mantém o token', () => {
    const store = novoStore();
    store.definir(SESSAO);
    store.atualizarUsuario({ ...SESSAO.usuario, nome: 'Novo Nome' });
    expect(store.usuario()?.nome).toBe('Novo Nome');
    expect(store.token()).toBe('jwt-abc');
  });

  it('ignora e remove a sessão antiga do mock (rede_sessao_usuario, sem token)', () => {
    localStorage.setItem('rede_sessao_usuario', JSON.stringify(SESSAO.usuario));
    const store = novoStore();
    expect(store.sessao()).toBeNull();
    expect(localStorage.getItem('rede_sessao_usuario')).toBeNull();
  });

  it('ignora sessão corrompida ou sem token', () => {
    localStorage.setItem('rede_sessao', '{quebrado');
    expect(novoStore().sessao()).toBeNull();
    localStorage.setItem('rede_sessao', JSON.stringify({ usuario: SESSAO.usuario }));
    expect(novoStore().sessao()).toBeNull();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/core/auth/sessao.store.spec.ts`
Expected: FAIL de compilação — `Cannot find module './sessao.store'`.

- [ ] **Step 4: Implementar**

`src/app/core/auth/sessao.store.ts`:
```ts
import { computed, Injectable, signal } from '@angular/core';
import { Usuario } from './usuario.model';

export interface Sessao {
  usuario: Usuario;
  token: string;
}

const CHAVE_SESSAO = 'rede_sessao';
const CHAVE_SESSAO_MOCK = 'rede_sessao_usuario';

/**
 * Guarda usuário + JWT. Não depende de nada (nem de HttpClient) para o interceptor
 * poder ler o token sem criar um ciclo de injeção com o AuthService.
 */
@Injectable({ providedIn: 'root' })
export class SessaoStore {
  private readonly _sessao = signal<Sessao | null>(this.carregar());

  readonly sessao = this._sessao.asReadonly();
  readonly usuario = computed(() => this._sessao()?.usuario ?? null);
  readonly token = computed(() => this._sessao()?.token ?? null);

  definir(sessao: Sessao | null): void {
    this._sessao.set(sessao);
    if (sessao) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    else localStorage.removeItem(CHAVE_SESSAO);
  }

  atualizarUsuario(usuario: Usuario): void {
    const atual = this._sessao();
    if (atual) this.definir({ ...atual, usuario });
  }

  private carregar(): Sessao | null {
    // Sessões gravadas pelo mock antigo não têm token: descartadas.
    localStorage.removeItem(CHAVE_SESSAO_MOCK);
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    try {
      const sessao = JSON.parse(bruto) as Partial<Sessao> | null;
      return sessao?.token && sessao.usuario ? (sessao as Sessao) : null;
    } catch {
      return null;
    }
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/core/auth/sessao.store.spec.ts`
Expected: PASS (7 specs).

- [ ] **Step 6: Commit**

```bash
git add src/app/core/auth/sessao.store.ts src/app/core/auth/sessao.store.spec.ts src/app/core/auth/usuario.model.ts
git commit -m "feat: SessaoStore guarda usuario e token JWT

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `AuthService` via HTTP

**Files:**
- Modify: `src/app/core/auth/auth.service.ts`
- Rewrite: `src/app/core/auth/auth.service.spec.ts`
- Delete: `src/app/core/auth/auth-mock-store.ts`

**Interfaces:**
- Consumes: `SessaoStore`, `Sessao` (Task 2); `API`, `requisitar` (Task 1).
- Produces (API pública — telas dependem disso): `usuarioAtual: Signal<Usuario | null>`, `estaAutenticado`, `isAdmin`, `login(email, senha): Promise<Usuario>`, `cadastrar({nome,email,senha}): Promise<Usuario>`, `atualizarPerfil(dados): Promise<Usuario>`, `buscarPorId(id): Promise<Usuario | undefined>`, `recuperarSenha(email): Promise<void>`, **novos** `redefinirSenha(token: string, novaSenha: string): Promise<void>`, `validarSessao(): Promise<void>`, `encerrarSessaoExpirada(): void`; `logout(): void`.

- [ ] **Step 1: Reescrever o teste (falhando)**

Substituir todo o conteúdo de `src/app/core/auth/auth.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { SessaoStore } from './sessao.store';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../orders/order.service';
import { Usuario } from './usuario.model';

const API = 'http://localhost:5052';
const JOVEM: Usuario = { id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', telefone: null, papel: 'jovem' };
const ADMIN: Usuario = { id: 'a1', nome: 'Admin', email: 'admin@rede.com', telefone: null, papel: 'admin' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let sessao: SessaoStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    sessao = TestBed.inject(SessaoStore);
  });

  afterEach(() => http.verify());

  it('começa sem usuário autenticado', () => {
    expect(service.usuarioAtual()).toBeNull();
    expect(service.estaAutenticado()).toBeFalse();
  });

  it('login faz POST /auth/login e guarda usuário + token', async () => {
    const promessa = service.login('jovem@rede.com', 'senha1234');
    const req = http.expectOne(`${API}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'jovem@rede.com', senha: 'senha1234' });
    req.flush({ usuario: JOVEM, token: 'jwt-1' });

    expect((await promessa).email).toBe('jovem@rede.com');
    expect(service.estaAutenticado()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
    expect(sessao.token()).toBe('jwt-1');
  });

  it('login de admin marca isAdmin', async () => {
    const promessa = service.login('admin@rede.com', 'admin1234');
    http.expectOne(`${API}/auth/login`).flush({ usuario: ADMIN, token: 'jwt-a' });
    await promessa;
    expect(service.isAdmin()).toBeTrue();
  });

  it('login com credenciais erradas rejeita com CREDENCIAIS_INVALIDAS e não autentica', async () => {
    const promessa = service.login('jovem@rede.com', 'errada');
    http
      .expectOne(`${API}/auth/login`)
      .flush({ status: 401, title: 'CREDENCIAIS_INVALIDAS' }, { status: 401, statusText: 'Unauthorized' });
    await expectAsync(promessa).toBeRejectedWithError('CREDENCIAIS_INVALIDAS');
    expect(service.usuarioAtual()).toBeNull();
  });

  it('cadastrar faz POST /auth/cadastro e já autentica', async () => {
    const promessa = service.cadastrar({ nome: 'Jovem', email: 'jovem@rede.com', senha: 'senha1234' });
    const req = http.expectOne(`${API}/auth/cadastro`);
    expect(req.request.body).toEqual({ nome: 'Jovem', email: 'jovem@rede.com', senha: 'senha1234' });
    req.flush({ usuario: JOVEM, token: 'jwt-1' });
    expect((await promessa).papel).toBe('jovem');
    expect(service.estaAutenticado()).toBeTrue();
  });

  it('cadastrar com e-mail em uso rejeita com EMAIL_EM_USO', async () => {
    const promessa = service.cadastrar({ nome: 'X', email: 'jovem@rede.com', senha: 'senha1234' });
    http
      .expectOne(`${API}/auth/cadastro`)
      .flush({ status: 409, title: 'EMAIL_EM_USO' }, { status: 409, statusText: 'Conflict' });
    await expectAsync(promessa).toBeRejectedWithError('EMAIL_EM_USO');
  });

  it('atualizarPerfil faz PATCH /auth/perfil e atualiza o usuário mantendo o token', async () => {
    sessao.definir({ usuario: JOVEM, token: 'jwt-1' });
    const promessa = service.atualizarPerfil({ nome: 'Novo', telefone: '11999999999' });
    const req = http.expectOne(`${API}/auth/perfil`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ nome: 'Novo', telefone: '11999999999' });
    req.flush({ ...JOVEM, nome: 'Novo', telefone: '11999999999' });
    await promessa;
    expect(service.usuarioAtual()?.nome).toBe('Novo');
    expect(sessao.token()).toBe('jwt-1');
  });

  it('buscarPorId faz GET /usuarios/{id}', async () => {
    const promessa = service.buscarPorId('u1');
    http.expectOne(`${API}/usuarios/u1`).flush(JOVEM);
    expect((await promessa)?.email).toBe('jovem@rede.com');
  });

  it('buscarPorId devolve undefined em 404 e em ACESSO_NEGADO', async () => {
    const naoExiste = service.buscarPorId('x');
    http.expectOne(`${API}/usuarios/x`).flush(null, { status: 404, statusText: 'Not Found' });
    expect(await naoExiste).toBeUndefined();

    const negado = service.buscarPorId('y');
    http
      .expectOne(`${API}/usuarios/y`)
      .flush({ status: 403, title: 'ACESSO_NEGADO' }, { status: 403, statusText: 'Forbidden' });
    expect(await negado).toBeUndefined();
  });

  it('recuperarSenha faz POST /auth/recuperar-senha', async () => {
    const promessa = service.recuperarSenha('jovem@rede.com');
    const req = http.expectOne(`${API}/auth/recuperar-senha`);
    expect(req.request.body).toEqual({ email: 'jovem@rede.com' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await promessa;
  });

  it('redefinirSenha faz POST /auth/redefinir-senha e propaga TOKEN_INVALIDO', async () => {
    const promessa = service.redefinirSenha('tok', 'novaSenha123');
    const req = http.expectOne(`${API}/auth/redefinir-senha`);
    expect(req.request.body).toEqual({ token: 'tok', novaSenha: 'novaSenha123' });
    req.flush({ status: 400, title: 'TOKEN_INVALIDO' }, { status: 400, statusText: 'Bad Request' });
    await expectAsync(promessa).toBeRejectedWithError('TOKEN_INVALIDO');
  });

  it('validarSessao sem token não chama a API', async () => {
    await service.validarSessao();
    http.expectNone(`${API}/auth/me`);
  });

  it('validarSessao com token atualiza o usuário a partir de /auth/me', async () => {
    sessao.definir({ usuario: JOVEM, token: 'jwt-1' });
    const promessa = service.validarSessao();
    http.expectOne(`${API}/auth/me`).flush({ ...JOVEM, nome: 'Nome do Servidor' });
    await promessa;
    expect(service.usuarioAtual()?.nome).toBe('Nome do Servidor');
  });

  it('validarSessao mantém a sessão local quando o servidor está fora do ar', async () => {
    sessao.definir({ usuario: JOVEM, token: 'jwt-1' });
    const promessa = service.validarSessao();
    http.expectOne(`${API}/auth/me`).error(new ProgressEvent('error'));
    await promessa;
    expect(service.estaAutenticado()).toBeTrue();
  });

  it('logout limpa sessão, carrinho e último pedido', () => {
    sessao.definir({ usuario: JOVEM, token: 'jwt-1' });
    const carrinho = TestBed.inject(CartService);
    const pedidos = TestBed.inject(OrderService);
    spyOn(carrinho, 'limpar');
    spyOn(pedidos, 'limparUltimoPedido');

    service.logout();

    expect(service.usuarioAtual()).toBeNull();
    expect(sessao.token()).toBeNull();
    expect(carrinho.limpar).toHaveBeenCalled();
    expect(pedidos.limparUltimoPedido).toHaveBeenCalled();
  });

  it('encerrarSessaoExpirada tem o mesmo efeito do logout', () => {
    sessao.definir({ usuario: JOVEM, token: 'jwt-1' });
    service.encerrarSessaoExpirada();
    expect(service.estaAutenticado()).toBeFalse();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/core/auth/auth.service.spec.ts`
Expected: FAIL — `service.redefinirSenha is not a function` (e falhas de `expectOne` nos testes de login).

- [ ] **Step 3: Implementar**

Substituir todo o conteúdo de `src/app/core/auth/auth.service.ts`:
```ts
import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API, requisitar } from '../api/api';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../orders/order.service';
import { Sessao, SessaoStore } from './sessao.store';
import { Usuario } from './usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessao = inject(SessaoStore);
  private readonly carrinho = inject(CartService);
  private readonly pedidos = inject(OrderService);

  readonly usuarioAtual = this.sessao.usuario;
  readonly estaAutenticado = computed(() => this.usuarioAtual() !== null);
  readonly isAdmin = computed(() => this.usuarioAtual()?.papel === 'admin');

  async login(email: string, senha: string): Promise<Usuario> {
    const resposta = await requisitar(this.http.post<Sessao>(`${API}/auth/login`, { email, senha }));
    this.sessao.definir(resposta);
    return resposta.usuario;
  }

  async cadastrar(dados: { nome: string; email: string; senha: string }): Promise<Usuario> {
    const resposta = await requisitar(this.http.post<Sessao>(`${API}/auth/cadastro`, dados));
    this.sessao.definir(resposta);
    return resposta.usuario;
  }

  async buscarPorId(id: string): Promise<Usuario | undefined> {
    try {
      return await requisitar(this.http.get<Usuario>(`${API}/usuarios/${id}`));
    } catch (erro) {
      if (erro instanceof Error && ['NAO_ENCONTRADO', 'ACESSO_NEGADO'].includes(erro.message)) return undefined;
      throw erro;
    }
  }

  async recuperarSenha(email: string): Promise<void> {
    await requisitar(this.http.post<void>(`${API}/auth/recuperar-senha`, { email }));
  }

  async redefinirSenha(token: string, novaSenha: string): Promise<void> {
    await requisitar(this.http.post<void>(`${API}/auth/redefinir-senha`, { token, novaSenha }));
  }

  async atualizarPerfil(
    dados: Partial<Pick<Usuario, 'nome' | 'email' | 'telefone'>>,
  ): Promise<Usuario> {
    const atualizado = await requisitar(this.http.patch<Usuario>(`${API}/auth/perfil`, dados));
    this.sessao.atualizarUsuario(atualizado);
    return atualizado;
  }

  /** Confere o token salvo com o servidor e atualiza os dados do usuário. 401 é tratado pelo interceptor. */
  async validarSessao(): Promise<void> {
    if (!this.sessao.token()) return;
    try {
      this.sessao.atualizarUsuario(await requisitar(this.http.get<Usuario>(`${API}/auth/me`)));
    } catch {
      // Servidor fora do ar: mantém a sessão local; a próxima requisição autenticada decide.
    }
  }

  encerrarSessaoExpirada(): void {
    this.logout();
  }

  logout(): void {
    this.sessao.definir(null);
    this.carrinho.limpar();
    this.pedidos.limparUltimoPedido();
  }
}
```

Apagar `src/app/core/auth/auth-mock-store.ts` e conferir que ninguém mais importa:
```bash
git rm src/app/core/auth/auth-mock-store.ts
grep -rn "auth-mock-store\|USUARIOS_MOCK" src
```
Expected do grep: nenhuma linha.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/core/auth/auth.service.spec.ts`
Expected: PASS (16 specs).

- [ ] **Step 5: Commit**

```bash
git add src/app/core/auth
git commit -m "feat: AuthService autentica via API com JWT

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `authInterceptor` + `app.config`

**Files:**
- Create: `src/app/core/api/auth.interceptor.ts`, `src/app/core/api/auth.interceptor.spec.ts`
- Modify: `src/app/app.config.ts`

**Interfaces:**
- Consumes: `SessaoStore.token` (Task 2); `AuthService.encerrarSessaoExpirada()`, `AuthService.validarSessao()` (Task 3); `environment.apiUrl` (Task 1).
- Produces: `authInterceptor: HttpInterceptorFn`.

- [ ] **Step 1: Escrever o teste (falhando)**

`src/app/core/api/auth.interceptor.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { SessaoStore } from '../auth/sessao.store';
import { AuthService } from '../auth/auth.service';

const API = 'http://localhost:5052';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controle: HttpTestingController;
  let sessao: SessaoStore;
  let authFalso: { encerrarSessaoExpirada: jasmine.Spy };
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    authFalso = { encerrarSessaoExpirada: jasmine.createSpy('encerrarSessaoExpirada') };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authFalso },
      ],
    });
    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
    sessao = TestBed.inject(SessaoStore);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
  });

  afterEach(() => controle.verify());

  function logar(): void {
    sessao.definir({ usuario: { id: 'u1', nome: 'J', email: 'j@rede.com', papel: 'jovem' }, token: 'jwt-1' });
  }

  it('adiciona Authorization: Bearer quando há token', () => {
    logar();
    http.get(`${API}/usuarios/me/pedidos`).subscribe();
    const req = controle.expectOne(`${API}/usuarios/me/pedidos`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-1');
    req.flush([]);
  });

  it('não adiciona Authorization sem token', () => {
    http.get(`${API}/produtos`).subscribe();
    const req = controle.expectOne(`${API}/produtos`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('não envia o token para outros domínios', () => {
    logar();
    http.get('https://picsum.photos/x').subscribe();
    const req = controle.expectOne('https://picsum.photos/x');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush('');
  });

  it('401 com sessão ativa encerra a sessão, vai para /login e repassa o erro', async () => {
    logar();
    const promessa = firstValueFrom(http.get(`${API}/usuarios/me/pedidos`));
    controle.expectOne(`${API}/usuarios/me/pedidos`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await expectAsync(promessa).toBeRejected();
    expect(authFalso.encerrarSessaoExpirada).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('401 do próprio /auth/login (senha errada) não desloga nem redireciona', async () => {
    logar();
    const promessa = firstValueFrom(http.post(`${API}/auth/login`, {}));
    controle
      .expectOne(`${API}/auth/login`)
      .flush({ title: 'CREDENCIAIS_INVALIDAS' }, { status: 401, statusText: 'Unauthorized' });
    await expectAsync(promessa).toBeRejected();
    expect(authFalso.encerrarSessaoExpirada).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('401 sem sessão (visitante) não redireciona', async () => {
    const promessa = firstValueFrom(http.get(`${API}/auth/me`));
    controle.expectOne(`${API}/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await expectAsync(promessa).toBeRejected();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/core/api/auth.interceptor.spec.ts`
Expected: FAIL de compilação — `Cannot find module './auth.interceptor'`.

- [ ] **Step 3: Implementar o interceptor**

`src/app/core/api/auth.interceptor.ts`:
```ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessaoStore } from '../auth/sessao.store';
import { AuthService } from '../auth/auth.service';

/** Rotas em que 401 significa "credencial errada", não "sessão expirada". */
const ROTAS_DE_CREDENCIAL = ['/auth/login', '/auth/cadastro'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(SessaoStore).token();
  const auth = inject(AuthService);
  const router = inject(Router);

  const ehApi = req.url.startsWith(environment.apiUrl);
  const requisicao = token && ehApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requisicao).pipe(
    catchError((erro: unknown) => {
      const sessaoExpirou =
        erro instanceof HttpErrorResponse &&
        erro.status === 401 &&
        !!token &&
        ehApi &&
        !ROTAS_DE_CREDENCIAL.some((rota) => req.url.endsWith(rota));
      if (sessaoExpirou) {
        auth.encerrarSessaoExpirada();
        router.navigateByUrl('/login');
      }
      return throwError(() => erro);
    }),
  );
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/core/api/auth.interceptor.spec.ts`
Expected: PASS (6 specs).

- [ ] **Step 5: Registrar no `app.config.ts`**

Substituir todo o conteúdo de `src/app/app.config.ts`:
```ts
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/api/auth.interceptor';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Não bloqueia o bootstrap: confere o token salvo em segundo plano.
    provideAppInitializer(() => {
      void inject(AuthService).validarSessao();
    }),
  ],
};
```

- [ ] **Step 6: Commit**

```bash
git add src/app/core/api/auth.interceptor.ts src/app/core/api/auth.interceptor.spec.ts src/app/app.config.ts
git commit -m "feat: interceptor JWT com tratamento de sessao expirada

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `ProductService` via HTTP

**Files:**
- Modify: `src/app/core/products/product.service.ts`, `src/app/core/products/produto.model.ts`
- Rewrite: `src/app/core/products/product.service.spec.ts`
- Delete: `src/app/core/products/product-mock-store.ts`

**Interfaces:**
- Consumes: `API`, `requisitar`, `buscarOuIndefinido` (Task 1).
- Produces (assinaturas inalteradas): `listar(filtro?: FiltroProdutos): Promise<Produto[]>`, `listarDestaques()`, `buscarPorId(id): Promise<Produto | undefined>`, `criar(dados: Omit<Produto,'id'>): Promise<Produto>`, `atualizar(id, dados: Partial<Omit<Produto,'id'>>): Promise<Produto>`, `remover(id): Promise<void>`. `Variacao` ganha `id?: string`.

- [ ] **Step 1: Ajustar o modelo**

Em `src/app/core/products/produto.model.ts`, na interface `Variacao`, adicionar como primeiro campo:
```ts
  id?: string;
```

- [ ] **Step 2: Reescrever o teste (falhando)**

Substituir todo o conteúdo de `src/app/core/products/product.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Produto } from './produto.model';

const API = 'http://localhost:5052';
const PRODUTO: Produto = {
  id: 'p1',
  nome: 'Camiseta REDE',
  categoria: 'camisetas',
  preco: 79.9,
  descricao: 'Algodão',
  fotos: ['https://x/1.jpg'],
  tamanhos: ['P'],
  cores: ['Preto'],
  destaque: true,
  variacoes: [{ id: 'v1', tamanho: 'P', cor: 'Preto', estoque: 3 }],
};

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar sem filtro faz GET /produtos sem parâmetros', async () => {
    const promessa = service.listar();
    const req = http.expectOne(`${API}/produtos`);
    expect(req.request.params.keys()).toEqual([]);
    req.flush([PRODUTO]);
    expect(await promessa).toEqual([PRODUTO]);
  });

  it('listar envia categoria e busca (aparada) como query params', async () => {
    const promessa = service.listar({ categoria: 'moletons', busca: '  rede ' });
    const req = http.expectOne((r) => r.url === `${API}/produtos`);
    expect(req.request.params.get('categoria')).toBe('moletons');
    expect(req.request.params.get('busca')).toBe('rede');
    req.flush([]);
    await promessa;
  });

  it('listar ignora busca vazia', async () => {
    const promessa = service.listar({ busca: '   ' });
    const req = http.expectOne((r) => r.url === `${API}/produtos`);
    expect(req.request.params.has('busca')).toBeFalse();
    req.flush([]);
    await promessa;
  });

  it('listarDestaques faz GET /produtos/destaques', async () => {
    const promessa = service.listarDestaques();
    http.expectOne(`${API}/produtos/destaques`).flush([PRODUTO]);
    expect((await promessa).length).toBe(1);
  });

  it('buscarPorId faz GET /produtos/{id}', async () => {
    const promessa = service.buscarPorId('p1');
    http.expectOne(`${API}/produtos/p1`).flush(PRODUTO);
    expect((await promessa)?.nome).toBe('Camiseta REDE');
  });

  it('buscarPorId devolve undefined para id inexistente ou que não é GUID (404)', async () => {
    const promessa = service.buscarPorId('abc');
    http.expectOne(`${API}/produtos/abc`).flush(null, { status: 404, statusText: 'Not Found' });
    expect(await promessa).toBeUndefined();
  });

  it('criar faz POST /produtos sem tamanhos/cores e sem ids de variação', async () => {
    const { id: _id, ...dados } = PRODUTO;
    const promessa = service.criar(dados);
    const req = http.expectOne(`${API}/produtos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nome: 'Camiseta REDE',
      categoria: 'camisetas',
      preco: 79.9,
      descricao: 'Algodão',
      fotos: ['https://x/1.jpg'],
      destaque: true,
      variacoes: [{ tamanho: 'P', cor: 'Preto', estoque: 3 }],
    });
    req.flush(PRODUTO);
    expect((await promessa).id).toBe('p1');
  });

  it('atualizar faz PATCH /produtos/{id} só com os campos enviados', async () => {
    const promessa = service.atualizar('p1', { preco: 69.9, tamanhos: ['P'] });
    const req = http.expectOne(`${API}/produtos/p1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ preco: 69.9 });
    req.flush({ ...PRODUTO, preco: 69.9 });
    expect((await promessa).preco).toBe(69.9);
  });

  it('remover faz DELETE /produtos/{id}', async () => {
    const promessa = service.remover('p1');
    const req = http.expectOne(`${API}/produtos/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await promessa;
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/core/products/product.service.spec.ts`
Expected: FAIL — `Expected one matching request for criteria "Match URL: http://localhost:5052/produtos", found none.`

- [ ] **Step 4: Implementar**

Substituir todo o conteúdo de `src/app/core/products/product.service.ts`:
```ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API, buscarOuIndefinido, requisitar } from '../api/api';
import { FiltroProdutos, Produto } from './produto.model';

type DadosProduto = Omit<Produto, 'id'>;

/** `tamanhos`/`cores` são calculados pelo backend e ids de variação são regerados: nunca enviados. */
function paraCorpo(dados: Partial<DadosProduto>): Record<string, unknown> {
  const { tamanhos: _tamanhos, cores: _cores, variacoes, ...resto } = dados;
  return variacoes
    ? { ...resto, variacoes: variacoes.map(({ tamanho, cor, estoque }) => ({ tamanho, cor, estoque })) }
    : resto;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  async listar(filtro?: FiltroProdutos): Promise<Produto[]> {
    let params = new HttpParams();
    if (filtro?.categoria) params = params.set('categoria', filtro.categoria);
    const busca = filtro?.busca?.trim();
    if (busca) params = params.set('busca', busca);
    return requisitar(this.http.get<Produto[]>(`${API}/produtos`, { params }));
  }

  async listarDestaques(): Promise<Produto[]> {
    return requisitar(this.http.get<Produto[]>(`${API}/produtos/destaques`));
  }

  async buscarPorId(id: string): Promise<Produto | undefined> {
    return buscarOuIndefinido(this.http.get<Produto>(`${API}/produtos/${id}`));
  }

  async criar(dados: DadosProduto): Promise<Produto> {
    return requisitar(this.http.post<Produto>(`${API}/produtos`, paraCorpo(dados)));
  }

  async atualizar(id: string, dados: Partial<DadosProduto>): Promise<Produto> {
    return requisitar(this.http.patch<Produto>(`${API}/produtos/${id}`, paraCorpo(dados)));
  }

  async remover(id: string): Promise<void> {
    await requisitar(this.http.delete<void>(`${API}/produtos/${id}`));
  }
}
```

```bash
git rm src/app/core/products/product-mock-store.ts
grep -rn "product-mock-store\|PRODUTOS_MOCK" src
```
Expected do grep: nenhuma linha.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/core/products/product.service.spec.ts`
Expected: PASS (9 specs).

- [ ] **Step 6: Commit**

```bash
git add src/app/core/products
git commit -m "feat: ProductService consome a API

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `EventService` via HTTP + `Evento.vagasRestantes`

**Files:**
- Modify: `src/app/core/events/evento.model.ts`, `src/app/core/events/event.service.ts`
- Rewrite: `src/app/core/events/event.service.spec.ts`
- Delete: `src/app/core/events/event-mock-store.ts`
- Modify (tipo `DadosEvento`): `src/app/features/admin/eventos/evento-form/evento-form.ts`, `src/app/features/admin/eventos/eventos.ts`
- Modify (fixtures de `Evento` ganham `vagasRestantes`): `src/app/features/loja/home/home.spec.ts`, `src/app/features/eventos/agenda/agenda.spec.ts`, `src/app/features/eventos/evento-detalhes/evento-detalhes.spec.ts`, `src/app/features/eventos/confirmacao/confirmacao.spec.ts`, `src/app/features/eventos/minhas-inscricoes/minhas-inscricoes.spec.ts`, `src/app/features/admin/eventos/inscricoes/inscricoes.spec.ts`, `src/app/features/admin/eventos/eventos.spec.ts`, `src/app/features/admin/eventos/evento-form/evento-form.spec.ts`

**Interfaces:**
- Consumes: `API`, `requisitar`, `buscarOuIndefinido` (Task 1).
- Produces: `Evento.vagasRestantes: number`; `type DadosEvento = Omit<Evento, 'id' | 'vagasRestantes'>`; `EventService.listar()`, `buscarPorId(id): Promise<Evento | undefined>`, `criar(dados: DadosEvento)`, `atualizar(id, dados: Partial<DadosEvento>)`, `remover(id)`; `EventoForm.salvar: OutputEmitterRef<DadosEvento>`.

- [ ] **Step 1: Ajustar o modelo**

Substituir todo o conteúdo de `src/app/core/events/evento.model.ts`:
```ts
export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  dataHora: string;
  local: string;
  preco: number;
  vagasTotais: number;
  /** Calculado pelo backend: vagasTotais − inscrições confirmadas. */
  vagasRestantes: number;
  foto: string;
}

/** O que o admin envia ao criar/editar: sem id e sem o campo calculado. */
export type DadosEvento = Omit<Evento, 'id' | 'vagasRestantes'>;
```

- [ ] **Step 2: Atualizar fixtures e tipos que quebram com o campo novo**

Em cada arquivo abaixo, em **todo** literal tipado como `Evento`, adicionar `vagasRestantes` logo depois de `vagasTotais` com o **mesmo valor** de `vagasTotais` (ex.: `vagasTotais: 4,` → `vagasTotais: 4,\n  vagasRestantes: 4,`):
- `src/app/features/loja/home/home.spec.ts` (3 eventos: 150, 100, 4)
- `src/app/features/eventos/agenda/agenda.spec.ts` (`EVENTO` 4, `EVENTO_PASSADO` 50)
- `src/app/features/eventos/evento-detalhes/evento-detalhes.spec.ts` (`EVENTO` 4)
- `src/app/features/eventos/confirmacao/confirmacao.spec.ts` (`EVENTO` 4)
- `src/app/features/eventos/minhas-inscricoes/minhas-inscricoes.spec.ts` (`EVENTO` 4)
- `src/app/features/admin/eventos/inscricoes/inscricoes.spec.ts` (`EVENTO` 4)
- `src/app/features/admin/eventos/eventos.spec.ts` (`EVENTO` 4)
- `src/app/features/admin/eventos/evento-form/evento-form.spec.ts` (`EVENTO` 4)

Em `src/app/features/admin/eventos/evento-form/evento-form.spec.ts`, trocar `let emitido: Omit<Evento, 'id'> | undefined;` por `let emitido: DadosEvento | undefined;` e o import para `import { DadosEvento, Evento } from '../../../../core/events/evento.model';`.

Em `src/app/features/admin/eventos/evento-form/evento-form.ts`: import `import { DadosEvento, Evento } from '../../../../core/events/evento.model';` e `readonly salvar = output<DadosEvento>();`.

Em `src/app/features/admin/eventos/eventos.ts`: import `import { DadosEvento, Evento } from '../../../core/events/evento.model';` e assinatura `protected async salvar(dados: DadosEvento): Promise<void> {`.

Conferir que não sobrou literal sem o campo:
```bash
grep -rln "vagasTotais:" src/app --include=*.ts | xargs grep -L "vagasRestantes"
```
Expected: só `src/app/core/events/event-mock-store.ts` (apagado no Step 5) ou nenhuma linha.

- [ ] **Step 3: Reescrever o teste do serviço (falhando)**

Substituir todo o conteúdo de `src/app/core/events/event.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EventService } from './event.service';
import { DadosEvento, Evento } from './evento.model';

const API = 'http://localhost:5052';
const EVENTO: Evento = {
  id: 'e1',
  titulo: 'Retiro',
  descricao: 'Imersão',
  dataHora: '2026-12-20T19:00:00Z',
  local: 'Sítio',
  preco: 150,
  vagasTotais: 100,
  vagasRestantes: 37,
  foto: 'https://x/e.jpg',
};
const { id: _id, vagasRestantes: _v, ...DADOS } = EVENTO;

describe('EventService', () => {
  let service: EventService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EventService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar faz GET /eventos e traz vagasRestantes', async () => {
    const promessa = service.listar();
    http.expectOne(`${API}/eventos`).flush([EVENTO]);
    expect((await promessa)[0].vagasRestantes).toBe(37);
  });

  it('buscarPorId faz GET /eventos/{id}', async () => {
    const promessa = service.buscarPorId('e1');
    http.expectOne(`${API}/eventos/e1`).flush(EVENTO);
    expect((await promessa)?.titulo).toBe('Retiro');
  });

  it('buscarPorId devolve undefined em 404 (inclui id que não é GUID)', async () => {
    const promessa = service.buscarPorId('1');
    http.expectOne(`${API}/eventos/1`).flush(null, { status: 404, statusText: 'Not Found' });
    expect(await promessa).toBeUndefined();
  });

  it('criar faz POST /eventos com os dados (sem id nem vagasRestantes)', async () => {
    const promessa = service.criar(DADOS as DadosEvento);
    const req = http.expectOne(`${API}/eventos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(DADOS);
    req.flush(EVENTO);
    expect((await promessa).id).toBe('e1');
  });

  it('atualizar faz PATCH /eventos/{id} e propaga EVENTO_VAGAS_TOTAIS_INSUFICIENTES', async () => {
    const promessa = service.atualizar('e1', { vagasTotais: 1 });
    const req = http.expectOne(`${API}/eventos/e1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ vagasTotais: 1 });
    req.flush(
      { status: 409, title: 'EVENTO_VAGAS_TOTAIS_INSUFICIENTES' },
      { status: 409, statusText: 'Conflict' },
    );
    await expectAsync(promessa).toBeRejectedWithError('EVENTO_VAGAS_TOTAIS_INSUFICIENTES');
  });

  it('remover faz DELETE /eventos/{id}', async () => {
    const promessa = service.remover('e1');
    const req = http.expectOne(`${API}/eventos/e1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await promessa;
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/core/events/event.service.spec.ts`
Expected: FAIL — `Expected one matching request ... /eventos, found none.`

- [ ] **Step 5: Implementar**

Substituir todo o conteúdo de `src/app/core/events/event.service.ts`:
```ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API, buscarOuIndefinido, requisitar } from '../api/api';
import { DadosEvento, Evento } from './evento.model';

/** Garante que campos só de leitura nunca vão no corpo, mesmo se a tela passar um Evento inteiro. */
function paraCorpo(dados: Partial<DadosEvento>): Partial<DadosEvento> {
  const { id: _id, vagasRestantes: _vagas, ...corpo } = dados as Partial<Evento>;
  return corpo;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);

  async listar(): Promise<Evento[]> {
    return requisitar(this.http.get<Evento[]>(`${API}/eventos`));
  }

  async buscarPorId(id: string): Promise<Evento | undefined> {
    return buscarOuIndefinido(this.http.get<Evento>(`${API}/eventos/${id}`));
  }

  async criar(dados: DadosEvento): Promise<Evento> {
    return requisitar(this.http.post<Evento>(`${API}/eventos`, paraCorpo(dados)));
  }

  async atualizar(id: string, dados: Partial<DadosEvento>): Promise<Evento> {
    return requisitar(this.http.patch<Evento>(`${API}/eventos/${id}`, paraCorpo(dados)));
  }

  async remover(id: string): Promise<void> {
    await requisitar(this.http.delete<void>(`${API}/eventos/${id}`));
  }
}
```

```bash
git rm src/app/core/events/event-mock-store.ts
grep -rn "event-mock-store\|EVENTOS_MOCK" src
```
Expected do grep: nenhuma linha.

- [ ] **Step 6: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/core/events/event.service.spec.ts`
Expected: PASS (6 specs).

Run (garante que os tipos de `DadosEvento` fecham no form): `npx ng test --watch=false --include=src/app/features/admin/eventos/evento-form/evento-form.spec.ts`
Expected: PASS (4 specs).

- [ ] **Step 7: Commit**

```bash
git add src/app/core/events src/app/features
git commit -m "feat: EventService consome a API; Evento ganha vagasRestantes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `RegistrationService` via HTTP + telas de eventos

**Files:**
- Modify: `src/app/core/registrations/registration.service.ts`
- Rewrite: `src/app/core/registrations/registration.service.spec.ts`
- Delete: `src/app/core/registrations/registration-mock-store.ts`
- Modify: `src/app/features/eventos/agenda/agenda.ts`, `agenda.html`, `agenda.spec.ts`
- Modify: `src/app/features/eventos/evento-detalhes/evento-detalhes.ts`, `evento-detalhes.spec.ts`
- Modify: `src/app/features/eventos/confirmacao/confirmacao.ts`, `confirmacao.spec.ts`
- Modify: `src/app/features/eventos/minhas-inscricoes/minhas-inscricoes.ts`, `minhas-inscricoes.spec.ts`
- Modify: `src/app/features/perfil/perfil.ts`, `perfil.spec.ts`
- Modify: `src/app/features/admin/eventos/eventos.ts`, `eventos.spec.ts`

**Interfaces:**
- Consumes: `API`, `requisitar` (Task 1); `Evento.vagasRestantes` (Task 6).
- Produces: `ResultadoInscricao` (inalterado); `RegistrationService.inscrever(eventoId: string): Promise<ResultadoInscricao>`, `listarMinhas(): Promise<Inscricao[]>`, `listarPorEvento(eventoId: string): Promise<Inscricao[]>`, `cancelar(inscricaoId: string): Promise<void>`. **Removidos:** `listarPorUsuario`, `vagasRestantes`.

- [ ] **Step 1: Reescrever o teste do serviço (falhando)**

Substituir todo o conteúdo de `src/app/core/registrations/registration.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RegistrationService } from './registration.service';
import { Inscricao } from './inscricao.model';

const API = 'http://localhost:5052';
const INSCRICAO: Inscricao = {
  id: 'i1',
  eventoId: 'e1',
  usuarioId: 'u1',
  status: 'confirmada',
  valorPago: 150,
  criadoEm: '2026-10-01T14:32:10.123Z',
};

describe('RegistrationService', () => {
  let service: RegistrationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RegistrationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('inscrever faz POST /eventos/{id}/inscricoes sem corpo e devolve "criada"', async () => {
    const promessa = service.inscrever('e1');
    const req = http.expectOne(`${API}/eventos/e1/inscricoes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({ resultado: 'criada', inscricao: INSCRICAO });
    expect(await promessa).toEqual({ resultado: 'criada', inscricao: INSCRICAO });
  });

  it('inscrever devolve "ja_inscrito" com a inscrição existente', async () => {
    const promessa = service.inscrever('e1');
    http.expectOne(`${API}/eventos/e1/inscricoes`).flush({ resultado: 'ja_inscrito', inscricao: INSCRICAO });
    expect(await promessa).toEqual({ resultado: 'ja_inscrito', inscricao: INSCRICAO });
  });

  it('inscrever devolve "esgotado" sem inscrição', async () => {
    const promessa = service.inscrever('e1');
    http.expectOne(`${API}/eventos/e1/inscricoes`).flush({ resultado: 'esgotado', inscricao: null });
    expect(await promessa).toEqual({ resultado: 'esgotado' });
  });

  it('listarMinhas faz GET /usuarios/me/inscricoes', async () => {
    const promessa = service.listarMinhas();
    http.expectOne(`${API}/usuarios/me/inscricoes`).flush([INSCRICAO]);
    expect(await promessa).toEqual([INSCRICAO]);
  });

  it('listarPorEvento faz GET /eventos/{id}/inscricoes', async () => {
    const promessa = service.listarPorEvento('e1');
    http.expectOne(`${API}/eventos/e1/inscricoes`).flush([INSCRICAO]);
    expect((await promessa).length).toBe(1);
  });

  it('cancelar faz PATCH /inscricoes/{id}/cancelar sem corpo', async () => {
    const promessa = service.cancelar('i1');
    const req = http.expectOne(`${API}/inscricoes/i1/cancelar`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeNull();
    req.flush({ ...INSCRICAO, status: 'cancelada' });
    await promessa;
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/core/registrations/registration.service.spec.ts`
Expected: FAIL de compilação — `Property 'listarMinhas' does not exist on type 'RegistrationService'`.

- [ ] **Step 3: Implementar o serviço**

Substituir todo o conteúdo de `src/app/core/registrations/registration.service.ts`:
```ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API, requisitar } from '../api/api';
import { Inscricao } from './inscricao.model';

/**
 * Resultado de uma tentativa de inscrição:
 * - 'criada': uma nova inscrição confirmada foi criada.
 * - 'ja_inscrito': o usuário já tinha inscrição confirmada (idempotente) — devolve a existente.
 * - 'esgotado': não havia vagas; nenhuma inscrição foi criada.
 */
export type ResultadoInscricao =
  | { resultado: 'criada'; inscricao: Inscricao }
  | { resultado: 'ja_inscrito'; inscricao: Inscricao }
  | { resultado: 'esgotado' };

interface ResultadoInscricaoDto {
  resultado: 'criada' | 'ja_inscrito' | 'esgotado';
  inscricao: Inscricao | null;
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);

  /** Inscreve o usuário logado (identificado pelo token). Seguro contra overbooking no backend. */
  async inscrever(eventoId: string): Promise<ResultadoInscricao> {
    const dto = await requisitar(
      this.http.post<ResultadoInscricaoDto>(`${API}/eventos/${eventoId}/inscricoes`, null),
    );
    if (dto.resultado === 'esgotado' || !dto.inscricao) return { resultado: 'esgotado' };
    return { resultado: dto.resultado, inscricao: dto.inscricao };
  }

  async cancelar(inscricaoId: string): Promise<void> {
    await requisitar(this.http.patch<Inscricao>(`${API}/inscricoes/${inscricaoId}/cancelar`, null));
  }

  async listarMinhas(): Promise<Inscricao[]> {
    return requisitar(this.http.get<Inscricao[]>(`${API}/usuarios/me/inscricoes`));
  }

  async listarPorEvento(eventoId: string): Promise<Inscricao[]> {
    return requisitar(this.http.get<Inscricao[]>(`${API}/eventos/${eventoId}/inscricoes`));
  }
}
```

```bash
git rm src/app/core/registrations/registration-mock-store.ts
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/core/registrations/registration.service.spec.ts`
Expected: PASS (6 specs).

- [ ] **Step 5: Agenda — usar `evento.vagasRestantes`**

Em `src/app/features/eventos/agenda/agenda.ts`: remover o import e o `inject` de `RegistrationService`, remover o signal `vagasPorEvento` e o bloco `const pares = …; this.vagasPorEvento.set(…)`. O `ngOnInit` fica:
```ts
  async ngOnInit(): Promise<void> {
    const agora = Date.now();
    this.lista.set(
      (await this.eventos.listar()).filter((evento) => new Date(evento.dataHora).getTime() >= agora),
    );
  }
```

Em `agenda.html`, trocar o bloco
```html
              @if (vagasPorEvento()[evento.id] !== undefined) {
                <span class="texto-utilitario agenda__vagas">{{ rotuloVagas(vagasPorEvento()[evento.id]) }}</span>
              }
```
por
```html
              <span class="texto-utilitario agenda__vagas">{{ rotuloVagas(evento.vagasRestantes) }}</span>
```

Em `agenda.spec.ts`: remover o import de `RegistrationService`, a variável `registrationServiceFalso`, o parâmetro `vagasRestantes` de `montar` e o provider `{ provide: RegistrationService, … }`. A assinatura vira `async function montar(eventos: Evento[]): Promise<void>`. O teste de vagas vira:
```ts
  it('mostra as vagas restantes de cada evento', async () => {
    await montar([{ ...EVENTO, vagasRestantes: 3 }]);
    expect(fixture.nativeElement.textContent).toContain('3 vagas restantes');
  });
```
`EVENTO.dataHora` está em `2026-09-16` (já no passado em 2026-10-01): trocar por `'2099-09-16T08:00:00.000Z'` para os testes que esperam o evento visível continuarem válidos.

- [ ] **Step 6: Rodar a spec da Agenda**

Run: `npx ng test --watch=false --include=src/app/features/eventos/agenda/agenda.spec.ts`
Expected: PASS (6 specs).

- [ ] **Step 7: EventoDetalhes — vagas do próprio evento + `listarMinhas`**

Em `src/app/features/eventos/evento-detalhes/evento-detalhes.ts`, substituir o trecho depois de `if (!evento) { … }` por:
```ts
    const inscricoes = this.auth.usuarioAtual() ? await this.registrations.listarMinhas() : [];

    this.vagasRestantes.set(evento.vagasRestantes);
    this.jaInscrito.set(inscricoes.some((i) => i.eventoId === id && i.status === 'confirmada'));
    this.carregado.set(true);
```
(As vagas só são aplicadas depois de as inscrições carregarem, para manter o comportamento "sem CTA antes de tudo carregar".)

Em `evento-detalhes.spec.ts`:
- `montar(opcoes: { vagasRestantes: number; inscricoes: Inscricao[] })`: o spy passa a ser `createSpyObj('RegistrationService', ['listarMinhas'])`, com `registrationServiceFalso.listarMinhas.and.resolveTo(opcoes.inscricoes)`, e o evento devolvido por `buscarPorId` é `{ ...EVENTO, vagasRestantes: opcoes.vagasRestantes }`.
- No último teste ("não mostra nenhum estado de CTA…"): `buscarPorId` resolve `{ ...EVENTO, vagasRestantes: 0 }`; o spy é `createSpyObj('RegistrationService', ['listarMinhas'])` com `listarMinhas.and.returnValue(inscricoesPromise)`; apagar `vagasPromise`/`resolverVagas` e a chamada `resolverVagas(0)`; o comentário vira `// ainda listarMinhas — reproduz a janela descrita em I1.`

- [ ] **Step 8: Rodar a spec de EventoDetalhes**

Run: `npx ng test --watch=false --include=src/app/features/eventos/evento-detalhes/evento-detalhes.spec.ts`
Expected: PASS (5 specs).

- [ ] **Step 9: Confirmacao (eventos) — `inscrever(evento.id)`**

Em `src/app/features/eventos/confirmacao/confirmacao.ts`: remover o import e o `inject` de `AuthService`; trocar o bloco `const usuario = …; const resposta = await this.registrations.inscrever({ … });` por:
```ts
    const resposta = await this.registrations.inscrever(evento.id);
```

Em `confirmacao.spec.ts`: remover o import de `AuthService`, o `signal` import se ficar sem uso, e o provider `{ provide: AuthService, … }`. O primeiro teste vira:
```ts
  it('chama RegistrationService.inscrever com o id do evento', async () => {
    await montar(EVENTO);
    expect(registrationServiceFalso.inscrever).toHaveBeenCalledWith('1');
  });
```

- [ ] **Step 10: Rodar a spec de Confirmacao**

Run: `npx ng test --watch=false --include=src/app/features/eventos/confirmacao/confirmacao.spec.ts`
Expected: PASS (5 specs).

- [ ] **Step 11: MinhasInscricoes — `listarMinhas`**

Em `src/app/features/eventos/minhas-inscricoes/minhas-inscricoes.ts`: remover import e `inject` de `AuthService`; o `ngOnInit` começa direto com:
```ts
    const inscricoes = await this.registrations.listarMinhas();
```
(sem o `const usuario = …; if (!usuario) return;` — a rota já é protegida por `authGuard`).

Em `minhas-inscricoes.spec.ts`: o tipo do spy vira `jasmine.SpyObj<Pick<RegistrationService, 'listarMinhas' | 'cancelar'>>`, `createSpyObj('RegistrationService', ['listarMinhas', 'cancelar'])`, `registrationServiceFalso.listarMinhas.and.resolveTo(inscricoes)`; remover o provider de `AuthService` e os imports `AuthService`/`signal` se ficarem sem uso. Qualquer `expect(...listarPorUsuario...)` vira `listarMinhas` sem argumento.

- [ ] **Step 12: Rodar a spec de MinhasInscricoes**

Run: `npx ng test --watch=false --include=src/app/features/eventos/minhas-inscricoes/minhas-inscricoes.spec.ts`
Expected: PASS.

- [ ] **Step 13: Perfil — inscrições via `listarMinhas`**

Em `src/app/features/perfil/perfil.ts`, trocar `this.registrations.listarPorUsuario(usuario.id),` por `this.registrations.listarMinhas(),`.

Em `perfil.spec.ts`: `registrationServiceFalso` vira `jasmine.SpyObj<Pick<RegistrationService, 'listarMinhas'>>`, criado com `createSpyObj('RegistrationService', ['listarMinhas'])` e `listarMinhas.and.resolveTo(inscricoes)`.

- [ ] **Step 14: Rodar a spec de Perfil**

Run: `npx ng test --watch=false --include=src/app/features/perfil/perfil.spec.ts`
Expected: PASS.

- [ ] **Step 15: Admin › Eventos — ocupação a partir do evento**

Em `src/app/features/admin/eventos/eventos.ts`: remover import e `inject` de `RegistrationService` e o signal `vagasRestantes`; `carregar()` vira:
```ts
  private async carregar(): Promise<void> {
    this.lista.set(await this.eventosService.listar());
  }
```
e `ocupadas()` vira:
```ts
  protected ocupadas(evento: Evento): number {
    return evento.vagasTotais - evento.vagasRestantes;
  }
```

Em `eventos.spec.ts`: remover o import de `RegistrationService`, a variável `inscricoesServicoFalso`, sua criação e o provider. Adicionar o teste:
```ts
  it('mostra a ocupação calculada a partir de vagasRestantes', async () => {
    await montar([{ ...EVENTO, vagasTotais: 4, vagasRestantes: 1 }]);
    expect(fixture.nativeElement.textContent).toContain('3/4');
  });
```

- [ ] **Step 16: Rodar a spec de Admin › Eventos**

Run: `npx ng test --watch=false --include=src/app/features/admin/eventos/eventos.spec.ts`
Expected: PASS (5 specs).

- [ ] **Step 17: Conferir que não sobrou uso das assinaturas antigas**

```bash
grep -rn "registrations\.listarPorUsuario\|inscricoesService\.vagasRestantes\|registrations\.vagasRestantes\|registration-mock-store\|INSCRICOES_MOCK" src
```
Expected: nenhuma linha.

- [ ] **Step 18: Commit**

```bash
git add src/app/core/registrations src/app/features
git commit -m "feat: RegistrationService consome a API; telas de eventos usam vagasRestantes do evento

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: `OrderService` via HTTP + telas de pedidos

**Files:**
- Modify: `src/app/core/orders/order.service.ts`, `src/app/core/orders/pedido.model.ts`
- Rewrite: `src/app/core/orders/order.service.spec.ts`
- Delete: `src/app/core/orders/order-mock-store.ts`, `src/app/core/mock/mock-latency.ts`
- Modify: `src/app/features/loja/checkout/checkout.ts`, `checkout.spec.ts`
- Modify: `src/app/features/loja/meus-pedidos/meus-pedidos.ts`, `meus-pedidos.spec.ts`
- Modify: `src/app/features/perfil/perfil.ts`, `perfil.spec.ts`
- Modify: `src/app/features/admin/pedidos/pedidos.ts`, `pedidos.spec.ts`

**Interfaces:**
- Consumes: `API`, `requisitar` (Task 1).
- Produces: `interface DadosPedido { itens: ItemCarrinho[]; formaEntrega: FormaEntrega; endereco?: Endereco }`; `OrderService.criar(dados: DadosPedido): Promise<Pedido>` (mantém `ultimoPedido`), `listarMeus(): Promise<Pedido[]>`, `listarTodos(): Promise<Pedido[]>`, `avancarStatus(id: string): Promise<Pedido>`, `limparUltimoPedido()`, `ultimoPedido`. **Removidos:** `listarPorUsuario`, `atualizarStatus`. `Pedido.endereco?: Endereco | null`.

- [ ] **Step 1: Ajustar o modelo**

Em `src/app/core/orders/pedido.model.ts`, na interface `Pedido`, trocar `endereco?: Endereco;` por:
```ts
  endereco?: Endereco | null;
```

- [ ] **Step 2: Reescrever o teste do serviço (falhando)**

Substituir todo o conteúdo de `src/app/core/orders/order.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { Pedido } from './pedido.model';
import { ItemCarrinho } from '../cart/item-carrinho.model';

const API = 'http://localhost:5052';
const ITEM: ItemCarrinho = {
  produtoId: 'p1',
  nome: 'Camiseta',
  precoUnitario: 79.9,
  fotoUrl: 'https://x/1.jpg',
  tamanho: 'M',
  cor: 'Preto',
  quantidade: 2,
  estoqueDisponivel: 5,
};
const ENDERECO = { rua: 'Rua A', numero: '1', bairro: 'Centro', cidade: 'SP', cep: '01000-000' };
const PEDIDO: Pedido = {
  id: 'ped-1',
  usuarioId: 'u1',
  itens: [ITEM],
  formaEntrega: 'retirada',
  endereco: null,
  valorTotal: 159.8,
  status: 'pago',
  criadoEm: '2026-10-01T14:40:00.000Z',
};

describe('OrderService', () => {
  let service: OrderService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(OrderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('criar envia só produtoId/tamanho/cor/quantidade (sem preço) e guarda o último pedido', async () => {
    const promessa = service.criar({ itens: [ITEM], formaEntrega: 'retirada' });
    const req = http.expectOne(`${API}/pedidos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      itens: [{ produtoId: 'p1', tamanho: 'M', cor: 'Preto', quantidade: 2 }],
      formaEntrega: 'retirada',
    });
    req.flush(PEDIDO);
    expect((await promessa).id).toBe('ped-1');
    expect(service.ultimoPedido()?.id).toBe('ped-1');
  });

  it('criar com entrega envia o endereço', async () => {
    const promessa = service.criar({ itens: [ITEM], formaEntrega: 'entrega', endereco: ENDERECO });
    const req = http.expectOne(`${API}/pedidos`);
    expect(req.request.body.endereco).toEqual(ENDERECO);
    req.flush({ ...PEDIDO, formaEntrega: 'entrega', endereco: ENDERECO });
    await promessa;
  });

  it('criar com retirada não envia endereço mesmo se vier preenchido', async () => {
    const promessa = service.criar({ itens: [ITEM], formaEntrega: 'retirada', endereco: ENDERECO });
    const req = http.expectOne(`${API}/pedidos`);
    expect('endereco' in req.request.body).toBeFalse();
    req.flush(PEDIDO);
    await promessa;
  });

  it('criar propaga ESTOQUE_INSUFICIENTE e não altera o último pedido', async () => {
    const promessa = service.criar({ itens: [ITEM], formaEntrega: 'retirada' });
    http
      .expectOne(`${API}/pedidos`)
      .flush({ status: 409, title: 'ESTOQUE_INSUFICIENTE' }, { status: 409, statusText: 'Conflict' });
    await expectAsync(promessa).toBeRejectedWithError('ESTOQUE_INSUFICIENTE');
    expect(service.ultimoPedido()).toBeNull();
  });

  it('listarMeus faz GET /usuarios/me/pedidos', async () => {
    const promessa = service.listarMeus();
    http.expectOne(`${API}/usuarios/me/pedidos`).flush([PEDIDO]);
    expect((await promessa).length).toBe(1);
  });

  it('listarTodos faz GET /pedidos', async () => {
    const promessa = service.listarTodos();
    http.expectOne(`${API}/pedidos`).flush([PEDIDO]);
    expect((await promessa)[0].id).toBe('ped-1');
  });

  it('avancarStatus faz PATCH /pedidos/{id}/avancar-status sem corpo', async () => {
    const promessa = service.avancarStatus('ped-1');
    const req = http.expectOne(`${API}/pedidos/ped-1/avancar-status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeNull();
    req.flush({ ...PEDIDO, status: 'em_preparo' });
    expect((await promessa).status).toBe('em_preparo');
  });

  it('limparUltimoPedido zera o sinal', async () => {
    const promessa = service.criar({ itens: [ITEM], formaEntrega: 'retirada' });
    http.expectOne(`${API}/pedidos`).flush(PEDIDO);
    await promessa;
    service.limparUltimoPedido();
    expect(service.ultimoPedido()).toBeNull();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/core/orders/order.service.spec.ts`
Expected: FAIL de compilação — `Property 'listarMeus' does not exist on type 'OrderService'`.

- [ ] **Step 4: Implementar o serviço**

Substituir todo o conteúdo de `src/app/core/orders/order.service.ts`:
```ts
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API, requisitar } from '../api/api';
import { ItemCarrinho } from '../cart/item-carrinho.model';
import { Endereco, FormaEntrega, Pedido } from './pedido.model';

export interface DadosPedido {
  itens: ItemCarrinho[];
  formaEntrega: FormaEntrega;
  endereco?: Endereco;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  private readonly _ultimoPedido = signal<Pedido | null>(null);
  readonly ultimoPedido = this._ultimoPedido.asReadonly();

  /** O preço é sempre o do servidor: o cliente só diz o quê e quanto. */
  async criar(dados: DadosPedido): Promise<Pedido> {
    const corpo = {
      itens: dados.itens.map(({ produtoId, tamanho, cor, quantidade }) => ({ produtoId, tamanho, cor, quantidade })),
      formaEntrega: dados.formaEntrega,
      ...(dados.formaEntrega === 'entrega' && dados.endereco ? { endereco: dados.endereco } : {}),
    };
    const pedido = await requisitar(this.http.post<Pedido>(`${API}/pedidos`, corpo));
    this._ultimoPedido.set(pedido);
    return pedido;
  }

  limparUltimoPedido(): void {
    this._ultimoPedido.set(null);
  }

  async listarMeus(): Promise<Pedido[]> {
    return requisitar(this.http.get<Pedido[]>(`${API}/usuarios/me/pedidos`));
  }

  async listarTodos(): Promise<Pedido[]> {
    return requisitar(this.http.get<Pedido[]>(`${API}/pedidos`));
  }

  /** O próximo status é calculado pelo servidor (pago → em_preparo → retirado/entregue). */
  async avancarStatus(id: string): Promise<Pedido> {
    return requisitar(this.http.patch<Pedido>(`${API}/pedidos/${id}/avancar-status`, null));
  }
}
```

```bash
git rm src/app/core/orders/order-mock-store.ts
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/core/orders/order.service.spec.ts`
Expected: PASS (8 specs).

- [ ] **Step 6: Checkout — sem `usuarioId`**

Em `src/app/features/loja/checkout/checkout.ts`, dentro de `pagar()`: apagar a linha `const usuario = this.auth.usuarioAtual();` e a linha `usuarioId: usuario!.id,`. Se depois disso `this.auth` não for mais usado no arquivo (`grep -n "this.auth" src/app/features/loja/checkout/checkout.ts` sem resultado), apagar também o `inject(AuthService)` e o import.

Em `checkout.spec.ts`, no teste "cria o pedido com retirada…", o `toHaveBeenCalledWith` vira:
```ts
    expect(orderServiceFalso.criar).toHaveBeenCalledWith({
      itens: [ITEM],
      formaEntrega: 'retirada',
      endereco: undefined,
    });
```
Se `AuthService` saiu do componente, remover também o provider e o import do spec.

- [ ] **Step 7: Rodar a spec do Checkout**

Run: `npx ng test --watch=false --include=src/app/features/loja/checkout/checkout.spec.ts`
Expected: PASS (6 specs).

- [ ] **Step 8: MeusPedidos e Perfil — `listarMeus`**

Em `src/app/features/loja/meus-pedidos/meus-pedidos.ts`: remover import e `inject` de `AuthService`; `ngOnInit` vira:
```ts
  async ngOnInit(): Promise<void> {
    this.lista.set(await this.pedidosService.listarMeus());
  }
```
Em `meus-pedidos.spec.ts`: spy `jasmine.SpyObj<Pick<OrderService, 'listarMeus'>>`, `createSpyObj('OrderService', ['listarMeus'])`, `listarMeus.and.resolveTo(pedidos)`; remover provider/imports de `AuthService` e `signal`.

Em `src/app/features/perfil/perfil.ts`: trocar `this.pedidosService.listarPorUsuario(usuario.id),` por `this.pedidosService.listarMeus(),`.
Em `perfil.spec.ts`: `orderServiceFalso` vira `jasmine.SpyObj<Pick<OrderService, 'listarMeus'>>`, `createSpyObj('OrderService', ['listarMeus'])`, `listarMeus.and.resolveTo(pedidos)`.

- [ ] **Step 9: Rodar as specs de MeusPedidos e Perfil**

Run: `npx ng test --watch=false --include=src/app/features/loja/meus-pedidos/meus-pedidos.spec.ts`
Expected: PASS (2 specs).
Run: `npx ng test --watch=false --include=src/app/features/perfil/perfil.spec.ts`
Expected: PASS.

- [ ] **Step 10: Admin › Pedidos — `avancarStatus`**

Em `src/app/features/admin/pedidos/pedidos.ts`, `avancar()` vira:
```ts
  protected async avancar(pedido: Pedido): Promise<void> {
    if (!proximoStatus(pedido)) return;
    await this.pedidosService.avancarStatus(pedido.id);
    await this.carregar();
  }
```
Em `pedidos.spec.ts`: o spy vira `Pick<OrderService, 'listarTodos' | 'avancarStatus'>` e `createSpyObj('OrderService', ['listarTodos', 'avancarStatus'])`; o último teste vira:
```ts
  it('ao clicar em avançar, chama avancarStatus com o id do pedido', async () => {
    await montar([PEDIDO_RETIRADA]);
    pedidosServicoFalso.avancarStatus.and.resolveTo({ ...PEDIDO_RETIRADA, status: 'em_preparo' });
    pedidosServicoFalso.listarTodos.and.resolveTo([{ ...PEDIDO_RETIRADA, status: 'em_preparo' }]);

    const botoes: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const botao = botoes.find((b) => b.textContent?.includes('Avançar')) as HTMLButtonElement;
    botao.click();
    await fixture.whenStable();

    expect(pedidosServicoFalso.avancarStatus).toHaveBeenCalledWith('1');
  });
```

- [ ] **Step 11: Rodar a spec de Admin › Pedidos**

Run: `npx ng test --watch=false --include=src/app/features/admin/pedidos/pedidos.spec.ts`
Expected: PASS (5 specs).

- [ ] **Step 12: Remover `mockLatency` e conferir sobras**

```bash
git rm src/app/core/mock/mock-latency.ts
grep -rn "mockLatency\|mock-latency\|_MOCK\b\|mock-store\|listarPorUsuario\|atualizarStatus" src
```
Expected: nenhuma linha.

- [ ] **Step 13: Commit**

```bash
git add src/app/core src/app/features
git commit -m "feat: OrderService consome a API; remove mocks restantes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: `CodigoPedidoPipe` (GUID curto)

**Files:**
- Create: `src/app/shared/pipes/codigo-pedido.pipe.ts`, `src/app/shared/pipes/codigo-pedido.pipe.spec.ts`
- Modify: `src/app/features/loja/meus-pedidos/meus-pedidos.ts` + `.html`, `src/app/features/loja/confirmacao/confirmacao.ts` + `.html`, `src/app/features/admin/pedidos/pedidos.ts` + `.html`

**Interfaces:**
- Produces: `CodigoPedidoPipe` (`name: 'codigoPedido'`, standalone): `transform(id: string): string` — 8 primeiros caracteres em maiúsculas quando `id.length > 8`; senão o próprio `id`.

- [ ] **Step 1: Escrever o teste (falhando)**

`src/app/shared/pipes/codigo-pedido.pipe.spec.ts`:
```ts
import { CodigoPedidoPipe } from './codigo-pedido.pipe';

describe('CodigoPedidoPipe', () => {
  const pipe = new CodigoPedidoPipe();

  it('encurta um GUID para os 8 primeiros caracteres em maiúsculas', () => {
    expect(pipe.transform('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')).toBe('A1B2C3D4');
  });

  it('mantém ids curtos como estão', () => {
    expect(pipe.transform('1')).toBe('1');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/shared/pipes/codigo-pedido.pipe.spec.ts`
Expected: FAIL de compilação — `Cannot find module './codigo-pedido.pipe'`.

- [ ] **Step 3: Implementar**

`src/app/shared/pipes/codigo-pedido.pipe.ts`:
```ts
import { Pipe, PipeTransform } from '@angular/core';

/** IDs de pedido são GUIDs; para exibição basta o começo (ex.: #A1B2C3D4). */
@Pipe({ name: 'codigoPedido' })
export class CodigoPedidoPipe implements PipeTransform {
  transform(id: string): string {
    return id.length > 8 ? id.slice(0, 8).toUpperCase() : id;
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/shared/pipes/codigo-pedido.pipe.spec.ts`
Expected: PASS (2 specs).

- [ ] **Step 5: Usar nas três telas**

- `src/app/features/loja/meus-pedidos/meus-pedidos.html`: `Pedido #{{ pedido.id }}` → `Pedido #{{ pedido.id | codigoPedido }}`. Em `meus-pedidos.ts`, adicionar `CodigoPedidoPipe` ao `imports` (import de `'../../../shared/pipes/codigo-pedido.pipe'`).
- `src/app/features/loja/confirmacao/confirmacao.html`: `Pedido #{{ p.id }}` → `Pedido #{{ p.id | codigoPedido }}`. Em `confirmacao.ts` (loja), adicionar `CodigoPedidoPipe` ao `imports`.
- `src/app/features/admin/pedidos/pedidos.html`: `#{{ pedido.id }}` → `#{{ pedido.id | codigoPedido }}`. Em `pedidos.ts`, adicionar `CodigoPedidoPipe` ao `imports`.

- [ ] **Step 6: Rodar as specs das telas afetadas**

Run: `npx ng test --watch=false --include=src/app/features/loja/meus-pedidos/meus-pedidos.spec.ts`
Expected: PASS (fixture usa id `'1'` → continua `Pedido #1`).
Run: `npx ng test --watch=false --include=src/app/features/loja/confirmacao/confirmacao.spec.ts`
Expected: PASS.
Run: `npx ng test --watch=false --include=src/app/features/admin/pedidos/pedidos.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/shared/pipes src/app/features
git commit -m "feat: exibe codigo curto do pedido no lugar do GUID

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Mensagens de erro por código

**Files:**
- Create: `src/app/core/api/mensagem-erro.ts`, `src/app/core/api/mensagem-erro.spec.ts`
- Modify: `src/app/features/loja/checkout/checkout.ts`, `checkout.spec.ts`
- Modify: `src/app/features/auth/login/login.ts`, `login.spec.ts`
- Modify: `src/app/features/auth/cadastro/cadastro.ts`
- Modify: `src/app/features/auth/recuperar-senha/recuperar-senha.ts`, `.html`, `.spec.ts`
- Modify: `src/app/features/perfil/perfil.ts`, `perfil.spec.ts`
- Modify: `src/app/features/admin/eventos/eventos.ts`, `.html`, `.scss`, `.spec.ts`
- Modify: `src/app/features/admin/pedidos/pedidos.ts`, `.html`, `.scss`, `.spec.ts`
- Modify: `src/app/features/admin/produtos/produtos.ts`, `.html`, `.scss`, `.spec.ts`

**Interfaces:**
- Consumes: códigos de erro (Task 1).
- Produces: `mensagemDeErro(erro: unknown, especificas: Record<string, string>, padrao: string): string` — prioridade: específica → comum (`SEM_CONEXAO`, `VALIDACAO`) → padrão.

- [ ] **Step 1: Escrever o teste do helper (falhando)**

`src/app/core/api/mensagem-erro.spec.ts`:
```ts
import { mensagemDeErro } from './mensagem-erro';

describe('mensagemDeErro', () => {
  it('usa a mensagem específica da tela quando o código bate', () => {
    expect(mensagemDeErro(new Error('ESTOQUE_INSUFICIENTE'), { ESTOQUE_INSUFICIENTE: 'Acabou.' }, 'Padrão')).toBe(
      'Acabou.',
    );
  });

  it('usa a mensagem comum para SEM_CONEXAO e VALIDACAO', () => {
    expect(mensagemDeErro(new Error('SEM_CONEXAO'), {}, 'Padrão')).toContain('servidor');
    expect(mensagemDeErro(new Error('VALIDACAO'), {}, 'Padrão')).toContain('validação');
  });

  it('cai no padrão para códigos desconhecidos e não-Errors', () => {
    expect(mensagemDeErro(new Error('XYZ'), {}, 'Padrão')).toBe('Padrão');
    expect(mensagemDeErro('qualquer coisa', {}, 'Padrão')).toBe('Padrão');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/core/api/mensagem-erro.spec.ts`
Expected: FAIL de compilação — `Cannot find module './mensagem-erro'`.

- [ ] **Step 3: Implementar**

`src/app/core/api/mensagem-erro.ts`:
```ts
const MENSAGENS_COMUNS: Record<string, string> = {
  SEM_CONEXAO: 'Não conseguimos falar com o servidor. Confere sua conexão e tenta de novo.',
  VALIDACAO: 'Algum campo não passou na validação do servidor. Confere os dados.',
};

/** Traduz o código de um `Error` da API na mensagem da tela; a específica vence a comum. */
export function mensagemDeErro(erro: unknown, especificas: Record<string, string>, padrao: string): string {
  const codigo = erro instanceof Error ? erro.message : '';
  return especificas[codigo] ?? MENSAGENS_COMUNS[codigo] ?? padrao;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/core/api/mensagem-erro.spec.ts`
Expected: PASS (3 specs).

- [ ] **Step 5: Checkout**

Em `src/app/features/loja/checkout/checkout.ts`, adicionar import `import { mensagemDeErro } from '../../../core/api/mensagem-erro';`, a constante no topo do arquivo (fora da classe):
```ts
const ERROS_PEDIDO: Record<string, string> = {
  ESTOQUE_INSUFICIENTE: 'Algum item do carrinho acabou de esgotar. Revisa as quantidades e tenta de novo.',
  PRODUTO_NAO_ENCONTRADO: 'Um dos produtos do carrinho não está mais disponível.',
  VARIACAO_NAO_ENCONTRADA: 'Um dos produtos do carrinho não está mais disponível.',
};
```
e trocar o `catch { this.erroGeral.set('Não deu pra finalizar…'); }` por:
```ts
    } catch (erro) {
      this.erroGeral.set(
        mensagemDeErro(erro, ERROS_PEDIDO, 'Não deu pra finalizar o pedido agora. Tenta de novo em instantes.'),
      );
    } finally {
```

Em `checkout.spec.ts`, adicionar:
```ts
  it('mostra mensagem específica quando falta estoque', async () => {
    orderServiceFalso.criar.and.rejectWith(new Error('ESTOQUE_INSUFICIENTE'));

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('acabou de esgotar');
    expect(cartServiceFalso.limpar).not.toHaveBeenCalled();
  });
```

Run: `npx ng test --watch=false --include=src/app/features/loja/checkout/checkout.spec.ts`
Expected: PASS (7 specs).

- [ ] **Step 6: Login, Cadastro e Recuperar senha**

`src/app/features/auth/login/login.ts`: importar `mensagemDeErro` (`'../../../core/api/mensagem-erro'`) e trocar `} catch { this.erroGeral.set('E-mail ou senha incorretos. Confira e tente de novo.'); }` por:
```ts
    } catch (erro) {
      this.erroGeral.set(
        mensagemDeErro(erro, {}, 'E-mail ou senha incorretos. Confira e tente de novo.'),
      );
    } finally {
```
Em `login.spec.ts`, adicionar (usando o `authServiceFalso`/padrão de submit já existentes no arquivo — o spy de login se chama `login`):
```ts
  it('mostra aviso de conexão quando o servidor não responde', async () => {
    authServiceFalso.login.and.rejectWith(new Error('SEM_CONEXAO'));
    fixture.componentInstance['form'].setValue({ email: 'jovem@rede.com', senha: 'senha1234' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Não conseguimos falar com o servidor');
  });
```
(Se o nome da variável do spy ou dos campos do form no `login.spec.ts` for diferente, ajuste para os nomes já usados nesse arquivo.)

`src/app/features/auth/cadastro/cadastro.ts`: trocar o ternário do `catch (erro)` por:
```ts
      this.erroGeral.set(
        mensagemDeErro(
          erro,
          { EMAIL_EM_USO: 'Esse e-mail já está cadastrado. Tenta entrar em vez de criar conta de novo.' },
          'Não deu pra criar sua conta agora. Tenta de novo em instantes.',
        ),
      );
```
(com o import de `mensagemDeErro`).

`src/app/features/auth/recuperar-senha/recuperar-senha.ts`: adicionar `protected readonly erroGeral = signal<string | null>(null);`; no início de `aoEnviar` (depois da guarda) `this.erroGeral.set(null);`; o `catch` (apagar o comentário antigo) vira:
```ts
    } catch (erro) {
      this.erroGeral.set(
        mensagemDeErro(erro, {}, 'Não deu pra enviar o link agora. Tenta de novo em instantes.'),
      );
    } finally {
```
Em `recuperar-senha.html`, logo antes do `<app-button tipo="submit" …>`:
```html
        @if (erroGeral()) {
          <p class="cartao-auth__erro" role="alert">{{ erroGeral() }}</p>
        }
```
Em `recuperar-senha.spec.ts`, no teste "reseta o estado de carregamento…", acrescentar ao final:
```ts
    expect(fixture.nativeElement.textContent).toContain('Não deu pra enviar o link');
```

Run: `npx ng test --watch=false --include=src/app/features/auth/login/login.spec.ts`
Run: `npx ng test --watch=false --include=src/app/features/auth/cadastro/cadastro.spec.ts`
Run: `npx ng test --watch=false --include=src/app/features/auth/recuperar-senha/recuperar-senha.spec.ts`
Expected: PASS nas três.

- [ ] **Step 7: Perfil — `EMAIL_EM_USO`**

Em `src/app/features/perfil/perfil.ts`, importar `mensagemDeErro` (`'../../core/api/mensagem-erro'`) e trocar o `catch` de `aoSalvar` por:
```ts
    } catch (erro) {
      this.erroGeral.set(
        mensagemDeErro(
          erro,
          { EMAIL_EM_USO: 'Esse e-mail já está em uso por outra conta.' },
          'Não deu pra salvar suas alterações agora. Tenta de novo em instantes.',
        ),
      );
    } finally {
```
Em `perfil.spec.ts`, adicionar:
```ts
  it('mostra mensagem específica quando o e-mail já está em uso', async () => {
    await montar([], []);
    authServiceFalso.atualizarPerfil.and.rejectWith(new Error('EMAIL_EM_USO'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('já está em uso');
  });
```
(Se o perfil tiver mais de um `<form>`, use o mesmo seletor que os testes de salvar já existentes em `perfil.spec.ts` usam.)

Run: `npx ng test --watch=false --include=src/app/features/perfil/perfil.spec.ts`
Expected: PASS.

- [ ] **Step 8: Admin › Eventos — erros ao salvar/remover**

Em `src/app/features/admin/eventos/eventos.ts`: importar `mensagemDeErro` (`'../../../core/api/mensagem-erro'`); adicionar `protected readonly erro = signal<string | null>(null);` e a constante (fora da classe):
```ts
const ERROS_EVENTO: Record<string, string> = {
  EVENTO_COM_INSCRICOES_CONFIRMADAS: 'Esse evento tem inscrições confirmadas. Cancele-as antes de remover.',
  EVENTO_VAGAS_TOTAIS_INSUFICIENTES: 'O total de vagas não pode ficar abaixo das inscrições já confirmadas.',
};
```
`salvar` e `confirmarRemocao` viram:
```ts
  protected async salvar(dados: DadosEvento): Promise<void> {
    this.erro.set(null);
    const editando = this.eventoEditando();
    try {
      if (editando) {
        await this.eventosService.atualizar(editando.id, dados);
      } else {
        await this.eventosService.criar(dados);
      }
    } catch (erro) {
      this.erro.set(mensagemDeErro(erro, ERROS_EVENTO, 'Não deu pra salvar o evento agora. Tenta de novo em instantes.'));
      this.modalAberto.set(false);
      return;
    }
    this.modalAberto.set(false);
    await this.carregar();
  }

  protected async confirmarRemocao(): Promise<void> {
    const evento = this.eventoParaRemover();
    if (!evento) return;
    this.erro.set(null);
    try {
      await this.eventosService.remover(evento.id);
    } catch (erro) {
      this.erro.set(mensagemDeErro(erro, ERROS_EVENTO, 'Não deu pra remover o evento agora. Tenta de novo em instantes.'));
    }
    this.eventoParaRemover.set(null);
    await this.carregar();
  }
```
Em `eventos.html`, logo depois do `</div>` que fecha `admin-tela__cabecalho`:
```html
  @if (erro()) {
    <p class="admin-tela__erro" role="alert">{{ erro() }}</p>
  }
```
Em `eventos.scss`, adicionar:
```scss
.admin-tela__erro {
  color: var(--status-cancel);
  font-size: 0.875rem;
  margin: 0 0 var(--espaco-4);
}
```
Em `eventos.spec.ts`, adicionar:
```ts
  it('mostra mensagem quando o evento tem inscrições confirmadas e não pode ser removido', async () => {
    await montar([EVENTO]);
    eventosServicoFalso.remover.and.rejectWith(new Error('EVENTO_COM_INSCRICOES_CONFIRMADAS'));

    fixture.componentInstance['pedirRemocao'](EVENTO);
    await fixture.componentInstance['confirmarRemocao']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cancele-as antes de remover');
  });

  it('mostra mensagem quando as vagas ficariam abaixo das inscrições confirmadas', async () => {
    await montar([EVENTO]);
    eventosServicoFalso.atualizar.and.rejectWith(new Error('EVENTO_VAGAS_TOTAIS_INSUFICIENTES'));

    fixture.componentInstance['abrirEdicao'](EVENTO);
    const { id: _id, vagasRestantes: _v, ...dados } = EVENTO;
    await fixture.componentInstance['salvar'](dados);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('não pode ficar abaixo');
  });
```

Run: `npx ng test --watch=false --include=src/app/features/admin/eventos/eventos.spec.ts`
Expected: PASS (7 specs).

- [ ] **Step 9: Admin › Pedidos — `PEDIDO_EM_ESTADO_FINAL`**

Em `src/app/features/admin/pedidos/pedidos.ts`: importar `mensagemDeErro`; adicionar `protected readonly erro = signal<string | null>(null);`; `avancar` vira:
```ts
  protected async avancar(pedido: Pedido): Promise<void> {
    if (!proximoStatus(pedido)) return;
    this.erro.set(null);
    try {
      await this.pedidosService.avancarStatus(pedido.id);
    } catch (erro) {
      this.erro.set(
        mensagemDeErro(
          erro,
          { PEDIDO_EM_ESTADO_FINAL: 'Esse pedido já foi finalizado.' },
          'Não deu pra atualizar o pedido agora. Tenta de novo em instantes.',
        ),
      );
    }
    await this.carregar();
  }
```
Em `pedidos.html`, depois do `</div>` de `admin-tela__cabecalho`, o mesmo bloco `@if (erro()) { <p class="admin-tela__erro" role="alert">{{ erro() }}</p> }`; em `pedidos.scss`, a mesma regra `.admin-tela__erro` do Step 8.
Em `pedidos.spec.ts`, adicionar:
```ts
  it('mostra aviso quando o pedido já está em estado final e recarrega a lista', async () => {
    await montar([PEDIDO_RETIRADA]);
    pedidosServicoFalso.avancarStatus.and.rejectWith(new Error('PEDIDO_EM_ESTADO_FINAL'));
    pedidosServicoFalso.listarTodos.calls.reset();

    await fixture.componentInstance['avancar'](PEDIDO_RETIRADA);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('já foi finalizado');
    expect(pedidosServicoFalso.listarTodos).toHaveBeenCalled();
  });
```

Run: `npx ng test --watch=false --include=src/app/features/admin/pedidos/pedidos.spec.ts`
Expected: PASS (6 specs).

- [ ] **Step 10: Admin › Produtos — erro genérico ao salvar/remover**

Em `src/app/features/admin/produtos/produtos.ts`: importar `mensagemDeErro`; `protected readonly erro = signal<string | null>(null);`; envolver o corpo de `salvar` e de `confirmarRemocao` no mesmo padrão do Step 8, com padrões `'Não deu pra salvar o produto agora. Tenta de novo em instantes.'` e `'Não deu pra remover o produto agora. Tenta de novo em instantes.'` e `especificas = {}`:
```ts
  protected async salvar(dados: Omit<Produto, 'id'>): Promise<void> {
    this.erro.set(null);
    const editando = this.produtoEditando();
    try {
      if (editando) {
        await this.produtosService.atualizar(editando.id, dados);
      } else {
        await this.produtosService.criar(dados);
      }
    } catch (erro) {
      this.erro.set(mensagemDeErro(erro, {}, 'Não deu pra salvar o produto agora. Tenta de novo em instantes.'));
      this.modalAberto.set(false);
      return;
    }
    this.modalAberto.set(false);
    await this.carregar();
  }

  protected async confirmarRemocao(): Promise<void> {
    const produto = this.produtoParaRemover();
    if (!produto) return;
    this.erro.set(null);
    try {
      await this.produtosService.remover(produto.id);
    } catch (erro) {
      this.erro.set(mensagemDeErro(erro, {}, 'Não deu pra remover o produto agora. Tenta de novo em instantes.'));
    }
    this.produtoParaRemover.set(null);
    await this.carregar();
  }
```
`produtos.html` ganha o mesmo bloco `@if (erro())` depois do cabeçalho; `produtos.scss` a mesma regra `.admin-tela__erro`.
Em `produtos.spec.ts`, adicionar:
```ts
  it('mostra erro de validação do servidor ao salvar', async () => {
    await montar([]);
    servicoFalso.criar.and.rejectWith(new Error('VALIDACAO'));
    fixture.componentInstance['abrirNovo']();
    const { id: _id, ...dados } = PRODUTO;
    await fixture.componentInstance['salvar'](dados);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('validação do servidor');
  });
```
(Use o nome da função de montagem já existente em `produtos.spec.ts`; se ela se chamar diferente de `montar`, ajuste.)

Run: `npx ng test --watch=false --include=src/app/features/admin/produtos/produtos.spec.ts`
Expected: PASS.

- [ ] **Step 11: Polimento visual**

Invocar a skill `frontend-design` para revisar as linhas de erro novas (Admin Eventos/Pedidos/Produtos e Recuperar senha) dentro dos tokens existentes — espaçamento em relação ao cabeçalho/tabela e consistência com `.cartao-auth__erro`/`.checkout__erro`. Sem tokens novos.

- [ ] **Step 12: Commit**

```bash
git add src/app/core/api src/app/features
git commit -m "feat: mensagens de erro especificas por codigo da API

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Fuso horário no `EventoForm`

**Files:**
- Modify: `src/app/features/admin/eventos/evento-form/evento-form.ts`, `evento-form.spec.ts`

**Interfaces:**
- Produces: função de módulo `paraDataHoraLocal(iso: string): string` (não exportada) — `YYYY-MM-DDTHH:mm` no fuso local.

- [ ] **Step 1: Escrever o teste (falhando)**

Em `evento-form.spec.ts`, adicionar:
```ts
  it('em modo edição, pré-preenche a data no fuso local (salvar sem mexer mantém o mesmo instante)', () => {
    fixture.componentRef.setInput('evento', EVENTO);
    fixture.detectChanges();
    const valorCampo = fixture.componentInstance['form'].controls.dataHora.value;
    // `datetime-local` é interpretado no fuso local: precisa voltar ao mesmo instante UTC.
    expect(new Date(valorCampo).toISOString()).toBe(EVENTO.dataHora);
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/features/admin/eventos/evento-form/evento-form.spec.ts`
Expected: FAIL — `Expected '2026-01-16T11:00:00.000Z' to be '2026-01-16T08:00:00.000Z'` (em máquina com fuso UTC−3; numa máquina em UTC o teste passa já no Step 2 — registre isso no relatório da task).

- [ ] **Step 3: Implementar**

Em `evento-form.ts`, adicionar acima do `@Component`:
```ts
/** Converte um ISO (UTC) para o formato do `<input type="datetime-local">`, no fuso do navegador. */
function paraDataHoraLocal(iso: string): string {
  const data = new Date(iso);
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  return (
    `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}` +
    `T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`
  );
}
```
e no `ngOnChanges` trocar `dataHora: evento.dataHora.slice(0, 16),` por `dataHora: paraDataHoraLocal(evento.dataHora),`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/features/admin/eventos/evento-form/evento-form.spec.ts`
Expected: PASS (5 specs).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/admin/eventos/evento-form
git commit -m "fix: EventoForm pre-preenche data no fuso local

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Tela Redefinir senha

**Files:**
- Create: `src/app/features/auth/redefinir-senha/redefinir-senha.ts`, `.html`, `.scss`, `.spec.ts`
- Modify: `src/app/features/auth/auth.routes.ts`

**Interfaces:**
- Consumes: `AuthService.redefinirSenha(token, novaSenha)` (Task 3); `senhaForte()`, `senhasIguais()` (`shared/validators/senha.validators.ts`); `mensagemDeErro` (Task 10); `TextField`, `Button`, `Logo`; estilos `styles/auth`.
- Produces: rota pública `/redefinir-senha?token=…`; componente `RedefinirSenha` com `token = input<string | undefined>()` (preenchido pelo `withComponentInputBinding` a partir da query string).

- [ ] **Step 1: Escrever o teste (falhando)**

`src/app/features/auth/redefinir-senha/redefinir-senha.spec.ts`:
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RedefinirSenha } from './redefinir-senha';
import { AuthService } from '../../../core/auth/auth.service';

describe('RedefinirSenha', () => {
  let fixture: ComponentFixture<RedefinirSenha>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'redefinirSenha'>>;

  async function montar(token?: string): Promise<void> {
    authServiceFalso = jasmine.createSpyObj('AuthService', ['redefinirSenha']);
    authServiceFalso.redefinirSenha.and.resolveTo();
    await TestBed.configureTestingModule({
      imports: [RedefinirSenha],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();
    fixture = TestBed.createComponent(RedefinirSenha);
    if (token !== undefined) fixture.componentRef.setInput('token', token);
    fixture.detectChanges();
  }

  async function enviar(novaSenha: string, confirmarSenha: string): Promise<void> {
    fixture.componentInstance['form'].setValue({ novaSenha, confirmarSenha });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('sem token na URL mostra "link inválido" e não mostra o formulário', async () => {
    await montar();
    expect(fixture.nativeElement.textContent).toContain('Link inválido');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('não envia quando as senhas não coincidem', async () => {
    await montar('tok');
    await enviar('senhaNova123', 'outraSenha123');
    expect(authServiceFalso.redefinirSenha).not.toHaveBeenCalled();
  });

  it('não envia senha com menos de 8 caracteres', async () => {
    await montar('tok');
    await enviar('curta', 'curta');
    expect(authServiceFalso.redefinirSenha).not.toHaveBeenCalled();
  });

  it('envia token e nova senha e mostra o sucesso com link para o login', async () => {
    await montar('tok');
    await enviar('senhaNova123', 'senhaNova123');
    expect(authServiceFalso.redefinirSenha).toHaveBeenCalledWith('tok', 'senhaNova123');
    expect(fixture.nativeElement.textContent).toContain('Senha alterada');
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="/login"]');
    expect(link).not.toBeNull();
  });

  it('TOKEN_INVALIDO mostra que o link expirou, com link para pedir outro', async () => {
    await montar('tok');
    authServiceFalso.redefinirSenha.and.rejectWith(new Error('TOKEN_INVALIDO'));
    await enviar('senhaNova123', 'senhaNova123');
    expect(fixture.nativeElement.textContent).toContain('expirou ou já foi usado');
    expect(fixture.nativeElement.querySelector('a[href="/recuperar-senha"]')).not.toBeNull();
  });

  it('outros erros mostram mensagem geral e mantêm o formulário', async () => {
    await montar('tok');
    authServiceFalso.redefinirSenha.and.rejectWith(new Error('SEM_CONEXAO'));
    await enviar('senhaNova123', 'senhaNova123');
    expect(fixture.nativeElement.textContent).toContain('Não conseguimos falar com o servidor');
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(fixture.componentInstance['enviando']()).toBeFalse();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx ng test --watch=false --include=src/app/features/auth/redefinir-senha/redefinir-senha.spec.ts`
Expected: FAIL de compilação — `Cannot find module './redefinir-senha'`.

- [ ] **Step 3: Implementar o componente**

`src/app/features/auth/redefinir-senha/redefinir-senha.ts`:
```ts
import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { mensagemDeErro } from '../../../core/api/mensagem-erro';
import { senhaForte, senhasIguais } from '../../../shared/validators/senha.validators';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { Button } from '../../../shared/ui/button/button';
import { Logo } from '../../../shared/ui/logo/logo';

type Estado = 'formulario' | 'sucesso' | 'token_invalido';

@Component({
  selector: 'app-redefinir-senha',
  imports: [ReactiveFormsModule, RouterLink, TextField, Button, Logo],
  templateUrl: './redefinir-senha.html',
  styleUrl: './redefinir-senha.scss',
})
export class RedefinirSenha {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  /** Vem de `?token=` (link do e-mail), via withComponentInputBinding. */
  readonly token = input<string | undefined>();

  protected readonly form = this.fb.nonNullable.group(
    {
      novaSenha: ['', [Validators.required, senhaForte()]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: senhasIguais('novaSenha', 'confirmarSenha') },
  );

  protected readonly estado = signal<Estado>('formulario');
  protected readonly enviando = signal(false);
  protected readonly erroGeral = signal<string | null>(null);

  protected get erroNovaSenha(): string {
    const c = this.form.controls.novaSenha;
    if (c.touched && c.hasError('required')) return 'Crie uma nova senha.';
    if (c.touched && c.hasError('senhaFraca')) return 'A senha precisa ter pelo menos 8 caracteres.';
    return '';
  }

  protected get erroConfirmarSenha(): string {
    if (!this.form.controls.confirmarSenha.touched) return '';
    if (this.form.controls.confirmarSenha.hasError('required')) return 'Confirme a nova senha.';
    if (this.form.hasError('senhasDiferentes')) return 'As senhas não coincidem.';
    return '';
  }

  protected async aoEnviar(): Promise<void> {
    const token = this.token();
    if (!token) {
      this.estado.set('token_invalido');
      return;
    }
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erroGeral.set(null);
    try {
      await this.auth.redefinirSenha(token, this.form.getRawValue().novaSenha);
      this.estado.set('sucesso');
    } catch (erro) {
      if (erro instanceof Error && erro.message === 'TOKEN_INVALIDO') {
        this.estado.set('token_invalido');
      } else {
        this.erroGeral.set(
          mensagemDeErro(erro, {}, 'Não deu pra trocar sua senha agora. Tenta de novo em instantes.'),
        );
      }
    } finally {
      this.enviando.set(false);
    }
  }
}
```

`src/app/features/auth/redefinir-senha/redefinir-senha.html`:
```html
<div class="tela-auth">
  <div class="cartao-auth">
    <app-logo variante="amarelo-transparente" tamanho="56px" />

    @if (!token() || estado() === 'token_invalido') {
      <h1 class="titulo-1">Link inválido</h1>
      <p class="texto-corpo">Esse link de redefinição expirou ou já foi usado. Pede um novo e tenta de novo.</p>
      <div class="cartao-auth__links">
        <a routerLink="/recuperar-senha">Pedir novo link</a>
        <a routerLink="/login">Voltar pro login</a>
      </div>
    } @else if (estado() === 'sucesso') {
      <h1 class="titulo-1">Senha alterada</h1>
      <p class="texto-corpo">Pronto! Agora é só entrar com a sua nova senha.</p>
      <div class="cartao-auth__links">
        <a routerLink="/login">Ir para o login</a>
      </div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="aoEnviar()" class="cartao-auth">
        <h1 class="titulo-1">Nova senha</h1>
        <p class="texto-corpo">Escolhe uma senha nova com pelo menos 8 caracteres.</p>
        <app-text-field rotulo="Nova senha" tipo="password" [controle]="form.controls.novaSenha" [erro]="erroNovaSenha" />
        <app-text-field
          rotulo="Confirmar nova senha"
          tipo="password"
          [controle]="form.controls.confirmarSenha"
          [erro]="erroConfirmarSenha"
        />
        @if (erroGeral()) {
          <p class="cartao-auth__erro" role="alert">{{ erroGeral() }}</p>
        }
        <app-button tipo="submit" [carregando]="enviando()">Salvar nova senha</app-button>
      </form>
      <div class="cartao-auth__links">
        <a routerLink="/login">Voltar pro login</a>
      </div>
    }
  </div>
</div>
```

`src/app/features/auth/redefinir-senha/redefinir-senha.scss`:
```scss
@use 'styles/auth' as *;
```

- [ ] **Step 4: Registrar a rota**

Em `src/app/features/auth/auth.routes.ts`, adicionar ao array, depois de `recuperar-senha`:
```ts
  { path: 'redefinir-senha', loadComponent: () => import('./redefinir-senha/redefinir-senha').then((m) => m.RedefinirSenha) },
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx ng test --watch=false --include=src/app/features/auth/redefinir-senha/redefinir-senha.spec.ts`
Expected: PASS (6 specs).

- [ ] **Step 6: Polimento visual**

Invocar a skill `frontend-design` para a tela nova, mantendo paridade visual com `RecuperarSenha`/`Cadastro` (mesmo `styles/auth`, sem tokens novos). Se o polimento mudar markup, rodar de novo a spec do Step 5.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/auth
git commit -m "feat: tela de redefinir senha com token do e-mail

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Reescrever a integração de rotas (`app.routes.spec.ts`)

**Files:**
- Rewrite: `src/app/app.routes.spec.ts`

**Interfaces:**
- Consumes: `SessaoStore.definir` (Task 2); nomes de método dos serviços das Tasks 5-8 (`listarDestaques`, `listar`, `buscarPorId`, `listarMinhas`, `listarPorEvento`, `listarTodos`, `listarMeus`, `ultimoPedido`, `limparUltimoPedido`).

- [ ] **Step 1: Reescrever**

Substituir todo o conteúdo de `src/app/app.routes.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { SessaoStore } from './core/auth/sessao.store';
import { Usuario } from './core/auth/usuario.model';
import { ProductService } from './core/products/product.service';
import { EventService } from './core/events/event.service';
import { RegistrationService } from './core/registrations/registration.service';
import { OrderService } from './core/orders/order.service';
import { Evento } from './core/events/evento.model';

const JOVEM: Usuario = { id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' };
const ADMIN: Usuario = { id: 'a1', nome: 'Admin', email: 'admin@rede.com', papel: 'admin' };
const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2099-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  vagasRestantes: 4,
  foto: 'https://picsum.photos/seed/x/480/480',
};

describe('Rotas do app (integração)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ProductService,
          useValue: { listar: async () => [], listarDestaques: async () => [], buscarPorId: async () => undefined },
        },
        { provide: EventService, useValue: { listar: async () => [EVENTO], buscarPorId: async () => EVENTO } },
        { provide: RegistrationService, useValue: { listarMinhas: async () => [], listarPorEvento: async () => [] } },
        {
          provide: OrderService,
          useValue: {
            listarTodos: async () => [],
            listarMeus: async () => [],
            ultimoPedido: signal(null),
            limparUltimoPedido: () => undefined,
          },
        },
      ],
    });
  });

  function logarComo(usuario: Usuario): void {
    TestBed.inject(SessaoStore).definir({ usuario, token: 'jwt-teste' });
  }

  it('"/" renderiza a Home da loja', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });

  it('"/loja" renderiza as Categorias', async () => {
    const harness = await RouterTestingHarness.create('/loja');
    expect(harness.routeNativeElement?.textContent).toContain('Camisetas');
  });

  it('"/loja/carrinho" sem login redireciona para "/login"', async () => {
    const harness = await RouterTestingHarness.create('/loja/carrinho');
    expect(harness.routeNativeElement?.textContent).toContain('Entrar na REDE');
  });

  it('"/loja/carrinho" logado renderiza o Carrinho', async () => {
    logarComo(JOVEM);
    const harness = await RouterTestingHarness.create('/loja/carrinho');
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).not.toContain('Entrar na REDE');
  });

  it('"/eventos" renderiza a Agenda de eventos', async () => {
    const harness = await RouterTestingHarness.create('/eventos');
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).toContain('Agenda de eventos');
  });

  it('"/eventos/:id" renderiza os Detalhes do evento', async () => {
    const harness = await RouterTestingHarness.create('/eventos/1');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Retiro de Verão REDE');
  });

  it('"/eventos/minhas-inscricoes" sem login redireciona para "/login"', async () => {
    const harness = await RouterTestingHarness.create('/eventos/minhas-inscricoes');
    expect(harness.routeNativeElement?.textContent).toContain('Entrar na REDE');
  });

  it('"/eventos/1/confirmacao" sem login redireciona para "/login"', async () => {
    const harness = await RouterTestingHarness.create('/eventos/1/confirmacao');
    expect(harness.routeNativeElement?.textContent).toContain('Entrar na REDE');
  });

  it('"/eventos/minhas-inscricoes" logado renderiza Minhas inscrições, não a rota :id', async () => {
    logarComo(JOVEM);
    const harness = await RouterTestingHarness.create('/eventos/minhas-inscricoes');
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).not.toContain('Entrar na REDE');
    expect(harness.routeNativeElement?.textContent).toContain('Minhas inscrições');
  });

  it('"/redefinir-senha" sem token mostra link inválido', async () => {
    const harness = await RouterTestingHarness.create('/redefinir-senha');
    expect(harness.routeNativeElement?.textContent).toContain('Link inválido');
  });

  it('"/redefinir-senha?token=abc" mostra o formulário de nova senha', async () => {
    const harness = await RouterTestingHarness.create('/redefinir-senha?token=abc');
    expect(harness.routeNativeElement?.textContent).toContain('Nova senha');
  });

  it('"/admin" sem login redireciona para "/"', async () => {
    const harness = await RouterTestingHarness.create('/admin');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });

  it('"/admin" logado como jovem redireciona para "/"', async () => {
    logarComo(JOVEM);
    const harness = await RouterTestingHarness.create('/admin');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });

  it('"/admin" logado como admin renderiza a tela de Produtos', async () => {
    logarComo(ADMIN);
    const harness = await RouterTestingHarness.create('/admin');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Produtos');
  });

  it('"/admin/pedidos" logado como admin renderiza a tela de Pedidos', async () => {
    logarComo(ADMIN);
    const harness = await RouterTestingHarness.create('/admin/pedidos');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Pedidos');
  });

  it('uma rota desconhecida redireciona para "/"', async () => {
    const harness = await RouterTestingHarness.create('/rota-que-nao-existe');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });
});
```

- [ ] **Step 2: Rodar**

Run: `npx ng test --watch=false --include=src/app/app.routes.spec.ts`
Expected: PASS (16 specs). Se algum teste falhar por uma tela chamar um método de serviço que não está nos stubs acima, adicionar esse método ao `useValue` correspondente (resolvendo com `[]`/`undefined`) — não mudar a tela.

- [ ] **Step 3: Commit**

```bash
git add src/app/app.routes.spec.ts
git commit -m "test: integracao de rotas com servicos HTTP stubados e sessao JWT

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Seed de desenvolvimento, roteiro de teste e README

**Files:**
- Create: `docs/backend/seed-dev.sql`, `docs/backend/roteiro-integracao.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: schema do backend (spec seção 7): tabelas `"Usuarios"`, `"Produtos"`, `"Variacoes"`, `"Eventos"`; enums gravados pelo nome C# (`'Admin'`, `'Camisetas'`, `'Moletons'`, `'Acessorios'`).

- [ ] **Step 1: Escrever o seed**

`docs/backend/seed-dev.sql`:
```sql
-- Seed de DESENVOLVIMENTO para testar o front da REDE contra a API local.
-- Pré-requisito: as contas admin@rede.com e jovem@rede.com já foram criadas pela tela de cadastro
-- (a senha usa o hash do ASP.NET Identity e não pode ser gerada por SQL).
-- Idempotente: só insere produtos/eventos se as tabelas estiverem vazias.
-- Atenção: o banco grava enums pelo NOME C# ('Admin', 'Camisetas'), não em minúsculas como o JSON.

BEGIN;

UPDATE "Usuarios" SET "Papel" = 'Admin' WHERE lower("Email") = 'admin@rede.com';

DO $$
DECLARE
  p uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Produtos") THEN
    p := gen_random_uuid();
    INSERT INTO "Produtos" ("Id", "Nome", "Categoria", "Preco", "Descricao", "Fotos", "Destaque")
    VALUES (p, 'Camiseta REDE Clássica', 'Camisetas', 79.90, 'Camiseta 100% algodão com a marca REDE estampada no peito.',
            ARRAY['https://picsum.photos/seed/camiseta-classica-rede/480/480'], true);
    INSERT INTO "Variacoes" ("Id", "ProdutoId", "Tamanho", "Cor", "Estoque") VALUES
      (gen_random_uuid(), p, 'P', 'Preto', 12), (gen_random_uuid(), p, 'P', 'Amarelo', 8),
      (gen_random_uuid(), p, 'M', 'Preto', 15), (gen_random_uuid(), p, 'M', 'Amarelo', 10),
      (gen_random_uuid(), p, 'G', 'Preto', 9),  (gen_random_uuid(), p, 'G', 'Amarelo', 6),
      (gen_random_uuid(), p, 'GG', 'Preto', 4), (gen_random_uuid(), p, 'GG', 'Amarelo', 0);

    p := gen_random_uuid();
    INSERT INTO "Produtos" ("Id", "Nome", "Categoria", "Preco", "Descricao", "Fotos", "Destaque")
    VALUES (p, 'Camiseta REDE Minimalista', 'Camisetas', 74.90, 'Estampa discreta, para o dia a dia.',
            ARRAY['https://picsum.photos/seed/camiseta-minimalista-rede/480/480'], false);
    INSERT INTO "Variacoes" ("Id", "ProdutoId", "Tamanho", "Cor", "Estoque") VALUES
      (gen_random_uuid(), p, 'P', 'Preto', 10), (gen_random_uuid(), p, 'P', 'Amarelo', 10),
      (gen_random_uuid(), p, 'M', 'Preto', 10), (gen_random_uuid(), p, 'M', 'Amarelo', 10),
      (gen_random_uuid(), p, 'G', 'Preto', 10), (gen_random_uuid(), p, 'G', 'Amarelo', 10),
      (gen_random_uuid(), p, 'GG', 'Preto', 10), (gen_random_uuid(), p, 'GG', 'Amarelo', 10);

    p := gen_random_uuid();
    INSERT INTO "Produtos" ("Id", "Nome", "Categoria", "Preco", "Descricao", "Fotos", "Destaque")
    VALUES (p, 'Camiseta REDE Edição Retiro', 'Camisetas', 84.90, 'Estampa exclusiva do último retiro da REDE.',
            ARRAY['https://picsum.photos/seed/camiseta-retiro-rede/480/480'], false);
    INSERT INTO "Variacoes" ("Id", "ProdutoId", "Tamanho", "Cor", "Estoque") VALUES
      (gen_random_uuid(), p, 'P', 'Preto', 5), (gen_random_uuid(), p, 'M', 'Preto', 7),
      (gen_random_uuid(), p, 'G', 'Preto', 3);

    p := gen_random_uuid();
    INSERT INTO "Produtos" ("Id", "Nome", "Categoria", "Preco", "Descricao", "Fotos", "Destaque")
    VALUES (p, 'Moletom REDE Essencial', 'Moletons', 139.90, 'Moletom canguru, forro macio.',
            ARRAY['https://picsum.photos/seed/moletom-essencial-rede/480/480'], true);
    INSERT INTO "Variacoes" ("Id", "ProdutoId", "Tamanho", "Cor", "Estoque") VALUES
      (gen_random_uuid(), p, 'P', 'Preto', 5), (gen_random_uuid(), p, 'P', 'Amarelo', 5),
      (gen_random_uuid(), p, 'M', 'Preto', 5), (gen_random_uuid(), p, 'M', 'Amarelo', 5),
      (gen_random_uuid(), p, 'G', 'Preto', 5), (gen_random_uuid(), p, 'G', 'Amarelo', 5),
      (gen_random_uuid(), p, 'GG', 'Preto', 5), (gen_random_uuid(), p, 'GG', 'Amarelo', 5);

    p := gen_random_uuid();
    INSERT INTO "Produtos" ("Id", "Nome", "Categoria", "Preco", "Descricao", "Fotos", "Destaque")
    VALUES (p, 'Moletom REDE Oversized', 'Moletons', 149.90, 'Corte oversized, streetwear.',
            ARRAY['https://picsum.photos/seed/moletom-oversized-rede/480/480'], false);
    INSERT INTO "Variacoes" ("Id", "ProdutoId", "Tamanho", "Cor", "Estoque") VALUES
      (gen_random_uuid(), p, 'M', 'Preto', 6), (gen_random_uuid(), p, 'G', 'Preto', 8),
      (gen_random_uuid(), p, 'GG', 'Preto', 2);

    p := gen_random_uuid();
    INSERT INTO "Produtos" ("Id", "Nome", "Categoria", "Preco", "Descricao", "Fotos", "Destaque")
    VALUES (p, 'Boné REDE', 'Acessorios', 59.90, 'Boné aba curva bordado.',
            ARRAY['https://picsum.photos/seed/bone-rede/480/480'], true);
    INSERT INTO "Variacoes" ("Id", "ProdutoId", "Tamanho", "Cor", "Estoque") VALUES
      (gen_random_uuid(), p, 'Único', 'Preto', 20), (gen_random_uuid(), p, 'Único', 'Amarelo', 15);

    p := gen_random_uuid();
    INSERT INTO "Produtos" ("Id", "Nome", "Categoria", "Preco", "Descricao", "Fotos", "Destaque")
    VALUES (p, 'Squeeze REDE', 'Acessorios', 39.90, 'Squeeze 600ml com o logo da REDE.',
            ARRAY['https://picsum.photos/seed/squeeze-rede/480/480'], false);
    INSERT INTO "Variacoes" ("Id", "ProdutoId", "Tamanho", "Cor", "Estoque") VALUES
      (gen_random_uuid(), p, 'Único', 'Preto', 30);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "Eventos") THEN
    INSERT INTO "Eventos" ("Id", "Titulo", "Descricao", "DataHora", "Local", "Preco", "VagasTotais", "Foto") VALUES
      (gen_random_uuid(), 'Retiro de Verão REDE', 'Um fim de semana de imersão, comunhão e descanso para os jovens da REDE.',
       date_trunc('hour', now()) + interval '30 days', 'Sítio Vida Nova, Ibiúna', 250.00, 4,
       'https://picsum.photos/seed/retiro-verao-rede/480/480'),
      (gen_random_uuid(), 'Encontro de Jovens', 'Noite de louvor, palavra e comunhão na igreja.',
       date_trunc('hour', now()) + interval '5 days', 'Templo sede, Vila Maria', 0, 100,
       'https://picsum.photos/seed/encontro-jovens-rede/480/480'),
      (gen_random_uuid(), 'Culto Especial de Missões', 'Culto dedicado ao envio e apoio aos missionários da igreja.',
       date_trunc('hour', now()) + interval '12 days', 'Templo sede, Vila Maria', 0, 200,
       'https://picsum.photos/seed/culto-missoes-rede/480/480'),
      (gen_random_uuid(), 'Acampamento de Carnaval', 'Três dias de atividades ao ar livre, esportes e devocionais.',
       date_trunc('hour', now()) + interval '60 days', 'Chácara Monte Sião, Mairiporã', 180.00, 3,
       'https://picsum.photos/seed/acampamento-carnaval-rede/480/480'),
      (gen_random_uuid(), 'Workshop de Louvor', 'Oficina prática de instrumentos e ministério de louvor para iniciantes.',
       date_trunc('hour', now()) + interval '8 days', 'Templo sede, Vila Maria', 40.00, 20,
       'https://picsum.photos/seed/workshop-louvor-rede/480/480'),
      (gen_random_uuid(), 'Vigília de Oração', 'Noite inteira de oração e adoração para encerrar o trimestre.',
       date_trunc('hour', now()) - interval '10 days', 'Templo sede, Vila Maria', 0, 150,
       'https://picsum.photos/seed/vigilia-oracao-rede/480/480');
  END IF;
END $$;

COMMIT;
```
(A Vigília fica no passado de propósito, para conferir que a Agenda esconde eventos já realizados.)

- [ ] **Step 2: Escrever o roteiro**

`docs/backend/roteiro-integracao.md`:
````markdown
# Roteiro de teste — Front ↔ Backend

## 1. Subir o backend (`../RedeStore-BackEnd`)

```bash
docker compose up -d db
cd src/RedeStore.Api
# uma vez: user-secrets conforme o README do backend, incluindo
dotnet user-secrets set "Frontend:ResetPasswordUrl" "http://localhost:4200/redefinir-senha"
# (Resend:ApiKey válida só é necessária para testar o e-mail de recuperação)
dotnet run
```

Conferir: `http://localhost:5052/health` → `{ "status": "healthy", "database": "connected" }`.

## 2. Subir o front

```bash
npm start
```

Abrir `http://localhost:4200`.

## 3. Criar contas e popular dados

1. Em `/cadastro`, criar `admin@rede.com` e `jovem@rede.com` (senha com 8+ caracteres).
2. Rodar o seed a partir da raiz do backend:
   ```bash
   docker compose exec -T db psql -U postgres -d redestore < "../RedeStore-FrontEnd/docs/backend/seed-dev.sql"
   ```
3. Se estiver logado como `admin@rede.com`, **sair e entrar de novo** — o papel fica gravado no token.

## 4. Checklist

**Loja (como jovem)**
- [ ] Home mostra 3 destaques e os próximos eventos.
- [ ] `/loja` → categoria Camisetas lista 3 produtos; busca "moletom" filtra.
- [ ] Detalhe da Camiseta Clássica: GG/Amarelo aparece sem estoque.
- [ ] Adicionar ao carrinho, checkout com **retirada** → confirmação com código curto (`#XXXXXXXX`).
- [ ] Checkout com **entrega** exige endereço; pedido aparece em "Meus pedidos" e no Perfil.
- [ ] Estoque insuficiente: colocar no carrinho mais unidades do que o estoque (ex.: Moletom Oversized GG ×3, estoque 2) → mensagem "acabou de esgotar".

**Eventos (como jovem)**
- [ ] Agenda lista 5 eventos (a Vigília, no passado, não aparece) com vagas restantes.
- [ ] Inscrição no Workshop → "Inscrição confirmada!"; voltar e entrar de novo → "Você já está inscrito".
- [ ] Minhas inscrições → cancelar → status "Cancelada"; a vaga volta na Agenda.
- [ ] Encher o Acampamento (3 vagas) com outras contas → próxima tentativa mostra "Esgotado".

**Admin (como admin)**
- [ ] Link Admin aparece no Header; `/admin` abre Produtos.
- [ ] Criar, editar (mudar estoque de uma variação) e remover um produto.
- [ ] Criar um evento; editar **sem mexer na data** → o horário não muda.
- [ ] Reduzir as vagas de um evento abaixo das inscrições confirmadas → mensagem "não pode ficar abaixo".
- [ ] Remover evento com inscrição confirmada → mensagem "Cancele-as antes de remover".
- [ ] Inscrições do evento listam o nome do jovem; cancelar uma pelo admin.
- [ ] Pedidos: avançar `Pago → Em preparo → Retirado/Entregue`; o botão some no estado final.

**Conta**
- [ ] Perfil: alterar nome/telefone; trocar e-mail para o de outra conta → "já está em uso".
- [ ] `/recuperar-senha` → e-mail chega (com Resend configurado) → link abre `/redefinir-senha?token=…` → nova senha → login com ela funciona.
- [ ] Usar o mesmo link de novo → "Link inválido".
- [ ] Sessão expirada: no DevTools, editar o `token` em `localStorage.rede_sessao` para um valor inválido e abrir "Meus pedidos" → volta para `/login` deslogado.
- [ ] Backend desligado: tentar logar → "Não conseguimos falar com o servidor".
````

- [ ] **Step 3: Atualizar o README**

Em `README.md`, logo depois da seção `## Como rodar` (antes da próxima seção `##`), adicionar:
```markdown
## Rodando com o backend

O front consome a API do repositório `RedeStore-BackEnd` (padrão `http://localhost:5052`, configurado em
`src/environments/environment.ts`). Passo a passo para subir os dois, popular dados de teste e o
checklist de fluxos: [`docs/backend/roteiro-integracao.md`](docs/backend/roteiro-integracao.md).
```
E trocar o parágrafo que começa com "Este repositório está no subprojeto **Fundação**…" por:
```markdown
Os subprojetos Fundação, Loja, Eventos e Admin estão concluídos, e o front está integrado à API real (`RedeStore-BackEnd`) — veja [Documentação do projeto](#documentação-do-projeto).
```

- [ ] **Step 4: Commit**

```bash
git add docs/backend/seed-dev.sql docs/backend/roteiro-integracao.md README.md
git commit -m "docs: seed de desenvolvimento, roteiro de teste da integracao e README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Entrega**

Perguntar ao usuário se quer rodar a suíte completa / `ng build` antes do PR (não rodar sem pedido). Depois: `git push -u origin feature/rede-integracao-backend` e entregar a compare URL `https://github.com/KauaVidal/RedeStore-FrontEnd/compare/main...feature/rede-integracao-backend?expand=1` com título e descrição sugeridos (descrição termina com `🤖 Generated with [Claude Code](https://claude.com/claude-code)`).
