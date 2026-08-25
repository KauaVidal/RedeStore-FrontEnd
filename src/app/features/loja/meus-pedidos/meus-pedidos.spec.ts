import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { MeusPedidos } from './meus-pedidos';
import { AuthService } from '../../../core/auth/auth.service';
import { OrderService } from '../../../core/orders/order.service';
import { Pedido } from '../../../core/orders/pedido.model';

const PEDIDO: Pedido = {
  id: '1',
  usuarioId: 'u1',
  itens: [],
  formaEntrega: 'retirada',
  valorTotal: 159.8,
  status: 'em_preparo',
  criadoEm: new Date().toISOString(),
};

describe('MeusPedidos', () => {
  let fixture: ComponentFixture<MeusPedidos>;
  let orderServiceFalso: jasmine.SpyObj<Pick<OrderService, 'listarPorUsuario'>>;

  async function montar(pedidos: Pedido[]): Promise<void> {
    orderServiceFalso = jasmine.createSpyObj('OrderService', ['listarPorUsuario']);
    orderServiceFalso.listarPorUsuario.and.resolveTo(pedidos);

    await TestBed.configureTestingModule({
      imports: [MeusPedidos],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { usuarioAtual: signal({ id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' }) },
        },
        { provide: OrderService, useValue: orderServiceFalso },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MeusPedidos);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o estado vazio quando não há pedidos', async () => {
    await montar([]);
    expect(fixture.nativeElement.textContent).toContain('Você ainda não fez nenhum pedido.');
  });

  it('mostra os pedidos com o status traduzido', async () => {
    await montar([PEDIDO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Pedido #1');
    expect(texto).toContain('Em preparo');
    expect(texto).toContain('159,80');
  });
});
