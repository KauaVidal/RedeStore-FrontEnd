import { ItemCarrinho } from '../cart/item-carrinho.model';

export type StatusPedido = 'pago' | 'em_preparo' | 'retirado' | 'entregue';
export type FormaEntrega = 'retirada' | 'entrega';

export interface Endereco {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  cep: string;
}

export interface Pedido {
  id: string;
  usuarioId: string;
  itens: ItemCarrinho[];
  formaEntrega: FormaEntrega;
  endereco?: Endereco;
  valorTotal: number;
  status: StatusPedido;
  criadoEm: string;
}
