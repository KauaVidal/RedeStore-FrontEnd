import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-field',
  imports: [ReactiveFormsModule],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
})
export class TextField {
  readonly rotulo = input.required<string>();
  readonly tipo = input<'text' | 'email' | 'password' | 'tel'>('text');
  readonly controle = input.required<FormControl>();
  readonly erro = input<string | null>(null);
}
