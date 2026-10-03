import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ProdutoDetalhes } from './produto-detalhes';
import { ProductService } from '../../../core/products/product.service';
import { CartService } from '../../../core/cart/cart.service';
import { Produto } from '../../../core/products/produto.model';
import { ItemCarrinho } from '../../../core/cart/item-carrinho.model';

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
  let cartServiceFalso: Pick<jasmine.SpyObj<CartService>, 'adicionar'> & Pick<CartService, 'itens'>;

  async function montar(itensIniciais: ItemCarrinho[] = [], produto: Produto = PRODUTO): Promise<void> {
    TestBed.resetTestingModule();
    const productServiceFalso = jasmine.createSpyObj('ProductService', ['buscarPorId']);
    productServiceFalso.buscarPorId.and.resolveTo(produto);
    cartServiceFalso = {
      adicionar: jasmine.createSpy('adicionar'),
      itens: signal(itensIniciais),
    };

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
  }

  beforeEach(async () => {
    await montar();
  });

  it('mostra os dados do produto', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Camiseta REDE Clássica');
    expect(texto).toContain('79,90');
  });

  it('mostra "Sem estoque" para uma combinação sem estoque', async () => {
    fixture.nativeElement.querySelectorAll('.detalhes__tamanho')[0].click(); // P
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.nativeElement.querySelectorAll('.detalhes__cor')[1].click(); // Amarelo
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Sem estoque nessa combinação.');
  });

  it('adiciona ao carrinho quando tamanho e cor com estoque são selecionados', async () => {
    fixture.nativeElement.querySelectorAll('.detalhes__tamanho')[0].click(); // P
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.nativeElement.querySelectorAll('.detalhes__cor')[0].click(); // Preto
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
      estoqueDisponivel: 5,
    });
    expect(fixture.nativeElement.textContent).toContain('Adicionado ao carrinho.');
  });

  it('mostra mensagem quando o carrinho já tem a quantidade máxima da variação', async () => {
    await montar([
      {
        produtoId: '1',
        nome: 'Camiseta REDE Clássica',
        precoUnitario: 79.9,
        fotoUrl: 'https://picsum.photos/seed/x/480/480',
        tamanho: 'P',
        cor: 'Preto',
        quantidade: 5,
        estoqueDisponivel: 5,
      },
    ]);

    fixture.nativeElement.querySelectorAll('.detalhes__tamanho')[0].click(); // P
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.nativeElement.querySelectorAll('.detalhes__cor')[0].click(); // Preto
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.nativeElement.querySelector('app-button button').click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(cartServiceFalso.adicionar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Você já tem a quantidade máxima em estoque no carrinho.',
    );
  });

  it('mostra as cores como amostras com o nome acessível e a cor escolhida no rótulo', () => {
    const cores: HTMLButtonElement[] = [...fixture.nativeElement.querySelectorAll('.detalhes__cor')];
    expect(cores.map((c) => c.getAttribute('aria-label'))).toEqual(['Preto', 'Amarelo']);
    cores[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.detalhes__valor-opcao').textContent).toContain('Amarelo');
  });

  it('esmaece a cor sem estoque no tamanho escolhido', () => {
    fixture.nativeElement.querySelectorAll('.detalhes__tamanho')[0].click(); // P
    fixture.detectChanges();
    const cores: HTMLElement[] = [...fixture.nativeElement.querySelectorAll('.detalhes__cor')];
    expect(cores[0].classList).not.toContain('detalhes__opcao--indisponivel'); // Preto P: 5
    expect(cores[1].classList).toContain('detalhes__opcao--indisponivel'); // Amarelo P: 0
  });

  it('com várias fotos, as miniaturas trocam a foto principal', async () => {
    await montar([], { ...PRODUTO, fotos: ['https://exemplo.com/a.jpg', 'https://exemplo.com/b.jpg'] });
    const miniaturas: HTMLButtonElement[] = [...fixture.nativeElement.querySelectorAll('.detalhes__miniatura')];
    expect(miniaturas.length).toBe(2);
    miniaturas[1].click();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('.detalhes__foto') as HTMLImageElement).src).toContain('b.jpg');
    expect(miniaturas[1].classList).toContain('detalhes__miniatura--ativa');
  });

  it('com uma foto só, não mostra miniaturas', () => {
    expect(fixture.nativeElement.querySelector('.detalhes__miniatura')).toBeNull();
  });

  it('com tamanho e cor únicos, já vem selecionado e pronto para adicionar', async () => {
    await montar([], {
      ...PRODUTO,
      tamanhos: ['U'],
      cores: ['Preto'],
      variacoes: [{ tamanho: 'U', cor: 'Preto', estoque: 4 }],
    });
    fixture.nativeElement.querySelector('app-button button').click();
    fixture.detectChanges();
    expect(cartServiceFalso.adicionar).toHaveBeenCalledWith(jasmine.objectContaining({ tamanho: 'U', cor: 'Preto' }));
  });

  it('avisa quando o produto está esgotado em todas as variações', async () => {
    await montar([], { ...PRODUTO, variacoes: PRODUTO.variacoes.map((v) => ({ ...v, estoque: 0 })) });
    expect(fixture.nativeElement.querySelector('.detalhes__nota').textContent).toContain('Esgotado');
  });

  it('mostra a trilha com a categoria do produto', () => {
    const trilha: HTMLElement = fixture.nativeElement.querySelector('.detalhes__trilha');
    expect(trilha.textContent).toContain('Camisetas');
    expect(trilha.textContent).toContain('Camiseta REDE Clássica');
  });
});
