import { Component, OnInit, inject, signal } from '@angular/core';
import { OrderService } from '../../../core/orders/order.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Pedido, StatusPedido, proximoStatus } from '../../../core/orders/pedido.model';
import { Usuario } from '../../../core/auth/usuario.model';
import { Table } from '../../../shared/ui/table/table';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

const ROTULO_STATUS: Record<StatusPedido, string> = {
  pago: 'Pago',
  em_preparo: 'Em preparo',
  retirado: 'Retirado',
  entregue: 'Entregue',
};

@Component({
  selector: 'app-pedidos',
  imports: [Table, EmptyState, PrecoBrPipe, DataBrPipe],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.scss',
})
export class Pedidos implements OnInit {
  private readonly pedidosService = inject(OrderService);
  private readonly auth = inject(AuthService);

  protected readonly lista = signal<Pedido[]>([]);
  protected readonly clientes = signal<Record<string, Usuario | undefined>>({});
  protected readonly rotuloStatus = ROTULO_STATUS;

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    const pedidos = await this.pedidosService.listarTodos();
    this.lista.set(pedidos);
    const idsUnicos = [...new Set(pedidos.map((p) => p.usuarioId))];
    const usuarios = await Promise.all(idsUnicos.map((id) => this.auth.buscarPorId(id)));
    const mapa: Record<string, Usuario | undefined> = {};
    idsUnicos.forEach((id, indice) => (mapa[id] = usuarios[indice]));
    this.clientes.set(mapa);
  }

  protected nomeCliente(usuarioId: string): string {
    return this.clientes()[usuarioId]?.nome ?? 'Cliente não encontrado';
  }

  protected rotuloProximo(pedido: Pedido): string {
    const proximo = proximoStatus(pedido);
    return proximo ? `Avançar para ${this.rotuloStatus[proximo]}` : '';
  }

  protected resumoItens(pedido: Pedido): string {
    if (pedido.itens.length === 0) return 'Sem itens';
    const restante = pedido.itens.length - 1;
    return restante > 0 ? `${pedido.itens[0].nome} e mais ${restante}` : pedido.itens[0].nome;
  }

  protected async avancar(pedido: Pedido): Promise<void> {
    const proximo = proximoStatus(pedido);
    if (!proximo) return;
    await this.pedidosService.atualizarStatus(pedido.id, proximo);
    await this.carregar();
  }
}
