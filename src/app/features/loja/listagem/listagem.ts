import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../core/products/product.service';
import { Categoria, Produto } from '../../../core/products/produto.model';
import { ProductCard } from '../../../shared/ui/product-card/product-card';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { tomDaCor } from '../../../shared/ui/product-card/cores';

interface CategoriaExibicao {
  valor: Categoria;
  rotulo: string;
}

type Disponibilidade = 'disponivel' | 'esgotado';
type SecaoFiltro = 'disponibilidade' | 'cores' | 'preco';

const CATEGORIAS: CategoriaExibicao[] = [
  { valor: 'camisetas', rotulo: 'Camisetas' },
  { valor: 'moletons', rotulo: 'Moletons' },
  { valor: 'acessorios', rotulo: 'Acessórios' },
];

/** Ordem natural das grades; tamanhos fora da lista vão para o fim. */
const ORDEM_TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG', 'U'];

function posicaoTamanho(tamanho: string): number {
  const i = ORDEM_TAMANHOS.indexOf(tamanho.toUpperCase());
  return i === -1 ? ORDEM_TAMANHOS.length : i;
}

function emEstoque(produto: Produto): boolean {
  return produto.variacoes.some((v) => v.estoque > 0);
}

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

function precoOuNulo(texto: string): number | null {
  if (texto.trim() === '') return null;
  const valor = Number(texto.replace(',', '.'));
  return Number.isFinite(valor) ? valor : null;
}

@Component({
  selector: 'app-listagem',
  imports: [ReactiveFormsModule, RouterLink, ProductCard, EmptyState],
  templateUrl: './listagem.html',
  styleUrl: './listagem.scss',
})
export class Listagem implements OnInit {
  private readonly produtos = inject(ProductService);
  private readonly rota = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly categorias = CATEGORIAS;
  protected readonly tomDaCor = tomDaCor;

  protected readonly form = this.fb.nonNullable.group({ busca: [''] });
  protected readonly faixaPreco = this.fb.nonNullable.group({ minimo: [''], maximo: [''] });

  protected readonly categoria = signal<Categoria | undefined>(undefined);
  protected readonly resultado = signal<Produto[]>([]);
  protected readonly carregando = signal(true);
  protected readonly somenteDestaques = signal(false);
  protected readonly tamanhos = signal<string[]>([]);
  protected readonly cores = signal<string[]>([]);
  protected readonly disponibilidade = signal<Disponibilidade[]>([]);
  protected readonly precoMinimo = signal<number | null>(null);
  protected readonly precoMaximo = signal<number | null>(null);
  protected readonly secoesAbertas = signal<SecaoFiltro[]>(['disponibilidade']);
  protected readonly filtrosAbertos = signal(false);

  protected readonly tamanhosDisponiveis = computed(() =>
    [...new Set(this.resultado().flatMap((p) => p.tamanhos))].sort(
      (a, b) => posicaoTamanho(a) - posicaoTamanho(b) || a.localeCompare(b, 'pt-BR'),
    ),
  );
  protected readonly coresDisponiveis = computed(() =>
    [...new Set(this.resultado().flatMap((p) => p.cores))].sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    ),
  );
  protected readonly totalDisponiveis = computed(() => this.resultado().filter(emEstoque).length);
  protected readonly totalEsgotados = computed(
    () => this.resultado().length - this.totalDisponiveis(),
  );

  protected readonly filtrados = computed(() => {
    const tamanhos = this.tamanhos();
    const cores = this.cores();
    const disponibilidade = this.disponibilidade();
    const minimo = this.precoMinimo();
    const maximo = this.precoMaximo();

    return this.resultado().filter(
      (p) =>
        (!this.somenteDestaques() || p.destaque) &&
        (tamanhos.length === 0 || p.tamanhos.some((t) => tamanhos.includes(t))) &&
        (cores.length === 0 || p.cores.some((c) => cores.includes(c))) &&
        (disponibilidade.length === 0 ||
          disponibilidade.includes(emEstoque(p) ? 'disponivel' : 'esgotado')) &&
        (minimo === null || p.preco >= minimo) &&
        (maximo === null || p.preco <= maximo),
    );
  });

  protected readonly quantidadeFiltros = computed(
    () =>
      this.tamanhos().length +
      this.cores().length +
      this.disponibilidade().length +
      (this.precoMinimo() !== null ? 1 : 0) +
      (this.precoMaximo() !== null ? 1 : 0),
  );

  async ngOnInit(): Promise<void> {
    const params = this.rota.snapshot.queryParamMap;
    this.categoria.set((params.get('categoria') as Categoria | null) ?? undefined);
    this.form.controls.busca.setValue(params.get('busca') ?? '');
    await this.pesquisar();
  }

  protected async pesquisar(): Promise<void> {
    const busca = this.form.getRawValue().busca;
    this.carregando.set(true);
    try {
      this.resultado.set(
        await this.produtos.listar({ categoria: this.categoria(), busca: busca || undefined }),
      );
    } finally {
      this.carregando.set(false);
    }
  }

  protected async selecionarCategoria(categoria: Categoria | undefined): Promise<void> {
    this.somenteDestaques.set(false);
    if (categoria === this.categoria()) return;
    this.categoria.set(categoria);
    await this.pesquisar();
  }

  protected alternarDestaques(): void {
    this.somenteDestaques.update((ativo) => !ativo);
  }

  protected alternarTamanho(tamanho: string): void {
    this.tamanhos.update((lista) => alternar(lista, tamanho));
  }

  protected alternarCor(cor: string): void {
    this.cores.update((lista) => alternar(lista, cor));
  }

  protected alternarDisponibilidade(valor: Disponibilidade): void {
    this.disponibilidade.update((lista) => alternar(lista, valor));
  }

  protected alternarSecao(secao: SecaoFiltro): void {
    this.secoesAbertas.update((lista) => alternar(lista, secao));
  }

  protected aplicarPreco(): void {
    const { minimo, maximo } = this.faixaPreco.getRawValue();
    this.precoMinimo.set(precoOuNulo(minimo));
    this.precoMaximo.set(precoOuNulo(maximo));
  }

  protected limparFiltros(): void {
    this.tamanhos.set([]);
    this.cores.set([]);
    this.disponibilidade.set([]);
    this.faixaPreco.setValue({ minimo: '', maximo: '' });
    this.precoMinimo.set(null);
    this.precoMaximo.set(null);
  }
}
