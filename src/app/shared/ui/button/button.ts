import { Component, booleanAttribute, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  host: { '[class.largura-total]': 'larguraTotal()' },
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  readonly variante = input<'primario' | 'secundario'>('primario');
  readonly desabilitado = input<boolean>(false);
  readonly carregando = input<boolean>(false);
  readonly tipo = input<'button' | 'submit'>('button');
  /** Ocupa toda a largura do container (ex.: botão principal de um painel). */
  readonly larguraTotal = input(false, { transform: booleanAttribute });
  readonly clicado = output<void>();

  protected aoClicar(): void {
    if (this.desabilitado() || this.carregando()) return;
    this.clicado.emit();
  }
}
