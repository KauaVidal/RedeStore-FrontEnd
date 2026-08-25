# REDE — Loja: Design Spec

## Contexto

Segundo subprojeto do site da REDE, construído sobre a **Fundação** (já
mesclada em `main`): design system, `AuthService` mockado com guards,
shell de navegação (Header/BottomNav/Footer), e componentes de UI
compartilhados (`Logo`, `Button`, `TextField`, `SectionDivider`,
`EmptyState`).

Este subprojeto implementa a loja de produtos (camisetas, moletons,
acessórios) do lado do jovem: navegação de catálogo, carrinho, checkout
e histórico de pedidos. Ainda não existe backend — como no resto do
projeto, os dados de produto e pedido são mockados, com serviços
desenhados para trocar a implementação por chamadas HTTP reais depois
sem alterar quem os consome (mesmo padrão do `AuthService`).

Ordem dos subprojetos: Fundação (concluído) → **Loja** (este) → Eventos
→ Admin.

## Decisões confirmadas com o cliente

- **Navegação pública, checkout autenticado**: home, categorias,
  listagem e detalhes do produto são acessíveis sem login. Carrinho e
  checkout exigem login (mesmo `authGuard` da Fundação).
- **Catálogo mockado com fotos de banco de imagens livre**: sem catálogo
  real ainda, os produtos usam fotos de um serviço de imagens livre
  (ex.: Unsplash), escolhidas por categoria — não são fotos reais dos
  produtos da REDE.
- **Pagamento mockado como sucesso direto**: o botão "Pagar" simula o
  Mercado Pago e confirma o pedido como pago na hora, sem fluxo de erro
  por enquanto (isso pode ser revisitado quando o backend real existir).
- **Carrinho persistido no `localStorage`**: sobrevive a reload da
  página, mesmo padrão da sessão de login.
- **Endereço de entrega capturado no checkout**, não no Perfil — não
  altera a tela de Perfil já existente além do necessário para mostrar
  o link/resumo de pedidos reais (ver Telas detalhadas).

## Escopo desta spec

**Incluído**: Home (destaques de produtos + prévia de eventos),
Categorias, Listagem de produtos (por categoria ou busca), Detalhes do
produto, Carrinho, Checkout, Confirmação do pedido, Meus pedidos. Também
inclui uma modificação pontual na tela de Perfil da Fundação (a seção
"Meus pedidos" passa a refletir pedidos reais via `OrderService`, em vez
do estado vazio estático) e no `Header` (o ícone de carrinho passa a
mostrar a quantidade real de itens e linkar para o carrinho de verdade).

**Fora de escopo**: Eventos, Admin (gestão de produtos/pedidos/financeiro
segue fora até o subprojeto Admin). A rota `/eventos` continua mostrando
o placeholder `EmBreve` da Fundação, inalterada.

## Arquitetura

- **`ProductService`** (mock, `providedIn: 'root'`): array de produtos em
  memória com `mockLatency`, expõe `listar()`, `listarPorCategoria(categoria)`,
  `buscar(termo)`, `buscarPorId(id)` — todos `Promise`, mesma assinatura
  que uma versão HTTP real teria.
- **`CartService`** (Signals): `itens: Signal<ItemCarrinho[]>`,
  `quantidadeTotal`/`subtotal` como `computed`, `adicionar()`,
  `atualizarQuantidade()`, `removerItem()`, `limpar()`. Persistido no
  `localStorage` como a sessão de auth (carrega no construtor, salva a
  cada mutação).
- **`OrderService`** (mock): `criar(dados)` gera um `Pedido` a partir do
  carrinho atual + forma de entrega/endereço, `listarPorUsuario(usuarioId)`
  retorna o histórico. Status inicial sempre `'pago'` (dado o pagamento
  mockado como sucesso direto).
- **Rotas** (guard `authGuard` nas marcadas com 🔒): substitui os
  placeholders `EmBreve` da Fundação em `''` e `'loja'`, adiciona as
  demais como filhas do `Shell`:
  - `''` → Home
  - `'loja'` → Categorias
  - `'loja/produtos'` → Listagem (query params `categoria`, `busca`)
  - `'loja/produtos/:id'` → Detalhes do produto
  - `'loja/carrinho'` 🔒 → Carrinho
  - `'loja/checkout'` 🔒 → Checkout
  - `'loja/checkout/confirmacao'` 🔒 → Confirmação
  - `'loja/meus-pedidos'` 🔒 → Meus pedidos
  - `'eventos'` — inalterada (continua `EmBreve`)

## Modelo de dados (mock)

```
Produto
  id: string
  nome: string
  categoria: 'camisetas' | 'moletons' | 'acessorios'
  preco: number               // reais, ex.: 89.90
  descricao: string
  fotos: string[]              // URLs de banco de imagens livre
  tamanhos: string[]           // ex.: ['P','M','G','GG'] ou ['Único']
  cores: string[]              // ex.: ['Preto','Amarelo','Branco']
  variacoes: { tamanho: string; cor: string; estoque: number }[]
  destaque: boolean            // aparece na Home

ItemCarrinho
  produtoId: string
  nome: string                 // snapshot no momento de adicionar
  precoUnitario: number
  fotoUrl: string
  tamanho: string
  cor: string
  quantidade: number

Pedido
  id: string
  usuarioId: string
  itens: ItemCarrinho[]         // snapshot do carrinho no momento da compra
  formaEntrega: 'retirada' | 'entrega'
  endereco?: { rua: string; numero: string; complemento?: string; bairro: string; cidade: string; cep: string }
  valorTotal: number
  status: 'pago' | 'em_preparo' | 'retirado' | 'entregue'
  criadoEm: string              // ISO date
```

Catálogo mockado inicial: pelo menos 2-3 produtos por categoria (6-9 no
total), variações de tamanho/cor com estoque suficiente para exercitar
os fluxos de compra e de "sem estoque".

## Telas detalhadas

### Home (`''`)
- Seção de destaques: grade de produtos com `destaque: true`, card com
  foto/nome/preço, leva a Detalhes.
- Seção de eventos: prévia leve (título + texto curto + botão "Ver
  eventos" para `/eventos`, que hoje mostra "em breve") — não busca
  dados de evento nenhum, é só uma vitrine textual até o subprojeto
  Eventos existir.
- Usa o `Shell` normalmente (header + bottom nav).

### Categorias (`loja`)
- Três cards (camisetas, moletons, acessórios), cada um leva a Listagem
  filtrada por aquela categoria.

### Listagem (`loja/produtos`)
- Grade de produtos, filtrável por `categoria` (query param) e por
  `busca` (campo de texto livre sobre o nome do produto).
- Estado vazio: "Nenhum produto encontrado." quando a busca/filtro não
  retorna nada, com `EmptyState`.

### Detalhes do produto (`loja/produtos/:id`)
- Fotos, nome, preço, descrição.
- Seletor de tamanho e cor (obrigatórios antes de habilitar "Adicionar
  ao carrinho").
- Mostra "Sem estoque" e desabilita o botão quando a combinação
  tamanho+cor escolhida tem `estoque: 0`.
- Ao adicionar, dá feedback visual (ex.: texto de confirmação temporário)
  sem navegar para outra tela.

### Carrinho (`loja/carrinho`) 🔒
- Lista de itens com foto/nome/tamanho/cor/quantidade/preço, permite
  alterar quantidade e remover item.
- Subtotal calculado via `CartService`.
- Estado vazio: "Seu carrinho está vazio." com `EmptyState` e CTA para
  a loja.
- Botão "Continuar para o checkout" (desabilitado se vazio).

### Checkout (`loja/checkout`) 🔒
- Escolha de forma de entrega: retirada ou entrega.
- Se entrega: formulário de endereço (rua, número, complemento
  opcional, bairro, cidade, CEP) — validado como obrigatório exceto
  complemento.
- Resumo do pedido (itens + total).
- Botão "Pagar com Mercado Pago" — simula sucesso e cria o pedido via
  `OrderService`, limpa o carrinho, navega para a Confirmação.
- Guarda contra duplo clique (mesmo padrão `enviando`/`salvando` da
  Fundação).

### Confirmação do pedido (`loja/checkout/confirmacao`) 🔒
- Mostra o pedido recém-criado (número, itens, total, forma de entrega).
- CTA para "Ver meus pedidos" e para voltar à loja.
- Acessível apenas por navegação vinda do checkout bem-sucedido (sem
  pedido em contexto, redireciona para `loja/meus-pedidos`).

### Meus pedidos (`loja/meus-pedidos`) 🔒
- Histórico de pedidos do usuário logado, mais recentes primeiro, com
  status (`pago`, `em_preparo`, `retirado`, `entregue`) em destaque
  visual (cor por status, reaproveitando `--status-confirm`/
  `--status-cancel`/`--rede-yellow` conforme o estado).
- Estado vazio: "Você ainda não fez nenhum pedido." com `EmptyState`
  (mesmo texto que a Fundação já usa no Perfil).

### Modificações em telas da Fundação

- **Perfil** — a seção "Meus pedidos" passa a consultar
  `OrderService.listarPorUsuario()`: se houver pedidos, mostra a
  quantidade total de pedidos feitos com link para `loja/meus-pedidos`
  (ex.: "Você já fez 3 pedidos."); se não houver, mantém o `EmptyState`
  já existente sem alteração de texto.
- **Header** — o ícone de carrinho passa a mostrar um badge com
  `CartService.quantidadeTotal()` (some quando o carrinho está vazio) e
  linka para `loja/carrinho` em vez do placeholder `/loja` da Fundação.

## Tratamento de vazio e erro

Segue a voz da interface já estabelecida na Fundação — diz o que
aconteceu e como resolver, sem se desculpar. Ex.: variação sem estoque →
"Sem estoque nessa combinação." Carrinho vazio → convite pra loja, não
reclamação. Falha ao criar pedido (caso teórico, já que o pagamento é
mockado como sucesso) → mensagem genérica + manter o carrinho intacto
para nova tentativa.

## Critérios de sucesso

- Fluxo completo navegável do zero: Home → Categorias → Listagem →
  Detalhes → Carrinho → Checkout → Confirmação → Meus pedidos, sem
  telas soltas ou links quebrados.
- Guards bloqueiam corretamente carrinho/checkout/confirmação/meus
  pedidos para quem não está logado (redireciona a `/login`).
- Carrinho sobrevive a reload de página.
- Estoque é respeitado: não é possível adicionar mais itens do que a
  variação tem disponível.
- Perfil e Header (Fundação) continuam funcionando exatamente como
  antes para quem ainda não interagiu com a loja — a integração é
  aditiva, não regressiva.
