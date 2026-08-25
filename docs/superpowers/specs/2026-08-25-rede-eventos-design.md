# REDE — Eventos: Design Spec

## Contexto

Terceiro subprojeto do site da REDE, construído sobre a **Fundação**
(já mesclada em `main`) e a **Loja** (em implementação em paralelo, no
worktree `rede-loja`): design system, `AuthService` mockado com guards,
shell de navegação (Header/BottomNav/Footer), componentes de UI
compartilhados (`Logo`, `Button`, `TextField`, `SectionDivider`,
`EmptyState`), e o padrão de serviço mockado consolidado na Loja
(`ProductService`/`CartService`/`OrderService`: Signals, `mockLatency`,
persistência em `localStorage` onde relevante).

Este subprojeto implementa a agenda de eventos da REDE (retiros,
encontros, cultos especiais) do lado do jovem: visualização da agenda,
inscrição paga (pagamento mockado, mesmo padrão da Loja), cancelamento
de inscrição e histórico de inscrições. Como no resto do projeto, os
dados de evento são mockados — sem CRUD de eventos nesta fase; isso
fica para o subprojeto Admin.

Ordem dos subprojetos: Fundação (concluído) → Loja (em implementação) →
**Eventos** (este) → Admin.

## Decisões confirmadas com o cliente

- **Eventos mockados estaticamente**: uma lista fixa de 5-6 eventos
  (retiro, encontro, culto especial etc.) definida em código, sem tela
  de criação nesta fase. O CRUD real de eventos é responsabilidade do
  subprojeto Admin.
- **Inscrição paga, sem formulário extra**: o usuário já está logado
  (nome/email/telefone vêm do perfil), a inscrição é só uma confirmação
  seguida do pagamento mockado — sem pedir endereço ou dados adicionais,
  mesmo padrão do fluxo de retirada da Loja.
- **Vagas com limite fixo por evento**: cada evento mockado tem um
  número de vagas totais; `vagasRestantes` é sempre **computado
  dinamicamente** (vagas totais − inscrições ativas daquele evento), sem
  contador armazenado que precise ser mantido em sincronia. Ao esgotar,
  o botão de inscrição vira "Esgotado" (desabilitado).
- **Cancelamento simples**: em "Minhas inscrições", cancelar muda o
  status para `'cancelada'` (sem removê-la do histórico, sem reembolso
  real) — a vaga volta a contar como livre no cálculo de
  `vagasRestantes`.
- **Sem inscrição duplicada**: se o usuário já tem uma inscrição
  `'confirmada'` para um evento, a tela de detalhes mostra "Você já está
  inscrito" no lugar do botão de inscrição, em vez de permitir duplicar.
- **Pagamento mockado como sucesso direto**: mesma regra da Loja — o
  botão de confirmação simula o Mercado Pago e confirma a inscrição na
  hora, sem caminho de erro.
- **Fluxo de confirmação como página dedicada**: mesmo padrão de UX da
  Loja (`checkout` → `confirmacao`), não um modal — reaproveita o
  "spinner → sucesso" já validado, e mantém os testes consistentes com o
  resto do projeto.

## Escopo desta spec

**Incluído**: Agenda de eventos, Detalhes do evento, Confirmação de
inscrição, Minhas inscrições. Também inclui modificações pontuais na
Home (a seção de eventos passa de vitrine textual estática para uma
prévia real dos próximos eventos, mesmo padrão dos "Destaques" de
produto) e no Perfil (a seção "Meus eventos" passa a refletir inscrições
reais via `RegistrationService`, em vez do estado vazio estático da
Fundação/Loja).

**Fora de escopo**: CRUD de eventos por um admin (fica para o
subprojeto Admin), inscrição com múltiplas vagas/acompanhantes,
campos de formulário específicos por evento (ex.: tamanho de camiseta,
restrição alimentar), reembolso real.

## Arquitetura

- **`EventService`** (mock, `providedIn: 'root'`): array de eventos em
  memória com `mockLatency`, expõe `listar(): Promise<Evento[]>`,
  `buscarPorId(id): Promise<Evento | undefined>` — mesma forma que
  `ProductService`.
- **`RegistrationService`** (mock, `providedIn: 'root'`, Signals):
  `minhasInscricoes: Signal<Inscricao[]>`, `inscrever(dados): Promise<Inscricao>`,
  `cancelar(inscricaoId): Promise<void>`, `vagasRestantes(eventoId): Promise<number>`
  — calculado a partir do mock store de inscrições (vagas totais do
  evento menos inscrições `'confirmada'` daquele evento), nunca
  armazenado como campo mutável. Segue o mesmo padrão de
  `OrderService`: status inicial sempre `'confirmada'` dado o pagamento
  mockado como sucesso direto.
- **Rotas** (guard `authGuard` nas marcadas com 🔒), substituindo o
  placeholder `EmBreve` da Fundação em `'eventos'`:
  - `'eventos'` → Agenda
  - `'eventos/:id'` → Detalhes do evento
  - `'eventos/:id/confirmacao'` 🔒 → Confirmação
  - `'eventos/minhas-inscricoes'` 🔒 → Minhas inscrições

## Modelo de dados (mock)

```
Evento
  id: string
  titulo: string
  descricao: string
  dataHora: string             // ISO date
  local: string
  preco: number                // reais; 0 = evento gratuito
  vagasTotais: number
  foto: string                 // URL de banco de imagens livre

Inscricao
  id: string
  eventoId: string
  usuarioId: string
  status: 'confirmada' | 'cancelada'
  valorPago: number
  criadoEm: string              // ISO date
```

Catálogo mockado inicial: 5-6 eventos (ex.: retiro pago com vagas
limitadas, encontro gratuito, culto especial), pelo menos um já com
vagas quase esgotadas para exercitar o fluxo de "Esgotado" sem precisar
de muitas inscrições de teste.

## Telas detalhadas

### Agenda (`eventos`)
- Lista os eventos futuros: foto, título, data/hora, local, preço (ou
  "Gratuito") e vagas restantes.
- Cada card leva a Detalhes do evento correspondente.
- Estado vazio: "Nenhum evento programado no momento." com
  `EmptyState`, caso a agenda mockada fique vazia no futuro.

### Detalhes do evento (`eventos/:id`)
- Foto, título, descrição completa, data/hora, local, preço.
- Botão de ação, mutuamente exclusivo conforme o estado:
  - "Inscrever-se" (navega para Confirmação) quando há vaga e o usuário
    ainda não está inscrito.
  - "Esgotado" (desabilitado) quando `vagasRestantes === 0`.
  - "Você já está inscrito" (desabilitado, sem navegação) quando já
    existe uma inscrição `'confirmada'` do usuário para esse evento.
  - Se o usuário não estiver logado, o clique em "Inscrever-se" segue o
    guard padrão e redireciona para `/login` (mesmo comportamento do
    `authGuard` nas rotas protegidas).

### Confirmação de inscrição (`eventos/:id/confirmacao`) 🔒
- Chama `RegistrationService.inscrever({ eventoId, usuarioId })`,
  simula o pagamento (mockado como sucesso direto), mostra "Inscrição
  confirmada!" com o resumo do evento (título, data, valor pago).
- Guarda contra duplo clique (mesmo padrão `enviando` da Loja/Fundação).
- CTA para "Ver minhas inscrições" e para voltar à agenda.

### Minhas inscrições (`eventos/minhas-inscricoes`) 🔒
- Histórico de inscrições do usuário logado, mais recentes primeiro,
  com o evento correspondente (título, data) e status (`confirmada` /
  `cancelada`) em destaque visual.
- Botão "Cancelar inscrição" em inscrições `'confirmada'` — muda o
  status para `'cancelada'` sem removê-la da lista.
- Estado vazio: "Você ainda não se inscreveu em nenhum evento." com
  `EmptyState`.

### Modificações em telas existentes

- **Home** — a seção de eventos deixa de ser uma vitrine textual
  estática e passa a mostrar uma prévia real dos 2-3 próximos eventos
  (mesmo padrão visual da seção "Destaques" de produtos), com link para
  a Agenda completa.
- **Perfil** — a seção "Meus eventos" passa a consultar
  `RegistrationService.minhasInscricoes()` (filtrado por
  `status: 'confirmada'`): se houver inscrições ativas, mostra a
  quantidade com link para `eventos/minhas-inscricoes` (ex.: "Você está
  inscrito em 2 eventos."); se não houver, mantém o `EmptyState` já
  existente sem alteração de texto.

## Tratamento de vazio e erro

Segue a voz da interface já estabelecida na Fundação/Loja — diz o que
aconteceu e como resolver, sem se desculpar. Ex.: evento esgotado →
botão "Esgotado" em vez de mensagem de erro. Já inscrito → "Você já
está inscrito", não um bloqueio silencioso. Agenda vazia → estado vazio
neutro, sem alarmismo. Falha ao criar inscrição (caso teórico, já que o
pagamento é mockado como sucesso) → mensagem genérica, sem alterar o
estado de inscrições existente.

## Critérios de sucesso

- Fluxo completo navegável do zero: Home → Agenda → Detalhes →
  Confirmação → Minhas inscrições, sem telas soltas ou links quebrados.
- Guard bloqueia corretamente confirmação e minhas-inscrições para quem
  não está logado (redireciona a `/login`).
- Vagas restantes são sempre corretas: soma de inscrições `'confirmada'`
  nunca ultrapassa `vagasTotais`, e cancelar libera a vaga de volta.
- Não é possível se inscrever duas vezes no mesmo evento enquanto a
  inscrição anterior estiver `'confirmada'`.
- Home e Perfil (Fundação/Loja) continuam funcionando exatamente como
  antes para quem ainda não interagiu com eventos — a integração é
  aditiva, não regressiva.
