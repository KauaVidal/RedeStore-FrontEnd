import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Produtos } from './produtos';
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
  destaque: true,
  variacoes: [{ tamanho: 'P', cor: 'Preto', estoque: 10 }],
};

describe('Produtos', () => {
  let fixture: ComponentFixture<Produtos>;
  let servicoFalso: jasmine.SpyObj<Pick<ProductService, 'listar' | 'criar' | 'atualizar' | 'remover'>>;

  async function montar(produtos: Produto[]): Promise<void> {
    servicoFalso = jasmine.createSpyObj('ProductService', ['listar', 'criar', 'atualizar', 'remover']);
    servicoFalso.listar.and.resolveTo(produtos);

    await TestBed.configureTestingModule({
      imports: [Produtos],
      providers: [{ provide: ProductService, useValue: servicoFalso }],
    }).compileComponents();

    fixture = TestBed.createComponent(Produtos);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o estado vazio quando não há produtos', async () => {
    await montar([]);
    expect(fixture.nativeElement.textContent).toContain('Nenhum produto cadastrado ainda.');
  });

  it('lista os produtos com nome, preço e estoque total', async () => {
    await montar([PRODUTO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Camiseta REDE Clássica');
    expect(texto).toContain('79,90');
    expect(texto).toContain('10');
  });

  it('abre o modal de criação ao clicar em "Novo produto"', async () => {
    await montar([]);
    const botao = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Novo produto'),
    ) as HTMLButtonElement;
    botao.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal__overlay')).not.toBeNull();
  });

  it('chama ProductService.criar ao salvar o formulário em modo criação', async () => {
    await montar([]);
    servicoFalso.criar.and.resolveTo(PRODUTO);
    servicoFalso.listar.and.resolveTo([PRODUTO]);

    fixture.componentInstance['abrirNovo']();
    fixture.detectChanges();
    await fixture.componentInstance['salvar']({
      nome: PRODUTO.nome,
      categoria: PRODUTO.categoria,
      preco: PRODUTO.preco,
      descricao: PRODUTO.descricao,
      fotos: PRODUTO.fotos,
      tamanhos: PRODUTO.tamanhos,
      cores: PRODUTO.cores,
      variacoes: PRODUTO.variacoes,
      destaque: PRODUTO.destaque,
    });

    expect(servicoFalso.criar).toHaveBeenCalled();
  });

  it('chama ProductService.remover ao confirmar a remoção', async () => {
    await montar([PRODUTO]);
    servicoFalso.remover.and.resolveTo();
    servicoFalso.listar.and.resolveTo([]);

    fixture.componentInstance['pedirRemocao'](PRODUTO);
    await fixture.componentInstance['confirmarRemocao']();

    expect(servicoFalso.remover).toHaveBeenCalledWith('1');
  });

  it('mostra erro de validação do servidor ao salvar', async () => {
    await montar([]);
    servicoFalso.criar.and.rejectWith(new Error('VALIDACAO'));
    fixture.componentInstance['abrirNovo']();
    const { id: _id, ...dados } = PRODUTO;
    await fixture.componentInstance['salvar'](dados);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('validação do servidor');
  });

  it('mantém o modal aberto com o erro quando o servidor recusa o produto', async () => {
    await montar([]);
    servicoFalso.criar.and.rejectWith(new Error('VALIDACAO'));
    fixture.componentInstance['abrirNovo']();
    fixture.detectChanges();
    const { id: _id, ...dados } = PRODUTO;
    await fixture.componentInstance['salvar'](dados);
    fixture.detectChanges();
    const modal: HTMLElement = fixture.nativeElement.querySelector('.modal__caixa');
    expect(modal).not.toBeNull();
    expect(modal.textContent).toContain('validação do servidor');
    expect(modal.querySelector('app-produto-form')).not.toBeNull();
  });

  it('reabrir "Novo produto" traz o formulário vazio, sem o que foi digitado antes', async () => {
    await montar([]);
    fixture.componentInstance['abrirNovo']();
    fixture.detectChanges();
    const nome: HTMLInputElement = fixture.nativeElement.querySelector('.modal__caixa input');
    nome.value = 'Rascunho';
    nome.dispatchEvent(new Event('input'));
    fixture.componentInstance['fecharModal']();
    fixture.detectChanges();

    fixture.componentInstance['abrirNovo']();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('.modal__caixa input') as HTMLInputElement).value).toBe('');
  });

  it('reabrir a edição após cancelar descarta as alterações não salvas', async () => {
    await montar([PRODUTO]);
    fixture.componentInstance['abrirEdicao'](PRODUTO);
    fixture.detectChanges();
    const nome: HTMLInputElement = fixture.nativeElement.querySelector('.modal__caixa input');
    nome.value = 'Alterado';
    nome.dispatchEvent(new Event('input'));
    fixture.componentInstance['fecharModal']();
    fixture.detectChanges();

    fixture.componentInstance['abrirEdicao'](PRODUTO);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('.modal__caixa input') as HTMLInputElement).value).toBe(PRODUTO.nome);
  });
});
