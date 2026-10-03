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
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Listagem);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('carrega o catálogo inteiro e aplica a categoria informada na URL', async () => {
    await montar({ categoria: 'camisetas', busca: 'rede' });
    expect(productServiceFalso.listar).toHaveBeenCalledWith({ busca: 'rede' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Camisetas');
    expect(fixture.nativeElement.querySelectorAll('app-product-card').length).toBe(1);
  });

  it('ignora categoria desconhecida na URL', async () => {
    await montar({ categoria: 'inexistente' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Produtos');
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

  describe('filtros', () => {
    const MOLETOM: Produto = {
      ...PRODUTO,
      id: '2',
      nome: 'Moletom REDE',
      categoria: 'moletons',
      preco: 199.9,
      tamanhos: ['G'],
      cores: ['Azul'],
      variacoes: [{ tamanho: 'G', cor: 'Azul', estoque: 0 }],
      destaque: true,
    };

    beforeEach(async () => {
      await montar({});
      productServiceFalso.listar.and.resolveTo([PRODUTO, MOLETOM]);
      await fixture.componentInstance['pesquisar']();
      fixture.detectChanges();
    });

    function nomesVisiveis(): string[] {
      return [...fixture.nativeElement.querySelectorAll('app-product-card')].map(
        (c: HTMLElement) => (c.textContent!.includes('Moletom') ? 'moletom' : 'camiseta'),
      );
    }

    function clicar(seletor: string, texto: string): void {
      const botao = [...fixture.nativeElement.querySelectorAll(seletor)].find((b: HTMLElement) =>
        b.textContent!.trim().startsWith(texto),
      ) as HTMLElement;
      botao.click();
      fixture.detectChanges();
    }

    it('lista os tamanhos dos produtos e filtra pelo tamanho escolhido', () => {
      const tamanhos = [...fixture.nativeElement.querySelectorAll('.filtros__tamanho')].map(
        (b: HTMLElement) => b.textContent!.trim(),
      );
      expect(tamanhos).toEqual(['P', 'G']);
      clicar('.filtros__tamanho', 'G');
      expect(nomesVisiveis()).toEqual(['moletom']);
    });

    it('conta e filtra por disponibilidade', () => {
      expect(fixture.nativeElement.textContent).toContain('Disponível (1)');
      expect(fixture.nativeElement.textContent).toContain('Esgotado (1)');
      const rotulo = [...fixture.nativeElement.querySelectorAll('.filtros__opcao')].find(
        (l: HTMLElement) => l.textContent!.includes('Disponível'),
      ) as HTMLElement;
      rotulo.querySelector('input')!.click();
      fixture.detectChanges();
      expect(nomesVisiveis()).toEqual(['camiseta']);
    });

    it('filtra pela faixa de preço', () => {
      fixture.componentInstance['alternarSecao']('preco');
      fixture.componentInstance['faixaPreco'].setValue({ minimo: '100', maximo: '' });
      fixture.componentInstance['aplicarPreco']();
      fixture.detectChanges();
      expect(nomesVisiveis()).toEqual(['moletom']);
    });

    it('a etiqueta Destaques mostra só os produtos em destaque', () => {
      clicar('.listagem__etiqueta', 'Destaques');
      expect(nomesVisiveis()).toEqual(['moletom']);
    });

    it('a etiqueta de categoria filtra o catálogo sem nova busca', () => {
      const chamadas = productServiceFalso.listar.calls.count();
      clicar('.listagem__etiqueta', 'Moletons');
      expect(nomesVisiveis()).toEqual(['moletom']);
      expect(productServiceFalso.listar.calls.count()).toBe(chamadas);
    });

    it('a seção Categoria lista todas as categorias com a contagem de produtos', () => {
      const opcoes = [
        ...fixture.nativeElement.querySelectorAll('[role="radiogroup"] .filtros__opcao'),
      ].map((l: HTMLElement) => l.textContent!.replace(/\s+/g, ' ').trim());
      expect(opcoes.length).toBe(13);
      expect(opcoes).toContain('Todas (2)');
      expect(opcoes).toContain('Camisetas (1)');
      expect(opcoes).toContain('Moletons (1)');
      expect(opcoes).toContain('Calças (0)');
      expect(opcoes).toContain('Vestidos (0)');
    });

    it('escolher uma categoria nos filtros mostra só os produtos dela e atualiza o título', () => {
      const rotulo = [
        ...fixture.nativeElement.querySelectorAll('[role="radiogroup"] .filtros__opcao'),
      ].find((l: HTMLElement) => l.textContent!.includes('Moletons')) as HTMLElement;
      rotulo.querySelector('input')!.click();
      fixture.detectChanges();
      expect(nomesVisiveis()).toEqual(['moletom']);
      expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Moletons');
    });

    it('limpar remove todos os filtros', () => {
      clicar('.filtros__tamanho', 'G');
      clicar('.filtros__limpar', 'Limpar');
      expect(nomesVisiveis().length).toBe(2);
    });
  });
});
