import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/orders/order.service';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';
import { CodigoPedidoPipe } from '../../../shared/pipes/codigo-pedido.pipe';

@Component({
  selector: 'app-confirmacao',
  imports: [RouterLink, PrecoBrPipe, CodigoPedidoPipe],
  templateUrl: './confirmacao.html',
  styleUrl: './confirmacao.scss',
})
export class Confirmacao implements OnInit {
  private readonly pedidos = inject(OrderService);
  private readonly router = inject(Router);

  protected readonly pedido = this.pedidos.ultimoPedido;

  ngOnInit(): void {
    if (!this.pedido()) {
      this.router.navigateByUrl('/loja/meus-pedidos');
    }
  }
}
