import { Injectable, signal } from '@angular/core';
import { mockLatency } from '../mock/mock-latency';
import { ItemCarrinho } from '../cart/item-carrinho.model';
import { PEDIDOS_MOCK } from './order-mock-store';
import { Endereco, FormaEntrega, Pedido } from './pedido.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly _ultimoPedido = signal<Pedido | null>(null);
  readonly ultimoPedido = this._ultimoPedido.asReadonly();

  async criar(dados: {
    usuarioId: string;
    itens: ItemCarrinho[];
    formaEntrega: FormaEntrega;
    endereco?: Endereco;
  }): Promise<Pedido> {
    await mockLatency(undefined);
    const valorTotal = dados.itens.reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0);
    const pedido: Pedido = {
      id: String(PEDIDOS_MOCK.length + 1),
      usuarioId: dados.usuarioId,
      itens: dados.itens,
      formaEntrega: dados.formaEntrega,
      endereco: dados.endereco,
      valorTotal,
      status: 'pago',
      criadoEm: new Date().toISOString(),
    };
    PEDIDOS_MOCK.push(pedido);
    this._ultimoPedido.set(pedido);
    return pedido;
  }

  limparUltimoPedido(): void {
    this._ultimoPedido.set(null);
  }

  async listarPorUsuario(usuarioId: string): Promise<Pedido[]> {
    await mockLatency(undefined);
    return PEDIDOS_MOCK.filter((p) => p.usuarioId === usuarioId).sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    );
  }
}
