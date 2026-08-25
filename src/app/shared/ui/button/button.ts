import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  readonly variante = input<'primario' | 'secundario'>('primario');
  readonly desabilitado = input<boolean>(false);
  readonly carregando = input<boolean>(false);
  readonly tipo = input<'button' | 'submit'>('button');
  readonly clicado = output<void>();

  protected aoClicar(): void {
    if (this.desabilitado() || this.carregando()) return;
    this.clicado.emit();
  }
}
