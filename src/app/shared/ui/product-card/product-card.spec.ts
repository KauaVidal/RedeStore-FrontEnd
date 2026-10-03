import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductCard } from './product-card';
import { Produto } from '../../../core/products/produto.model';

const PRODUTO: Produto = {
  id: '1',
  nome: 'Camiseta REDE Clássica',
  categoria: 'camisetas',
  preco: 79.9,
  descricao: 'Camiseta 100% algodão.',
  fotos: ['https://picsum.photos/seed/x/480/480'],
  tamanhos: ['P', 'M'],
  cores: ['Preto'],
  variacoes: [{ tamanho: 'P', cor: 'Preto', estoque: 5 }],
  destaque: true,
};

describe('ProductCard', () => {
  let fixture: ComponentFixture<ProductCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('produto', PRODUTO);
    fixture.detectChanges();
  });

  it('mostra o nome e o preço do produto', () => {
    expect(fixture.nativeElement.textContent).toContain('Camiseta REDE Clássica');
    expect(fixture.nativeElement.textContent).toContain('79,90');
  });

  it('linka para a página de detalhes do produto', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/loja/produtos/1');
  });

  it('usa a primeira foto do produto como imagem', () => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toContain('picsum.photos/seed/x/480/480');
  });

  it('na variante catálogo mostra categoria, amostra de cor e cores extras', () => {
    fixture.componentRef.setInput('produto', { ...PRODUTO, cores: ['Preto', 'Branco', 'Azul'] });
    fixture.componentRef.setInput('variante', 'catalogo');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.cartao-catalogo')).not.toBeNull();
    expect(el.textContent).toContain('Camiseta');
    expect(el.querySelector('.cartao-catalogo__amostra')?.getAttribute('title')).toBe('Preto');
    expect(el.textContent).toContain('+2');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/loja/produtos/1');
  });
});
