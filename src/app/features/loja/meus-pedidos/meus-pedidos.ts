import { Component, OnInit, inject, signal } from '@angular/core';
import { OrderService } from '../../../core/orders/order.service';
import { Pedido, StatusPedido } from '../../../core/orders/pedido.model';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';
import { CodigoPedidoPipe } from '../../../shared/pipes/codigo-pedido.pipe';

const ROTULO_STATUS: Record<StatusPedido, string> = {
  pago: 'Pago',
  em_preparo: 'Em preparo',
  retirado: 'Retirado',
  entregue: 'Entregue',
};

@Component({
  selector: 'app-meus-pedidos',
  imports: [EmptyState, PrecoBrPipe, CodigoPedidoPipe],
  templateUrl: './meus-pedidos.html',
  styleUrl: './meus-pedidos.scss',
})
export class MeusPedidos implements OnInit {
  private readonly pedidosService = inject(OrderService);

  protected readonly lista = signal<Pedido[]>([]);
  protected readonly rotuloStatus = ROTULO_STATUS;

  async ngOnInit(): Promise<void> {
    this.lista.set(await this.pedidosService.listarMeus());
  }
}
