import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { OrderService } from '../../../core/orders/order.service';
import { Pedido, StatusPedido } from '../../../core/orders/pedido.model';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

const ROTULO_STATUS: Record<StatusPedido, string> = {
  pago: 'Pago',
  em_preparo: 'Em preparo',
  retirado: 'Retirado',
  entregue: 'Entregue',
};

@Component({
  selector: 'app-meus-pedidos',
  imports: [EmptyState],
  templateUrl: './meus-pedidos.html',
  styleUrl: './meus-pedidos.scss',
})
export class MeusPedidos implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly pedidosService = inject(OrderService);

  protected readonly lista = signal<Pedido[]>([]);
  protected readonly rotuloStatus = ROTULO_STATUS;

  async ngOnInit(): Promise<void> {
    const usuario = this.auth.usuarioAtual();
    if (!usuario) return;
    this.lista.set(await this.pedidosService.listarPorUsuario(usuario.id));
  }
}
