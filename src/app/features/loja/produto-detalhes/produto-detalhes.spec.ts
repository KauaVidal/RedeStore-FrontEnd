import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ProdutoDetalhes } from './produto-detalhes';
import { ProductService } from '../../../core/products/product.service';
import { CartService } from '../../../core/cart/cart.service';
import { Produto } from '../../../core/products/produto.model';

const PRODUTO: Produto = {
  id: '1',
  nome: 'Camiseta REDE Clássica',
  categoria: 'camisetas',
  preco: 79.9,
  descricao: 'Camiseta 100% algodão.',
  fotos: ['https://picsum.photos/seed/x/480/480'],
  tamanhos: ['P', 'M'],
  cores: ['Preto', 'Amarelo'],
  variacoes: [
    { tamanho: 'P', cor: 'Preto', estoque: 5 },
    { tamanho: 'P', cor: 'Amarelo', estoque: 0 },
    { tamanho: 'M', cor: 'Preto', estoque: 3 },
    { tamanho: 'M', cor: 'Amarelo', estoque: 2 },
  ],
  destaque: false,
};

describe('ProdutoDetalhes', () => {
  let fixture: ComponentFixture<ProdutoDetalhes>;
  let cartServiceFalso: jasmine.SpyObj<Pick<CartService, 'adicionar'>>;

  beforeEach(async () => {
    const productServiceFalso = jasmine.createSpyObj('ProductService', ['buscarPorId']);
    productServiceFalso.buscarPorId.and.resolveTo(PRODUTO);
    cartServiceFalso = jasmine.createSpyObj('CartService', ['adicionar']);

    await TestBed.configureTestingModule({
      imports: [ProdutoDetalhes],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productServiceFalso },
        { provide: CartService, useValue: cartServiceFalso },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProdutoDetalhes);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('mostra os dados do produto', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Camiseta REDE Clássica');
    expect(texto).toContain('79.90');
  });

  it('mostra "Sem estoque" para uma combinação sem estoque', async () => {
    fixture.nativeElement.querySelectorAll('.detalhes__opcao')[0].click(); // P
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.nativeElement.querySelectorAll('.detalhes__opcao')[3].click(); // Amarelo
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Sem estoque nessa combinação.');
  });

  it('adiciona ao carrinho quando tamanho e cor com estoque são selecionados', async () => {
    fixture.nativeElement.querySelectorAll('.detalhes__opcao')[0].click(); // P
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.nativeElement.querySelectorAll('.detalhes__opcao')[2].click(); // Preto
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.nativeElement.querySelector('app-button button').click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(cartServiceFalso.adicionar).toHaveBeenCalledWith({
      produtoId: '1',
      nome: 'Camiseta REDE Clássica',
      precoUnitario: 79.9,
      fotoUrl: 'https://picsum.photos/seed/x/480/480',
      tamanho: 'P',
      cor: 'Preto',
    });
    expect(fixture.nativeElement.textContent).toContain('Adicionado ao carrinho.');
  });
});
