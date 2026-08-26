import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface OpcaoSelect {
  valor: string;
  rotulo: string;
}

@Component({
  selector: 'app-select',
  imports: [ReactiveFormsModule],
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class Select {
  readonly rotulo = input.required<string>();
  readonly opcoes = input.required<OpcaoSelect[]>();
  readonly controle = input.required<FormControl>();
  readonly erro = input<string | null>(null);
}
