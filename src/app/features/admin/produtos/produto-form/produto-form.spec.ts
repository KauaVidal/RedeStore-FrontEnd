import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProdutoForm } from './produto-form';
import { Produto } from '../../../../core/products/produto.model';

const PRODUTO: Produto = {
  id: '1',
  nome: 'Camiseta REDE Clássica',
  categoria: 'camisetas',
  preco: 79.9,
  descricao: 'Camiseta 100% algodão.',
  fotos: ['https://picsum.photos/seed/x/480/480'],
  tamanhos: ['P', 'M'],
  cores: ['Preto'],
  destaque: true,
  variacoes: [{ tamanho: 'P', cor: 'Preto', estoque: 10 }],
};

describe('ProdutoForm', () => {
  let fixture: ComponentFixture<ProdutoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProdutoForm] }).compileComponents();
    fixture = TestBed.createComponent(ProdutoForm);
    fixture.detectChanges();
  });

  it('em modo criação, não emite salvar se o formulário estiver inválido', () => {
    let emitiu = false;
    fixture.componentInstance.salvar.subscribe(() => (emitiu = true));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(emitiu).toBeFalse();
  });

  it('em modo edição, pré-preenche o formulário com os dados do produto', () => {
    fixture.componentRef.setInput('produto', PRODUTO);
    fixture.detectChanges();
    // Checa o valor do FormControl, não o textContent: um <textarea> só reflete
    // no textContent o markup estático inicial, não o valor definido via
    // [formControl] (isso é feito via propriedade DOM `value`, não innerHTML).
    expect(fixture.componentInstance['form'].controls.nome.value).toBe('Camiseta REDE Clássica');
    expect(fixture.componentInstance['form'].controls.descricao.value).toBe('Camiseta 100% algodão.');
  });

  it('emite salvar com os dados preenchidos, incluindo ao menos uma variação', () => {
    fixture.componentInstance['form'].setValue({
      nome: 'Camiseta Nova',
      categoria: 'camisetas',
      preco: 99.9,
      descricao: 'Descrição nova',
      fotosTexto: 'https://picsum.photos/seed/a/480/480, https://picsum.photos/seed/b/480/480',
    });
    fixture.componentInstance['adicionarVariacao']();
    fixture.componentInstance['atualizarVariacao'](0, 'tamanho', 'M');
    fixture.componentInstance['atualizarVariacao'](0, 'cor', 'Preto');
    fixture.componentInstance['atualizarVariacao'](0, 'estoque', '5');
    fixture.detectChanges();

    let emitido: Omit<Produto, 'id'> | undefined;
    fixture.componentInstance.salvar.subscribe((dados) => (emitido = dados));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(emitido?.nome).toBe('Camiseta Nova');
    expect(emitido?.fotos.length).toBe(2);
    expect(emitido?.variacoes).toEqual([{ tamanho: 'M', cor: 'Preto', estoque: 5 }]);
  });

  it('não emite salvar quando não há nenhuma variação', () => {
    fixture.componentInstance['form'].setValue({
      nome: 'Camiseta Nova',
      categoria: 'camisetas',
      preco: 99.9,
      descricao: 'Descrição nova',
      fotosTexto: 'https://picsum.photos/seed/a/480/480',
    });
    fixture.detectChanges();

    let emitiu = false;
    fixture.componentInstance.salvar.subscribe(() => (emitiu = true));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(emitiu).toBeFalse();
  });

  it('emite cancelar ao clicar em Cancelar', () => {
    let emitiu = false;
    fixture.componentInstance.cancelar.subscribe(() => (emitiu = true));
    const botoes: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    const cancelar = Array.from(botoes).find((b) => b.textContent?.includes('Cancelar'));
    cancelar?.click();
    expect(emitiu).toBeTrue();
  });
});
