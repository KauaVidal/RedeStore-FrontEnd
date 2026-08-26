# REDE Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Admin panel for the REDE site — CRUD for Produtos and Eventos, order status management, and per-event registration management — behind the existing `adminGuard`, in a new desktop-first shell.

**Architecture:** New write methods (`criar`/`atualizar`/`remover`, `listarTodos`, `atualizarStatus`, `listarPorEvento`, `buscarPorId`) added to the four existing mock services (`ProductService`, `EventService`, `OrderService`, `RegistrationService`, `AuthService`) — no model or mock-store schema changes. Four new shared design-system components (`Table`, `Modal`, `Select`, `Textarea`) built in the same style as the existing ones (`Button`, `TextField`, `EmptyState`). A new `AdminShell` layout (sidebar) wraps a `/admin` route tree that is a sibling of the main `Shell`, not nested inside it, guarded by `adminGuard` at the parent route.

**Tech Stack:** Angular 22 (standalone components, signals, zoneless), Reactive Forms, Karma/Jasmine — same stack as Fundação/Loja/Eventos. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-25-rede-admin-design.md`

## Global Constraints

- Escopo confirmado: Produtos (CRUD), Pedidos (avançar status), Eventos (CRUD), Inscrições por evento (ver/cancelar) — as quatro áreas juntas nesta fase.
- `/admin` tem um `AdminShell` próprio (sidebar), **não** reaproveita o `Shell` mobile (Header/BottomNav/Footer) do resto do site.
- Criar/editar Produto e Evento sempre em `Modal`, nunca em rota dedicada.
- Sem tela de dashboard/estatísticas: `/admin` redireciona direto para `/admin/produtos`.
- **Nenhuma mudança nos modelos de dados existentes** (`Produto`, `Evento`, `Pedido`, `Inscricao`) — só métodos novos nos serviços.
- `adminGuard` **já existe** em `src/app/core/auth/auth.guard.ts` (linhas 11-14) e nunca foi usado em nenhuma rota — só precisa ser aplicado. Login de teste já existe: `admin@rede.com` / `admin123`.
- Regra de transição de status do pedido — **não é uma sequência linear única**:
  ```
  pago → em_preparo → retirado    (quando formaEntrega === 'retirada')
  pago → em_preparo → entregue    (quando formaEntrega === 'entrega')
  ```
  Sem transição para trás. Um pedido em `retirado` ou `entregue` não tem próximo status.
- Convenção de nomes idêntica ao resto do projeto: componentes **sem** sufixo `Component`, serviços **com** sufixo `Service`, Signals para estado (`input()`/`output()`/`signal()`/`computed()`), sem NgRx, sem `ControlValueAccessor` customizado — os campos de formulário (`TextField`/`Select`/`Textarea`) recebem um `FormControl` via `input.required<FormControl>()` e usam `[formControl]` direto no template, exatamente como `TextField` já faz hoje.
- **Padrão de CD em testes (zoneless, já validado na Fundação/Loja/Eventos):** uma mutação de signal feita **antes** do primeiro `detectChanges()` é sempre segura. Uma mutação feita **depois** — por um evento síncrono (clique) — precisa de `fixture.detectChanges(); await fixture.whenStable();`, nessa ordem. Um `ngOnInit` que aguarda uma chamada de serviço assíncrona precisa da sequência já usada em `meus-pedidos.spec.ts`: `fixture.detectChanges()` (dispara o `ngOnInit`) → `await fixture.whenStable()` (aguarda a promise) → `fixture.detectChanges()` (renderiza o resultado). Todos os testes abaixo já seguem o padrão certo — não precisa decidir de novo.
- Tokens de design (`src/styles/_tokens.scss`) são os mesmos do resto do site — nenhum token novo é criado nesta fase.
- **Uso obrigatório da skill frontend-design**: depois de implementar a estrutura funcional (HTML/TS/testes) de cada componente novo de design system (Modal, Select, Textarea, Table) e de cada tela nova do Admin, invoque a skill `frontend-design` para refinar o CSS (espaçamento, hierarquia visual, tipografia) usando os tokens existentes, antes de considerar a task concluída. O CSS mostrado em cada step abaixo é a base funcional mínima (estrutura, não o polimento final).
- `id` de registros novos (`criar()`) segue a mesma convenção já usada em `OrderService`/`AuthService.cadastrar`: `String(ARRAY.length + 1)`.

---

## Estrutura de arquivos

```
src/app/
  core/
    auth/
      auth.service.ts (+ .spec.ts)              MODIFY — buscarPorId
    products/
      product.service.ts (+ .spec.ts)           MODIFY — criar/atualizar/remover
    events/
      event.service.ts (+ .spec.ts)             MODIFY — criar/atualizar/remover
    orders/
      pedido.model.ts                           MODIFY — proximoStatus()
      pedido.model.spec.ts                      NEW
      order.service.ts (+ .spec.ts)             MODIFY — listarTodos/atualizarStatus
    registrations/
      registration.service.ts (+ .spec.ts)      MODIFY — listarPorEvento
  shared/ui/
    text-field/text-field.ts (+ .spec.ts)       MODIFY — tipo 'number' | 'datetime-local'
    modal/            (modal.ts/.html/.scss/.spec.ts)       NEW
    select/           (select.ts/.html/.scss/.spec.ts)      NEW
    textarea/         (textarea.ts/.html/.scss/.spec.ts)    NEW
    table/            (table.ts/.html/.scss/.spec.ts)       NEW
  layout/
    admin-shell/      (admin-shell.ts/.html/.scss/.spec.ts) NEW
    header/header.ts, header.html, header.spec.ts           MODIFY — link Admin
  features/admin/
    admin.routes.ts                             NEW
    produtos/
      produto-form/   (produto-form.ts/.html/.scss/.spec.ts) NEW
      produtos.ts, produtos.html, produtos.scss, produtos.spec.ts NEW
    eventos/
      evento-form/    (evento-form.ts/.html/.scss/.spec.ts)  NEW
      eventos.ts, eventos.html, eventos.scss, eventos.spec.ts NEW
      inscricoes/     (inscricoes.ts/.html/.scss/.spec.ts)   NEW
    pedidos/
      pedidos.ts, pedidos.html, pedidos.scss, pedidos.spec.ts NEW
  app.routes.ts (MODIFY)
  app.routes.spec.ts (MODIFY)
```

---

### Task 1: AuthService — buscarPorId

**Files:**
- Modify: `src/app/core/auth/auth.service.ts`, `src/app/core/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `USUARIOS_MOCK` (`core/auth/auth-mock-store.ts`, já existe), `mockLatency`
- Produces: `AuthService.buscarPorId(id: string): Promise<Usuario | undefined>`

- [ ] **Step 1: Escrever os testes que falham**

Adicione ao `describe('AuthService', ...)` em `auth.service.spec.ts` (junto aos outros `it`, antes do `afterEach` final):

```typescript
it('buscarPorId() retorna o usuário correspondente sem o campo senha', fakeAsync(() => {
  let usuario: { id: string; email: string; senha?: string } | undefined;
  service.buscarPorId('2').then((u) => (usuario = u));
  tick(400);
  expect(usuario?.email).toBe('jovem@rede.com');
  expect(usuario?.senha).toBeUndefined();
}));

it('buscarPorId() retorna undefined para um id inexistente', fakeAsync(() => {
  let usuario: unknown;
  let chamou = false;
  service.buscarPorId('inexistente').then((u) => {
    usuario = u;
    chamou = true;
  });
  tick(400);
  expect(chamou).toBeTrue();
  expect(usuario).toBeUndefined();
}));
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `ng test --watch=false`
Expected: FAIL em `AuthService > buscarPorId()...` com "service.buscarPorId is not a function"

- [ ] **Step 3: Implementar `buscarPorId`**

Em `auth.service.ts`, adicione o método logo depois de `cadastrar`:

```typescript
  async buscarPorId(id: string): Promise<Usuario | undefined> {
    await mockLatency(undefined);
    const encontrado = USUARIOS_MOCK.find((u) => u.id === id);
    return encontrado ? this.paraUsuario(encontrado) : undefined;
  }
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `AuthService`

- [ ] **Step 5: Commit**

```bash
git add src/app/core/auth/auth.service.ts src/app/core/auth/auth.service.spec.ts
git commit -m "feat: adiciona AuthService.buscarPorId para uso do Admin"
```

---

### Task 2: ProductService — criar/atualizar/remover

**Files:**
- Modify: `src/app/core/products/product.service.ts`, `src/app/core/products/product.service.spec.ts`

**Interfaces:**
- Consumes: `PRODUTOS_MOCK` (`core/products/product-mock-store.ts`), `Produto` (`core/products/produto.model.ts`)
- Produces: `ProductService.criar(dados: Omit<Produto, 'id'>): Promise<Produto>`, `.atualizar(id: string, dados: Partial<Omit<Produto, 'id'>>): Promise<Produto>`, `.remover(id: string): Promise<void>`

- [ ] **Step 1: Ajustar o topo do spec para restaurar o mock store a cada teste**

`PRODUTOS_MOCK` é um array estático mutável — os novos testes de `criar`/`atualizar`/`remover` vão alterá-lo, o que quebraria os testes existentes (`listar()` esperando length 7) se não for restaurado. Substitua o início de `product.service.spec.ts` (import e `beforeEach`) por:

```typescript
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ProductService } from './product.service';
import { PRODUTOS_MOCK } from './product-mock-store';
import { Produto } from './produto.model';

describe('ProductService', () => {
  let service: ProductService;
  let snapshot: Produto[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
    snapshot = PRODUTOS_MOCK.map((p) => ({ ...p, variacoes: p.variacoes.map((v) => ({ ...v })) }));
  });

  afterEach(() => {
    PRODUTOS_MOCK.length = 0;
    PRODUTOS_MOCK.push(...snapshot);
  });
```

(mantenha todos os `it` já existentes no arquivo sem alteração, só o cabeçalho do `describe` muda.)

- [ ] **Step 2: Escrever os testes que falham**

Adicione, antes do `});` final do `describe`:

```typescript
  it('criar() adiciona um novo produto com id sequencial', fakeAsync(() => {
    let produto: Produto | undefined;
    service
      .criar({
        nome: 'Camiseta Nova',
        categoria: 'camisetas',
        preco: 99.9,
        descricao: 'Descrição',
        fotos: ['https://picsum.photos/seed/nova/480/480'],
        tamanhos: ['M'],
        cores: ['Preto'],
        destaque: false,
        variacoes: [{ tamanho: 'M', cor: 'Preto', estoque: 5 }],
      })
      .then((p) => (produto = p));
    tick(400);
    expect(produto?.id).toBe('8');
    expect(produto?.nome).toBe('Camiseta Nova');

    let todos: Produto[] = [];
    service.listar().then((p) => (todos = p));
    tick(400);
    expect(todos.length).toBe(8);
  }));

  it('atualizar() altera os campos informados sem afetar os demais', fakeAsync(() => {
    let produto: Produto | undefined;
    service.atualizar('1', { preco: 89.9 }).then((p) => (produto = p));
    tick(400);
    expect(produto?.preco).toBe(89.9);
    expect(produto?.nome).toBe('Camiseta REDE Clássica');
  }));

  it('atualizar() rejeita quando o id não existe', fakeAsync(() => {
    let erro: Error | undefined;
    service.atualizar('inexistente', { preco: 10 }).catch((e) => (erro = e));
    tick(400);
    expect(erro?.message).toBe('PRODUTO_NAO_ENCONTRADO');
  }));

  it('remover() tira o produto da listagem', fakeAsync(() => {
    service.remover('1');
    tick(400);
    let todos: Produto[] = [];
    service.listar().then((p) => (todos = p));
    tick(400);
    expect(todos.find((p) => p.id === '1')).toBeUndefined();
    expect(todos.length).toBe(6);
  }));

  it('remover() com id inexistente não lança erro nem altera a lista', fakeAsync(() => {
    service.remover('inexistente');
    tick(400);
    let todos: Produto[] = [];
    service.listar().then((p) => (todos = p));
    tick(400);
    expect(todos.length).toBe(7);
  }));
```

- [ ] **Step 3: Rodar os testes e confirmar que falham**

Run: `ng test --watch=false`
Expected: FAIL com "service.criar is not a function"

- [ ] **Step 4: Implementar os três métodos**

Em `product.service.ts`, adicione dentro da classe, depois de `buscarPorId`:

```typescript
  async criar(dados: Omit<Produto, 'id'>): Promise<Produto> {
    await mockLatency(undefined);
    const produto: Produto = { ...dados, id: String(PRODUTOS_MOCK.length + 1) };
    PRODUTOS_MOCK.push(produto);
    return produto;
  }

  async atualizar(id: string, dados: Partial<Omit<Produto, 'id'>>): Promise<Produto> {
    await mockLatency(undefined);
    const indice = PRODUTOS_MOCK.findIndex((p) => p.id === id);
    if (indice < 0) throw new Error('PRODUTO_NAO_ENCONTRADO');
    PRODUTOS_MOCK[indice] = { ...PRODUTOS_MOCK[indice], ...dados };
    return PRODUTOS_MOCK[indice];
  }

  async remover(id: string): Promise<void> {
    await mockLatency(undefined);
    const indice = PRODUTOS_MOCK.findIndex((p) => p.id === id);
    if (indice >= 0) PRODUTOS_MOCK.splice(indice, 1);
  }
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `ProductService`

- [ ] **Step 6: Commit**

```bash
git add src/app/core/products/product.service.ts src/app/core/products/product.service.spec.ts
git commit -m "feat: adiciona criar/atualizar/remover ao ProductService"
```

---

### Task 3: EventService — criar/atualizar/remover

**Files:**
- Modify: `src/app/core/events/event.service.ts`, `src/app/core/events/event.service.spec.ts`

**Interfaces:**
- Consumes: `EVENTOS_MOCK`, `Evento`
- Produces: `EventService.criar(dados: Omit<Evento, 'id'>): Promise<Evento>`, `.atualizar(id: string, dados: Partial<Omit<Evento, 'id'>>): Promise<Evento>`, `.remover(id: string): Promise<void>`

- [ ] **Step 1: Ler o spec atual e ajustar o cabeçalho para restaurar o mock store**

Leia `src/app/core/events/event.service.spec.ts` para confirmar os testes já existentes (`listar()`, `buscarPorId()`), depois ajuste o início do arquivo para:

```typescript
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EventService } from './event.service';
import { EVENTOS_MOCK } from './event-mock-store';
import { Evento } from './evento.model';

describe('EventService', () => {
  let service: EventService;
  let snapshot: Evento[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventService);
    snapshot = EVENTOS_MOCK.map((e) => ({ ...e }));
  });

  afterEach(() => {
    EVENTOS_MOCK.length = 0;
    EVENTOS_MOCK.push(...snapshot);
  });
```

Mantenha os `it` já existentes sem alteração.

- [ ] **Step 2: Escrever os testes que falham**

```typescript
  it('criar() adiciona um novo evento com id sequencial', fakeAsync(() => {
    let evento: Evento | undefined;
    service
      .criar({
        titulo: 'Culto de Jovens',
        descricao: 'Descrição',
        dataHora: '2026-11-01T19:00:00.000Z',
        local: 'Templo sede, Vila Maria',
        preco: 0,
        vagasTotais: 50,
        foto: 'https://picsum.photos/seed/novo-evento/480/480',
      })
      .then((e) => (evento = e));
    tick(400);
    expect(evento?.id).toBe('7');

    let todos: Evento[] = [];
    service.listar().then((e) => (todos = e));
    tick(400);
    expect(todos.length).toBe(7);
  }));

  it('atualizar() altera os campos informados sem afetar os demais', fakeAsync(() => {
    let evento: Evento | undefined;
    service.atualizar('1', { vagasTotais: 10 }).then((e) => (evento = e));
    tick(400);
    expect(evento?.vagasTotais).toBe(10);
    expect(evento?.titulo).toBe('Retiro de Verão REDE');
  }));

  it('atualizar() rejeita quando o id não existe', fakeAsync(() => {
    let erro: Error | undefined;
    service.atualizar('inexistente', { vagasTotais: 10 }).catch((e) => (erro = e));
    tick(400);
    expect(erro?.message).toBe('EVENTO_NAO_ENCONTRADO');
  }));

  it('remover() tira o evento da listagem', fakeAsync(() => {
    service.remover('1');
    tick(400);
    let todos: Evento[] = [];
    service.listar().then((e) => (todos = e));
    tick(400);
    expect(todos.find((e) => e.id === '1')).toBeUndefined();
    expect(todos.length).toBe(5);
  }));

  it('remover() com id inexistente não lança erro nem altera a lista', fakeAsync(() => {
    service.remover('inexistente');
    tick(400);
    let todos: Evento[] = [];
    service.listar().then((e) => (todos = e));
    tick(400);
    expect(todos.length).toBe(6);
  }));
```

- [ ] **Step 3: Rodar os testes e confirmar que falham**

Run: `ng test --watch=false`
Expected: FAIL com "service.criar is not a function"

- [ ] **Step 4: Implementar os três métodos**

Em `event.service.ts`, depois de `buscarPorId`:

```typescript
  async criar(dados: Omit<Evento, 'id'>): Promise<Evento> {
    await mockLatency(undefined);
    const evento: Evento = { ...dados, id: String(EVENTOS_MOCK.length + 1) };
    EVENTOS_MOCK.push(evento);
    return evento;
  }

  async atualizar(id: string, dados: Partial<Omit<Evento, 'id'>>): Promise<Evento> {
    await mockLatency(undefined);
    const indice = EVENTOS_MOCK.findIndex((e) => e.id === id);
    if (indice < 0) throw new Error('EVENTO_NAO_ENCONTRADO');
    EVENTOS_MOCK[indice] = { ...EVENTOS_MOCK[indice], ...dados };
    return EVENTOS_MOCK[indice];
  }

  async remover(id: string): Promise<void> {
    await mockLatency(undefined);
    const indice = EVENTOS_MOCK.findIndex((e) => e.id === id);
    if (indice >= 0) EVENTOS_MOCK.splice(indice, 1);
  }
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `EventService`

- [ ] **Step 6: Commit**

```bash
git add src/app/core/events/event.service.ts src/app/core/events/event.service.spec.ts
git commit -m "feat: adiciona criar/atualizar/remover ao EventService"
```

---

### Task 4: Pedido — proximoStatus() e OrderService — listarTodos/atualizarStatus

**Files:**
- Modify: `src/app/core/orders/pedido.model.ts`, `src/app/core/orders/order.service.ts`, `src/app/core/orders/order.service.spec.ts`
- Create: `src/app/core/orders/pedido.model.spec.ts`

**Interfaces:**
- Consumes: `StatusPedido`, `FormaEntrega`, `Pedido` (já existem em `pedido.model.ts`)
- Produces: `proximoStatus(pedido: Pick<Pedido, 'status' | 'formaEntrega'>): StatusPedido | null`; `OrderService.listarTodos(): Promise<Pedido[]>`, `.atualizarStatus(id: string, novoStatus: StatusPedido): Promise<Pedido>`

- [ ] **Step 1: Escrever o teste de `proximoStatus` que falha**

```typescript
// src/app/core/orders/pedido.model.spec.ts
import { proximoStatus } from './pedido.model';

describe('proximoStatus', () => {
  it('de pago avança para em_preparo, independente da forma de entrega', () => {
    expect(proximoStatus({ status: 'pago', formaEntrega: 'retirada' })).toBe('em_preparo');
    expect(proximoStatus({ status: 'pago', formaEntrega: 'entrega' })).toBe('em_preparo');
  });

  it('de em_preparo avança para retirado quando a entrega é retirada', () => {
    expect(proximoStatus({ status: 'em_preparo', formaEntrega: 'retirada' })).toBe('retirado');
  });

  it('de em_preparo avança para entregue quando a entrega é por entrega', () => {
    expect(proximoStatus({ status: 'em_preparo', formaEntrega: 'entrega' })).toBe('entregue');
  });

  it('retorna null para os status finais (retirado, entregue)', () => {
    expect(proximoStatus({ status: 'retirado', formaEntrega: 'retirada' })).toBeNull();
    expect(proximoStatus({ status: 'entregue', formaEntrega: 'entrega' })).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `pedido.model` não exporta `proximoStatus`

- [ ] **Step 3: Implementar `proximoStatus` em `pedido.model.ts`**

Adicione ao final do arquivo:

```typescript
export function proximoStatus(pedido: Pick<Pedido, 'status' | 'formaEntrega'>): StatusPedido | null {
  if (pedido.status === 'pago') return 'em_preparo';
  if (pedido.status === 'em_preparo') return pedido.formaEntrega === 'retirada' ? 'retirado' : 'entregue';
  return null;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `ng test --watch=false`
Expected: PASS em `proximoStatus`

- [ ] **Step 5: Escrever os testes de `OrderService` que falham**

Adicione a `order.service.spec.ts` (dentro do `describe`, o `afterEach` que zera `PEDIDOS_MOCK` já existe e cobre esses testes também):

```typescript
  it('listarTodos() retorna todos os pedidos, mais recentes primeiro', fakeAsync(() => {
    spyOn(Date.prototype, 'toISOString').and.returnValues(
      '2024-01-01T00:00:00.000Z',
      '2024-01-01T00:00:01.000Z',
    );
    service.criar({ usuarioId: 'u1', itens: [ITEM], formaEntrega: 'retirada' });
    tick(400);
    service.criar({ usuarioId: 'u2', itens: [ITEM], formaEntrega: 'entrega' });
    tick(400);

    let todos: Pedido[] = [];
    service.listarTodos().then((p) => (todos = p));
    tick(400);
    expect(todos.length).toBe(2);
    expect(todos[0].usuarioId).toBe('u2');
  }));

  it('atualizarStatus() muda o status do pedido', fakeAsync(() => {
    let pedido: Pedido | undefined;
    service.criar({ usuarioId: 'u1', itens: [ITEM], formaEntrega: 'retirada' }).then((p) => (pedido = p));
    tick(400);

    let atualizado: Pedido | undefined;
    service.atualizarStatus(pedido!.id, 'em_preparo').then((p) => (atualizado = p));
    tick(400);
    expect(atualizado?.status).toBe('em_preparo');
  }));

  it('atualizarStatus() rejeita quando o id não existe', fakeAsync(() => {
    let erro: Error | undefined;
    service.atualizarStatus('inexistente', 'em_preparo').catch((e) => (erro = e));
    tick(400);
    expect(erro?.message).toBe('PEDIDO_NAO_ENCONTRADO');
  }));
```

- [ ] **Step 6: Rodar e confirmar que falham**

Run: `ng test --watch=false`
Expected: FAIL — "service.listarTodos is not a function"

- [ ] **Step 7: Implementar em `order.service.ts`**

Adicione dentro da classe, depois de `listarPorUsuario`:

```typescript
  async listarTodos(): Promise<Pedido[]> {
    await mockLatency(undefined);
    return [...PEDIDOS_MOCK].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  async atualizarStatus(id: string, novoStatus: StatusPedido): Promise<Pedido> {
    await mockLatency(undefined);
    const indice = PEDIDOS_MOCK.findIndex((p) => p.id === id);
    if (indice < 0) throw new Error('PEDIDO_NAO_ENCONTRADO');
    PEDIDOS_MOCK[indice] = { ...PEDIDOS_MOCK[indice], status: novoStatus };
    return PEDIDOS_MOCK[indice];
  }
```

Atualize o import no topo do arquivo para incluir `StatusPedido`:

```typescript
import { Endereco, FormaEntrega, Pedido, StatusPedido } from './pedido.model';
```

- [ ] **Step 8: Rodar os testes e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `OrderService` e `proximoStatus`

- [ ] **Step 9: Commit**

```bash
git add src/app/core/orders/pedido.model.ts src/app/core/orders/pedido.model.spec.ts src/app/core/orders/order.service.ts src/app/core/orders/order.service.spec.ts
git commit -m "feat: adiciona proximoStatus() e listarTodos/atualizarStatus ao OrderService"
```

---

### Task 5: RegistrationService — listarPorEvento

**Files:**
- Modify: `src/app/core/registrations/registration.service.ts`, `src/app/core/registrations/registration.service.spec.ts`

**Interfaces:**
- Consumes: `INSCRICOES_MOCK`, `Inscricao`
- Produces: `RegistrationService.listarPorEvento(eventoId: string): Promise<Inscricao[]>`

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `registration.service.spec.ts`:

```typescript
  it('listarPorEvento() retorna só as inscrições daquele evento, mais recentes primeiro', fakeAsync(() => {
    spyOn(Date.prototype, 'toISOString').and.returnValues(
      '2024-01-01T00:00:00.000Z',
      '2024-01-01T00:00:01.000Z',
      '2024-01-01T00:00:02.000Z',
    );
    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250, vagasTotais: 4 });
    tick(400);
    service.inscrever({ eventoId: '2', usuarioId: 'u2', valorPago: 0, vagasTotais: 4 });
    tick(400);
    service.inscrever({ eventoId: '1', usuarioId: 'u3', valorPago: 250, vagasTotais: 4 });
    tick(400);

    let lista: Inscricao[] = [];
    service.listarPorEvento('1').then((i) => (lista = i));
    tick(400);
    expect(lista.length).toBe(2);
    expect(lista[0].usuarioId).toBe('u3');
  }));
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — "service.listarPorEvento is not a function"

- [ ] **Step 3: Implementar em `registration.service.ts`**

Adicione depois de `listarPorUsuario`:

```typescript
  async listarPorEvento(eventoId: string): Promise<Inscricao[]> {
    await mockLatency(undefined);
    return INSCRICOES_MOCK.filter((i) => i.eventoId === eventoId).sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    );
  }
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `RegistrationService`

- [ ] **Step 5: Commit**

```bash
git add src/app/core/registrations/registration.service.ts src/app/core/registrations/registration.service.spec.ts
git commit -m "feat: adiciona RegistrationService.listarPorEvento"
```

---

### Task 6: TextField — suportar tipos 'number' e 'datetime-local'

Os formulários de Produto e Evento precisam de campos numéricos (preço, estoque, vagas) e de data/hora. Usar `<input type="number">`/`<input type="datetime-local">` ativa os conversores nativos do Angular (`NumberValueAccessor` etc.), evitando conversão manual de string para número. É uma extensão pequena e retrocompatível do `TextField` já existente.

**Files:**
- Modify: `src/app/shared/ui/text-field/text-field.ts`, `src/app/shared/ui/text-field/text-field.spec.ts`

**Interfaces:**
- Consumes: nenhuma nova
- Produces: `TextField.tipo` agora aceita `'text' | 'email' | 'password' | 'tel' | 'number' | 'datetime-local'`

- [ ] **Step 1: Escrever os testes que falham**

Adicione a `text-field.spec.ts`:

```typescript
  it('usa type="number" quando tipo é "number"', () => {
    const comp = TestBed.createComponent(TextField);
    comp.componentRef.setInput('rotulo', 'Preço');
    comp.componentRef.setInput('controle', new FormControl(0));
    comp.componentRef.setInput('tipo', 'number');
    comp.detectChanges();
    const input: HTMLInputElement = comp.nativeElement.querySelector('input');
    expect(input.type).toBe('number');
  });

  it('usa type="datetime-local" quando tipo é "datetime-local"', () => {
    const comp = TestBed.createComponent(TextField);
    comp.componentRef.setInput('rotulo', 'Data e hora');
    comp.componentRef.setInput('controle', new FormControl(''));
    comp.componentRef.setInput('tipo', 'datetime-local');
    comp.detectChanges();
    const input: HTMLInputElement = comp.nativeElement.querySelector('input');
    expect(input.type).toBe('datetime-local');
  });
```

- [ ] **Step 2: Rodar e confirmar que falham**

Run: `ng test --watch=false`
Expected: FAIL de tipo — `'number'`/`'datetime-local'` não são atribuíveis ao input `tipo`

- [ ] **Step 3: Ampliar a union de `tipo` em `text-field.ts`**

```typescript
  readonly tipo = input<'text' | 'email' | 'password' | 'tel' | 'number' | 'datetime-local'>('text');
```

Nenhuma outra mudança é necessária: `tipoEfetivo` já retorna `this.tipo()` para qualquer valor que não seja `'password'`.

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `TextField`

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/ui/text-field/text-field.ts src/app/shared/ui/text-field/text-field.spec.ts
git commit -m "feat: TextField aceita tipos number e datetime-local"
```

---

### Task 7: Componente Modal

**Files:**
- Create: `src/app/shared/ui/modal/modal.ts`, `modal.html`, `modal.scss`, `modal.spec.ts`

**Interfaces:**
- Consumes: nenhuma
- Produces: `Modal` — `titulo = input.required<string>()`, `aberto = input<boolean>(false)`, `fechar = output<void>()`; conteúdo via `<ng-content>`

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// src/app/shared/ui/modal/modal.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Modal } from './modal';

describe('Modal', () => {
  let fixture: ComponentFixture<Modal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Modal] }).compileComponents();
    fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('titulo', 'Novo produto');
  });

  it('não renderiza nada quando aberto é false', () => {
    fixture.componentRef.setInput('aberto', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal__overlay')).toBeNull();
  });

  it('renderiza o título quando aberto é true', () => {
    fixture.componentRef.setInput('aberto', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Novo produto');
  });

  it('clicar no overlay emite fechar', () => {
    fixture.componentRef.setInput('aberto', true);
    fixture.detectChanges();
    let fechou = false;
    fixture.componentInstance.fechar.subscribe(() => (fechou = true));
    fixture.nativeElement.querySelector('.modal__overlay').click();
    expect(fechou).toBeTrue();
  });

  it('clicar dentro da caixa não emite fechar', () => {
    fixture.componentRef.setInput('aberto', true);
    fixture.detectChanges();
    let fechou = false;
    fixture.componentInstance.fechar.subscribe(() => (fechou = true));
    fixture.nativeElement.querySelector('.modal__caixa').click();
    expect(fechou).toBeFalse();
  });

  it('clicar no botão de fechar emite fechar', () => {
    fixture.componentRef.setInput('aberto', true);
    fixture.detectChanges();
    let fechou = false;
    fixture.componentInstance.fechar.subscribe(() => (fechou = true));
    fixture.nativeElement.querySelector('.modal__fechar').click();
    expect(fechou).toBeTrue();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `./modal` não existe

- [ ] **Step 3: Implementar o componente**

```typescript
// src/app/shared/ui/modal/modal.ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  readonly titulo = input.required<string>();
  readonly aberto = input<boolean>(false);
  readonly fechar = output<void>();
}
```

```html
<!-- src/app/shared/ui/modal/modal.html -->
@if (aberto()) {
  <div class="modal__overlay" (click)="fechar.emit()">
    <div class="modal__caixa" (click)="$event.stopPropagation()">
      <header class="modal__cabecalho">
        <h2>{{ titulo() }}</h2>
        <button type="button" class="modal__fechar" aria-label="Fechar" (click)="fechar.emit()">✕</button>
      </header>
      <div class="modal__conteudo">
        <ng-content />
      </div>
    </div>
  </div>
}
```

```scss
// src/app/shared/ui/modal/modal.scss
@use 'styles/tokens' as *;

.modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 13, 13, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--espaco-4);
}

.modal__caixa {
  background: var(--rede-graphite);
  color: var(--rede-paper);
  border-radius: var(--raio-padrao);
  max-width: 640px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--espaco-5);
}

.modal__cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--espaco-4);
}

.modal__fechar {
  background: none;
  border: none;
  color: var(--rede-paper);
  font-size: 1.25rem;
  cursor: pointer;
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `Modal`

- [ ] **Step 5: Refinar visualmente com a skill frontend-design**

Invoque a skill `frontend-design` para revisar o espaçamento, sombra e hierarquia visual do `Modal` usando os tokens de `_tokens.scss`, mantendo as classes `modal__overlay`/`modal__caixa`/`modal__cabecalho`/`modal__fechar` (os testes acima dependem delas).

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/ui/modal/
git commit -m "feat: adiciona componente Modal ao design system"
```

---

### Task 8: Componente Select

**Files:**
- Create: `src/app/shared/ui/select/select.ts`, `select.html`, `select.scss`, `select.spec.ts`

**Interfaces:**
- Consumes: nenhuma
- Produces: `OpcaoSelect { valor: string; rotulo: string }`; `Select` — `rotulo = input.required<string>()`, `opcoes = input.required<OpcaoSelect[]>()`, `controle = input.required<FormControl>()`, `erro = input<string | null>(null)`

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// src/app/shared/ui/select/select.spec.ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Select } from './select';

@Component({
  imports: [Select, ReactiveFormsModule],
  template: `<app-select
    rotulo="Categoria"
    [opcoes]="opcoes"
    [controle]="controle"
    [erro]="erro"
  ></app-select>`,
})
class HospedeTeste {
  opcoes = [
    { valor: 'camisetas', rotulo: 'Camisetas' },
    { valor: 'moletons', rotulo: 'Moletons' },
  ];
  controle = new FormControl('camisetas');
  erro: string | null = null;
}

describe('Select', () => {
  let fixture: ComponentFixture<HospedeTeste>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeTeste] }).compileComponents();
    fixture = TestBed.createComponent(HospedeTeste);
    fixture.detectChanges();
  });

  it('renderiza o rótulo e as opções', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Categoria');
    expect(texto).toContain('Camisetas');
    expect(texto).toContain('Moletons');
  });

  it('reflete o valor inicial do FormControl', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.value).toBe('camisetas');
  });

  it('propaga a mudança de seleção para o FormControl', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = 'moletons';
    select.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.controle.value).toBe('moletons');
  });

  it('não mostra mensagem de erro quando erro é null', () => {
    expect(fixture.nativeElement.querySelector('.campo__erro')).toBeNull();
  });

  it('mostra a mensagem de erro quando informada', () => {
    const comp = TestBed.createComponent(Select);
    comp.componentRef.setInput('rotulo', 'Categoria');
    comp.componentRef.setInput('opcoes', [{ valor: 'a', rotulo: 'A' }]);
    comp.componentRef.setInput('controle', new FormControl(''));
    comp.componentRef.setInput('erro', 'Selecione uma categoria.');
    comp.detectChanges();
    expect(comp.nativeElement.querySelector('.campo__erro').textContent).toContain('Selecione uma categoria.');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `./select` não existe

- [ ] **Step 3: Implementar o componente**

```typescript
// src/app/shared/ui/select/select.ts
import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface OpcaoSelect {
  valor: string;
  rotulo: string;
}

@Component({
  selector: 'app-select',
  imports: [ReactiveFormsModule],
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class Select {
  readonly rotulo = input.required<string>();
  readonly opcoes = input.required<OpcaoSelect[]>();
  readonly controle = input.required<FormControl>();
  readonly erro = input<string | null>(null);
}
```

```html
<!-- src/app/shared/ui/select/select.html -->
<label class="campo">
  <span class="campo__rotulo">{{ rotulo() }}</span>
  <select class="campo__input" [class.campo__input--erro]="erro()" [formControl]="controle()">
    @for (opcao of opcoes(); track opcao.valor) {
      <option [value]="opcao.valor">{{ opcao.rotulo }}</option>
    }
  </select>
  @if (erro()) {
    <span class="campo__erro" role="alert">{{ erro() }}</span>
  }
</label>
```

```scss
// src/app/shared/ui/select/select.scss
@use 'styles/tokens' as *;

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-1);
  font-family: var(--fonte-corpo);
}

.campo__rotulo {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rede-paper);
}

.campo__input {
  width: 100%;
  font-family: var(--fonte-corpo);
  font-size: 1rem;
  padding: var(--espaco-3) var(--espaco-4);
  border-radius: var(--raio-padrao);
  border: 1px solid rgba(246, 244, 236, 0.24);
  background: var(--rede-graphite);
  color: var(--rede-paper);

  &:focus {
    outline: none;
    border-color: var(--rede-yellow);
  }

  &--erro {
    border-color: var(--status-cancel);
  }
}

.campo__erro {
  font-size: 0.8125rem;
  color: var(--status-cancel);
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `Select`

- [ ] **Step 5: Refinar visualmente com a skill frontend-design**

Invoque a skill `frontend-design` para alinhar o visual do `Select` ao `TextField` (mesma altura, tipografia, estado de foco/erro).

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/ui/select/
git commit -m "feat: adiciona componente Select ao design system"
```

---

### Task 9: Componente Textarea

**Files:**
- Create: `src/app/shared/ui/textarea/textarea.ts`, `textarea.html`, `textarea.scss`, `textarea.spec.ts`

**Interfaces:**
- Consumes: nenhuma
- Produces: `Textarea` — `rotulo = input.required<string>()`, `controle = input.required<FormControl>()`, `erro = input<string | null>(null)`

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// src/app/shared/ui/textarea/textarea.spec.ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Textarea } from './textarea';

@Component({
  imports: [Textarea, ReactiveFormsModule],
  template: `<app-textarea rotulo="Descrição" [controle]="controle" [erro]="erro"></app-textarea>`,
})
class HospedeTeste {
  controle = new FormControl('');
  erro: string | null = null;
}

describe('Textarea', () => {
  let fixture: ComponentFixture<HospedeTeste>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeTeste] }).compileComponents();
    fixture = TestBed.createComponent(HospedeTeste);
    fixture.detectChanges();
  });

  it('renderiza o rótulo', () => {
    expect(fixture.nativeElement.textContent).toContain('Descrição');
  });

  it('propaga digitação para o FormControl', () => {
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    textarea.value = 'Camiseta 100% algodão.';
    textarea.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.controle.value).toBe('Camiseta 100% algodão.');
  });

  it('não mostra mensagem de erro quando erro é null', () => {
    expect(fixture.nativeElement.querySelector('.campo__erro')).toBeNull();
  });

  it('mostra a mensagem de erro quando informada', () => {
    const comp = TestBed.createComponent(Textarea);
    comp.componentRef.setInput('rotulo', 'Descrição');
    comp.componentRef.setInput('controle', new FormControl(''));
    comp.componentRef.setInput('erro', 'Informe a descrição.');
    comp.detectChanges();
    expect(comp.nativeElement.querySelector('.campo__erro').textContent).toContain('Informe a descrição.');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `./textarea` não existe

- [ ] **Step 3: Implementar o componente**

```typescript
// src/app/shared/ui/textarea/textarea.ts
import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  imports: [ReactiveFormsModule],
  templateUrl: './textarea.html',
  styleUrl: './textarea.scss',
})
export class Textarea {
  readonly rotulo = input.required<string>();
  readonly controle = input.required<FormControl>();
  readonly erro = input<string | null>(null);
}
```

```html
<!-- src/app/shared/ui/textarea/textarea.html -->
<label class="campo">
  <span class="campo__rotulo">{{ rotulo() }}</span>
  <textarea
    class="campo__input"
    [class.campo__input--erro]="erro()"
    rows="4"
    [formControl]="controle()"
  ></textarea>
  @if (erro()) {
    <span class="campo__erro" role="alert">{{ erro() }}</span>
  }
</label>
```

```scss
// src/app/shared/ui/textarea/textarea.scss
@use 'styles/tokens' as *;

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-1);
  font-family: var(--fonte-corpo);
}

.campo__rotulo {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rede-paper);
}

.campo__input {
  width: 100%;
  font-family: var(--fonte-corpo);
  font-size: 1rem;
  padding: var(--espaco-3) var(--espaco-4);
  border-radius: var(--raio-padrao);
  border: 1px solid rgba(246, 244, 236, 0.24);
  background: var(--rede-graphite);
  color: var(--rede-paper);
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--rede-yellow);
  }

  &--erro {
    border-color: var(--status-cancel);
  }
}

.campo__erro {
  font-size: 0.8125rem;
  color: var(--status-cancel);
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `Textarea`

- [ ] **Step 5: Refinar visualmente com a skill frontend-design**

Invoque a skill `frontend-design` para alinhar o visual do `Textarea` ao `TextField`/`Select`.

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/ui/textarea/
git commit -m "feat: adiciona componente Textarea ao design system"
```

---

### Task 10: Componente Table

**Files:**
- Create: `src/app/shared/ui/table/table.ts`, `table.html`, `table.scss`, `table.spec.ts`

**Interfaces:**
- Consumes: nenhuma
- Produces: `Table` — `cabecalhos = input.required<string[]>()`; corpo via `<ng-content>` (a tela consumidora escreve suas próprias `<tr>`/`<td>`)

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// src/app/shared/ui/table/table.spec.ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Table } from './table';

@Component({
  imports: [Table],
  template: `
    <app-table [cabecalhos]="['Nome', 'Preço']">
      <tr>
        <td>Camiseta REDE</td>
        <td>R$ 79,90</td>
      </tr>
    </app-table>
  `,
})
class HospedeTeste {}

describe('Table', () => {
  let fixture: ComponentFixture<HospedeTeste>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeTeste] }).compileComponents();
    fixture = TestBed.createComponent(HospedeTeste);
    fixture.detectChanges();
  });

  it('renderiza um <th> por cabeçalho, na ordem informada', () => {
    const cabecalhos: NodeListOf<HTMLTableCellElement> = fixture.nativeElement.querySelectorAll('th');
    expect(cabecalhos.length).toBe(2);
    expect(cabecalhos[0].textContent).toContain('Nome');
    expect(cabecalhos[1].textContent).toContain('Preço');
  });

  it('renderiza o conteúdo projetado dentro do tbody', () => {
    const tbody = fixture.nativeElement.querySelector('tbody');
    expect(tbody.textContent).toContain('Camiseta REDE');
    expect(tbody.textContent).toContain('R$ 79,90');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `./table` não existe

- [ ] **Step 3: Implementar o componente**

```typescript
// src/app/shared/ui/table/table.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-table',
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class Table {
  readonly cabecalhos = input.required<string[]>();
}
```

```html
<!-- src/app/shared/ui/table/table.html -->
<div class="tabela__wrapper">
  <table class="tabela">
    <thead>
      <tr>
        @for (cabecalho of cabecalhos(); track cabecalho) {
          <th>{{ cabecalho }}</th>
        }
      </tr>
    </thead>
    <tbody>
      <ng-content />
    </tbody>
  </table>
</div>
```

```scss
// src/app/shared/ui/table/table.scss
@use 'styles/tokens' as *;

.tabela__wrapper {
  overflow-x: auto;
}

.tabela {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--fonte-corpo);
  color: var(--rede-paper);

  th,
  td {
    text-align: left;
    padding: var(--espaco-3) var(--espaco-4);
    border-bottom: 1px solid rgba(246, 244, 236, 0.12);
    white-space: nowrap;
  }

  th {
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(246, 244, 236, 0.64);
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `Table`

- [ ] **Step 5: Refinar visualmente com a skill frontend-design**

Invoque a skill `frontend-design` para o visual final da tabela (zebra striping, hover de linha, comportamento responsivo do scroll horizontal).

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/ui/table/
git commit -m "feat: adiciona componente Table ao design system"
```

---

### Task 11: AdminShell

**Files:**
- Create: `src/app/layout/admin-shell/admin-shell.ts`, `admin-shell.html`, `admin-shell.scss`, `admin-shell.spec.ts`

**Interfaces:**
- Consumes: `AuthService.usuarioAtual`, `.logout()` (já existem)
- Produces: `AdminShell` (componente de layout, usado como `loadComponent` da rota `/admin`)

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// src/app/layout/admin-shell/admin-shell.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AdminShell } from './admin-shell';
import { AuthService } from '../../core/auth/auth.service';

describe('AdminShell', () => {
  let fixture: ComponentFixture<AdminShell>;
  let authServiceFalso: { usuarioAtual: ReturnType<typeof signal>; logout: jasmine.Spy };
  let router: Router;

  beforeEach(async () => {
    authServiceFalso = {
      usuarioAtual: signal({ id: '1', nome: 'Admin REDE', email: 'admin@rede.com', papel: 'admin' as const }),
      logout: jasmine.createSpy('logout'),
    };

    await TestBed.configureTestingModule({
      imports: [AdminShell],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminShell);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('mostra os links de navegação e o nome do admin logado', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Produtos');
    expect(texto).toContain('Pedidos');
    expect(texto).toContain('Eventos');
    expect(texto).toContain('Admin REDE');
  });

  it('clicar em Sair chama logout() e navega para /login', () => {
    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="botao-sair"]');
    botao.click();
    expect(authServiceFalso.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `./admin-shell` não existe

- [ ] **Step 3: Implementar o componente**

```typescript
// src/app/layout/admin-shell/admin-shell.ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly usuario = this.auth.usuarioAtual;

  protected sair(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
```

```html
<!-- src/app/layout/admin-shell/admin-shell.html -->
<div class="admin-shell">
  <aside class="admin-shell__barra">
    <span class="admin-shell__marca">REDE Admin</span>
    <nav class="admin-shell__nav">
      <a routerLink="/admin/produtos" routerLinkActive="admin-shell__link--ativo">Produtos</a>
      <a routerLink="/admin/pedidos" routerLinkActive="admin-shell__link--ativo">Pedidos</a>
      <a routerLink="/admin/eventos" routerLinkActive="admin-shell__link--ativo">Eventos</a>
    </nav>
    <div class="admin-shell__rodape">
      @if (usuario(); as usuarioLogado) {
        <span class="admin-shell__usuario">{{ usuarioLogado.nome }}</span>
      }
      <button type="button" data-testid="botao-sair" (click)="sair()">Sair</button>
    </div>
  </aside>
  <main class="admin-shell__conteudo">
    <router-outlet />
  </main>
</div>
```

```scss
// src/app/layout/admin-shell/admin-shell.scss
@use 'styles/tokens' as *;

.admin-shell {
  display: flex;
  min-height: 100vh;
  font-family: var(--fonte-corpo);
  background: var(--rede-black);
  color: var(--rede-paper);
}

.admin-shell__barra {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--espaco-6);
  padding: var(--espaco-5);
  background: var(--rede-graphite);
}

.admin-shell__marca {
  font-family: var(--fonte-display);
  font-weight: 700;
}

.admin-shell__nav {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-3);

  a {
    color: var(--rede-paper);
    text-decoration: none;
    padding: var(--espaco-2) var(--espaco-3);
    border-radius: var(--raio-padrao);
  }
}

.admin-shell__link--ativo {
  background: rgba(244, 198, 23, 0.16);
  color: var(--rede-yellow);
}

.admin-shell__rodape {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--espaco-2);
}

.admin-shell__conteudo {
  flex: 1;
  padding: var(--espaco-6);
  overflow-x: auto;
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `AdminShell`

- [ ] **Step 5: Refinar visualmente com a skill frontend-design**

Invoque a skill `frontend-design` para o visual final da sidebar (hierarquia, hover states, responsividade mínima em telas menores).

- [ ] **Step 6: Commit**

```bash
git add src/app/layout/admin-shell/
git commit -m "feat: adiciona layout AdminShell"
```

---

### Task 12: ProdutoForm

**Files:**
- Create: `src/app/features/admin/produtos/produto-form/produto-form.ts`, `produto-form.html`, `produto-form.scss`, `produto-form.spec.ts`

**Interfaces:**
- Consumes: `Produto`, `Variacao`, `Categoria` (`core/products/produto.model.ts`); `TextField`, `Select` (com `OpcaoSelect`), `Textarea`, `Button`
- Produces: `ProdutoForm` — `produto = input<Produto | null>(null)`, `salvar = output<Omit<Produto, 'id'>>()`, `cancelar = output<void>()`

- [ ] **Step 1: Escrever os testes que falham**

```typescript
// src/app/features/admin/produtos/produto-form/produto-form.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProdutoForm } from './produto-form';
import { Produto } from '../../../../core/products/produto.model';

const PRODUTO: Produto = {
  id: '1',
  nome: 'Camiseta REDE Clássica',
  categoria: 'camisetas',
  preco: 79.9,
  descricao: 'Camiseta 100% algodão.',
  fotos: ['https://picsum.photos/seed/x/480/480'],
  tamanhos: ['P', 'M'],
  cores: ['Preto'],
  destaque: true,
  variacoes: [{ tamanho: 'P', cor: 'Preto', estoque: 10 }],
};

describe('ProdutoForm', () => {
  let fixture: ComponentFixture<ProdutoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProdutoForm] }).compileComponents();
    fixture = TestBed.createComponent(ProdutoForm);
    fixture.detectChanges();
  });

  it('em modo criação, não emite salvar se o formulário estiver inválido', () => {
    let emitiu = false;
    fixture.componentInstance.salvar.subscribe(() => (emitiu = true));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(emitiu).toBeFalse();
  });

  it('em modo edição, pré-preenche o formulário com os dados do produto', () => {
    fixture.componentRef.setInput('produto', PRODUTO);
    fixture.detectChanges();
    // Checa o valor do FormControl, não o textContent: um <textarea> só reflete
    // no textContent o markup estático inicial, não o valor definido via
    // [formControl] (isso é feito via propriedade DOM `value`, não innerHTML).
    expect(fixture.componentInstance['form'].controls.nome.value).toBe('Camiseta REDE Clássica');
    expect(fixture.componentInstance['form'].controls.descricao.value).toBe('Camiseta 100% algodão.');
  });

  it('emite salvar com os dados preenchidos, incluindo ao menos uma variação', () => {
    fixture.componentInstance['form'].setValue({
      nome: 'Camiseta Nova',
      categoria: 'camisetas',
      preco: 99.9,
      descricao: 'Descrição nova',
      fotosTexto: 'https://picsum.photos/seed/a/480/480, https://picsum.photos/seed/b/480/480',
    });
    fixture.componentInstance['adicionarVariacao']();
    fixture.componentInstance['atualizarVariacao'](0, 'tamanho', 'M');
    fixture.componentInstance['atualizarVariacao'](0, 'cor', 'Preto');
    fixture.componentInstance['atualizarVariacao'](0, 'estoque', '5');
    fixture.detectChanges();

    let emitido: Omit<Produto, 'id'> | undefined;
    fixture.componentInstance.salvar.subscribe((dados) => (emitido = dados));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(emitido?.nome).toBe('Camiseta Nova');
    expect(emitido?.fotos.length).toBe(2);
    expect(emitido?.variacoes).toEqual([{ tamanho: 'M', cor: 'Preto', estoque: 5 }]);
  });

  it('não emite salvar quando não há nenhuma variação', () => {
    fixture.componentInstance['form'].setValue({
      nome: 'Camiseta Nova',
      categoria: 'camisetas',
      preco: 99.9,
      descricao: 'Descrição nova',
      fotosTexto: 'https://picsum.photos/seed/a/480/480',
    });
    fixture.detectChanges();

    let emitiu = false;
    fixture.componentInstance.salvar.subscribe(() => (emitiu = true));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(emitiu).toBeFalse();
  });

  it('emite cancelar ao clicar em Cancelar', () => {
    let emitiu = false;
    fixture.componentInstance.cancelar.subscribe(() => (emitiu = true));
    const botoes: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    const cancelar = Array.from(botoes).find((b) => b.textContent?.includes('Cancelar'));
    cancelar?.click();
    expect(emitiu).toBeTrue();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `./produto-form` não existe

- [ ] **Step 3: Implementar o componente**

```typescript
// src/app/features/admin/produtos/produto-form/produto-form.ts
import { Component, OnChanges, SimpleChanges, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria, Produto, Variacao } from '../../../../core/products/produto.model';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { Select, OpcaoSelect } from '../../../../shared/ui/select/select';
import { Textarea } from '../../../../shared/ui/textarea/textarea';
import { Button } from '../../../../shared/ui/button/button';

const CATEGORIAS: OpcaoSelect[] = [
  { valor: 'camisetas', rotulo: 'Camisetas' },
  { valor: 'moletons', rotulo: 'Moletons' },
  { valor: 'acessorios', rotulo: 'Acessórios' },
];

@Component({
  selector: 'app-produto-form',
  imports: [ReactiveFormsModule, TextField, Select, Textarea, Button],
  templateUrl: './produto-form.html',
  styleUrl: './produto-form.scss',
})
export class ProdutoForm implements OnChanges {
  private readonly fb = inject(FormBuilder);

  readonly produto = input<Produto | null>(null);
  readonly salvar = output<Omit<Produto, 'id'>>();
  readonly cancelar = output<void>();

  protected readonly categorias = CATEGORIAS;
  protected readonly variacoes = signal<Variacao[]>([]);
  protected readonly tentouEnviar = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]],
    categoria: ['camisetas' as Categoria, [Validators.required]],
    preco: [0, [Validators.required, Validators.min(0.01)]],
    descricao: ['', [Validators.required]],
    fotosTexto: ['', [Validators.required]],
  });

  protected readonly erroVariacoes = computed(() =>
    this.tentouEnviar() && this.variacoes().length === 0
      ? 'Adicione ao menos uma variação de tamanho/cor.'
      : '',
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['produto']) return;
    const produto = this.produto();
    if (produto) {
      this.form.patchValue({
        nome: produto.nome,
        categoria: produto.categoria,
        preco: produto.preco,
        descricao: produto.descricao,
        fotosTexto: produto.fotos.join(', '),
      });
      this.variacoes.set(produto.variacoes.map((v) => ({ ...v })));
    } else {
      this.form.reset({ nome: '', categoria: 'camisetas', preco: 0, descricao: '', fotosTexto: '' });
      this.variacoes.set([]);
    }
  }

  protected get erroNome(): string {
    const c = this.form.controls.nome;
    return c.touched && c.invalid ? 'Informe o nome do produto.' : '';
  }

  protected get erroPreco(): string {
    const c = this.form.controls.preco;
    if (c.touched && c.hasError('required')) return 'Informe o preço.';
    if (c.touched && c.hasError('min')) return 'O preço precisa ser maior que zero.';
    return '';
  }

  protected get erroDescricao(): string {
    const c = this.form.controls.descricao;
    return c.touched && c.invalid ? 'Informe a descrição.' : '';
  }

  protected get erroFotos(): string {
    const c = this.form.controls.fotosTexto;
    return c.touched && c.invalid ? 'Informe ao menos uma URL de foto.' : '';
  }

  protected adicionarVariacao(): void {
    this.variacoes.update((lista) => [...lista, { tamanho: '', cor: '', estoque: 0 }]);
  }

  protected removerVariacao(indice: number): void {
    this.variacoes.update((lista) => lista.filter((_, i) => i !== indice));
  }

  protected atualizarVariacao(indice: number, campo: keyof Variacao, valor: string): void {
    this.variacoes.update((lista) =>
      lista.map((item, i) => (i === indice ? { ...item, [campo]: campo === 'estoque' ? Number(valor) : valor } : item)),
    );
  }

  protected aoEnviar(): void {
    this.tentouEnviar.set(true);
    if (this.form.invalid || this.variacoes().length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const bruto = this.form.getRawValue();
    const fotos = bruto.fotosTexto
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    const variacoes = this.variacoes();
    const tamanhos = [...new Set(variacoes.map((v) => v.tamanho))];
    const cores = [...new Set(variacoes.map((v) => v.cor))];
    this.salvar.emit({
      nome: bruto.nome,
      categoria: bruto.categoria,
      preco: Number(bruto.preco),
      descricao: bruto.descricao,
      fotos,
      tamanhos,
      cores,
      variacoes,
      destaque: this.produto()?.destaque ?? false,
    });
  }
}
```

```html
<!-- src/app/features/admin/produtos/produto-form/produto-form.html -->
<form class="produto-form" (ngSubmit)="aoEnviar()">
  <app-text-field rotulo="Nome" [controle]="form.controls.nome" [erro]="erroNome"></app-text-field>
  <app-select rotulo="Categoria" [opcoes]="categorias" [controle]="form.controls.categoria"></app-select>
  <app-text-field
    rotulo="Preço"
    tipo="number"
    [controle]="form.controls.preco"
    [erro]="erroPreco"
  ></app-text-field>
  <app-textarea rotulo="Descrição" [controle]="form.controls.descricao" [erro]="erroDescricao"></app-textarea>
  <app-text-field
    rotulo="Fotos (URLs separadas por vírgula)"
    [controle]="form.controls.fotosTexto"
    [erro]="erroFotos"
  ></app-text-field>

  <div class="produto-form__variacoes">
    <div class="produto-form__variacoes-cabecalho">
      <span>Variações (tamanho, cor, estoque)</span>
      <button type="button" (click)="adicionarVariacao()">+ Adicionar</button>
    </div>
    @for (variacao of variacoes(); track $index) {
      <div class="produto-form__variacao-linha">
        <input
          placeholder="Tamanho"
          [value]="variacao.tamanho"
          (input)="atualizarVariacao($index, 'tamanho', $any($event.target).value)"
        />
        <input
          placeholder="Cor"
          [value]="variacao.cor"
          (input)="atualizarVariacao($index, 'cor', $any($event.target).value)"
        />
        <input
          type="number"
          placeholder="Estoque"
          [value]="variacao.estoque"
          (input)="atualizarVariacao($index, 'estoque', $any($event.target).value)"
        />
        <button type="button" aria-label="Remover variação" (click)="removerVariacao($index)">✕</button>
      </div>
    }
    @if (erroVariacoes()) {
      <span class="campo__erro" role="alert">{{ erroVariacoes() }}</span>
    }
  </div>

  <div class="produto-form__acoes">
    <app-button variante="secundario" (clicado)="cancelar.emit()">Cancelar</app-button>
    <app-button tipo="submit">Salvar</app-button>
  </div>
</form>
```

```scss
// src/app/features/admin/produtos/produto-form/produto-form.scss
@use 'styles/tokens' as *;

.produto-form {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-4);
}

.produto-form__variacoes {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-2);
}

.produto-form__variacoes-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.produto-form__variacao-linha {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: var(--espaco-2);
}

.produto-form__acoes {
  display: flex;
  justify-content: flex-end;
  gap: var(--espaco-3);
}

.campo__erro {
  font-size: 0.8125rem;
  color: var(--status-cancel);
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `ProdutoForm`

- [ ] **Step 5: Refinar visualmente com a skill frontend-design**

Invoque a skill `frontend-design` para o layout do formulário (grade de variações, espaçamento entre campos, botões de ação).

- [ ] **Step 6: Commit**

```bash
git add src/app/features/admin/produtos/produto-form/
git commit -m "feat: adiciona ProdutoForm para criar/editar produtos"
```

---

### Task 13: Tela Produtos

**Files:**
- Create: `src/app/features/admin/produtos/produtos.ts`, `produtos.html`, `produtos.scss`, `produtos.spec.ts`

**Interfaces:**
- Consumes: `ProductService.listar/criar/atualizar/remover`; `Table`, `Modal`, `ProdutoForm`, `EmptyState`, `PrecoBrPipe`
- Produces: `Produtos` (componente de rota, `admin/produtos`)

- [ ] **Step 1: Escrever os testes que falham**

```typescript
// src/app/features/admin/produtos/produtos.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Produtos } from './produtos';
import { ProductService } from '../../../core/products/product.service';
import { Produto } from '../../../core/products/produto.model';

const PRODUTO: Produto = {
  id: '1',
  nome: 'Camiseta REDE Clássica',
  categoria: 'camisetas',
  preco: 79.9,
  descricao: 'Camiseta 100% algodão.',
  fotos: ['https://picsum.photos/seed/x/480/480'],
  tamanhos: ['P'],
  cores: ['Preto'],
  destaque: true,
  variacoes: [{ tamanho: 'P', cor: 'Preto', estoque: 10 }],
};

describe('Produtos', () => {
  let fixture: ComponentFixture<Produtos>;
  let servicoFalso: jasmine.SpyObj<Pick<ProductService, 'listar' | 'criar' | 'atualizar' | 'remover'>>;

  async function montar(produtos: Produto[]): Promise<void> {
    servicoFalso = jasmine.createSpyObj('ProductService', ['listar', 'criar', 'atualizar', 'remover']);
    servicoFalso.listar.and.resolveTo(produtos);

    await TestBed.configureTestingModule({
      imports: [Produtos],
      providers: [{ provide: ProductService, useValue: servicoFalso }],
    }).compileComponents();

    fixture = TestBed.createComponent(Produtos);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o estado vazio quando não há produtos', async () => {
    await montar([]);
    expect(fixture.nativeElement.textContent).toContain('Nenhum produto cadastrado ainda.');
  });

  it('lista os produtos com nome, preço e estoque total', async () => {
    await montar([PRODUTO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Camiseta REDE Clássica');
    expect(texto).toContain('79,90');
    expect(texto).toContain('10');
  });

  it('abre o modal de criação ao clicar em "Novo produto"', async () => {
    await montar([]);
    const botao: HTMLButtonElement = Array.from(fixture.nativeElement.querySelectorAll('button')).find((b: HTMLButtonElement) =>
      b.textContent?.includes('Novo produto'),
    ) as HTMLButtonElement;
    botao.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal__overlay')).not.toBeNull();
  });

  it('chama ProductService.criar ao salvar o formulário em modo criação', async () => {
    await montar([]);
    servicoFalso.criar.and.resolveTo(PRODUTO);
    servicoFalso.listar.and.resolveTo([PRODUTO]);

    fixture.componentInstance['abrirNovo']();
    fixture.detectChanges();
    await fixture.componentInstance['salvar']({
      nome: PRODUTO.nome,
      categoria: PRODUTO.categoria,
      preco: PRODUTO.preco,
      descricao: PRODUTO.descricao,
      fotos: PRODUTO.fotos,
      tamanhos: PRODUTO.tamanhos,
      cores: PRODUTO.cores,
      variacoes: PRODUTO.variacoes,
      destaque: PRODUTO.destaque,
    });

    expect(servicoFalso.criar).toHaveBeenCalled();
  });

  it('chama ProductService.remover ao confirmar a remoção', async () => {
    await montar([PRODUTO]);
    servicoFalso.remover.and.resolveTo();
    servicoFalso.listar.and.resolveTo([]);

    fixture.componentInstance['pedirRemocao'](PRODUTO);
    await fixture.componentInstance['confirmarRemocao']();

    expect(servicoFalso.remover).toHaveBeenCalledWith('1');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `./produtos` não existe

- [ ] **Step 3: Implementar o componente**

```typescript
// src/app/features/admin/produtos/produtos.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { ProductService } from '../../../core/products/product.service';
import { Produto } from '../../../core/products/produto.model';
import { Table } from '../../../shared/ui/table/table';
import { Modal } from '../../../shared/ui/modal/modal';
import { Button } from '../../../shared/ui/button/button';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';
import { ProdutoForm } from './produto-form/produto-form';

const ROTULO_CATEGORIA: Record<Produto['categoria'], string> = {
  camisetas: 'Camisetas',
  moletons: 'Moletons',
  acessorios: 'Acessórios',
};

@Component({
  selector: 'app-produtos',
  imports: [Table, Modal, Button, EmptyState, PrecoBrPipe, ProdutoForm],
  templateUrl: './produtos.html',
  styleUrl: './produtos.scss',
})
export class Produtos implements OnInit {
  private readonly produtosService = inject(ProductService);

  protected readonly lista = signal<Produto[]>([]);
  protected readonly modalAberto = signal(false);
  protected readonly produtoEditando = signal<Produto | null>(null);
  protected readonly produtoParaRemover = signal<Produto | null>(null);
  protected readonly rotuloCategoria = ROTULO_CATEGORIA;

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    this.lista.set(await this.produtosService.listar());
  }

  protected abrirNovo(): void {
    this.produtoEditando.set(null);
    this.modalAberto.set(true);
  }

  protected abrirEdicao(produto: Produto): void {
    this.produtoEditando.set(produto);
    this.modalAberto.set(true);
  }

  protected fecharModal(): void {
    this.modalAberto.set(false);
  }

  protected async salvar(dados: Omit<Produto, 'id'>): Promise<void> {
    const editando = this.produtoEditando();
    if (editando) {
      await this.produtosService.atualizar(editando.id, dados);
    } else {
      await this.produtosService.criar(dados);
    }
    this.modalAberto.set(false);
    await this.carregar();
  }

  protected pedirRemocao(produto: Produto): void {
    this.produtoParaRemover.set(produto);
  }

  protected cancelarRemocao(): void {
    this.produtoParaRemover.set(null);
  }

  protected async confirmarRemocao(): Promise<void> {
    const produto = this.produtoParaRemover();
    if (!produto) return;
    await this.produtosService.remover(produto.id);
    this.produtoParaRemover.set(null);
    await this.carregar();
  }

  protected estoqueTotal(produto: Produto): number {
    return produto.variacoes.reduce((soma, v) => soma + v.estoque, 0);
  }
}
```

```html
<!-- src/app/features/admin/produtos/produtos.html -->
<div class="admin-tela">
  <div class="admin-tela__cabecalho">
    <h1>Produtos</h1>
    <app-button (clicado)="abrirNovo()">Novo produto</app-button>
  </div>

  @if (lista().length === 0) {
    <app-empty-state mensagem="Nenhum produto cadastrado ainda."></app-empty-state>
  } @else {
    <app-table [cabecalhos]="['Foto', 'Nome', 'Categoria', 'Preço', 'Estoque', 'Ações']">
      @for (produto of lista(); track produto.id) {
        <tr>
          <td><img class="admin-tela__miniatura" [src]="produto.fotos[0]" [alt]="produto.nome" /></td>
          <td>{{ produto.nome }}</td>
          <td>{{ rotuloCategoria[produto.categoria] }}</td>
          <td>R$ {{ produto.preco | precoBr }}</td>
          <td>{{ estoqueTotal(produto) }}</td>
          <td>
            <button type="button" (click)="abrirEdicao(produto)">Editar</button>
            <button type="button" (click)="pedirRemocao(produto)">Remover</button>
          </td>
        </tr>
      }
    </app-table>
  }
</div>

<app-modal
  [titulo]="produtoEditando() ? 'Editar produto' : 'Novo produto'"
  [aberto]="modalAberto()"
  (fechar)="fecharModal()"
>
  <app-produto-form [produto]="produtoEditando()" (salvar)="salvar($event)" (cancelar)="fecharModal()"></app-produto-form>
</app-modal>

<app-modal titulo="Remover produto" [aberto]="produtoParaRemover() !== null" (fechar)="cancelarRemocao()">
  @if (produtoParaRemover(); as produto) {
    <p>Tem certeza que deseja remover "{{ produto.nome }}"? Essa ação não pode ser desfeita.</p>
    <div class="admin-tela__confirmar-acoes">
      <app-button variante="secundario" (clicado)="cancelarRemocao()">Cancelar</app-button>
      <app-button (clicado)="confirmarRemocao()">Remover</app-button>
    </div>
  }
</app-modal>
```

```scss
// src/app/features/admin/produtos/produtos.scss
@use 'styles/tokens' as *;

.admin-tela__cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--espaco-5);
}

.admin-tela__miniatura {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--raio-padrao);
}

.admin-tela__confirmar-acoes {
  display: flex;
  justify-content: flex-end;
  gap: var(--espaco-3);
  margin-top: var(--espaco-4);
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `Produtos`

- [ ] **Step 5: Refinar visualmente com a skill frontend-design**

Invoque a skill `frontend-design` para o layout da tela (cabeçalho, botão de ação primária, miniaturas na tabela).

- [ ] **Step 6: Commit**

```bash
git add src/app/features/admin/produtos/produtos.ts src/app/features/admin/produtos/produtos.html src/app/features/admin/produtos/produtos.scss src/app/features/admin/produtos/produtos.spec.ts
git commit -m "feat: adiciona tela Admin de Produtos (CRUD)"
```

---

### Task 14: EventoForm

**Files:**
- Create: `src/app/features/admin/eventos/evento-form/evento-form.ts`, `evento-form.html`, `evento-form.scss`, `evento-form.spec.ts`

**Interfaces:**
- Consumes: `Evento` (`core/events/evento.model.ts`); `TextField`, `Textarea`, `Button`
- Produces: `EventoForm` — `evento = input<Evento | null>(null)`, `salvar = output<Omit<Evento, 'id'>>()`, `cancelar = output<void>()`

- [ ] **Step 1: Escrever os testes que falham**

```typescript
// src/app/features/admin/eventos/evento-form/evento-form.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventoForm } from './evento-form';
import { Evento } from '../../../../core/events/evento.model';

const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  foto: 'https://picsum.photos/seed/retiro/480/480',
};

describe('EventoForm', () => {
  let fixture: ComponentFixture<EventoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EventoForm] }).compileComponents();
    fixture = TestBed.createComponent(EventoForm);
    fixture.detectChanges();
  });

  it('não emite salvar quando o formulário está inválido', () => {
    let emitiu = false;
    fixture.componentInstance.salvar.subscribe(() => (emitiu = true));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(emitiu).toBeFalse();
  });

  it('em modo edição, pré-preenche o formulário com os dados do evento', () => {
    fixture.componentRef.setInput('evento', EVENTO);
    fixture.detectChanges();
    // Checa o valor do FormControl, não o textContent: um <textarea> só reflete
    // no textContent o markup estático inicial, não o valor definido via
    // [formControl] (isso é feito via propriedade DOM `value`, não innerHTML).
    expect(fixture.componentInstance['form'].controls.titulo.value).toBe('Retiro de Verão REDE');
    expect(fixture.componentInstance['form'].controls.descricao.value).toBe('Um fim de semana de imersão.');
  });

  it('emite salvar com os dados preenchidos e a data convertida para ISO', () => {
    fixture.componentInstance['form'].setValue({
      titulo: 'Culto de Jovens',
      descricao: 'Descrição',
      dataHora: '2026-11-01T19:00',
      local: 'Templo sede, Vila Maria',
      preco: 0,
      vagasTotais: 50,
      foto: 'https://picsum.photos/seed/novo/480/480',
    });
    fixture.detectChanges();

    let emitido: Omit<Evento, 'id'> | undefined;
    fixture.componentInstance.salvar.subscribe((dados) => (emitido = dados));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(emitido?.titulo).toBe('Culto de Jovens');
    expect(emitido?.vagasTotais).toBe(50);
    expect(emitido?.dataHora).toBe(new Date('2026-11-01T19:00').toISOString());
  });

  it('emite cancelar ao clicar em Cancelar', () => {
    let emitiu = false;
    fixture.componentInstance.cancelar.subscribe(() => (emitiu = true));
    const botoes: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    const cancelar = Array.from(botoes).find((b) => b.textContent?.includes('Cancelar'));
    cancelar?.click();
    expect(emitiu).toBeTrue();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `./evento-form` não existe

- [ ] **Step 3: Implementar o componente**

```typescript
// src/app/features/admin/eventos/evento-form/evento-form.ts
import { Component, OnChanges, SimpleChanges, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Evento } from '../../../../core/events/evento.model';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { Textarea } from '../../../../shared/ui/textarea/textarea';
import { Button } from '../../../../shared/ui/button/button';

@Component({
  selector: 'app-evento-form',
  imports: [ReactiveFormsModule, TextField, Textarea, Button],
  templateUrl: './evento-form.html',
  styleUrl: './evento-form.scss',
})
export class EventoForm implements OnChanges {
  private readonly fb = inject(FormBuilder);

  readonly evento = input<Evento | null>(null);
  readonly salvar = output<Omit<Evento, 'id'>>();
  readonly cancelar = output<void>();

  protected readonly tentouEnviar = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required]],
    descricao: ['', [Validators.required]],
    dataHora: ['', [Validators.required]],
    local: ['', [Validators.required]],
    preco: [0, [Validators.required, Validators.min(0)]],
    vagasTotais: [1, [Validators.required, Validators.min(1)]],
    foto: ['', [Validators.required]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['evento']) return;
    const evento = this.evento();
    if (evento) {
      this.form.patchValue({
        titulo: evento.titulo,
        descricao: evento.descricao,
        dataHora: evento.dataHora.slice(0, 16),
        local: evento.local,
        preco: evento.preco,
        vagasTotais: evento.vagasTotais,
        foto: evento.foto,
      });
    } else {
      this.form.reset({ titulo: '', descricao: '', dataHora: '', local: '', preco: 0, vagasTotais: 1, foto: '' });
    }
  }

  protected get erroTitulo(): string {
    const c = this.form.controls.titulo;
    return c.touched && c.invalid ? 'Informe o título do evento.' : '';
  }

  protected get erroDescricao(): string {
    const c = this.form.controls.descricao;
    return c.touched && c.invalid ? 'Informe a descrição.' : '';
  }

  protected get erroDataHora(): string {
    const c = this.form.controls.dataHora;
    return c.touched && c.invalid ? 'Informe a data e hora do evento.' : '';
  }

  protected get erroLocal(): string {
    const c = this.form.controls.local;
    return c.touched && c.invalid ? 'Informe o local.' : '';
  }

  protected get erroPreco(): string {
    const c = this.form.controls.preco;
    if (c.touched && c.hasError('required')) return 'Informe o preço (0 para gratuito).';
    if (c.touched && c.hasError('min')) return 'O preço não pode ser negativo.';
    return '';
  }

  protected get erroVagasTotais(): string {
    const c = this.form.controls.vagasTotais;
    if (c.touched && c.hasError('required')) return 'Informe o total de vagas.';
    if (c.touched && c.hasError('min')) return 'É preciso ao menos 1 vaga.';
    return '';
  }

  protected get erroFoto(): string {
    const c = this.form.controls.foto;
    return c.touched && c.invalid ? 'Informe a URL da foto.' : '';
  }

  protected aoEnviar(): void {
    this.tentouEnviar.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const bruto = this.form.getRawValue();
    this.salvar.emit({
      titulo: bruto.titulo,
      descricao: bruto.descricao,
      dataHora: new Date(bruto.dataHora).toISOString(),
      local: bruto.local,
      preco: Number(bruto.preco),
      vagasTotais: Number(bruto.vagasTotais),
      foto: bruto.foto,
    });
  }
}
```

```html
<!-- src/app/features/admin/eventos/evento-form/evento-form.html -->
<form class="evento-form" (ngSubmit)="aoEnviar()">
  <app-text-field rotulo="Título" [controle]="form.controls.titulo" [erro]="erroTitulo"></app-text-field>
  <app-textarea rotulo="Descrição" [controle]="form.controls.descricao" [erro]="erroDescricao"></app-textarea>
  <app-text-field
    rotulo="Data e hora"
    tipo="datetime-local"
    [controle]="form.controls.dataHora"
    [erro]="erroDataHora"
  ></app-text-field>
  <app-text-field rotulo="Local" [controle]="form.controls.local" [erro]="erroLocal"></app-text-field>
  <app-text-field
    rotulo="Preço (0 para gratuito)"
    tipo="number"
    [controle]="form.controls.preco"
    [erro]="erroPreco"
  ></app-text-field>
  <app-text-field
    rotulo="Vagas totais"
    tipo="number"
    [controle]="form.controls.vagasTotais"
    [erro]="erroVagasTotais"
  ></app-text-field>
  <app-text-field rotulo="Foto (URL)" [controle]="form.controls.foto" [erro]="erroFoto"></app-text-field>

  <div class="evento-form__acoes">
    <app-button variante="secundario" (clicado)="cancelar.emit()">Cancelar</app-button>
    <app-button tipo="submit">Salvar</app-button>
  </div>
</form>
```

```scss
// src/app/features/admin/eventos/evento-form/evento-form.scss
@use 'styles/tokens' as *;

.evento-form {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-4);
}

.evento-form__acoes {
  display: flex;
  justify-content: flex-end;
  gap: var(--espaco-3);
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `EventoForm`

- [ ] **Step 5: Refinar visualmente com a skill frontend-design**

Invoque a skill `frontend-design` para o layout do formulário de evento.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/admin/eventos/evento-form/
git commit -m "feat: adiciona EventoForm para criar/editar eventos"
```

---

### Task 15: Tela Eventos

**Files:**
- Create: `src/app/features/admin/eventos/eventos.ts`, `eventos.html`, `eventos.scss`, `eventos.spec.ts`

**Interfaces:**
- Consumes: `EventService.listar/criar/atualizar/remover`, `RegistrationService.vagasRestantes`; `Table`, `Modal`, `EventoForm`, `EmptyState`, `DataBrPipe`
- Produces: `Eventos` (componente de rota, `admin/eventos`)

- [ ] **Step 1: Escrever os testes que falham**

```typescript
// src/app/features/admin/eventos/eventos.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Eventos } from './eventos';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { Evento } from '../../../core/events/evento.model';

const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  foto: 'https://picsum.photos/seed/retiro/480/480',
};

describe('Eventos', () => {
  let fixture: ComponentFixture<Eventos>;
  let eventosServicoFalso: jasmine.SpyObj<Pick<EventService, 'listar' | 'criar' | 'atualizar' | 'remover'>>;
  let inscricoesServicoFalso: jasmine.SpyObj<Pick<RegistrationService, 'vagasRestantes'>>;

  async function montar(eventos: Evento[]): Promise<void> {
    eventosServicoFalso = jasmine.createSpyObj('EventService', ['listar', 'criar', 'atualizar', 'remover']);
    eventosServicoFalso.listar.and.resolveTo(eventos);
    inscricoesServicoFalso = jasmine.createSpyObj('RegistrationService', ['vagasRestantes']);
    inscricoesServicoFalso.vagasRestantes.and.resolveTo(4);

    await TestBed.configureTestingModule({
      imports: [Eventos],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventosServicoFalso },
        { provide: RegistrationService, useValue: inscricoesServicoFalso },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Eventos);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o estado vazio quando não há eventos', async () => {
    await montar([]);
    expect(fixture.nativeElement.textContent).toContain('Nenhum evento cadastrado ainda.');
  });

  it('lista os eventos com título, local e vagas', async () => {
    await montar([EVENTO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('Sítio Vida Nova, Ibiúna');
    expect(texto).toContain('4');
  });

  it('chama EventService.criar ao salvar o formulário em modo criação', async () => {
    await montar([]);
    eventosServicoFalso.criar.and.resolveTo(EVENTO);
    eventosServicoFalso.listar.and.resolveTo([EVENTO]);

    fixture.componentInstance['abrirNovo']();
    await fixture.componentInstance['salvar']({
      titulo: EVENTO.titulo,
      descricao: EVENTO.descricao,
      dataHora: EVENTO.dataHora,
      local: EVENTO.local,
      preco: EVENTO.preco,
      vagasTotais: EVENTO.vagasTotais,
      foto: EVENTO.foto,
    });

    expect(eventosServicoFalso.criar).toHaveBeenCalled();
  });

  it('chama EventService.remover ao confirmar a remoção', async () => {
    await montar([EVENTO]);
    eventosServicoFalso.remover.and.resolveTo();
    eventosServicoFalso.listar.and.resolveTo([]);

    fixture.componentInstance['pedirRemocao'](EVENTO);
    await fixture.componentInstance['confirmarRemocao']();

    expect(eventosServicoFalso.remover).toHaveBeenCalledWith('1');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `./eventos` não existe

- [ ] **Step 3: Implementar o componente**

```typescript
// src/app/features/admin/eventos/eventos.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { Evento } from '../../../core/events/evento.model';
import { Table } from '../../../shared/ui/table/table';
import { Modal } from '../../../shared/ui/modal/modal';
import { Button } from '../../../shared/ui/button/button';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { EventoForm } from './evento-form/evento-form';

@Component({
  selector: 'app-eventos',
  imports: [RouterLink, Table, Modal, Button, EmptyState, DataBrPipe, EventoForm],
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss',
})
export class Eventos implements OnInit {
  private readonly eventosService = inject(EventService);
  private readonly inscricoesService = inject(RegistrationService);

  protected readonly lista = signal<Evento[]>([]);
  protected readonly vagasRestantes = signal<Record<string, number>>({});
  protected readonly modalAberto = signal(false);
  protected readonly eventoEditando = signal<Evento | null>(null);
  protected readonly eventoParaRemover = signal<Evento | null>(null);

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    const eventos = await this.eventosService.listar();
    this.lista.set(eventos);
    const vagas = await Promise.all(
      eventos.map((e) => this.inscricoesService.vagasRestantes(e.id, e.vagasTotais)),
    );
    const mapa: Record<string, number> = {};
    eventos.forEach((e, indice) => (mapa[e.id] = vagas[indice]));
    this.vagasRestantes.set(mapa);
  }

  protected ocupadas(evento: Evento): number {
    return evento.vagasTotais - (this.vagasRestantes()[evento.id] ?? evento.vagasTotais);
  }

  protected abrirNovo(): void {
    this.eventoEditando.set(null);
    this.modalAberto.set(true);
  }

  protected abrirEdicao(evento: Evento): void {
    this.eventoEditando.set(evento);
    this.modalAberto.set(true);
  }

  protected fecharModal(): void {
    this.modalAberto.set(false);
  }

  protected async salvar(dados: Omit<Evento, 'id'>): Promise<void> {
    const editando = this.eventoEditando();
    if (editando) {
      await this.eventosService.atualizar(editando.id, dados);
    } else {
      await this.eventosService.criar(dados);
    }
    this.modalAberto.set(false);
    await this.carregar();
  }

  protected pedirRemocao(evento: Evento): void {
    this.eventoParaRemover.set(evento);
  }

  protected cancelarRemocao(): void {
    this.eventoParaRemover.set(null);
  }

  protected async confirmarRemocao(): Promise<void> {
    const evento = this.eventoParaRemover();
    if (!evento) return;
    await this.eventosService.remover(evento.id);
    this.eventoParaRemover.set(null);
    await this.carregar();
  }
}
```

```html
<!-- src/app/features/admin/eventos/eventos.html -->
<div class="admin-tela">
  <div class="admin-tela__cabecalho">
    <h1>Eventos</h1>
    <app-button (clicado)="abrirNovo()">Novo evento</app-button>
  </div>

  @if (lista().length === 0) {
    <app-empty-state mensagem="Nenhum evento cadastrado ainda."></app-empty-state>
  } @else {
    <app-table [cabecalhos]="['Foto', 'Título', 'Data', 'Local', 'Preço', 'Vagas', 'Ações']">
      @for (evento of lista(); track evento.id) {
        <tr>
          <td><img class="admin-tela__miniatura" [src]="evento.foto" [alt]="evento.titulo" /></td>
          <td>{{ evento.titulo }}</td>
          <td>{{ evento.dataHora | dataBr }}</td>
          <td>{{ evento.local }}</td>
          <td>{{ evento.preco === 0 ? 'Gratuito' : 'R$ ' + evento.preco }}</td>
          <td>{{ ocupadas(evento) }}/{{ evento.vagasTotais }}</td>
          <td>
            <a [routerLink]="['/admin/eventos', evento.id, 'inscricoes']">Inscrições</a>
            <button type="button" (click)="abrirEdicao(evento)">Editar</button>
            <button type="button" (click)="pedirRemocao(evento)">Remover</button>
          </td>
        </tr>
      }
    </app-table>
  }
</div>

<app-modal
  [titulo]="eventoEditando() ? 'Editar evento' : 'Novo evento'"
  [aberto]="modalAberto()"
  (fechar)="fecharModal()"
>
  <app-evento-form [evento]="eventoEditando()" (salvar)="salvar($event)" (cancelar)="fecharModal()"></app-evento-form>
</app-modal>

<app-modal titulo="Remover evento" [aberto]="eventoParaRemover() !== null" (fechar)="cancelarRemocao()">
  @if (eventoParaRemover(); as evento) {
    <p>Tem certeza que deseja remover "{{ evento.titulo }}"? Essa ação não pode ser desfeita.</p>
    <div class="admin-tela__confirmar-acoes">
      <app-button variante="secundario" (clicado)="cancelarRemocao()">Cancelar</app-button>
      <app-button (clicado)="confirmarRemocao()">Remover</app-button>
    </div>
  }
</app-modal>
```

```scss
// src/app/features/admin/eventos/eventos.scss
@use 'styles/tokens' as *;

.admin-tela__cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--espaco-5);
}

.admin-tela__miniatura {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--raio-padrao);
}

.admin-tela__confirmar-acoes {
  display: flex;
  justify-content: flex-end;
  gap: var(--espaco-3);
  margin-top: var(--espaco-4);
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `Eventos`

- [ ] **Step 5: Refinar visualmente com a skill frontend-design**

Invoque a skill `frontend-design` para o layout da tela (cabeçalho, miniatura, link de Inscrições).

- [ ] **Step 6: Commit**

```bash
git add src/app/features/admin/eventos/eventos.ts src/app/features/admin/eventos/eventos.html src/app/features/admin/eventos/eventos.scss src/app/features/admin/eventos/eventos.spec.ts
git commit -m "feat: adiciona tela Admin de Eventos (CRUD)"
```

---

### Task 16: Tela Pedidos

**Files:**
- Create: `src/app/features/admin/pedidos/pedidos.ts`, `pedidos.html`, `pedidos.scss`, `pedidos.spec.ts`

**Interfaces:**
- Consumes: `OrderService.listarTodos/atualizarStatus`, `AuthService.buscarPorId`, `proximoStatus` (`core/orders/pedido.model.ts`); `Table`, `EmptyState`, `PrecoBrPipe`, `DataBrPipe`
- Produces: `Pedidos` (componente de rota, `admin/pedidos`)

- [ ] **Step 1: Escrever os testes que falham**

```typescript
// src/app/features/admin/pedidos/pedidos.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pedidos } from './pedidos';
import { OrderService } from '../../../core/orders/order.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Pedido } from '../../../core/orders/pedido.model';
import { Usuario } from '../../../core/auth/usuario.model';

const CLIENTE: Usuario = { id: 'u1', nome: 'Jovem Teste', email: 'jovem@rede.com', papel: 'jovem' };

const PEDIDO_RETIRADA: Pedido = {
  id: '1',
  usuarioId: 'u1',
  itens: [
    {
      produtoId: '1',
      nome: 'Camiseta REDE',
      precoUnitario: 79.9,
      fotoUrl: 'https://picsum.photos/seed/x/480/480',
      tamanho: 'M',
      cor: 'Preto',
      quantidade: 2,
    },
  ],
  formaEntrega: 'retirada',
  valorTotal: 159.8,
  status: 'pago',
  criadoEm: '2026-01-01T00:00:00.000Z',
};

describe('Pedidos', () => {
  let fixture: ComponentFixture<Pedidos>;
  let pedidosServicoFalso: jasmine.SpyObj<Pick<OrderService, 'listarTodos' | 'atualizarStatus'>>;
  let authServicoFalso: jasmine.SpyObj<Pick<AuthService, 'buscarPorId'>>;

  async function montar(pedidos: Pedido[]): Promise<void> {
    pedidosServicoFalso = jasmine.createSpyObj('OrderService', ['listarTodos', 'atualizarStatus']);
    pedidosServicoFalso.listarTodos.and.resolveTo(pedidos);
    authServicoFalso = jasmine.createSpyObj('AuthService', ['buscarPorId']);
    authServicoFalso.buscarPorId.and.resolveTo(CLIENTE);

    await TestBed.configureTestingModule({
      imports: [Pedidos],
      providers: [
        { provide: OrderService, useValue: pedidosServicoFalso },
        { provide: AuthService, useValue: authServicoFalso },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Pedidos);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o estado vazio quando não há pedidos', async () => {
    await montar([]);
    expect(fixture.nativeElement.textContent).toContain('Nenhum pedido registrado ainda.');
  });

  it('lista os pedidos com cliente, total e status traduzido', async () => {
    await montar([PEDIDO_RETIRADA]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Jovem Teste');
    expect(texto).toContain('159,80');
    expect(texto).toContain('Pago');
  });

  it('mostra o botão "Avançar para Em preparo" para um pedido pago', async () => {
    await montar([PEDIDO_RETIRADA]);
    expect(fixture.nativeElement.textContent).toContain('Avançar para Em preparo');
  });

  it('não mostra botão de avançar para um pedido já retirado', async () => {
    await montar([{ ...PEDIDO_RETIRADA, status: 'retirado' }]);
    expect(fixture.nativeElement.textContent).not.toContain('Avançar para');
  });

  it('ao clicar em avançar, chama atualizarStatus com o próximo status correto', async () => {
    await montar([PEDIDO_RETIRADA]);
    pedidosServicoFalso.atualizarStatus.and.resolveTo({ ...PEDIDO_RETIRADA, status: 'em_preparo' });
    pedidosServicoFalso.listarTodos.and.resolveTo([{ ...PEDIDO_RETIRADA, status: 'em_preparo' }]);

    const botao: HTMLButtonElement = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b: HTMLButtonElement) => b.textContent?.includes('Avançar'),
    ) as HTMLButtonElement;
    botao.click();
    await fixture.whenStable();

    expect(pedidosServicoFalso.atualizarStatus).toHaveBeenCalledWith('1', 'em_preparo');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `./pedidos` não existe

- [ ] **Step 3: Implementar o componente**

```typescript
// src/app/features/admin/pedidos/pedidos.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { OrderService } from '../../../core/orders/order.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Pedido, StatusPedido, proximoStatus } from '../../../core/orders/pedido.model';
import { Usuario } from '../../../core/auth/usuario.model';
import { Table } from '../../../shared/ui/table/table';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

const ROTULO_STATUS: Record<StatusPedido, string> = {
  pago: 'Pago',
  em_preparo: 'Em preparo',
  retirado: 'Retirado',
  entregue: 'Entregue',
};

@Component({
  selector: 'app-pedidos',
  imports: [Table, EmptyState, PrecoBrPipe, DataBrPipe],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.scss',
})
export class Pedidos implements OnInit {
  private readonly pedidosService = inject(OrderService);
  private readonly auth = inject(AuthService);

  protected readonly lista = signal<Pedido[]>([]);
  protected readonly clientes = signal<Record<string, Usuario | undefined>>({});
  protected readonly rotuloStatus = ROTULO_STATUS;

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    const pedidos = await this.pedidosService.listarTodos();
    this.lista.set(pedidos);
    const idsUnicos = [...new Set(pedidos.map((p) => p.usuarioId))];
    const usuarios = await Promise.all(idsUnicos.map((id) => this.auth.buscarPorId(id)));
    const mapa: Record<string, Usuario | undefined> = {};
    idsUnicos.forEach((id, indice) => (mapa[id] = usuarios[indice]));
    this.clientes.set(mapa);
  }

  protected nomeCliente(usuarioId: string): string {
    return this.clientes()[usuarioId]?.nome ?? 'Cliente não encontrado';
  }

  protected rotuloProximo(pedido: Pedido): string {
    const proximo = proximoStatus(pedido);
    return proximo ? `Avançar para ${this.rotuloStatus[proximo]}` : '';
  }

  protected resumoItens(pedido: Pedido): string {
    if (pedido.itens.length === 0) return 'Sem itens';
    const restante = pedido.itens.length - 1;
    return restante > 0 ? `${pedido.itens[0].nome} e mais ${restante}` : pedido.itens[0].nome;
  }

  protected async avancar(pedido: Pedido): Promise<void> {
    const proximo = proximoStatus(pedido);
    if (!proximo) return;
    await this.pedidosService.atualizarStatus(pedido.id, proximo);
    await this.carregar();
  }
}
```

```html
<!-- src/app/features/admin/pedidos/pedidos.html -->
<div class="admin-tela">
  <h1>Pedidos</h1>
  @if (lista().length === 0) {
    <app-empty-state mensagem="Nenhum pedido registrado ainda."></app-empty-state>
  } @else {
    <app-table [cabecalhos]="['Pedido', 'Cliente', 'Itens', 'Total', 'Status', 'Data', 'Ações']">
      @for (pedido of lista(); track pedido.id) {
        <tr>
          <td>#{{ pedido.id }}</td>
          <td>{{ nomeCliente(pedido.usuarioId) }}</td>
          <td>{{ resumoItens(pedido) }}</td>
          <td>R$ {{ pedido.valorTotal | precoBr }}</td>
          <td>{{ rotuloStatus[pedido.status] }}</td>
          <td>{{ pedido.criadoEm | dataBr }}</td>
          <td>
            @if (rotuloProximo(pedido)) {
              <button type="button" (click)="avancar(pedido)">{{ rotuloProximo(pedido) }}</button>
            }
          </td>
        </tr>
      }
    </app-table>
  }
</div>
```

```scss
// src/app/features/admin/pedidos/pedidos.scss
@use 'styles/tokens' as *;

h1 {
  margin-bottom: var(--espaco-5);
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `Pedidos`

- [ ] **Step 5: Refinar visualmente com a skill frontend-design**

Invoque a skill `frontend-design` para o visual da tela (badge de status, tabela densa e legível).

- [ ] **Step 6: Commit**

```bash
git add src/app/features/admin/pedidos/
git commit -m "feat: adiciona tela Admin de Pedidos (avançar status)"
```

---

### Task 17: Tela Inscrições do evento

**Files:**
- Create: `src/app/features/admin/eventos/inscricoes/inscricoes.ts`, `inscricoes.html`, `inscricoes.scss`, `inscricoes.spec.ts`

**Interfaces:**
- Consumes: `EventService.buscarPorId`, `RegistrationService.listarPorEvento/cancelar`, `AuthService.buscarPorId`; `Table`, `EmptyState`, `DataBrPipe`
- Produces: `Inscricoes` (componente de rota, `admin/eventos/:id/inscricoes`)

- [ ] **Step 1: Escrever os testes que falham**

```typescript
// src/app/features/admin/eventos/inscricoes/inscricoes.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Inscricoes } from './inscricoes';
import { EventService } from '../../../../core/events/event.service';
import { RegistrationService } from '../../../../core/registrations/registration.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Evento } from '../../../../core/events/evento.model';
import { Inscricao } from '../../../../core/registrations/inscricao.model';
import { Usuario } from '../../../../core/auth/usuario.model';

const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  foto: 'https://picsum.photos/seed/retiro/480/480',
};

const INSCRICAO: Inscricao = {
  id: 'i1',
  eventoId: '1',
  usuarioId: 'u1',
  status: 'confirmada',
  valorPago: 250,
  criadoEm: '2026-01-01T00:00:00.000Z',
};

const INSCRITO: Usuario = { id: 'u1', nome: 'Jovem Teste', email: 'jovem@rede.com', papel: 'jovem' };

describe('Inscricoes', () => {
  let fixture: ComponentFixture<Inscricoes>;
  let eventosServicoFalso: jasmine.SpyObj<Pick<EventService, 'buscarPorId'>>;
  let inscricoesServicoFalso: jasmine.SpyObj<Pick<RegistrationService, 'listarPorEvento' | 'cancelar'>>;
  let authServicoFalso: jasmine.SpyObj<Pick<AuthService, 'buscarPorId'>>;

  async function montar(inscricoes: Inscricao[]): Promise<void> {
    eventosServicoFalso = jasmine.createSpyObj('EventService', ['buscarPorId']);
    eventosServicoFalso.buscarPorId.and.resolveTo(EVENTO);
    inscricoesServicoFalso = jasmine.createSpyObj('RegistrationService', ['listarPorEvento', 'cancelar']);
    inscricoesServicoFalso.listarPorEvento.and.resolveTo(inscricoes);
    authServicoFalso = jasmine.createSpyObj('AuthService', ['buscarPorId']);
    authServicoFalso.buscarPorId.and.resolveTo(INSCRITO);

    await TestBed.configureTestingModule({
      imports: [Inscricoes],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventosServicoFalso },
        { provide: RegistrationService, useValue: inscricoesServicoFalso },
        { provide: AuthService, useValue: authServicoFalso },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Inscricoes);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o título do evento e o estado vazio quando não há inscrições', async () => {
    await montar([]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('Ninguém se inscreveu neste evento ainda.');
  });

  it('lista os inscritos com nome, email e status', async () => {
    await montar([INSCRICAO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Jovem Teste');
    expect(texto).toContain('jovem@rede.com');
    expect(texto).toContain('confirmada');
  });

  it('cancelar chama RegistrationService.cancelar e recarrega a lista', async () => {
    await montar([INSCRICAO]);
    inscricoesServicoFalso.cancelar.and.resolveTo();
    inscricoesServicoFalso.listarPorEvento.and.resolveTo([{ ...INSCRICAO, status: 'cancelada' }]);

    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="botao-cancelar"]');
    botao.click();
    await fixture.whenStable();

    expect(inscricoesServicoFalso.cancelar).toHaveBeenCalledWith('i1');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `ng test --watch=false`
Expected: FAIL — módulo `./inscricoes` não existe

- [ ] **Step 3: Implementar o componente**

```typescript
// src/app/features/admin/eventos/inscricoes/inscricoes.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../../../core/events/event.service';
import { RegistrationService } from '../../../../core/registrations/registration.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Evento } from '../../../../core/events/evento.model';
import { Inscricao } from '../../../../core/registrations/inscricao.model';
import { Usuario } from '../../../../core/auth/usuario.model';
import { Table } from '../../../../shared/ui/table/table';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { DataBrPipe } from '../../../../shared/pipes/data-br.pipe';

@Component({
  selector: 'app-inscricoes',
  imports: [RouterLink, Table, EmptyState, DataBrPipe],
  templateUrl: './inscricoes.html',
  styleUrl: './inscricoes.scss',
})
export class Inscricoes implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventosService = inject(EventService);
  private readonly inscricoesService = inject(RegistrationService);
  private readonly auth = inject(AuthService);

  protected readonly evento = signal<Evento | undefined>(undefined);
  protected readonly lista = signal<Inscricao[]>([]);
  protected readonly inscritos = signal<Record<string, Usuario | undefined>>({});

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.evento.set(await this.eventosService.buscarPorId(id));
    const inscricoes = await this.inscricoesService.listarPorEvento(id);
    this.lista.set(inscricoes);
    const idsUnicos = [...new Set(inscricoes.map((i) => i.usuarioId))];
    const usuarios = await Promise.all(idsUnicos.map((uid) => this.auth.buscarPorId(uid)));
    const mapa: Record<string, Usuario | undefined> = {};
    idsUnicos.forEach((uid, indice) => (mapa[uid] = usuarios[indice]));
    this.inscritos.set(mapa);
  }

  protected nomeInscrito(usuarioId: string): string {
    return this.inscritos()[usuarioId]?.nome ?? 'Usuário não encontrado';
  }

  protected emailInscrito(usuarioId: string): string {
    return this.inscritos()[usuarioId]?.email ?? '';
  }

  protected async cancelar(inscricao: Inscricao): Promise<void> {
    await this.inscricoesService.cancelar(inscricao.id);
    await this.carregar();
  }
}
```

```html
<!-- src/app/features/admin/eventos/inscricoes/inscricoes.html -->
<div class="admin-tela">
  <a routerLink="/admin/eventos">← Voltar para Eventos</a>
  <h1>{{ evento()?.titulo }}</h1>

  @if (lista().length === 0) {
    <app-empty-state mensagem="Ninguém se inscreveu neste evento ainda."></app-empty-state>
  } @else {
    <app-table [cabecalhos]="['Nome', 'Email', 'Status', 'Data', 'Ações']">
      @for (inscricao of lista(); track inscricao.id) {
        <tr>
          <td>{{ nomeInscrito(inscricao.usuarioId) }}</td>
          <td>{{ emailInscrito(inscricao.usuarioId) }}</td>
          <td>{{ inscricao.status }}</td>
          <td>{{ inscricao.criadoEm | dataBr }}</td>
          <td>
            @if (inscricao.status === 'confirmada') {
              <button type="button" data-testid="botao-cancelar" (click)="cancelar(inscricao)">
                Cancelar inscrição
              </button>
            }
          </td>
        </tr>
      }
    </app-table>
  }
</div>
```

```scss
// src/app/features/admin/eventos/inscricoes/inscricoes.scss
@use 'styles/tokens' as *;

h1 {
  margin: var(--espaco-3) 0 var(--espaco-5);
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `Inscricoes`

- [ ] **Step 5: Refinar visualmente com a skill frontend-design**

Invoque a skill `frontend-design` para o visual da tela (link de voltar, badge de status confirmada/cancelada).

- [ ] **Step 6: Commit**

```bash
git add src/app/features/admin/eventos/inscricoes/
git commit -m "feat: adiciona tela Admin de Inscricoes por evento"
```

---

### Task 18: Rotas do Admin, guard e link no Header

**Files:**
- Create: `src/app/features/admin/admin.routes.ts`
- Modify: `src/app/app.routes.ts`, `src/app/layout/header/header.ts`, `src/app/layout/header/header.html`, `src/app/layout/header/header.spec.ts`

**Interfaces:**
- Consumes: `adminGuard` (`core/auth/auth.guard.ts`, já existe), `AdminShell`, `Produtos`, `Pedidos`, `Eventos`, `Inscricoes` (todos já criados nas tasks anteriores)
- Produces: `ADMIN_ROUTES`; rota `/admin` registrada em `app.routes.ts`; link "Admin" no `Header`

- [ ] **Step 1: Criar `admin.routes.ts`**

```typescript
// src/app/features/admin/admin.routes.ts
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'produtos', pathMatch: 'full' },
  { path: 'produtos', loadComponent: () => import('./produtos/produtos').then((m) => m.Produtos) },
  { path: 'pedidos', loadComponent: () => import('./pedidos/pedidos').then((m) => m.Pedidos) },
  { path: 'eventos', loadComponent: () => import('./eventos/eventos').then((m) => m.Eventos) },
  {
    path: 'eventos/:id/inscricoes',
    loadComponent: () => import('./eventos/inscricoes/inscricoes').then((m) => m.Inscricoes),
  },
];
```

- [ ] **Step 2: Registrar a rota `/admin` em `app.routes.ts`**

Atualize o import do guard e adicione um novo bloco de rota (irmão do bloco do `Shell` e do bloco de `auth.routes`):

```typescript
import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', loadComponent: () => import('./features/loja/home/home').then((m) => m.Home) },
      { path: 'loja', loadChildren: () => import('./features/loja/loja.routes').then((m) => m.LOJA_ROUTES) },
      { path: 'eventos', loadChildren: () => import('./features/eventos/eventos.routes').then((m) => m.EVENTOS_ROUTES) },
      { path: 'sobre', loadComponent: () => import('./features/institucional/sobre/sobre').then((m) => m.Sobre) },
      { path: 'perfil', canActivate: [authGuard], loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil) },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layout/admin-shell/admin-shell').then((m) => m.AdminShell),
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
```

`canActivate: [adminGuard]` no nível pai já protege todas as rotas filhas — não é preciso repetir o guard em `admin.routes.ts`.

- [ ] **Step 3: Escrever os testes do link "Admin" que falham**

Atualize o `beforeEach` de `header.spec.ts` para incluir um signal `isAdmin` na fake `AuthService`:

```typescript
  let isAdmin: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    estaAutenticado = signal(false);
    quantidadeTotal = signal(0);
    isAdmin = signal(false);
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { estaAutenticado, isAdmin } },
        { provide: CartService, useValue: { quantidadeTotal } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
  });
```

Adicione os novos testes ao final do `describe`:

```typescript
  it('não mostra o link Admin quando isAdmin é false', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Admin');
  });

  it('mostra o link Admin quando isAdmin é true', async () => {
    isAdmin.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Admin');
  });
```

- [ ] **Step 4: Rodar e confirmar que falham**

Run: `ng test --watch=false`
Expected: FAIL — `Header` não expõe `isAdmin`, "mostra o link Admin..." falha por ausência do texto

- [ ] **Step 5: Adicionar o link no Header**

Em `header.ts`, adicione a propriedade:

```typescript
  protected readonly isAdmin = this.auth.isAdmin;
```

Em `header.html`, adicione dentro de `<nav class="cabecalho__nav">`, depois do link Sobre:

```html
    @if (isAdmin()) {
      <a routerLink="/admin" routerLinkActive="cabecalho__link--ativo">Admin</a>
    }
```

- [ ] **Step 6: Rodar e confirmar que passam**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `Header`

- [ ] **Step 7: Commit**

```bash
git add src/app/features/admin/admin.routes.ts src/app/app.routes.ts src/app/layout/header/
git commit -m "feat: registra rotas do Admin com adminGuard e link no Header"
```

---

### Task 19: Teste de integração das rotas do Admin

**Files:**
- Modify: `src/app/app.routes.spec.ts`

**Interfaces:**
- Consumes: `routes` (`app.routes.ts`), `AuthService`

- [ ] **Step 1: Escrever os testes**

Adicione ao `describe('Rotas do app (integração)', ...)` em `app.routes.spec.ts`, antes do teste "uma rota desconhecida...":

```typescript
  it('"/admin" sem login redireciona para "/"', async () => {
    const harness = await RouterTestingHarness.create('/admin');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });

  it('"/admin" logado como jovem redireciona para "/"', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.login('jovem@rede.com', 'jovem123');

    const harness = await RouterTestingHarness.create('/admin');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });

  it('"/admin" logado como admin renderiza a tela de Produtos', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.login('admin@rede.com', 'admin123');

    const harness = await RouterTestingHarness.create('/admin');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('Produtos');
  });

  it('"/admin/pedidos" logado como admin renderiza a tela de Pedidos', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.login('admin@rede.com', 'admin123');

    const harness = await RouterTestingHarness.create('/admin/pedidos');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('Pedidos');
  });
```

- [ ] **Step 2: Rodar e confirmar o resultado**

Run: `ng test --watch=false`
Expected: PASS em todos os testes de `Rotas do app (integração)` — todas as tasks anteriores já deixam essas rotas funcionais; este teste apenas verifica a integração de ponta a ponta.

Se algum teste falhar, verifique antes de tudo se `admin.routes.ts` está corretamente referenciado em `app.routes.ts` (Task 18) e se cada `loadComponent` aponta para o nome de classe exportado correto — não adivinhe uma correção, confira o arquivo real.

- [ ] **Step 3: Rodar a suíte completa uma última vez**

Run: `ng test --watch=false`
Expected: PASS em toda a suíte do projeto (Fundação + Loja + Eventos + Admin)

- [ ] **Step 4: Commit**

```bash
git add src/app/app.routes.spec.ts
git commit -m "test: integracao das rotas do Admin (fundacao + loja + eventos + admin)"
```
