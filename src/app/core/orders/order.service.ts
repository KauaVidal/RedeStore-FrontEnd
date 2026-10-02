import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API, requisitar } from '../api/api';
import { ItemCarrinho } from '../cart/item-carrinho.model';
import { Endereco, FormaEntrega, Pedido } from './pedido.model';

export interface DadosPedido {
  itens: ItemCarrinho[];
  formaEntrega: FormaEntrega;
  endereco?: Endereco;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  private readonly _ultimoPedido = signal<Pedido | null>(null);
  readonly ultimoPedido = this._ultimoPedido.asReadonly();

  /** O preço é sempre o do servidor: o cliente só diz o quê e quanto. */
  async criar(dados: DadosPedido): Promise<Pedido> {
    const corpo = {
      itens: dados.itens.map(({ produtoId, tamanho, cor, quantidade }) => ({ produtoId, tamanho, cor, quantidade })),
      formaEntrega: dados.formaEntrega,
      ...(dados.formaEntrega === 'entrega' && dados.endereco ? { endereco: dados.endereco } : {}),
    };
    const pedido = await requisitar(this.http.post<Pedido>(`${API}/pedidos`, corpo));
    this._ultimoPedido.set(pedido);
    return pedido;
  }

  limparUltimoPedido(): void {
    this._ultimoPedido.set(null);
  }

  async listarMeus(): Promise<Pedido[]> {
    return requisitar(this.http.get<Pedido[]>(`${API}/usuarios/me/pedidos`));
  }

  async listarTodos(): Promise<Pedido[]> {
    return requisitar(this.http.get<Pedido[]>(`${API}/pedidos`));
  }

  /** O próximo status é calculado pelo servidor (pago → em_preparo → retirado/entregue). */
  async avancarStatus(id: string): Promise<Pedido> {
    return requisitar(this.http.patch<Pedido>(`${API}/pedidos/${id}/avancar-status`, null));
  }
}
