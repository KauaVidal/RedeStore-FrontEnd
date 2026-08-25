import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/products/product.service';
import { CartService } from '../../../core/cart/cart.service';
import { Produto } from '../../../core/products/produto.model';
import { Button } from '../../../shared/ui/button/button';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';

@Component({
  selector: 'app-produto-detalhes',
  imports: [Button, PrecoBrPipe],
  templateUrl: './produto-detalhes.html',
  styleUrl: './produto-detalhes.scss',
})
export class ProdutoDetalhes implements OnInit {
  private readonly produtos = inject(ProductService);
  private readonly carrinho = inject(CartService);
  private readonly rota = inject(ActivatedRoute);

  protected readonly produto = signal<Produto | null>(null);
  protected readonly tamanhoSelecionado = signal<string | null>(null);
  protected readonly corSelecionada = signal<string | null>(null);
  protected readonly adicionado = signal(false);
  protected readonly estoqueMaximoAtingido = signal(false);

  protected readonly variacaoAtual = computed(() => {
    const produto = this.produto();
    const tamanho = this.tamanhoSelecionado();
    const cor = this.corSelecionada();
    if (!produto || !tamanho || !cor) return null;
    return produto.variacoes.find((v) => v.tamanho === tamanho && v.cor === cor) ?? null;
  });

  protected readonly semEstoque = computed(() => this.variacaoAtual()?.estoque === 0);
  protected readonly podeAdicionar = computed(() => this.variacaoAtual() !== null && !this.semEstoque());

  async ngOnInit(): Promise<void> {
    const id = this.rota.snapshot.paramMap.get('id')!;
    this.produto.set((await this.produtos.buscarPorId(id)) ?? null);
  }

  protected selecionarTamanho(tamanho: string): void {
    this.tamanhoSelecionado.set(tamanho);
    this.adicionado.set(false);
    this.estoqueMaximoAtingido.set(false);
  }

  protected selecionarCor(cor: string): void {
    this.corSelecionada.set(cor);
    this.adicionado.set(false);
    this.estoqueMaximoAtingido.set(false);
  }

  protected adicionarAoCarrinho(): void {
    const produto = this.produto();
    const tamanho = this.tamanhoSelecionado();
    const cor = this.corSelecionada();
    const variacao = this.variacaoAtual();
    if (!produto || !tamanho || !cor || !variacao || !this.podeAdicionar()) return;

    const quantidadeNoCarrinho =
      this.carrinho.itens().find((i) => i.produtoId === produto.id && i.tamanho === tamanho && i.cor === cor)
        ?.quantidade ?? 0;

    if (quantidadeNoCarrinho >= variacao.estoque) {
      this.estoqueMaximoAtingido.set(true);
      this.adicionado.set(false);
      return;
    }

    this.carrinho.adicionar({
      produtoId: produto.id,
      nome: produto.nome,
      precoUnitario: produto.preco,
      fotoUrl: produto.fotos[0],
      tamanho,
      cor,
      estoqueDisponivel: variacao.estoque,
    });
    this.estoqueMaximoAtingido.set(false);
    this.adicionado.set(true);
  }
}
