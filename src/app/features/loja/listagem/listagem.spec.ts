import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Listagem } from './listagem';
import { ProductService } from '../../../core/products/product.service';
import { Produto } from '../../../core/products/produto.model';

const PRODUTO: Produto = {
  id: '1',
  nome: 'Camiseta REDE Clássica',
  categoria: 'camisetas',
  preco: 79.9,
  descricao: 'Camiseta 100% algodão.',
  fotos: ['https://picsum.photos/seed/x/480/480'],
  tamanhos: ['P'],
  cores: ['Preto'],
  variacoes: [{ tamanho: 'P', cor: 'Preto', estoque: 5 }],
  destaque: false,
};

describe('Listagem', () => {
  let fixture: ComponentFixture<Listagem>;
  let productServiceFalso: jasmine.SpyObj<Pick<ProductService, 'listar'>>;

  async function montar(queryParams: Record<string, string>): Promise<void> {
    productServiceFalso = jasmine.createSpyObj('ProductService', ['listar']);
    productServiceFalso.listar.and.resolveTo([PRODUTO]);

    await TestBed.configureTestingModule({
      imports: [Listagem],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productServiceFalso },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Listagem);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('busca produtos pela categoria informada na URL', async () => {
    await montar({ categoria: 'camisetas' });
    expect(productServiceFalso.listar).toHaveBeenCalledWith({ categoria: 'camisetas', busca: undefined });
  });

  it('mostra os produtos encontrados', async () => {
    await montar({});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-product-card').length).toBe(1);
  });

  it('mostra o estado vazio quando não encontra nada', async () => {
    await montar({});
    productServiceFalso.listar.and.resolveTo([]);
    fixture.componentInstance['form'].controls.busca.setValue('produto inexistente');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum produto encontrado.');
  });
});
