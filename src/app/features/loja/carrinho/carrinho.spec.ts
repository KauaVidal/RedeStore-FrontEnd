import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Carrinho } from './carrinho';
import { CartService } from '../../../core/cart/cart.service';
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

describe('Carrinho', () => {
  let fixture: ComponentFixture<Carrinho>;
  let cartServiceFalso: {
    itens: ReturnType<typeof signal<ItemCarrinho[]>>;
    subtotal: () => number;
    atualizarQuantidade: jasmine.Spy;
    removerItem: jasmine.Spy;
  };
  let router: Router;

  beforeEach(async () => {
    cartServiceFalso = {
      itens: signal<ItemCarrinho[]>([]),
      subtotal: () => cartServiceFalso.itens().reduce((s, i) => s + i.precoUnitario * i.quantidade, 0),
      atualizarQuantidade: jasmine.createSpy('atualizarQuantidade'),
      removerItem: jasmine.createSpy('removerItem'),
    };

    await TestBed.configureTestingModule({
      imports: [Carrinho],
      providers: [provideRouter([]), { provide: CartService, useValue: cartServiceFalso }],
    }).compileComponents();

    fixture = TestBed.createComponent(Carrinho);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
  });

  it('mostra o estado vazio quando não há itens', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Seu carrinho está vazio.');
  });

  it('mostra os itens e o subtotal', () => {
    cartServiceFalso.itens.set([ITEM]);
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Camiseta REDE Clássica');
    expect(texto).toContain('159.80');
  });

  it('chama atualizarQuantidade ao clicar em "+"', () => {
    cartServiceFalso.itens.set([ITEM]);
    fixture.detectChanges();
    const botoes: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('.carrinho__quantidade button');
    botoes[1].click();
    expect(cartServiceFalso.atualizarQuantidade).toHaveBeenCalledWith('1', 'M', 'Preto', 3);
  });

  it('chama removerItem ao clicar em "Remover"', () => {
    cartServiceFalso.itens.set([ITEM]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.carrinho__remover').click();
    expect(cartServiceFalso.removerItem).toHaveBeenCalledWith('1', 'M', 'Preto');
  });

  it('navega para o checkout ao clicar em continuar', () => {
    cartServiceFalso.itens.set([ITEM]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('app-button button').click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/loja/checkout');
  });
});
