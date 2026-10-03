import { Component, OnChanges, SimpleChanges, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria, Produto, Variacao } from '../../../../core/products/produto.model';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { Select, OpcaoSelect } from '../../../../shared/ui/select/select';
import { Textarea } from '../../../../shared/ui/textarea/textarea';
import { Button } from '../../../../shared/ui/button/button';
import { CATEGORIAS } from '../../../../core/products/categorias';
import { Icone } from '../../../../shared/ui/icone/icone';

const OPCOES_CATEGORIA: OpcaoSelect[] = CATEGORIAS.map(({ valor, rotulo }) => ({ valor, rotulo }));

/** Sugestões do campo Tamanho (o admin ainda pode digitar qualquer valor). */
const SUGESTOES_TAMANHO = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'U', '34', '36', '38', '40', '42', '44', '46'];

type ProblemaVariacao = 'tamanho' | 'cor' | 'estoque' | 'duplicada';

function chaveVariacao(v: Variacao): string {
  return `${v.tamanho.trim().toLowerCase()}|${v.cor.trim().toLowerCase()}`;
}

/** Problemas de cada variação (por índice), na mesma regra do backend + sem combinações repetidas. */
function problemasDasVariacoes(variacoes: Variacao[]): Map<number, ProblemaVariacao[]> {
  const problemas = new Map<number, ProblemaVariacao[]>();
  const vistas = new Set<string>();
  variacoes.forEach((v, i) => {
    const lista: ProblemaVariacao[] = [];
    if (!v.tamanho.trim()) lista.push('tamanho');
    if (!v.cor.trim()) lista.push('cor');
    if (!Number.isInteger(v.estoque) || v.estoque < 0) lista.push('estoque');
    if (v.tamanho.trim() && v.cor.trim()) {
      const chave = chaveVariacao(v);
      if (vistas.has(chave)) lista.push('duplicada');
      vistas.add(chave);
    }
    if (lista.length > 0) problemas.set(i, lista);
  });
  return problemas;
}

@Component({
  selector: 'app-produto-form',
  imports: [ReactiveFormsModule, TextField, Select, Textarea, Button, Icone],
  templateUrl: './produto-form.html',
  styleUrl: './produto-form.scss',
})
export class ProdutoForm implements OnChanges {
  private readonly fb = inject(FormBuilder);

  readonly produto = input<Produto | null>(null);
  readonly salvando = input(false);
  readonly salvar = output<Omit<Produto, 'id'>>();
  readonly cancelar = output<void>();

  protected readonly categorias = OPCOES_CATEGORIA;
  protected readonly sugestoesTamanho = SUGESTOES_TAMANHO;
  protected readonly variacoes = signal<Variacao[]>([]);
  protected readonly tentouEnviar = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]],
    categoria: ['camisetas' as Categoria, [Validators.required]],
    preco: [0, [Validators.required, Validators.min(0.01)]],
    descricao: ['', [Validators.required]],
    fotosTexto: ['', [Validators.required]],
    destaque: [false],
  });

  protected readonly problemasVariacoes = computed(() =>
    this.tentouEnviar() ? problemasDasVariacoes(this.variacoes()) : new Map<number, ProblemaVariacao[]>(),
  );

  protected readonly erroVariacoes = computed(() => {
    if (!this.tentouEnviar()) return '';
    if (this.variacoes().length === 0) return 'Adicione ao menos uma variação de tamanho/cor.';
    const problemas = [...this.problemasVariacoes().values()].flat();
    if (problemas.some((p) => p === 'tamanho' || p === 'cor')) return 'Preencha tamanho e cor de todas as variações.';
    if (problemas.includes('estoque')) return 'O estoque precisa ser um número inteiro, zero ou maior.';
    if (problemas.includes('duplicada')) return 'Há variações repetidas (mesmo tamanho e cor).';
    return '';
  });

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
        destaque: produto.destaque,
      });
      this.variacoes.set(produto.variacoes.map((v) => ({ ...v })));
    } else {
      this.form.reset({
        nome: '',
        categoria: 'camisetas',
        preco: 0,
        descricao: '',
        fotosTexto: '',
        destaque: false,
      });
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

  protected temProblema(indice: number, campo: ProblemaVariacao): boolean {
    const lista = this.problemasVariacoes().get(indice) ?? [];
    return lista.includes(campo) || (campo !== 'estoque' && lista.includes('duplicada'));
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
    if (this.form.invalid || this.variacoes().length === 0 || problemasDasVariacoes(this.variacoes()).size > 0) {
      this.form.markAllAsTouched();
      return;
    }
    const bruto = this.form.getRawValue();
    const fotos = bruto.fotosTexto
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    const variacoes = this.variacoes().map((v) => ({ ...v, tamanho: v.tamanho.trim(), cor: v.cor.trim() }));
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
      destaque: bruto.destaque,
    });
  }
}
