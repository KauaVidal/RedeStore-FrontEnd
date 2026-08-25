# REDE Eventos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the events agenda, paid registration (mocked Mercado Pago payment), cancellation, and registration history for the REDE site, on top of the merged Fundação and Loja foundations.

**Architecture:** Two mocked services (`EventService`, `RegistrationService`) following the exact pattern already established by `ProductService`/`OrderService` (Signals where relevant, `mockLatency`, in-memory mock stores). Four lazy-loaded feature routes nested under the existing `Shell`, replacing the Fundação `EmBreve` placeholder at `'eventos'`. Two small, additive modifications to already-shipped screens (`Home`, `Perfil`).

**Tech Stack:** Angular (standalone components, signals), Reactive Forms not needed here (no forms in this plan), Karma/Jasmine — same stack as Fundação/Loja. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-25-rede-eventos-design.md`

## Global Constraints

- Eventos mockados estaticamente: 5-6 eventos fixos definidos em `event-mock-store.ts` (ver Task 1), fotos via `https://picsum.photos/seed/<slug>/480/480`, mesmo padrão da Loja.
- Inscrição sempre simula sucesso — `RegistrationService.inscrever()` sempre retorna uma inscrição com `status: 'confirmada'`, sem caminho de erro.
- Agenda e detalhes do evento são públicos; confirmação e minhas inscrições usam `authGuard` (já existe, de `core/auth/auth.guard.ts`).
- `vagasRestantes(eventoId)` é sempre **computado dinamicamente** (vagasTotais do evento menos inscrições com `status: 'confirmada'` daquele evento) — nunca um contador armazenado que precise ser mantido em sincronia.
- Não é possível se inscrever duas vezes no mesmo evento enquanto houver uma inscrição `'confirmada'` do usuário para ele — a tela de detalhes mostra "Você já está inscrito" no lugar do botão nesse caso.
- Convenção de nomes idêntica à Fundação/Loja: componentes **sem** sufixo `Component`, serviços **com** sufixo `Service`, Signals para estado (`input()`/`output()`/`signal()`/`computed()`), sem NgRx.
- **Padrão de CD em testes (zoneless, já validado na Fundação e na Loja):** uma mutação de signal feita **antes** do primeiro `detectChanges()` é sempre segura. Uma mutação feita **depois** — por um evento síncrono (clique) — precisa de `fixture.detectChanges(); await fixture.whenStable();`, nessa ordem. Uma mutação dentro de um handler **assíncrono** (`async (…) => { await …}`, ex.: um `ngOnInit` que aguarda uma chamada de serviço) precisa de `await fixture.whenStable(); fixture.detectChanges();` (`whenStable` primeiro). Todos os testes abaixo já seguem o padrão certo para o seu caso — não precisa decidir de novo, só seguir o que está escrito. Se algo ainda assim não passar, não adivinhe: tente uma vez trocar a ordem/chamada, e se não resolver, reporte BLOCKED com o que foi observado.
- Preço sempre exibido como `R$ {{ valor.toFixed(2) }}`; eventos com `preco: 0` mostram "Gratuito" no lugar do valor.
- Tokens de design (cores, tipografia, espaçamento) são os mesmos da Fundação/Loja — nenhum token novo é criado nesta fase.

---

## Estrutura de arquivos

```
src/app/
  core/
    events/
      evento.model.ts
      event-mock-store.ts
      event.service.ts (+ .spec.ts)
    registrations/
      inscricao.model.ts
      registration-mock-store.ts
      registration.service.ts (+ .spec.ts)
  features/
    eventos/
      eventos.routes.ts
      agenda/           (agenda.ts/.html/.scss/.spec.ts)
      evento-detalhes/  (evento-detalhes.ts/.html/.scss/.spec.ts)
      confirmacao/      (confirmacao.ts/.html/.scss/.spec.ts)
      minhas-inscricoes/(minhas-inscricoes.ts/.html/.scss/.spec.ts)
    loja/home/home.ts, home.html, home.spec.ts (MODIFY)
    perfil/perfil.ts, perfil.html, perfil.spec.ts (MODIFY)
  app.routes.ts (MODIFY)
  app.routes.spec.ts (MODIFY — estende o teste de integração já criado na Loja)
```

---

### Task 1: Evento — modelo, mock store e EventService

**Files:**
- Create: `src/app/core/events/evento.model.ts`, `event-mock-store.ts`, `event.service.ts`, `event.service.spec.ts`

**Interfaces:**
- Consumes: `mockLatency` (`core/mock/mock-latency.ts`, já existe)
- Produces: `Evento`; `EventService` (providedIn root): `listar(): Promise<Evento[]>`, `buscarPorId(id: string): Promise<Evento | undefined>`

- [ ] **Step 1: Criar o modelo**

```typescript
// src/app/core/events/evento.model.ts
export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  dataHora: string;
  local: string;
  preco: number;
  vagasTotais: number;
  foto: string;
}
```

- [ ] **Step 2: Criar o mock store com 6 eventos**

```typescript
// src/app/core/events/event-mock-store.ts
import { Evento } from './evento.model';

export const EVENTOS_MOCK: Evento[] = [
  {
    id: '1',
    titulo: 'Retiro de Verão REDE',
    descricao: 'Um fim de semana de imersão, comunhão e descanso para os jovens da REDE.',
    dataHora: '2026-01-16T08:00:00.000Z',
    local: 'Sítio Vida Nova, Ibiúna',
    preco: 250,
    vagasTotais: 4,
    foto: 'https://picsum.photos/seed/retiro-verao-rede/480/480',
  },
  {
    id: '2',
    titulo: 'Encontro de Jovens',
    descricao: 'Noite de louvor, palavra e comunhão na igreja.',
    dataHora: '2026-02-06T22:00:00.000Z',
    local: 'Templo sede, Vila Maria',
    preco: 0,
    vagasTotais: 100,
    foto: 'https://picsum.photos/seed/encontro-jovens-rede/480/480',
  },
  {
    id: '3',
    titulo: 'Culto Especial de Missões',
    descricao: 'Culto dedicado ao envio e apoio aos missionários da igreja.',
    dataHora: '2026-02-20T19:00:00.000Z',
    local: 'Templo sede, Vila Maria',
    preco: 0,
    vagasTotais: 200,
    foto: 'https://picsum.photos/seed/culto-missoes-rede/480/480',
  },
  {
    id: '4',
    titulo: 'Acampamento de Carnaval',
    descricao: 'Três dias de atividades ao ar livre, esportes e devocionais.',
    dataHora: '2026-02-13T08:00:00.000Z',
    local: 'Chácara Monte Sião, Mairiporã',
    preco: 180,
    vagasTotais: 3,
    foto: 'https://picsum.photos/seed/acampamento-carnaval-rede/480/480',
  },
  {
    id: '5',
    titulo: 'Workshop de Louvor',
    descricao: 'Oficina prática de instrumentos e ministério de louvor para iniciantes.',
    dataHora: '2026-03-07T14:00:00.000Z',
    local: 'Templo sede, Vila Maria',
    preco: 40,
    vagasTotais: 20,
    foto: 'https://picsum.photos/seed/workshop-louvor-rede/480/480',
  },
  {
    id: '6',
    titulo: 'Vigília de Oração',
    descricao: 'Noite inteira de oração e adoração para encerrar o trimestre.',
    dataHora: '2026-03-28T22:00:00.000Z',
    local: 'Templo sede, Vila Maria',
    preco: 0,
    vagasTotais: 150,
    foto: 'https://picsum.photos/seed/vigilia-oracao-rede/480/480',
  },
];
```

- [ ] **Step 3: Escrever o teste do EventService**

```typescript
// src/app/core/events/event.service.spec.ts
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EventService } from './event.service';
import { Evento } from './evento.model';

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventService);
  });

  it('listar() retorna todos os eventos', fakeAsync(() => {
    let eventos: Evento[] = [];
    service.listar().then((e) => (eventos = e));
    tick(400);
    expect(eventos.length).toBe(6);
  }));

  it('listar() não retorna a referência literal do mock store', fakeAsync(() => {
    let eventos: Evento[] = [];
    service.listar().then((e) => (eventos = e));
    tick(400);
    eventos.sort(() => 1);
    let segundaChamada: Evento[] = [];
    service.listar().then((e) => (segundaChamada = e));
    tick(400);
    expect(segundaChamada[0].id).toBe('1');
  }));

  it('buscarPorId() retorna o evento correspondente', fakeAsync(() => {
    let evento: Evento | undefined;
    service.buscarPorId('1').then((e) => (evento = e));
    tick(400);
    expect(evento?.titulo).toBe('Retiro de Verão REDE');
  }));

  it('buscarPorId() retorna undefined para um id inexistente', fakeAsync(() => {
    let evento: Evento | undefined;
    let chamou = false;
    service.buscarPorId('inexistente').then((e) => {
      evento = e;
      chamou = true;
    });
    tick(400);
    expect(chamou).toBeTrue();
    expect(evento).toBeUndefined();
  }));
});
```

- [ ] **Step 4: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/event.service.spec.ts'`
Expected: FAIL (`EventService` não existe)

- [ ] **Step 5: Implementar o EventService**

```typescript
// src/app/core/events/event.service.ts
import { Injectable } from '@angular/core';
import { mockLatency } from '../mock/mock-latency';
import { EVENTOS_MOCK } from './event-mock-store';
import { Evento } from './evento.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  async listar(): Promise<Evento[]> {
    return mockLatency([...EVENTOS_MOCK]);
  }

  async buscarPorId(id: string): Promise<Evento | undefined> {
    return mockLatency(EVENTOS_MOCK.find((e) => e.id === id));
  }
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/event.service.spec.ts'`
Expected: PASS (4 testes)

- [ ] **Step 7: Commit**

```bash
git add src/app/core/events
git commit -m "feat: modelo de evento, mock store e EventService"
```

---

### Task 2: Inscricao — modelo, mock store e RegistrationService

**Files:**
- Create: `src/app/core/registrations/inscricao.model.ts`, `registration-mock-store.ts`, `registration.service.ts`, `registration.service.spec.ts`

**Interfaces:**
- Consumes: `mockLatency` (Task 1's dependency, já existe)
- Produces: `StatusInscricao`, `Inscricao`; `RegistrationService` (providedIn root): `inscrever(dados: { eventoId: string; usuarioId: string; valorPago: number }): Promise<Inscricao>`, `cancelar(inscricaoId: string): Promise<void>`, `listarPorUsuario(usuarioId: string): Promise<Inscricao[]>`, `vagasRestantes(eventoId: string, vagasTotais: number): Promise<number>`

Nota de design: diferente do `OrderService` da Loja (que expõe `ultimoPedido` como sinal porque o Checkout cria o pedido e a Confirmação, numa tela separada, precisa lê-lo depois), aqui a própria tela de Confirmação (Task 6) é quem chama `inscrever()` e já recebe a inscrição diretamente como retorno da Promise — não há uma tela intermediária que precise repassar o resultado via sinal. Por isso não existe um `ultimaInscricao` aqui: seria um membro nunca consumido. `listarPorUsuario` é o único método de leitura pós-criação, usado por Minhas Inscrições e Perfil, igual ao `listarPorUsuario` do pedido. Não existe um sinal global "todas as inscrições" — evitaria vazar dados de outros usuários para quem não filtrasse por `usuarioId`.

- [ ] **Step 1: Criar o modelo**

```typescript
// src/app/core/registrations/inscricao.model.ts
export type StatusInscricao = 'confirmada' | 'cancelada';

export interface Inscricao {
  id: string;
  eventoId: string;
  usuarioId: string;
  status: StatusInscricao;
  valorPago: number;
  criadoEm: string;
}
```

- [ ] **Step 2: Criar o mock store**

```typescript
// src/app/core/registrations/registration-mock-store.ts
import { Inscricao } from './inscricao.model';

export const INSCRICOES_MOCK: Inscricao[] = [];
```

- [ ] **Step 3: Escrever o teste**

```typescript
// src/app/core/registrations/registration.service.spec.ts
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RegistrationService } from './registration.service';
import { INSCRICOES_MOCK } from './registration-mock-store';
import { Inscricao } from './inscricao.model';

describe('RegistrationService', () => {
  let service: RegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistrationService);
  });

  afterEach(() => {
    INSCRICOES_MOCK.length = 0;
  });

  it('inscrever() cria uma inscrição confirmada', fakeAsync(() => {
    let inscricao: Inscricao | undefined;
    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250 }).then((i) => (inscricao = i));
    tick(400);
    expect(inscricao?.status).toBe('confirmada');
    expect(inscricao?.eventoId).toBe('1');
    expect(inscricao?.valorPago).toBe(250);
  }));

  it('cancelar() muda o status da inscrição para cancelada', fakeAsync(() => {
    let inscricao: Inscricao | undefined;
    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250 }).then((i) => (inscricao = i));
    tick(400);
    service.cancelar(inscricao!.id);
    tick(400);

    let lista: Inscricao[] = [];
    service.listarPorUsuario('u1').then((i) => (lista = i));
    tick(400);
    expect(lista[0].status).toBe('cancelada');
  }));

  it('listarPorUsuario() retorna só as inscrições do usuário, mais recentes primeiro', fakeAsync(() => {
    // Timestamps forçados a serem estritamente crescentes: tick() só virtualiza
    // setTimeout, não Date — sem isso, criadoEm poderia empatar entre chamadas
    // próximas e o teste de ordenação ficaria dependente de timing real (mesma
    // licao aprendida no OrderService da Loja).
    spyOn(Date.prototype, 'toISOString').and.returnValues(
      '2024-01-01T00:00:00.000Z',
      '2024-01-01T00:00:01.000Z',
      '2024-01-01T00:00:02.000Z',
    );

    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250 });
    tick(400);
    service.inscrever({ eventoId: '2', usuarioId: 'u2', valorPago: 0 });
    tick(400);
    service.inscrever({ eventoId: '3', usuarioId: 'u1', valorPago: 0 });
    tick(400);

    let lista: Inscricao[] = [];
    service.listarPorUsuario('u1').then((i) => (lista = i));
    tick(400);
    expect(lista.length).toBe(2);
    expect(lista[0].eventoId).toBe('3');
  }));

  it('vagasRestantes() desconta apenas inscrições confirmadas', fakeAsync(() => {
    let a: Inscricao | undefined;
    let b: Inscricao | undefined;
    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250 }).then((i) => (a = i));
    tick(400);
    service.inscrever({ eventoId: '1', usuarioId: 'u2', valorPago: 250 }).then((i) => (b = i));
    tick(400);
    service.cancelar(b!.id);
    tick(400);

    let vagas = -1;
    service.vagasRestantes('1', 4).then((v) => (vagas = v));
    tick(400);
    expect(vagas).toBe(3);
  }));

  it('vagasRestantes() ignora inscrições de outros eventos', fakeAsync(() => {
    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250 });
    tick(400);
    service.inscrever({ eventoId: '2', usuarioId: 'u1', valorPago: 0 });
    tick(400);

    let vagas = -1;
    service.vagasRestantes('2', 100).then((v) => (vagas = v));
    tick(400);
    expect(vagas).toBe(99);
  }));
});
```

- [ ] **Step 4: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/registration.service.spec.ts'`
Expected: FAIL (`RegistrationService` não existe)

- [ ] **Step 5: Implementar o RegistrationService**

```typescript
// src/app/core/registrations/registration.service.ts
import { Injectable } from '@angular/core';
import { mockLatency } from '../mock/mock-latency';
import { INSCRICOES_MOCK } from './registration-mock-store';
import { Inscricao } from './inscricao.model';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  async inscrever(dados: { eventoId: string; usuarioId: string; valorPago: number }): Promise<Inscricao> {
    await mockLatency(undefined);
    const inscricao: Inscricao = {
      id: String(INSCRICOES_MOCK.length + 1),
      eventoId: dados.eventoId,
      usuarioId: dados.usuarioId,
      status: 'confirmada',
      valorPago: dados.valorPago,
      criadoEm: new Date().toISOString(),
    };
    INSCRICOES_MOCK.push(inscricao);
    return inscricao;
  }

  async cancelar(inscricaoId: string): Promise<void> {
    await mockLatency(undefined);
    const indice = INSCRICOES_MOCK.findIndex((i) => i.id === inscricaoId);
    if (indice >= 0) {
      INSCRICOES_MOCK[indice] = { ...INSCRICOES_MOCK[indice], status: 'cancelada' };
    }
  }

  async listarPorUsuario(usuarioId: string): Promise<Inscricao[]> {
    await mockLatency(undefined);
    return INSCRICOES_MOCK.filter((i) => i.usuarioId === usuarioId).sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    );
  }

  async vagasRestantes(eventoId: string, vagasTotais: number): Promise<number> {
    await mockLatency(undefined);
    const confirmadas = INSCRICOES_MOCK.filter(
      (i) => i.eventoId === eventoId && i.status === 'confirmada',
    ).length;
    return vagasTotais - confirmadas;
  }
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/registration.service.spec.ts'`
Expected: PASS (5 testes)

- [ ] **Step 7: Commit**

```bash
git add src/app/core/registrations
git commit -m "feat: modelo de inscricao, mock store e RegistrationService"
```

---

### Task 3: Rotas de eventos

**Files:**
- Create: `src/app/features/eventos/eventos.routes.ts`
- Modify: `src/app/app.routes.ts`

**Interfaces:**
- Consumes: `authGuard` (já existe, de `core/auth/auth.guard.ts`)
- Produces: `EVENTOS_ROUTES`, wired em `app.routes.ts` substituindo o placeholder `EmBreve` de `'eventos'`

- [ ] **Step 1: Criar `eventos.routes.ts`**

```typescript
// src/app/features/eventos/eventos.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const EVENTOS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./agenda/agenda').then((m) => m.Agenda) },
  {
    path: ':id',
    loadComponent: () => import('./evento-detalhes/evento-detalhes').then((m) => m.EventoDetalhes),
  },
  {
    path: ':id/confirmacao',
    canActivate: [authGuard],
    loadComponent: () => import('./confirmacao/confirmacao').then((m) => m.Confirmacao),
  },
  {
    path: 'minhas-inscricoes',
    canActivate: [authGuard],
    loadComponent: () => import('./minhas-inscricoes/minhas-inscricoes').then((m) => m.MinhasInscricoes),
  },
];
```

Nota: a rota `'minhas-inscricoes'` precisa vir declarada **depois** de `':id'` seria ambígua com o Angular Router tentando casar `minhas-inscricoes` como um valor de `:id` — mas como `:id/confirmacao` e `minhas-inscricoes` têm formatos de segmento diferentes (um tem dois segmentos, outro um só) e o Router resolve por especificidade de path completo, não há conflito real aqui: `minhas-inscricoes` (só um segmento) nunca casa com `:id/confirmacao` (dois segmentos), e `:id` sozinho (um segmento) é tentado antes de `minhas-inscricoes` na ordem do array — então uma navegação para `/eventos/minhas-inscricoes` cairia em `:id` com `id: 'minhas-inscricoes'` se a ordem não for respeitada. **A ordem exata acima (com `minhas-inscricoes` por último) faz o Router tentar `:id` primeiro e capturar `minhas-inscricoes` como um id inexistente.** Para evitar esse bug, inverta a ordem: `minhas-inscricoes` deve vir **antes** de `:id` no array. A lista final correta é:

```typescript
// src/app/features/eventos/eventos.routes.ts (ordem final)
import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const EVENTOS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./agenda/agenda').then((m) => m.Agenda) },
  {
    path: 'minhas-inscricoes',
    canActivate: [authGuard],
    loadComponent: () => import('./minhas-inscricoes/minhas-inscricoes').then((m) => m.MinhasInscricoes),
  },
  {
    path: ':id',
    loadComponent: () => import('./evento-detalhes/evento-detalhes').then((m) => m.EventoDetalhes),
  },
  {
    path: ':id/confirmacao',
    canActivate: [authGuard],
    loadComponent: () => import('./confirmacao/confirmacao').then((m) => m.Confirmacao),
  },
];
```

Use esta segunda versão (com `minhas-inscricoes` antes de `:id`) como o conteúdo real do arquivo — a primeira versão acima existe só para explicar por que a ordem importa.

- [ ] **Step 2: Atualizar `app.routes.ts`**

Substitui a rota `'eventos'` (antes `EmBreve`) pelas rotas de eventos. `''`, `'loja'`, `'sobre'` e `'perfil'` ficam **inalteradas** (a rota `''`/Home e `'loja'` já foram trocadas na Loja).

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

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
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
```

Nota: `Agenda`, `EventoDetalhes`, `Confirmacao` e `MinhasInscricoes` só existem a partir das Tasks 4-7. `npx ng build` vai falhar citando esses módulos até lá — **isso é esperado**, mesmo padrão de "build que estreita" já usado na Fundação e na Loja. Não tente stubar esses componentes.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/eventos/eventos.routes.ts src/app/app.routes.ts
git commit -m "feat: rotas de eventos"
```

---

### Task 4: Tela Agenda

**Files:**
- Create: `src/app/features/eventos/agenda/agenda.ts`, `agenda.html`, `agenda.scss`, `agenda.spec.ts`

**Interfaces:**
- Consumes: `EventService.listar` (Task 1), `EmptyState` (já existe da Fundação)
- Produces: `Agenda` (selector `app-agenda`) — já referenciado em `eventos.routes.ts` (Task 3)

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/features/eventos/agenda/agenda.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Agenda } from './agenda';
import { EventService } from '../../../core/events/event.service';
import { Evento } from '../../../core/events/evento.model';

const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  foto: 'https://picsum.photos/seed/x/480/480',
};

describe('Agenda', () => {
  let fixture: ComponentFixture<Agenda>;
  let eventServiceFalso: jasmine.SpyObj<Pick<EventService, 'listar'>>;

  async function montar(eventos: Evento[]): Promise<void> {
    eventServiceFalso = jasmine.createSpyObj('EventService', ['listar']);
    eventServiceFalso.listar.and.resolveTo(eventos);

    await TestBed.configureTestingModule({
      imports: [Agenda],
      providers: [provideRouter([]), { provide: EventService, useValue: eventServiceFalso }],
    }).compileComponents();

    fixture = TestBed.createComponent(Agenda);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra os eventos com título, data, local e preço', async () => {
    await montar([EVENTO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('Sítio Vida Nova, Ibiúna');
    expect(texto).toContain('250.00');
  });

  it('mostra "Gratuito" para eventos com preco 0', async () => {
    await montar([{ ...EVENTO, id: '2', preco: 0 }]);
    expect(fixture.nativeElement.textContent).toContain('Gratuito');
  });

  it('cada evento linka para a página de detalhes', async () => {
    await montar([EVENTO]);
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/eventos/1');
  });

  it('mostra o estado vazio quando não há eventos', async () => {
    await montar([]);
    expect(fixture.nativeElement.textContent).toContain('Nenhum evento programado no momento.');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/agenda.spec.ts'`
Expected: FAIL (`Agenda` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/features/eventos/agenda/agenda.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../core/events/event.service';
import { Evento } from '../../../core/events/evento.model';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-agenda',
  imports: [RouterLink, EmptyState],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class Agenda implements OnInit {
  private readonly eventos = inject(EventService);

  protected readonly lista = signal<Evento[]>([]);

  async ngOnInit(): Promise<void> {
    this.lista.set(await this.eventos.listar());
  }
}
```

```html
<!-- src/app/features/eventos/agenda/agenda.html -->
<div class="agenda">
  <h1 class="titulo-1">Agenda de eventos</h1>

  @if (lista().length > 0) {
    <ul class="agenda__lista">
      @for (evento of lista(); track evento.id) {
        <li>
          <a class="agenda__cartao" [routerLink]="['/eventos', evento.id]">
            <img class="agenda__foto" [src]="evento.foto" [alt]="evento.titulo" />
            <div class="agenda__info">
              <span class="titulo-2">{{ evento.titulo }}</span>
              <span class="texto-utilitario">{{ evento.local }}</span>
              <span class="texto-utilitario">
                {{ evento.preco === 0 ? 'Gratuito' : 'R$ ' + evento.preco.toFixed(2) }}
              </span>
            </div>
          </a>
        </li>
      }
    </ul>
  } @else {
    <app-empty-state mensagem="Nenhum evento programado no momento." />
  }
</div>
```

```scss
// src/app/features/eventos/agenda/agenda.scss
@use 'styles/tokens' as *;

.agenda {
  padding: var(--espaco-5) var(--espaco-4) var(--espaco-8);
}

.agenda__lista {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--espaco-4);
  margin-top: var(--espaco-4);
}

.agenda__cartao {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: var(--espaco-3);
  text-decoration: none;
  color: var(--rede-paper);
}

.agenda__foto {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: var(--raio-padrao);
  background: var(--rede-graphite);
}

.agenda__info {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-1);
  justify-content: center;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/agenda.spec.ts'`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/features/eventos/agenda
git commit -m "feat: tela Agenda de eventos"
```

---

### Task 5: Tela Detalhes do evento

**Files:**
- Create: `src/app/features/eventos/evento-detalhes/evento-detalhes.ts`, `evento-detalhes.html`, `evento-detalhes.scss`, `evento-detalhes.spec.ts`

**Interfaces:**
- Consumes: `EventService.buscarPorId` (Task 1), `RegistrationService.vagasRestantes` e `RegistrationService.listarPorUsuario` (Task 2), `AuthService.usuarioAtual` (já existe da Fundação), `Button` (já existe)
- Produces: `EventoDetalhes` (selector `app-evento-detalhes`) — já referenciado em `eventos.routes.ts` (Task 3)

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/features/eventos/evento-detalhes/evento-detalhes.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { EventoDetalhes } from './evento-detalhes';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Evento } from '../../../core/events/evento.model';
import { Inscricao } from '../../../core/registrations/inscricao.model';

const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  foto: 'https://picsum.photos/seed/x/480/480',
};

describe('EventoDetalhes', () => {
  let fixture: ComponentFixture<EventoDetalhes>;

  async function montar(opcoes: { vagasRestantes: number; inscricoes: Inscricao[] }): Promise<void> {
    const eventServiceFalso = jasmine.createSpyObj('EventService', ['buscarPorId']);
    eventServiceFalso.buscarPorId.and.resolveTo(EVENTO);

    const registrationServiceFalso = jasmine.createSpyObj('RegistrationService', [
      'vagasRestantes',
      'listarPorUsuario',
    ]);
    registrationServiceFalso.vagasRestantes.and.resolveTo(opcoes.vagasRestantes);
    registrationServiceFalso.listarPorUsuario.and.resolveTo(opcoes.inscricoes);

    await TestBed.configureTestingModule({
      imports: [EventoDetalhes],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventServiceFalso },
        { provide: RegistrationService, useValue: registrationServiceFalso },
        {
          provide: AuthService,
          useValue: { usuarioAtual: signal({ id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' }) },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventoDetalhes);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra os dados do evento', async () => {
    await montar({ vagasRestantes: 2, inscricoes: [] });
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('250.00');
  });

  it('mostra o botão "Inscrever-se" com link pra confirmação quando há vaga e o usuário não está inscrito', async () => {
    await montar({ vagasRestantes: 2, inscricoes: [] });
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.detalhes-evento__acao');
    expect(link.textContent).toContain('Inscrever-se');
    expect(link.getAttribute('href')).toBe('/eventos/1/confirmacao');
  });

  it('mostra "Esgotado" quando não há vagas restantes', async () => {
    await montar({ vagasRestantes: 0, inscricoes: [] });
    expect(fixture.nativeElement.textContent).toContain('Esgotado');
    expect(fixture.nativeElement.querySelector('a.detalhes-evento__acao')).toBeNull();
  });

  it('mostra "Você já está inscrito" quando o usuário já tem inscrição confirmada', async () => {
    const inscricaoExistente: Inscricao = {
      id: '9',
      eventoId: '1',
      usuarioId: 'u1',
      status: 'confirmada',
      valorPago: 250,
      criadoEm: new Date().toISOString(),
    };
    await montar({ vagasRestantes: 2, inscricoes: [inscricaoExistente] });
    expect(fixture.nativeElement.textContent).toContain('Você já está inscrito');
    expect(fixture.nativeElement.querySelector('a.detalhes-evento__acao')).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/evento-detalhes.spec.ts'`
Expected: FAIL (`EventoDetalhes` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/features/eventos/evento-detalhes/evento-detalhes.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Evento } from '../../../core/events/evento.model';

@Component({
  selector: 'app-evento-detalhes',
  imports: [RouterLink],
  templateUrl: './evento-detalhes.html',
  styleUrl: './evento-detalhes.scss',
})
export class EventoDetalhes implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly registrations = inject(RegistrationService);
  private readonly auth = inject(AuthService);
  private readonly rota = inject(ActivatedRoute);

  protected readonly evento = signal<Evento | null>(null);
  protected readonly vagasRestantes = signal<number | null>(null);
  protected readonly jaInscrito = signal(false);

  protected readonly esgotado = computed(() => (this.vagasRestantes() ?? 0) <= 0);

  async ngOnInit(): Promise<void> {
    const id = this.rota.snapshot.paramMap.get('id')!;
    const evento = (await this.eventService.buscarPorId(id)) ?? null;
    this.evento.set(evento);
    if (!evento) return;

    this.vagasRestantes.set(await this.registrations.vagasRestantes(id, evento.vagasTotais));

    const usuario = this.auth.usuarioAtual();
    if (usuario) {
      const inscricoes = await this.registrations.listarPorUsuario(usuario.id);
      this.jaInscrito.set(inscricoes.some((i) => i.eventoId === id && i.status === 'confirmada'));
    }
  }
}
```

```html
<!-- src/app/features/eventos/evento-detalhes/evento-detalhes.html -->
@if (evento(); as e) {
  <div class="detalhes-evento">
    <img class="detalhes-evento__foto" [src]="e.foto" [alt]="e.titulo" />

    <div class="detalhes-evento__info">
      <h1 class="titulo-1">{{ e.titulo }}</h1>
      <p class="texto-utilitario">{{ e.local }}</p>
      <p class="texto-corpo">{{ e.descricao }}</p>
      <p class="detalhes-evento__preco texto-utilitario">
        {{ e.preco === 0 ? 'Gratuito' : 'R$ ' + e.preco.toFixed(2) }}
      </p>

      @if (jaInscrito()) {
        <p class="detalhes-evento__status">Você já está inscrito</p>
      } @else if (esgotado()) {
        <p class="detalhes-evento__status">Esgotado</p>
      } @else {
        <a class="detalhes-evento__acao" [routerLink]="['/eventos', e.id, 'confirmacao']">Inscrever-se</a>
      }
    </div>
  </div>
}
```

```scss
// src/app/features/eventos/evento-detalhes/evento-detalhes.scss
@use 'styles/tokens' as *;
@use 'styles/mixins' as *;

.detalhes-evento {
  padding: var(--espaco-5) var(--espaco-4) var(--espaco-8);
  display: flex;
  flex-direction: column;
  gap: var(--espaco-5);

  @include desktop {
    flex-direction: row;
  }
}

.detalhes-evento__foto {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: var(--raio-padrao);

  @include desktop {
    max-width: 400px;
  }
}

.detalhes-evento__info {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-3);
}

.detalhes-evento__preco {
  color: var(--rede-yellow);
}

.detalhes-evento__status {
  font-family: var(--fonte-corpo);
  font-weight: 700;
  margin: 0;
}

.detalhes-evento__acao {
  display: inline-block;
  width: fit-content;
  padding: var(--espaco-3) var(--espaco-6);
  border-radius: var(--raio-pilula);
  background: var(--rede-yellow);
  color: var(--rede-black);
  font-family: var(--fonte-corpo);
  font-weight: 700;
  text-decoration: none;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/evento-detalhes.spec.ts'`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/features/eventos/evento-detalhes
git commit -m "feat: tela Detalhes do evento"
```

---

### Task 6: Tela Confirmação de inscrição

**Files:**
- Create: `src/app/features/eventos/confirmacao/confirmacao.ts`, `confirmacao.html`, `confirmacao.scss`, `confirmacao.spec.ts`

**Interfaces:**
- Consumes: `EventService.buscarPorId` (Task 1), `RegistrationService.inscrever` (Task 2), `AuthService.usuarioAtual` (já existe)
- Produces: `Confirmacao` (selector `app-confirmacao`) — já referenciado em `eventos.routes.ts` (Task 3)

Nota de design: diferente do checkout da Loja (onde o pedido já é criado antes de navegar pra confirmação), aqui a própria tela de Confirmação dispara `RegistrationService.inscrever()` ao montar — não existe uma tela de "checkout" separada pra eventos (fluxo é só confirmação, decidido no brainstorm).

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/features/eventos/confirmacao/confirmacao.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Confirmacao } from './confirmacao';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Evento } from '../../../core/events/evento.model';
import { Inscricao } from '../../../core/registrations/inscricao.model';

const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  foto: 'https://picsum.photos/seed/x/480/480',
};

const INSCRICAO: Inscricao = {
  id: '1',
  eventoId: '1',
  usuarioId: 'u1',
  status: 'confirmada',
  valorPago: 250,
  criadoEm: new Date().toISOString(),
};

describe('Confirmacao', () => {
  let fixture: ComponentFixture<Confirmacao>;
  let eventServiceFalso: jasmine.SpyObj<Pick<EventService, 'buscarPorId'>>;
  let registrationServiceFalso: jasmine.SpyObj<Pick<RegistrationService, 'inscrever'>>;
  let router: Router;

  async function montar(evento: Evento | undefined): Promise<void> {
    eventServiceFalso = jasmine.createSpyObj('EventService', ['buscarPorId']);
    eventServiceFalso.buscarPorId.and.resolveTo(evento);
    registrationServiceFalso = jasmine.createSpyObj('RegistrationService', ['inscrever']);
    registrationServiceFalso.inscrever.and.resolveTo(INSCRICAO);

    await TestBed.configureTestingModule({
      imports: [Confirmacao],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventServiceFalso },
        { provide: RegistrationService, useValue: registrationServiceFalso },
        {
          provide: AuthService,
          useValue: { usuarioAtual: signal({ id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' }) },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Confirmacao);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('chama RegistrationService.inscrever com os dados certos', async () => {
    await montar(EVENTO);
    expect(registrationServiceFalso.inscrever).toHaveBeenCalledWith({
      eventoId: '1',
      usuarioId: 'u1',
      valorPago: 250,
    });
  });

  it('mostra a confirmação com os dados do evento e o valor pago', async () => {
    await montar(EVENTO);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Inscrição confirmada!');
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('250.00');
  });

  it('redireciona para a agenda quando o evento não existe', async () => {
    await montar(undefined);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/eventos');
    expect(registrationServiceFalso.inscrever).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/confirmacao.spec.ts'`
Expected: FAIL (`Confirmacao` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/features/eventos/confirmacao/confirmacao.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Evento } from '../../../core/events/evento.model';
import { Inscricao } from '../../../core/registrations/inscricao.model';

@Component({
  selector: 'app-confirmacao',
  imports: [RouterLink],
  templateUrl: './confirmacao.html',
  styleUrl: './confirmacao.scss',
})
export class Confirmacao implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly registrations = inject(RegistrationService);
  private readonly auth = inject(AuthService);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly evento = signal<Evento | null>(null);
  protected readonly inscricao = signal<Inscricao | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.rota.snapshot.paramMap.get('id')!;
    const evento = (await this.eventService.buscarPorId(id)) ?? null;
    if (!evento) {
      this.router.navigateByUrl('/eventos');
      return;
    }
    this.evento.set(evento);

    const usuario = this.auth.usuarioAtual()!;
    const inscricao = await this.registrations.inscrever({
      eventoId: evento.id,
      usuarioId: usuario.id,
      valorPago: evento.preco,
    });
    this.inscricao.set(inscricao);
  }
}
```

```html
<!-- src/app/features/eventos/confirmacao/confirmacao.html -->
@if (evento(); as e) {
  @if (inscricao(); as i) {
    <div class="confirmacao-inscricao">
      <h1 class="titulo-1">Inscrição confirmada!</h1>
      <p class="texto-corpo">{{ e.titulo }}</p>
      <p class="texto-utilitario">Valor pago: R$ {{ i.valorPago.toFixed(2) }}</p>

      <a routerLink="/eventos/minhas-inscricoes">Ver minhas inscrições</a>
      <a routerLink="/eventos">Voltar para a agenda</a>
    </div>
  }
}
```

```scss
// src/app/features/eventos/confirmacao/confirmacao.scss
@use 'styles/tokens' as *;

.confirmacao-inscricao {
  padding: var(--espaco-5) var(--espaco-4) var(--espaco-8);
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--espaco-3);
}

.confirmacao-inscricao a {
  color: var(--rede-yellow);
  font-weight: 700;
  text-decoration: none;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/confirmacao.spec.ts'`
Expected: PASS (3 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/features/eventos/confirmacao
git commit -m "feat: tela Confirmacao de inscricao"
```

---

### Task 7: Tela Minhas inscrições

**Files:**
- Create: `src/app/features/eventos/minhas-inscricoes/minhas-inscricoes.ts`, `minhas-inscricoes.html`, `minhas-inscricoes.scss`, `minhas-inscricoes.spec.ts`

**Interfaces:**
- Consumes: `AuthService.usuarioAtual` (já existe), `RegistrationService.listarPorUsuario` e `RegistrationService.cancelar` (Task 2), `EventService.buscarPorId` (Task 1), `EmptyState` (já existe)
- Produces: `MinhasInscricoes` (selector `app-minhas-inscricoes`) — já referenciado em `eventos.routes.ts` (Task 3)

Nota de design: `Inscricao` guarda só `eventoId`, não o título/data do evento — a tela precisa buscar cada evento correspondente via `EventService.buscarPorId` para exibir título e data. Isso é aceitável no volume mockado (poucos eventos, poucas inscrições por usuário); numa versão com backend real isso seria um join no servidor.

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/features/eventos/minhas-inscricoes/minhas-inscricoes.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MinhasInscricoes } from './minhas-inscricoes';
import { AuthService } from '../../../core/auth/auth.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { EventService } from '../../../core/events/event.service';
import { Inscricao } from '../../../core/registrations/inscricao.model';
import { Evento } from '../../../core/events/evento.model';

const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  foto: 'https://picsum.photos/seed/x/480/480',
};

const INSCRICAO: Inscricao = {
  id: '1',
  eventoId: '1',
  usuarioId: 'u1',
  status: 'confirmada',
  valorPago: 250,
  criadoEm: new Date().toISOString(),
};

describe('MinhasInscricoes', () => {
  let fixture: ComponentFixture<MinhasInscricoes>;
  let registrationServiceFalso: jasmine.SpyObj<Pick<RegistrationService, 'listarPorUsuario' | 'cancelar'>>;

  async function montar(inscricoes: Inscricao[]): Promise<void> {
    registrationServiceFalso = jasmine.createSpyObj('RegistrationService', ['listarPorUsuario', 'cancelar']);
    registrationServiceFalso.listarPorUsuario.and.resolveTo(inscricoes);
    registrationServiceFalso.cancelar.and.resolveTo();

    const eventServiceFalso = jasmine.createSpyObj('EventService', ['buscarPorId']);
    eventServiceFalso.buscarPorId.and.resolveTo(EVENTO);

    await TestBed.configureTestingModule({
      imports: [MinhasInscricoes],
      providers: [
        {
          provide: AuthService,
          useValue: { usuarioAtual: signal({ id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' }) },
        },
        { provide: RegistrationService, useValue: registrationServiceFalso },
        { provide: EventService, useValue: eventServiceFalso },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhasInscricoes);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o estado vazio quando não há inscrições', async () => {
    await montar([]);
    expect(fixture.nativeElement.textContent).toContain('Você ainda não se inscreveu em nenhum evento.');
  });

  it('mostra as inscrições com o título do evento e o status', async () => {
    await montar([INSCRICAO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('Confirmada');
  });

  it('mostra o botão "Cancelar inscrição" só para inscrições confirmadas', async () => {
    await montar([INSCRICAO]);
    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('.minhas-inscricoes__cancelar');
    expect(botao).not.toBeNull();
  });

  it('não mostra o botão "Cancelar inscrição" para inscrições já canceladas', async () => {
    await montar([{ ...INSCRICAO, status: 'cancelada' }]);
    expect(fixture.nativeElement.querySelector('.minhas-inscricoes__cancelar')).toBeNull();
  });

  it('chama cancelar() ao clicar em "Cancelar inscrição"', async () => {
    await montar([INSCRICAO]);
    fixture.nativeElement.querySelector('.minhas-inscricoes__cancelar').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(registrationServiceFalso.cancelar).toHaveBeenCalledWith('1');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/minhas-inscricoes.spec.ts'`
Expected: FAIL (`MinhasInscricoes` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/features/eventos/minhas-inscricoes/minhas-inscricoes.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { EventService } from '../../../core/events/event.service';
import { Inscricao, StatusInscricao } from '../../../core/registrations/inscricao.model';
import { Evento } from '../../../core/events/evento.model';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

interface InscricaoExibicao {
  inscricao: Inscricao;
  evento: Evento | undefined;
}

const ROTULO_STATUS: Record<StatusInscricao, string> = {
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
};

@Component({
  selector: 'app-minhas-inscricoes',
  imports: [EmptyState],
  templateUrl: './minhas-inscricoes.html',
  styleUrl: './minhas-inscricoes.scss',
})
export class MinhasInscricoes implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly registrations = inject(RegistrationService);
  private readonly eventService = inject(EventService);

  protected readonly lista = signal<InscricaoExibicao[]>([]);
  protected readonly rotuloStatus = ROTULO_STATUS;

  async ngOnInit(): Promise<void> {
    const usuario = this.auth.usuarioAtual();
    if (!usuario) return;

    const inscricoes = await this.registrations.listarPorUsuario(usuario.id);
    const lista = await Promise.all(
      inscricoes.map(async (inscricao) => ({
        inscricao,
        evento: await this.eventService.buscarPorId(inscricao.eventoId),
      })),
    );
    this.lista.set(lista);
  }

  protected async cancelar(inscricaoId: string): Promise<void> {
    await this.registrations.cancelar(inscricaoId);
    this.lista.set(
      this.lista().map((item) =>
        item.inscricao.id === inscricaoId
          ? { ...item, inscricao: { ...item.inscricao, status: 'cancelada' } }
          : item,
      ),
    );
  }
}
```

```html
<!-- src/app/features/eventos/minhas-inscricoes/minhas-inscricoes.html -->
<div class="minhas-inscricoes">
  <h1 class="titulo-1">Minhas inscrições</h1>

  @if (lista().length === 0) {
    <app-empty-state mensagem="Você ainda não se inscreveu em nenhum evento." textoAcao="Ver a agenda" linkAcao="/eventos" />
  } @else {
    <ul class="minhas-inscricoes__lista">
      @for (item of lista(); track item.inscricao.id) {
        <li class="minhas-inscricoes__item">
          <span class="titulo-2">{{ item.evento?.titulo }}</span>
          <span class="minhas-inscricoes__status" [class]="'minhas-inscricoes__status--' + item.inscricao.status">
            {{ rotuloStatus[item.inscricao.status] }}
          </span>
          @if (item.inscricao.status === 'confirmada') {
            <button type="button" class="minhas-inscricoes__cancelar" (click)="cancelar(item.inscricao.id)">
              Cancelar inscrição
            </button>
          }
        </li>
      }
    </ul>
  }
</div>
```

```scss
// src/app/features/eventos/minhas-inscricoes/minhas-inscricoes.scss
@use 'styles/tokens' as *;

.minhas-inscricoes {
  padding: var(--espaco-5) var(--espaco-4) var(--espaco-8);
}

.minhas-inscricoes__lista {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--espaco-4);
  margin-top: var(--espaco-4);
}

.minhas-inscricoes__item {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-2);
  padding: var(--espaco-4);
  background: var(--rede-graphite);
  border-radius: var(--raio-padrao);
}

.minhas-inscricoes__status {
  font-family: var(--fonte-corpo);
  font-weight: 700;
  font-size: 0.8125rem;
  width: fit-content;
  padding: 2px var(--espaco-2);
  border-radius: var(--raio-pilula);
}

.minhas-inscricoes__status--confirmada {
  background: var(--status-confirm);
  color: var(--rede-black);
}

.minhas-inscricoes__status--cancelada {
  background: var(--status-cancel);
  color: var(--rede-black);
}

.minhas-inscricoes__cancelar {
  width: fit-content;
  background: none;
  border: none;
  color: var(--status-cancel);
  font-family: var(--fonte-corpo);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/minhas-inscricoes.spec.ts'`
Expected: PASS (5 testes)

Run: `npx ng build`
Expected: build conclui sem erros — todas as 4 telas de eventos existem agora, o build deve estar limpo.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/eventos/minhas-inscricoes
git commit -m "feat: tela Minhas inscricoes"
```

---

### Task 8: Home — prévia real dos próximos eventos

**Files:**
- Modify: `src/app/features/loja/home/home.ts`, `home.html`, `home.spec.ts`

**Interfaces:**
- Consumes: `EventService.listar` (Task 1)
- Produces: `Home` passa a mostrar até 3 próximos eventos reais, ordenados por `dataHora` crescente, em vez da vitrine textual estática da Loja

- [ ] **Step 1: Atualizar o teste (arquivo completo)**

```typescript
// src/app/features/loja/home/home.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { ProductService } from '../../../core/products/product.service';
import { EventService } from '../../../core/events/event.service';
import { Produto } from '../../../core/products/produto.model';
import { Evento } from '../../../core/events/evento.model';

const DESTAQUE: Produto = {
  id: '1',
  nome: 'Camiseta REDE Clássica',
  categoria: 'camisetas',
  preco: 79.9,
  descricao: 'Camiseta 100% algodão.',
  fotos: ['https://picsum.photos/seed/x/480/480'],
  tamanhos: ['P'],
  cores: ['Preto'],
  variacoes: [{ tamanho: 'P', cor: 'Preto', estoque: 5 }],
  destaque: true,
};

const EVENTO_DISTANTE: Evento = {
  id: '6',
  titulo: 'Vigília de Oração',
  descricao: 'Noite inteira de oração.',
  dataHora: '2026-03-28T22:00:00.000Z',
  local: 'Templo sede, Vila Maria',
  preco: 0,
  vagasTotais: 150,
  foto: 'https://picsum.photos/seed/y/480/480',
};

const EVENTO_PROXIMO: Evento = {
  id: '2',
  titulo: 'Encontro de Jovens',
  descricao: 'Noite de louvor.',
  dataHora: '2026-02-06T22:00:00.000Z',
  local: 'Templo sede, Vila Maria',
  preco: 0,
  vagasTotais: 100,
  foto: 'https://picsum.photos/seed/z/480/480',
};

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let productServiceFalso: jasmine.SpyObj<Pick<ProductService, 'listarDestaques'>>;
  let eventServiceFalso: jasmine.SpyObj<Pick<EventService, 'listar'>>;

  beforeEach(async () => {
    productServiceFalso = jasmine.createSpyObj('ProductService', ['listarDestaques']);
    productServiceFalso.listarDestaques.and.resolveTo([DESTAQUE]);

    eventServiceFalso = jasmine.createSpyObj('EventService', ['listar']);
    // Fora de ordem de propósito, pra provar que a Home ordena por data.
    eventServiceFalso.listar.and.resolveTo([EVENTO_DISTANTE, EVENTO_PROXIMO]);

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productServiceFalso },
        { provide: EventService, useValue: eventServiceFalso },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('mostra o título "Destaques"', () => {
    expect(fixture.nativeElement.textContent).toContain('Destaques');
  });

  it('mostra um card para cada produto em destaque', () => {
    expect(fixture.nativeElement.querySelectorAll('app-product-card').length).toBe(1);
  });

  it('mostra os próximos eventos ordenados por data, do mais próximo pro mais distante', () => {
    const cartoes: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('.home__evento-cartao'));
    expect(cartoes.length).toBe(2);
    expect(cartoes[0].textContent).toContain('Encontro de Jovens');
    expect(cartoes[1].textContent).toContain('Vigília de Oração');
  });

  it('cada evento linka para a página de detalhes do evento', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.home__evento-cartao');
    expect(link.getAttribute('href')).toBe('/eventos/2');
  });

  it('mostra um link para a agenda completa de eventos', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.home__link-eventos');
    expect(link.getAttribute('href')).toBe('/eventos');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/home.spec.ts'`
Expected: FAIL (`EventService` não injetado / `.home__evento-cartao` não existe)

- [ ] **Step 3: Atualizar `home.ts` (arquivo completo)**

```typescript
// src/app/features/loja/home/home.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/products/product.service';
import { EventService } from '../../../core/events/event.service';
import { Produto } from '../../../core/products/produto.model';
import { Evento } from '../../../core/events/evento.model';
import { ProductCard } from '../../../shared/ui/product-card/product-card';

const MAX_EVENTOS_PREVIA = 3;

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly produtos = inject(ProductService);
  private readonly eventos = inject(EventService);

  protected readonly destaques = signal<Produto[]>([]);
  protected readonly proximosEventos = signal<Evento[]>([]);

  async ngOnInit(): Promise<void> {
    const [destaques, eventos] = await Promise.all([this.produtos.listarDestaques(), this.eventos.listar()]);
    this.destaques.set(destaques);
    this.proximosEventos.set(
      [...eventos]
        .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
        .slice(0, MAX_EVENTOS_PREVIA),
    );
  }
}
```

- [ ] **Step 4: Atualizar a seção de eventos em `home.html`**

Trocar o bloco `<section class="home__eventos">` inteiro (antes só texto estático) por:

```html
<!-- src/app/features/loja/home/home.html -->
<div class="home">
  <section class="home__destaques">
    <h1 class="titulo-1">Destaques</h1>
    <div class="home__grade">
      @for (produto of destaques(); track produto.id) {
        <app-product-card [produto]="produto" />
      }
    </div>
  </section>

  <section class="home__eventos">
    <h2 class="titulo-2">Próximos eventos</h2>
    <ul class="home__lista-eventos">
      @for (evento of proximosEventos(); track evento.id) {
        <li>
          <a class="home__evento-cartao" [routerLink]="['/eventos', evento.id]">
            <span class="home__evento-titulo">{{ evento.titulo }}</span>
            <span class="texto-utilitario">{{ evento.local }}</span>
          </a>
        </li>
      }
    </ul>
    <a routerLink="/eventos" class="home__link-eventos">Ver agenda completa</a>
  </section>
</div>
```

- [ ] **Step 5: Ajustar `home.scss`**

```scss
// adicionar ao final de src/app/features/loja/home/home.scss
.home__lista-eventos {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--espaco-3);
  margin: var(--espaco-4) 0;
}

.home__evento-cartao {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-1);
  padding: var(--espaco-4);
  background: var(--rede-graphite);
  border-radius: var(--raio-padrao);
  text-decoration: none;
  color: var(--rede-paper);
}

.home__evento-titulo {
  font-family: var(--fonte-corpo);
  font-weight: 700;
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/home.spec.ts'`
Expected: PASS (5 testes)

- [ ] **Step 7: Commit**

```bash
git add src/app/features/loja/home
git commit -m "feat: Home mostra os proximos eventos reais"
```

---

### Task 9: Perfil — resumo de inscrições reais

**Files:**
- Modify: `src/app/features/perfil/perfil.ts`, `perfil.html`, `perfil.spec.ts`

**Interfaces:**
- Consumes: `RegistrationService.listarPorUsuario` (Task 2)
- Produces: `Perfil` passa a mostrar a quantidade real de inscrições confirmadas (ou o estado vazio, se não houver nenhuma) na seção "Meus eventos"

- [ ] **Step 1: Atualizar o teste (arquivo completo)**

```typescript
// src/app/features/perfil/perfil.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Perfil } from './perfil';
import { AuthService } from '../../core/auth/auth.service';
import { OrderService } from '../../core/orders/order.service';
import { RegistrationService } from '../../core/registrations/registration.service';
import { Pedido } from '../../core/orders/pedido.model';
import { Inscricao } from '../../core/registrations/inscricao.model';

describe('Perfil', () => {
  let fixture: ComponentFixture<Perfil>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'atualizarPerfil' | 'logout'>> & {
    usuarioAtual: ReturnType<typeof signal>;
  };
  let orderServiceFalso: jasmine.SpyObj<Pick<OrderService, 'listarPorUsuario'>>;
  let registrationServiceFalso: jasmine.SpyObj<Pick<RegistrationService, 'listarPorUsuario'>>;
  let router: Router;

  async function montar(pedidos: Pedido[], inscricoes: Inscricao[]): Promise<void> {
    authServiceFalso = {
      usuarioAtual: signal({ id: '2', nome: 'Jovem Teste', email: 'jovem@rede.com', papel: 'jovem' as const }),
      atualizarPerfil: jasmine.createSpy('atualizarPerfil').and.resolveTo(),
      logout: jasmine.createSpy('logout'),
    };
    orderServiceFalso = jasmine.createSpyObj('OrderService', ['listarPorUsuario']);
    orderServiceFalso.listarPorUsuario.and.resolveTo(pedidos);
    registrationServiceFalso = jasmine.createSpyObj('RegistrationService', ['listarPorUsuario']);
    registrationServiceFalso.listarPorUsuario.and.resolveTo(inscricoes);

    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceFalso },
        { provide: OrderService, useValue: orderServiceFalso },
        { provide: RegistrationService, useValue: registrationServiceFalso },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Perfil);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('preenche o formulário com os dados do usuário atual', async () => {
    await montar([], []);
    expect(fixture.componentInstance['form'].value.nome).toBe('Jovem Teste');
    expect(fixture.componentInstance['form'].value.email).toBe('jovem@rede.com');
  });

  it('mostra estado vazio de pedidos e de eventos quando não há pedidos nem inscrições', async () => {
    await montar([], []);
    expect(fixture.nativeElement.textContent).toContain('nenhum pedido');
    expect(fixture.nativeElement.textContent).toContain('nenhum evento');
  });

  it('mostra a quantidade de pedidos e o link quando há pedidos', async () => {
    const pedido: Pedido = {
      id: '1',
      usuarioId: '2',
      itens: [],
      formaEntrega: 'retirada',
      valorTotal: 100,
      status: 'pago',
      criadoEm: new Date().toISOString(),
    };
    await montar([pedido], []);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Você já fez 1 pedido.');
    expect(fixture.nativeElement.querySelector('a[href="/loja/meus-pedidos"]')).not.toBeNull();
  });

  it('mostra a quantidade de inscrições confirmadas e o link quando há inscrições', async () => {
    const inscricao: Inscricao = {
      id: '1',
      eventoId: '1',
      usuarioId: '2',
      status: 'confirmada',
      valorPago: 250,
      criadoEm: new Date().toISOString(),
    };
    await montar([], [inscricao]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Você está inscrito em 1 evento.');
    expect(fixture.nativeElement.querySelector('a[href="/eventos/minhas-inscricoes"]')).not.toBeNull();
  });

  it('conta só as inscrições confirmadas, ignorando as canceladas', async () => {
    const confirmada: Inscricao = {
      id: '1',
      eventoId: '1',
      usuarioId: '2',
      status: 'confirmada',
      valorPago: 250,
      criadoEm: new Date().toISOString(),
    };
    const cancelada: Inscricao = { ...confirmada, id: '2', eventoId: '2', status: 'cancelada' };
    await montar([], [confirmada, cancelada]);
    expect(fixture.nativeElement.textContent).toContain('Você está inscrito em 1 evento.');
  });

  it('chama atualizarPerfil ao salvar', async () => {
    await montar([], []);
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(authServiceFalso.atualizarPerfil).toHaveBeenCalled();
  });

  it('faz logout e navega para /login', async () => {
    await montar([], []);
    fixture.nativeElement.querySelector('[data-testid="botao-sair"]').click();
    expect(authServiceFalso.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('reseta o estado de carregamento mesmo quando atualizarPerfil falha', async () => {
    await montar([], []);
    authServiceFalso.atualizarPerfil.and.rejectWith(new Error('NAO_AUTENTICADO'));

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance['salvando']()).toBeFalse();
    expect(fixture.componentInstance['erroGeral']()).toContain('Não deu pra salvar');
    expect(fixture.componentInstance['salvo']()).toBeFalse();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/perfil.spec.ts'`
Expected: FAIL (`RegistrationService` não injetado / texto de contagem de eventos não existe)

- [ ] **Step 3: Atualizar `perfil.ts` (arquivo completo)**

```typescript
// src/app/features/perfil/perfil.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OrderService } from '../../core/orders/order.service';
import { RegistrationService } from '../../core/registrations/registration.service';
import { Pedido } from '../../core/orders/pedido.model';
import { Inscricao } from '../../core/registrations/inscricao.model';
import { TextField } from '../../shared/ui/text-field/text-field';
import { Button } from '../../shared/ui/button/button';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, RouterLink, TextField, Button, EmptyState],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly pedidosService = inject(OrderService);
  private readonly registrations = inject(RegistrationService);
  private readonly router = inject(Router);

  protected readonly usuario = this.auth.usuarioAtual;
  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly inscricoesConfirmadas = signal<Inscricao[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    nome: [this.usuario()?.nome ?? '', [Validators.required]],
    email: [this.usuario()?.email ?? '', [Validators.required, Validators.email]],
    telefone: [this.usuario()?.telefone ?? ''],
  });

  protected readonly salvando = signal(false);
  protected readonly salvo = signal(false);
  protected readonly erroGeral = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const usuario = this.usuario();
    if (!usuario) return;
    const [pedidos, inscricoes] = await Promise.all([
      this.pedidosService.listarPorUsuario(usuario.id),
      this.registrations.listarPorUsuario(usuario.id),
    ]);
    this.pedidos.set(pedidos);
    this.inscricoesConfirmadas.set(inscricoes.filter((i) => i.status === 'confirmada'));
  }

  protected async aoSalvar(): Promise<void> {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    this.salvo.set(false);
    this.erroGeral.set(null);
    try {
      await this.auth.atualizarPerfil(this.form.getRawValue());
      this.salvo.set(true);
    } catch {
      this.erroGeral.set('Não deu pra salvar suas alterações agora. Tenta de novo em instantes.');
    } finally {
      this.salvando.set(false);
    }
  }

  protected sair(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
```

- [ ] **Step 4: Atualizar a seção "Meus eventos" em `perfil.html`**

Trocar o bloco (era só o `<app-empty-state>` fixo) por:

```html
<section class="perfil__secao">
  <h2 class="titulo-2">Meus eventos</h2>
  @if (inscricoesConfirmadas().length > 0) {
    <p class="texto-corpo">
      Você está inscrito em {{ inscricoesConfirmadas().length }}
      evento{{ inscricoesConfirmadas().length > 1 ? 's' : '' }}.
    </p>
    <a routerLink="/eventos/minhas-inscricoes" class="perfil__link-eventos">Ver minhas inscrições</a>
  } @else {
    <app-empty-state
      mensagem="Você ainda não se inscreveu em nenhum evento."
      textoAcao="Ver a agenda"
      linkAcao="/eventos"
    />
  }
</section>
```

A seção "Meus pedidos" acima **não muda** (já foi atualizada na Loja).

- [ ] **Step 5: Adicionar o estilo do link em `perfil.scss`**

```scss
// adicionar ao final de src/app/features/perfil/perfil.scss
.perfil__link-eventos {
  color: var(--rede-yellow);
  font-weight: 700;
  text-decoration: none;
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/perfil.spec.ts'`
Expected: PASS (8 testes)

- [ ] **Step 7: Commit**

```bash
git add src/app/features/perfil
git commit -m "feat: Perfil mostra a quantidade real de inscricoes em eventos"
```

---

### Task 10: Teste de integração das rotas (estende o da Loja)

**Files:**
- Modify: `src/app/app.routes.spec.ts`

**Interfaces:**
- Consumes: `routes` (`app.routes.ts`, Task 3), `AuthService` (já existe)
- Produces: nenhuma nova — estende o teste de integração já criado na Loja pra cobrir as rotas reais de eventos

Este teste já existe da Loja e cobria `'/eventos'` como o placeholder `EmBreve` da Fundação. Agora que a agenda de eventos é real, esse teste específico precisa mudar — e ganha companhia para as demais rotas de eventos.

- [ ] **Step 1: Atualizar o teste (arquivo completo)**

```typescript
// src/app/app.routes.spec.ts
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';

describe('Rotas do app (integração)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
  });

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
    const auth = TestBed.inject(AuthService);
    await auth.login('jovem@rede.com', 'jovem123');

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
    const auth = TestBed.inject(AuthService);
    await auth.login('jovem@rede.com', 'jovem123');

    const harness = await RouterTestingHarness.create('/eventos/minhas-inscricoes');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.textContent).not.toContain('Entrar na REDE');
    expect(harness.routeNativeElement?.textContent).toContain('Minhas inscrições');
  });

  it('uma rota desconhecida redireciona para "/"', async () => {
    const harness = await RouterTestingHarness.create('/rota-que-nao-existe');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });
});
```

Nota: o teste `'"/eventos/minhas-inscricoes" logado renderiza Minhas inscrições, não a rota :id'` existe especificamente para verificar a correção de ordem de rotas decidida na Task 3 — se `minhas-inscricoes` tivesse ficado depois de `:id` no array `EVENTOS_ROUTES`, essa navegação cairia na tela de Detalhes do evento com um "evento" de id `'minhas-inscricoes'` (inexistente), não na tela certa.

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/app.routes.spec.ts'`
Expected: FAIL (o teste antigo de `'/eventos'` mostrando o placeholder não existe mais nesse formato; os novos ainda não têm o que verificar)

- [ ] **Step 3: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/app.routes.spec.ts'`
Expected: PASS (10 testes). Se algum teste falhar por causa da ordem `detectChanges()`/`whenStable()`, siga a regra da seção Global Constraints — tente a outra ordem uma vez; se persistir, reporte BLOCKED com a saída real do Karma.

- [ ] **Step 4: Rodar a suíte completa e o build final**

Run: `npx ng test --watch=false`
Expected: PASS (todos os testes de todas as tasks, Fundação + Loja + Eventos)

Run: `npx ng build`
Expected: build conclui sem erros

- [ ] **Step 5: Commit**

```bash
git add src/app/app.routes.spec.ts
git commit -m "test: integracao das rotas do app (fundacao + loja + eventos)"
```
