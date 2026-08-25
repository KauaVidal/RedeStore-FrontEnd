import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { ProductService } from '../../../core/products/product.service';
import { Produto } from '../../../core/products/produto.model';

const DESTAQUE: Produto = {
  id: '1',
  nome: 'Camiseta REDE Clássica',
  categoria: 'camisetas',
  preco: 79.9,
  descricao: 'Camiseta 100% algodão.',
  fotos: ['https://picsum.photos/seed/x/480/480'],
  tamanhos: ['P'],
  cores: ['Preto'],
  variacoes: [{ tamanho: 'P', cor: 'Preto', estoque: 5 }],
  destaque: true,
};

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let productServiceFalso: jasmine.SpyObj<Pick<ProductService, 'listarDestaques'>>;

  beforeEach(async () => {
    productServiceFalso = jasmine.createSpyObj('ProductService', ['listarDestaques']);
    productServiceFalso.listarDestaques.and.resolveTo([DESTAQUE]);

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), { provide: ProductService, useValue: productServiceFalso }],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('mostra o título "Destaques"', () => {
    expect(fixture.nativeElement.textContent).toContain('Destaques');
  });

  it('mostra um card para cada produto em destaque', () => {
    expect(fixture.nativeElement.querySelectorAll('app-product-card').length).toBe(1);
  });

  it('mostra um link para a agenda de eventos', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.home__link-eventos');
    expect(link.getAttribute('href')).toBe('/eventos');
  });
});
