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

    const botoes: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const botao = botoes.find((b) => b.textContent?.includes('Avançar')) as HTMLButtonElement;
    botao.click();
    await fixture.whenStable();

    expect(pedidosServicoFalso.atualizarStatus).toHaveBeenCalledWith('1', 'em_preparo');
  });
});
