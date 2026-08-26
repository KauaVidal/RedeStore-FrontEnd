import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dataBr', pure: true })
export class DataBrPipe implements PipeTransform {
  transform(iso: string): string {
    const data = new Date(iso);
    const dataFormatada = data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataFormatada} às ${horaFormatada}`;
  }
}
