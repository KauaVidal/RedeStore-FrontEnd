import { Component, input, output } from '@angular/core';
import { Icone } from '../icone/icone';

@Component({
  selector: 'app-modal',
  imports: [Icone],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  readonly titulo = input.required<string>();
  readonly aberto = input<boolean>(false);
  readonly fechar = output<void>();
}
