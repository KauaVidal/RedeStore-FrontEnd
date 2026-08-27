import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { OrderService } from './order.service';
import { PEDIDOS_MOCK } from './order-mock-store';
import { ItemCarrinho } from '../cart/item-carrinho.model';
import { Pedido } from './pedido.model';

const ITEM: ItemCarrinho = {
  produtoId: '1',
  nome: 'Camiseta REDE Clássica',
  precoUnitario: 79.9,
  fotoUrl: 'https://picsum.photos/seed/x/480/480',
  tamanho: 'M',
  cor: 'Preto',
  quantidade: 2,
};

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderService);
  });

  afterEach(() => {
    PEDIDOS_MOCK.length = 0;
  });

  it('criar() cria um pedido pago com o valor total calculado', fakeAsync(() => {
    let pedido: Pedido | undefined;
    service.criar({ usuarioId: 'u1', itens: [ITEM], formaEntrega: 'retirada' }).then((p) => (pedido = p));
    tick(400);
    expect(pedido?.status).toBe('pago');
    expect(pedido?.valorTotal).toBeCloseTo(159.8, 2);
  }));

  it('criar() define ultimoPedido() com o pedido recém-criado', fakeAsync(() => {
    service.criar({ usuarioId: 'u1', itens: [ITEM], formaEntrega: 'retirada' });
    tick(400);
    expect(service.ultimoPedido()?.usuarioId).toBe('u1');
  }));

  it('limparUltimoPedido() volta ultimoPedido() para null', fakeAsync(() => {
    service.criar({ usuarioId: 'u1', itens: [ITEM], formaEntrega: 'retirada' });
    tick(400);
    expect(service.ultimoPedido()).not.toBeNull();

    service.limparUltimoPedido();

    expect(service.ultimoPedido()).toBeNull();
  }));

  it('listarPorUsuario() retorna só os pedidos do usuário, mais recentes primeiro', fakeAsync(() => {
    spyOn(Date.prototype, 'toISOString').and.returnValues(
      '2024-01-01T00:00:00.000Z',
      '2024-01-01T00:00:01.000Z',
      '2024-01-01T00:00:02.000Z',
    );

    service.criar({ usuarioId: 'u1', itens: [ITEM], formaEntrega: 'retirada' });
    tick(400);
    service.criar({ usuarioId: 'u2', itens: [ITEM], formaEntrega: 'retirada' });
    tick(400);
    service.criar({ usuarioId: 'u1', itens: [ITEM], formaEntrega: 'entrega' });
    tick(400);

    let pedidosU1: Pedido[] = [];
    service.listarPorUsuario('u1').then((p) => (pedidosU1 = p));
    tick(400);

    expect(pedidosU1.length).toBe(2);
    expect(pedidosU1[0].formaEntrega).toBe('entrega');
  }));

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
});
