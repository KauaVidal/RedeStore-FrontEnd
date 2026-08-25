import { computed, Injectable, signal } from '@angular/core';
import { ItemCarrinho } from './item-carrinho.model';

const CHAVE_CARRINHO = 'rede_carrinho';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _itens = signal<ItemCarrinho[]>(this.carregar());

  readonly itens = this._itens.asReadonly();
  readonly quantidadeTotal = computed(() => this._itens().reduce((soma, item) => soma + item.quantidade, 0));
  readonly subtotal = computed(() =>
    this._itens().reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0),
  );

  adicionar(item: Omit<ItemCarrinho, 'quantidade'>, quantidade = 1): void {
    const itens = [...this._itens()];
    const indice = itens.findIndex(
      (i) => i.produtoId === item.produtoId && i.tamanho === item.tamanho && i.cor === item.cor,
    );
    const limite = item.estoqueDisponivel ?? Infinity;
    if (indice >= 0) {
      itens[indice] = { ...itens[indice], quantidade: Math.min(itens[indice].quantidade + quantidade, limite) };
    } else {
      itens.push({ ...item, quantidade: Math.min(quantidade, limite) });
    }
    this.salvar(itens);
  }

  atualizarQuantidade(produtoId: string, tamanho: string, cor: string, quantidade: number): void {
    const itens = this._itens()
      .map((i) => {
        if (i.produtoId === produtoId && i.tamanho === tamanho && i.cor === cor) {
          const limite = i.estoqueDisponivel ?? Infinity;
          return { ...i, quantidade: Math.min(quantidade, limite) };
        }
        return i;
      })
      .filter((i) => i.quantidade > 0);
    this.salvar(itens);
  }

  removerItem(produtoId: string, tamanho: string, cor: string): void {
    const itens = this._itens().filter(
      (i) => !(i.produtoId === produtoId && i.tamanho === tamanho && i.cor === cor),
    );
    this.salvar(itens);
  }

  limpar(): void {
    this.salvar([]);
  }

  private salvar(itens: ItemCarrinho[]): void {
    this._itens.set(itens);
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
  }

  private carregar(): ItemCarrinho[] {
    const bruto = localStorage.getItem(CHAVE_CARRINHO);
    if (!bruto) return [];
    try {
      return JSON.parse(bruto) as ItemCarrinho[];
    } catch {
      return [];
    }
  }
}
