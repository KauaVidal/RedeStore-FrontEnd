import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Checkout } from './checkout';
import { CartService } from '../../../core/cart/cart.service';
import { OrderService } from '../../../core/orders/order.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ItemCarrinho } from '../../../core/cart/item-carrinho.model';

const ITEM: ItemCarrinho = {
  produtoId: '1',
  nome: 'Camiseta REDE Clássica',
  precoUnitario: 79.9,
  fotoUrl: 'https://picsum.photos/seed/x/480/480',
  tamanho: 'M',
  cor: 'Preto',
  quantidade: 2,
};

describe('Checkout', () => {
  let fixture: ComponentFixture<Checkout>;
  let cartServiceFalso: { itens: ReturnType<typeof signal<ItemCarrinho[]>>; subtotal: () => number; limpar: jasmine.Spy };
  let orderServiceFalso: jasmine.SpyObj<Pick<OrderService, 'criar'>>;
  let router: Router;

  beforeEach(async () => {
    cartServiceFalso = {
      itens: signal<ItemCarrinho[]>([ITEM]),
      subtotal: () => 159.8,
      limpar: jasmine.createSpy('limpar'),
    };
    orderServiceFalso = jasmine.createSpyObj('OrderService', ['criar']);
    orderServiceFalso.criar.and.resolveTo({
      id: '1',
      usuarioId: 'u1',
      itens: [ITEM],
      formaEntrega: 'retirada',
      valorTotal: 159.8,
      status: 'pago',
      criadoEm: new Date().toISOString(),
    });

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cartServiceFalso },
        { provide: OrderService, useValue: orderServiceFalso },
        {
          provide: AuthService,
          useValue: { usuarioAtual: signal({ id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Checkout);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('não mostra os campos de endereço quando a forma de entrega é retirada', () => {
    expect(fixture.nativeElement.querySelector('app-text-field')).toBeNull();
  });

  it('mostra os campos de endereço quando a entrega é escolhida', async () => {
    const radioEntrega: HTMLInputElement = fixture.nativeElement.querySelectorAll('input[type="radio"]')[1];
    radioEntrega.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('app-text-field').length).toBe(6);
  });

  it('cria o pedido com retirada e navega para a confirmação', async () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(orderServiceFalso.criar).toHaveBeenCalledWith({
      usuarioId: 'u1',
      itens: [ITEM],
      formaEntrega: 'retirada',
      endereco: undefined,
    });
    expect(cartServiceFalso.limpar).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/loja/checkout/confirmacao');
  });

  it('não envia quando a entrega está selecionada mas o endereço está incompleto', async () => {
    const radioEntrega: HTMLInputElement = fixture.nativeElement.querySelectorAll('input[type="radio"]')[1];
    radioEntrega.click();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(orderServiceFalso.criar).not.toHaveBeenCalled();
  });
});
