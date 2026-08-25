import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { USUARIOS_MOCK } from './auth-mock-store';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../orders/order.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('começa sem usuário autenticado', () => {
    expect(service.usuarioAtual()).toBeNull();
    expect(service.estaAutenticado()).toBeFalse();
  });

  it('login com credenciais corretas autentica o usuário', fakeAsync(() => {
    let usuario;
    service.login('jovem@rede.com', 'jovem123').then((u) => (usuario = u));
    tick(400);
    expect(usuario!.email).toBe('jovem@rede.com');
    expect(service.estaAutenticado()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
  }));

  it('login com senha errada rejeita com CREDENCIAIS_INVALIDAS', fakeAsync(() => {
    let erro: Error | undefined;
    service.login('jovem@rede.com', 'errada').catch((e) => (erro = e));
    tick(400);
    expect(erro?.message).toBe('CREDENCIAIS_INVALIDAS');
    expect(service.usuarioAtual()).toBeNull();
  }));

  it('login com admin marca isAdmin como true', fakeAsync(() => {
    service.login('admin@rede.com', 'admin123');
    tick(400);
    expect(service.isAdmin()).toBeTrue();
  }));

  it('cadastrar com e-mail novo cria e autentica o usuário como jovem', fakeAsync(() => {
    let usuario;
    service
      .cadastrar({ nome: 'Novo Jovem', email: 'novo@rede.com', senha: 'senha123' })
      .then((u) => (usuario = u));
    tick(400);
    expect(usuario!.papel).toBe('jovem');
    expect(service.estaAutenticado()).toBeTrue();
  }));

  it('cadastrar com e-mail já usado rejeita com EMAIL_EM_USO', fakeAsync(() => {
    let erro: Error | undefined;
    service
      .cadastrar({ nome: 'X', email: 'jovem@rede.com', senha: 'senha123' })
      .catch((e) => (erro = e));
    tick(400);
    expect(erro?.message).toBe('EMAIL_EM_USO');
  }));

  it('logout limpa o usuário atual', fakeAsync(() => {
    service.login('jovem@rede.com', 'jovem123');
    tick(400);
    service.logout();
    expect(service.usuarioAtual()).toBeNull();
    expect(service.estaAutenticado()).toBeFalse();
  }));

  it('logout limpa o carrinho e o último pedido para não vazar entre usuários', fakeAsync(() => {
    const carrinho = TestBed.inject(CartService);
    const pedidos = TestBed.inject(OrderService);

    service.login('jovem@rede.com', 'jovem123');
    tick(400);

    carrinho.adicionar({
      produtoId: '1',
      nome: 'Camiseta REDE Clássica',
      precoUnitario: 79.9,
      fotoUrl: 'https://picsum.photos/seed/x/480/480',
      tamanho: 'M',
      cor: 'Preto',
    });
    pedidos.criar({ usuarioId: '2', itens: carrinho.itens(), formaEntrega: 'retirada' });
    tick(400);

    expect(carrinho.itens().length).toBeGreaterThan(0);
    expect(pedidos.ultimoPedido()).not.toBeNull();

    service.logout();

    expect(carrinho.itens()).toEqual([]);
    expect(pedidos.ultimoPedido()).toBeNull();
  }));

  it('persiste a sessão no localStorage e restaura em uma nova instância', fakeAsync(() => {
    service.login('jovem@rede.com', 'jovem123');
    tick(400);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const novaInstancia = TestBed.inject(AuthService);

    expect(novaInstancia.usuarioAtual()?.email).toBe('jovem@rede.com');
  }));

  it('atualizarPerfil altera os dados do usuário logado', fakeAsync(() => {
    service.login('jovem@rede.com', 'jovem123');
    tick(400);
    service.atualizarPerfil({ nome: 'Jovem Atualizado', telefone: '11999999999' });
    tick(400);
    expect(service.usuarioAtual()?.nome).toBe('Jovem Atualizado');
    expect(service.usuarioAtual()?.telefone).toBe('11999999999');
  }));

  afterEach(() => {
    USUARIOS_MOCK.splice(2);
  });
});
