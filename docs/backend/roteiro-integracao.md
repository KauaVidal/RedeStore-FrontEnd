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
2. Rodar o seed do backend (fica em `RedeStore-BackEnd/scripts/seed-dev.sql`), a partir da raiz do backend:
   ```powershell
   ./scripts/seed-dev.ps1
   ```
   Detalhes na seção "Dados de exemplo (seed de desenvolvimento)" do README do backend.
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
