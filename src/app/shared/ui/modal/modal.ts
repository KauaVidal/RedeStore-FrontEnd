import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  readonly titulo = input.required<string>();
  readonly aberto = input<boolean>(false);
  readonly fechar = output<void>();
}
