import { Component, OnChanges, SimpleChanges, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria, Produto, Variacao } from '../../../../core/products/produto.model';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { Select, OpcaoSelect } from '../../../../shared/ui/select/select';
import { Textarea } from '../../../../shared/ui/textarea/textarea';
import { Button } from '../../../../shared/ui/button/button';

const CATEGORIAS: OpcaoSelect[] = [
  { valor: 'camisetas', rotulo: 'Camisetas' },
  { valor: 'moletons', rotulo: 'Moletons' },
  { valor: 'acessorios', rotulo: 'Acessórios' },
];

@Component({
  selector: 'app-produto-form',
  imports: [ReactiveFormsModule, TextField, Select, Textarea, Button],
  templateUrl: './produto-form.html',
  styleUrl: './produto-form.scss',
})
export class ProdutoForm implements OnChanges {
  private readonly fb = inject(FormBuilder);

  readonly produto = input<Produto | null>(null);
  readonly salvar = output<Omit<Produto, 'id'>>();
  readonly cancelar = output<void>();

  protected readonly categorias = CATEGORIAS;
  protected readonly variacoes = signal<Variacao[]>([]);
  protected readonly tentouEnviar = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]],
    categoria: ['camisetas' as Categoria, [Validators.required]],
    preco: [0, [Validators.required, Validators.min(0.01)]],
    descricao: ['', [Validators.required]],
    fotosTexto: ['', [Validators.required]],
  });

  protected readonly erroVariacoes = computed(() =>
    this.tentouEnviar() && this.variacoes().length === 0
      ? 'Adicione ao menos uma variação de tamanho/cor.'
      : '',
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['produto']) return;
    const produto = this.produto();
    if (produto) {
      this.form.patchValue({
        nome: produto.nome,
        categoria: produto.categoria,
        preco: produto.preco,
        descricao: produto.descricao,
        fotosTexto: produto.fotos.join(', '),
      });
      this.variacoes.set(produto.variacoes.map((v) => ({ ...v })));
    } else {
      this.form.reset({ nome: '', categoria: 'camisetas', preco: 0, descricao: '', fotosTexto: '' });
      this.variacoes.set([]);
    }
  }

  protected get erroNome(): string {
    const c = this.form.controls.nome;
    return c.touched && c.invalid ? 'Informe o nome do produto.' : '';
  }

  protected get erroPreco(): string {
    const c = this.form.controls.preco;
    if (c.touched && c.hasError('required')) return 'Informe o preço.';
    if (c.touched && c.hasError('min')) return 'O preço precisa ser maior que zero.';
    return '';
  }

  protected get erroDescricao(): string {
    const c = this.form.controls.descricao;
    return c.touched && c.invalid ? 'Informe a descrição.' : '';
  }

  protected get erroFotos(): string {
    const c = this.form.controls.fotosTexto;
    return c.touched && c.invalid ? 'Informe ao menos uma URL de foto.' : '';
  }

  protected adicionarVariacao(): void {
    this.variacoes.update((lista) => [...lista, { tamanho: '', cor: '', estoque: 0 }]);
  }

  protected removerVariacao(indice: number): void {
    this.variacoes.update((lista) => lista.filter((_, i) => i !== indice));
  }

  protected atualizarVariacao(indice: number, campo: keyof Variacao, valor: string): void {
    this.variacoes.update((lista) =>
      lista.map((item, i) => (i === indice ? { ...item, [campo]: campo === 'estoque' ? Number(valor) : valor } : item)),
    );
  }

  protected aoEnviar(): void {
    this.tentouEnviar.set(true);
    if (this.form.invalid || this.variacoes().length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const bruto = this.form.getRawValue();
    const fotos = bruto.fotosTexto
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    const variacoes = this.variacoes();
    const tamanhos = [...new Set(variacoes.map((v) => v.tamanho))];
    const cores = [...new Set(variacoes.map((v) => v.cor))];
    this.salvar.emit({
      nome: bruto.nome,
      categoria: bruto.categoria,
      preco: Number(bruto.preco),
      descricao: bruto.descricao,
      fotos,
      tamanhos,
      cores,
      variacoes,
      destaque: this.produto()?.destaque ?? false,
    });
  }
}
