import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Confirmacao } from './confirmacao';
import { OrderService } from '../../../core/orders/order.service';
import { Pedido } from '../../../core/orders/pedido.model';

const PEDIDO: Pedido = {
  id: '1',
  usuarioId: 'u1',
  itens: [
    {
      produtoId: '1',
      nome: 'Camiseta REDE Clássica',
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
  criadoEm: new Date().toISOString(),
};

describe('Confirmacao', () => {
  let router: Router;

  async function montar(pedido: Pedido | null): Promise<ComponentFixture<Confirmacao>> {
    await TestBed.configureTestingModule({
      imports: [Confirmacao],
      providers: [provideRouter([]), { provide: OrderService, useValue: { ultimoPedido: signal(pedido) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Confirmacao);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
    return fixture;
  }

  it('mostra o resumo do pedido quando existe um pedido recente', async () => {
    const fixture = await montar(PEDIDO);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Pedido confirmado!');
    expect(texto).toContain('Camiseta REDE Clássica');
    expect(texto).toContain('159.80');
  });

  it('redireciona para meus pedidos quando não há pedido recente', async () => {
    await montar(null);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/loja/meus-pedidos');
  });
});
