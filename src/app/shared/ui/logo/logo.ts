import { Component, computed, input } from '@angular/core';

export type LogoVariante =
  | 'amarelo-fundo-preto'
  | 'preto-fundo-amarelo'
  | 'amarelo-transparente'
  | 'branco-transparente'
  | 'preto-transparente';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
})
export class Logo {
  readonly variante = input<LogoVariante>('amarelo-transparente');
  readonly tamanho = input<string>('40px');

  protected readonly src = computed(() => `assets/logos/logo-rede-${this.variante()}.svg`);
}
