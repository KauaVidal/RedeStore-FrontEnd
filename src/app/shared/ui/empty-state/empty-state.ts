import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  readonly mensagem = input.required<string>();
  readonly textoAcao = input<string>('');
  readonly linkAcao = input<string>('');
}
