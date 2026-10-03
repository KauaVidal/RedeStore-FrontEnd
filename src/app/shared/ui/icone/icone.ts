import { Component, input } from '@angular/core';

export type NomeIcone =
  'carrinho' | 'usuario' | 'inicio' | 'loja' | 'eventos' | 'fechar' | 'voltar';

/**
 * Ícones de traço do site (SVG inline, sem dependência externa). Herdam a cor do texto
 * (`currentColor`) e são decorativos: o texto/aria-label fica no elemento que os contém.
 */
@Component({
  selector: 'app-icone',
  templateUrl: './icone.html',
  styleUrl: './icone.scss',
  host: { 'aria-hidden': 'true' },
})
export class Icone {
  readonly nome = input.required<NomeIcone>();
  readonly tamanho = input(20);
}
