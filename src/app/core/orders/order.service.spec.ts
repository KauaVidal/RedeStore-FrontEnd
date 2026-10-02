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
