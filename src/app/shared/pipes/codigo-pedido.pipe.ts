import { Pipe, PipeTransform } from '@angular/core';

/** IDs de pedido são GUIDs; para exibição basta o começo (ex.: #A1B2C3D4). */
@Pipe({ name: 'codigoPedido' })
export class CodigoPedidoPipe implements PipeTransform {
  transform(id: string): string {
    return id.length > 8 ? id.slice(0, 8).toUpperCase() : id;
  }
}
