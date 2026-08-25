import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'precoBr' })
export class PrecoBrPipe implements PipeTransform {
  transform(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }
}
