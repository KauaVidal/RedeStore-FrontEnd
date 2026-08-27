# REDE — Admin: Design Spec

## Contexto

Quarto e último subprojeto do site da REDE, construído sobre a
**Fundação**, a **Loja** e os **Eventos** (todos já mesclados em
`main`): design system, `AuthService` mockado com guards e roles
(`papel: 'admin' | 'jovem'`), `ProductService`/`OrderService`/
`EventService`/`RegistrationService` (todos mockados, Signals,
`mockLatency`), e os componentes de UI compartilhados (`Button`,
`TextField`, `EmptyState`, `SectionDivider`, `Logo`, `ProductCard`).

Este subprojeto entrega o painel de administração: gestão de produtos
e eventos (criar/editar/remover), acompanhamento e avanço de status de
pedidos, e visualização/cancelamento de inscrições por evento. É o
único ponto do site pensado para uso em desktop, já que quem administra
a REDE fará isso de computador.

Ordem dos subprojetos: Fundação (concluído) → Loja (concluído) →
Eventos (concluído) → **Admin** (este, último).

## Decisões confirmadas com o cliente

- **Escopo do v1 é o painel completo**: Produtos (CRUD), Pedidos
  (avançar status), Eventos (CRUD) e Inscrições por evento (ver/
  cancelar) — as quatro áreas entram juntas nesta fase, sem corte
  adicional.
- **Layout próprio, desktop-first**: o Admin não reaproveita o
  `Shell` (Header/BottomNav) do restante do site. Tem um `AdminShell`
  próprio com navegação lateral (sidebar), pensado para telas grandes
  e tabelas de dados.
- **Formulários em modal, não em rota dedicada**: criar/editar Produto
  e Evento abrem um `Modal` sobre a lista atual, em vez de navegar
  para uma tela própria — fluxo mais rápido, evita 4 telas novas só de
  formulário.
- **Sem dashboard/tela de estatísticas**: `/admin` redireciona direto
  para `/admin/produtos`. Com só 4 seções e um catálogo pequeno, uma
  tela de índice agregando números não paga o custo de manutenção
  (YAGNI) — pode ser reconsiderado depois se o catálogo crescer.
- **Nenhuma mudança de schema**: os modelos `Produto`, `Evento`,
  `Pedido` e `Inscricao` já têm todos os campos necessários; o Admin
  só adiciona métodos de escrita (criar/atualizar/remover) aos
  serviços existentes.

## Escopo desta spec

**Incluído**: `AdminShell` com sidebar; rotas `/admin/produtos`,
`/admin/pedidos`, `/admin/eventos`, `/admin/eventos/:id/inscricoes`
protegidas por `adminGuard`; link "Admin" no `Header` condicionado a
`auth.isAdmin()`; métodos de escrita em `ProductService`,
`EventService`, `OrderService`, `RegistrationService`; método
`buscarPorId` em `AuthService`; quatro novos componentes de design
system (`Table`, `Modal`, `Select`, `Textarea`).

**Fora de escopo**: dashboard com métricas/gráficos; edição de papel
de usuário (promover jovem a admin) pela UI — o mock de usuários já
tem um admin fixo (`admin@rede.com`); reembolso ou estorno real de
pedido; múltiplos administradores com permissões diferentes entre si
(todo admin vê e faz tudo); notificação por e-mail ao avançar status
de pedido ou cancelar inscrição.

## Arquitetura

- **Rotas**: `/admin` fica fora do bloco do `Shell` principal em
  `app.routes.ts` (mesmo nível que `auth.routes`), com
  `loadChildren` apontando para `admin.routes.ts`, mesmo padrão de
  lazy loading usado em `loja.routes`/`eventos.routes`. Todas as rotas
  filhas usam `canActivate: [adminGuard]` (guard já existente em
  `auth.guard.ts`, hoje sem uso).
  - `''` → redirect para `'produtos'`
  - `'produtos'` → tela de Produtos
  - `'pedidos'` → tela de Pedidos
  - `'eventos'` → tela de Eventos
  - `'eventos/:id/inscricoes'` → tela de Inscrições do evento
- **`AdminShell`**: layout próprio (sidebar com os 3 links principais +
  nome do admin logado + logout, mais área de conteúdo com
  `<router-outlet>`), carregado como componente de rota-pai das rotas
  acima. Não reaproveita `Header`/`BottomNav`/`Footer` da Fundação.
- **Link "Admin" no `Header`**: visível apenas quando
  `auth.isAdmin()` for `true`, ao lado dos links já existentes.
- **`AuthService.buscarPorId(id): Promise<Usuario | undefined>`**:
  novo método (mesmo padrão `mockLatency` dos demais services),
  usado para resolver nome/email de `usuarioId` nas telas de Pedidos e
  Inscrições sem que essas telas acessem `USUARIOS_MOCK` diretamente.

## Serviços — métodos novos (sem mudar os modelos)

```
ProductService
  criar(dados: Omit<Produto, 'id'>): Promise<Produto>
  atualizar(id: string, dados: Partial<Omit<Produto, 'id'>>): Promise<Produto>
  remover(id: string): Promise<void>

EventService
  criar(dados: Omit<Evento, 'id'>): Promise<Evento>
  atualizar(id: string, dados: Partial<Omit<Evento, 'id'>>): Promise<Evento>
  remover(id: string): Promise<void>

OrderService
  listarTodos(): Promise<Pedido[]>                         // ordenado por criadoEm desc, mesmo critério de listarPorUsuario
  atualizarStatus(id: string, novoStatus: StatusPedido): Promise<Pedido>

RegistrationService
  listarPorEvento(eventoId: string): Promise<Inscricao[]>  // ordenado por criadoEm desc
  // cancelar(inscricaoId) já existe e é reaproveitado sem alteração

AuthService
  buscarPorId(id: string): Promise<Usuario | undefined>
```

**Regra de transição de status do pedido**: `status` não é uma
sequência linear única — o passo final depende de `formaEntrega`.
Transições válidas:

```
pago → em_preparo → retirado    (quando formaEntrega === 'retirada')
pago → em_preparo → entregue    (quando formaEntrega === 'entrega')
```

A tela de Pedidos calcula o próximo status válido a partir do status
atual e da `formaEntrega` do pedido; o botão "Avançar" não aparece
quando o pedido já está no status final (`retirado` ou `entregue`).
Não existe transição para trás (nenhum botão de retroceder status).

**Segurança do histórico ao excluir**: `ItemCarrinho` e `Inscricao` já
guardam cópia dos dados relevantes (nome, preço) no momento da compra/
inscrição — não uma referência viva ao produto/evento original.
Remover um produto ou evento não afeta pedidos ou inscrições já
existentes.

## Componentes novos de design system (`shared/ui`)

Nenhum destes existe hoje (o design system atual só tem `Button`,
`TextField`, `EmptyState`, `SectionDivider`, `Logo`, `ProductCard`).
Seguem o mesmo padrão dos componentes existentes: standalone, Signals,
`input()`/`output()`, sem lógica de negócio dentro do componente.

- **`Table`**: colunas configuráveis via `input()` (label + acessor),
  linhas genéricas, slot/template por coluna para células customizadas
  (ex.: badge de status, botões de ação). Usada nas 3 listagens.
- **`Modal`**: overlay + diálogo, `input()` de título e visibilidade,
  `output()` de fechar; conteúdo via `ng-content`. Usado tanto para os
  formulários de criar/editar quanto para confirmação de exclusão.
- **`Select`**: dropdown com `input()` de opções e valor, `output()` de
  mudança — mesmo contrato de `ControlValueAccessor` que `TextField`
  já usa, para funcionar com Reactive Forms. Usado para categoria,
  tamanho/cor de variação e status de pedido.
- **`Textarea`**: campo de texto multilinha, mesmo contrato de
  `ControlValueAccessor`/estilo visual de `TextField`, usado para
  descrição de produto e evento.

## Telas detalhadas

### Produtos (`admin/produtos`)
- `Table`: foto miniatura, nome, categoria, preço, estoque total (soma
  de `variacoes[].estoque`), coluna de ações (editar, remover).
- Botão "Novo produto" abre `Modal` com formulário: nome, categoria
  (`Select`), preço, descrição (`Textarea`), fotos (campo de URL,
  permite mais de uma), variações (lista editável de tamanho/cor/
  estoque). Editar abre o mesmo modal pré-preenchido.
- Remover abre `Modal` de confirmação antes de excluir.
- Estado vazio: `EmptyState` ("Nenhum produto cadastrado ainda.").

### Pedidos (`admin/pedidos`)
- `Table`: id, cliente (via `AuthService.buscarPorId`), itens
  resumidos (quantidade de itens + primeiro nome de produto + "e mais
  N"), valor total, status (badge), data.
- Botão "Avançar para [próximo status]" por linha, calculado conforme
  a regra de transição acima; não aparece em pedidos já no status
  final.
- Sem edição/remoção de pedido — só avanço de status.
- Estado vazio: `EmptyState` ("Nenhum pedido registrado ainda.").

### Eventos (`admin/eventos`)
- `Table`: foto miniatura, título, data/hora, local, preço, vagas
  (ocupadas/totais, via `RegistrationService.vagasRestantes`), coluna
  de ações (ver inscrições, editar, remover).
- Botão "Novo evento" abre `Modal` com formulário: título, descrição
  (`Textarea`), data/hora, local, preço, vagas totais, foto (URL).
  Editar abre o mesmo modal pré-preenchido.
- Remover abre `Modal` de confirmação antes de excluir.
- Estado vazio: `EmptyState` ("Nenhum evento cadastrado ainda.").

### Inscrições do evento (`admin/eventos/:id/inscricoes`)
- Cabeçalho com título do evento e link para voltar a Eventos.
- `Table`: nome do inscrito e email (via `AuthService.buscarPorId`),
  status (badge `confirmada`/`cancelada`), data da inscrição, coluna
  de ação ("Cancelar inscrição", só em inscrições `confirmada`).
- Cancelar chama `RegistrationService.cancelar` direto (ação já
  reversível/idempotente na lógica existente, sem `Modal` de
  confirmação extra — consistente com "Minhas inscrições" do jovem,
  que também cancela sem confirmação adicional).
- Estado vazio: `EmptyState` ("Ninguém se inscreveu neste evento
  ainda.").

## Tratamento de vazio e erro

Mesma voz já estabelecida no resto do site — diz o que aconteceu e
como resolver, sem se desculpar. Listas vazias usam `EmptyState` com
mensagem específica por seção (nunca um texto genérico repetido).
Exclusão de produto/evento sempre passa por confirmação em `Modal`,
por ser destrutiva; avançar status de pedido e cancelar inscrição não
precisam de confirmação extra, por serem reversíveis ou de baixo risco
(mesmo critério já usado no cancelamento de inscrição do jovem).
Validação de formulário (campos obrigatórios, preço/vagas numéricos e
positivos) segue o padrão já usado em Cadastro/Checkout.

## Critérios de sucesso

- CRUD completo de produtos e eventos funcional do zero: criar, editar
  e remover refletem imediatamente nas telas do jovem (Loja/Agenda).
- Admin avança o status de um pedido e o jovem vê a mudança refletida
  em "Meus pedidos", respeitando a regra de transição por
  `formaEntrega`.
- Admin vê os inscritos de um evento e cancela uma inscrição; a vaga
  liberada aparece correta em `vagasRestantes` tanto no Admin quanto
  nas telas do jovem.
- `adminGuard` bloqueia `/admin/**` para usuários não-admin
  (redireciona para `/`), e o link "Admin" não aparece no Header para
  jovens.
- Nenhuma regressão nas telas existentes de Loja, Eventos, Perfil ou
  Home.
