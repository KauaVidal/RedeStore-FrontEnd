# REDE — Fundação: Design Spec

## Contexto

O RedeStore-FrontEnd é o site da REDE, ministério de jovens da Primeira
Igreja Batista de Vila Maria. O site une duas frentes: uma loja de produtos
(camisetas, moletons, acessórios) e uma área de eventos (retiros, encontros)
com inscrição online, paga ou gratuita. O projeto completo tem 25 telas
divididas em autenticação/perfil, loja, eventos, quatro áreas de admin e uma
página institucional.

Dado o tamanho, o projeto foi decomposto em 4 subprojetos, cada um com seu
próprio ciclo de spec → plano → implementação:

1. **Fundação** (esta spec) — design system, shell/navegação, autenticação,
   perfil, página institucional
2. **Loja** — home, categorias, listagem, produto, carrinho, checkout
   (Mercado Pago), confirmação, meus pedidos
3. **Eventos** — agenda, detalhes, inscrição (+ pagamento), meus eventos
4. **Admin** — produtos, pedidos, financeiro, eventos, inscritos, usuários

Não existe backend ainda; este e os próximos subprojetos são construídos
sobre dados mockados, com os serviços desenhados para trocar a implementação
por chamadas HTTP reais mais tarde sem alterar quem os consome.

## Escopo desta spec

**Incluído**: shell de navegação (topo desktop / barra inferior mobile +
rodapé), Login, Cadastro, Recuperar senha, Perfil (estrutura da tela e
navegação para as sub-seções de pedidos/inscrições — o conteúdo real dessas
listas é definido nos subprojetos Loja e Eventos), Sobre a REDE.

**Fora de escopo** (subprojetos futuros): todas as telas de Loja, Eventos e
Admin.

## Arquitetura

- **Angular** (standalone components, sem NgModules), roteamento com lazy
  loading por feature (`loja/`, `eventos/`, `admin/`) e guards funcionais.
- **Estado com Signals** — sem NgRx; o app não tem complexidade que
  justifique. `AuthService` expõe um `signal<Usuario | null>` de sessão e um
  `computed` `isAdmin`. Sessão mockada persistida em `localStorage` para
  sobreviver a reloads durante o desenvolvimento.
- **Guards**: `authGuard` (exige login) e `adminGuard` (exige papel admin),
  aplicados nas rotas de `perfil`, `loja` (checkout/pedidos), `eventos`
  (inscrição/meus eventos) e `admin`.
- **Papéis**: apenas dois — `jovem` e `admin`. Sem papéis intermediários.
- **Dados mockados**: serviços em `core/mock` simulam latência de rede
  (delay artificial) e retornam `Observable`/`Promise`, com a mesma
  assinatura que o serviço real terá. Trocar mock por API real deve ser uma
  troca de implementação, não uma reescrita dos componentes consumidores.
- **Estilização**: SCSS com design tokens (custom properties) nas telas do
  jovem. Admin (subprojeto 4) usa PrimeNG sem tema padrão (só os módulos de
  tabela, formulário e modal), estilizado por cima com os mesmos tokens —
  mas o arquivo de tokens já nasce compartilhável entre os dois mundos.
- **Testes**: seguir TDD nas partes com lógica (validação de formulário,
  guards, serviços de mock, `AuthService`). Cobertura de componentes visuais
  focada em comportamento (estados de erro/loading/sucesso), não em
  snapshot de UI.

## Design tokens

| Token | Hex | Uso |
|---|---|---|
| `--rede-black` | `#0D0D0D` | fundo principal (lado do jovem) |
| `--rede-yellow` | `#F4C617` | acento primário, CTAs, foco, destaques |
| `--rede-yellow-deep` | `#C79A12` | hover/pressed do amarelo |
| `--rede-paper` | `#F6F4EC` | texto sobre preto; fundo claro do admin |
| `--rede-graphite` | `#1A1815` | superfícies elevadas (cards) sobre o preto |
| `--status-confirm` | `#4C9A6A` | pago / confirmado |
| `--status-cancel` | `#D9573B` | cancelado / erro |

O lado do jovem é **predominantemente escuro** (fundo `--rede-black`, como a
versão da logo em fundo preto) — não um site institucional claro. O admin
(subprojeto 4) inverte para `--rede-paper` claro com texto escuro, priorizando
leitura rápida em tabelas densas sobre impacto visual.

**Espaçamento**: escala de 4px (`4, 8, 12, 16, 24, 32, 48, 64`).
**Raio**: `4px` em cards/inputs; `999px` (pílula) reservado a botões
primários e badges de status — não usar em outros elementos, para manter o
raio como sinal reconhecível.
**Breakpoint principal**: `768px` (abaixo = layout mobile com barra inferior;
acima = layout desktop com nav no topo).

## Tipografia

| Papel | Fonte | Peso | Uso |
|---|---|---|---|
| Display | Unbounded | 700–900 | Títulos grandes, preços em destaque, nome de evento |
| Corpo | Manrope | 400–600 | Parágrafos, labels, botões, formulários |
| Utilitária | IBM Plex Mono | 400–500 | Números de pedido/inscrição, datas, valores, tabelas do admin |

Ambas carregadas via Google Fonts, com fallback `system-ui, sans-serif` (e
`ui-monospace, monospace` para a utilitária) caso a fonte falhe ao carregar.

## Layout e navegação

Mobile-first, com navegação principal em **barra inferior fixa** (padrão de
app), não menu hambúrguer — a maioria dos jovens acessa pelo celular.

```
MOBILE (< 768px)                DESKTOP (>= 768px)
┌─────────────────────┐         ┌───────────────────────────────────┐
│ [logo]         🛒    │ topo    │ [logo]  Loja  Eventos  Sobre   🛒 👤│
├─────────────────────┤         ├───────────────────────────────────┤
│                      │         │                                     │
│     conteúdo         │         │             conteúdo               │
│                      │         │                                     │
├─────────────────────┤         └───────────────────────────────────┘
│ 🏠   🛍️   🎟️   👤   │ tab bar
│Início Loja Eventos Perfil│
└─────────────────────┘
```

A barra inferior some quando o usuário não está autenticado (login/cadastro
não têm navegação principal — são um fluxo isolado, tela cheia, sem
distrações).

## Elemento de assinatura

A assinatura visual vem do próprio glifo da logo (um traçado entrelaçado —
"rede" = malha/rede de pessoas), "desenrolado" numa textura de linhas finas
entrelaçadas. Usado com moderação em três lugares:

1. Atrás do título de telas de abertura (ex: Sobre a REDE, hero), em
   opacidade baixa (~8%), com um desenho sutil ao carregar a página.
   Respeita `prefers-reduced-motion: reduce` — sem animação, aparece
   estático.
2. Divisor entre seções: no lugar de um `<hr>` reto, um traço fino duplo
   entrelaçado (SVG inline reutilizável, `~2px` de altura).
3. Borda decorativa discreta em cards de "Meus pedidos"/"Meus eventos"
   (remete a canhoto de ingresso) — apenas nesses cards, não em cards de
   produto ou listagens genéricas.

Fora desses três usos, a interface fica quieta — sem repetir o motivo em
outros lugares.

## Uso da logo

Arquivos em `files/`, conceito e desenho não podem ser alterados (só
qualidade/resolução e escolha de variante de cor):

| Arquivo | Uso |
|---|---|
| `logo-rede-amarelo-fundo-preto.svg` | padrão, fundo escuro (header, hero) |
| `logo-rede-preto-fundo-amarelo.svg` | sobre superfícies amarelas (badges, CTAs cheios) |
| `logo-rede-amarelo-transparente.svg` | glifo amarelo sozinho, sobre fundo escuro custom |
| `logo-rede-branco-transparente.svg` | favicon/contextos monocromáticos escuros, texto sobre foto |
| `logo-rede-preto-transparente.svg` | contextos claros (admin, e-mail, impressos) |

Área de proteção mínima: altura de um "R" do glifo em todos os lados. Nunca
recolorir fora dessas 5 variantes fornecidas nem distorcer a proporção.

## Telas detalhadas

### Shell (header + bottom nav + footer)
- Header mobile: logo à esquerda, ícone de carrinho à direita (com contador).
- Nav desktop: logo, links (Loja/Eventos/Sobre), carrinho e avatar de
  perfil à direita.
- Bottom nav mobile (autenticado ou não, exceto durante auth): Início, Loja,
  Eventos, Perfil — ícone + label curto, item ativo em amarelo.
- Footer: logo pequena, links institucionais (Sobre, contato), redes
  sociais, horário de encontro (placeholder até ter conteúdo real).

### Login
- Card centralizado, glifo no topo, título "Entrar na REDE".
- Campos: e-mail, senha (toggle mostrar/ocultar).
- Ação primária: botão pílula amarelo "Entrar".
- Links secundários: "Esqueci minha senha", "Criar conta".
- Erros de credencial inválida na voz da interface: dizem o que aconteceu
  ("E-mail ou senha incorretos") e não avisam qual dos dois está errado
  (evitar enumeração de contas).

### Cadastro
- Mesmo padrão de card. Campos: nome, e-mail, senha, confirmar senha.
- Validação em tempo real (força mínima de senha, e-mail bem formado,
  confirmação bate com a senha) com mensagens específicas por campo.
- Ao concluir, loga automaticamente e vai para a Home.

### Recuperar senha
- Card com um campo (e-mail) e uma ação. Tela de confirmação após envio
  ("Se esse e-mail existir na nossa base, enviamos um link") — mock ainda
  não envia e-mail de verdade, mas a tela e a mensagem já refletem o
  comportamento final.

### Perfil
- Dados pessoais (nome, e-mail, telefone) editáveis.
- Duas seções de navegação: "Meus pedidos" e "Meus eventos" (levam às telas
  reais nos subprojetos Loja/Eventos — aqui só a estrutura/links, com estado
  vazio mockado: "Você ainda não fez nenhum pedido").
- Opção de logout.

### Sobre a REDE
- Visão do ministério, liderança, horários de encontro.
- Conteúdo de texto (liderança, horários) ainda não fornecido pelo cliente
  — a tela é construída com placeholders claramente marcados, para
  substituição fácil depois que o conteúdo real chegar.

## Tratamento de vazio e erro

Segue a voz da interface, não de uma pessoa se desculpando: diz o que
aconteceu e como resolver. Ex.: campo de senha errado → "E-mail ou senha
incorretos. Confira e tente de novo." Estado vazio de pedidos → "Você ainda
não fez nenhum pedido. Dá uma olhada na loja." com CTA para a loja.

## Critérios de sucesso

- Responsivo de verdade em mobile (não só "não quebra") — barra inferior,
  tipografia e toques testados em largura de celular real.
- Guards bloqueiam corretamente acesso a `perfil` (não autenticado) e não
  existe ainda rota de admin nesta fase (guard será testado no subprojeto
  Admin, mas a lógica de papel já nasce aqui em `AuthService`).
- Formulários validam com mensagens específicas por campo, sem bugs de
  submissão dupla ou estado travado em loading.
- Tokens de design (cores, tipografia, espaçamento, raio) ficam centralizados
  e são reaproveitados sem duplicação pelos subprojetos seguintes.
