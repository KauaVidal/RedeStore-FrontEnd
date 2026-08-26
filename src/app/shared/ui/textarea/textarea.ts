import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  imports: [ReactiveFormsModule],
  templateUrl: './textarea.html',
  styleUrl: './textarea.scss',
})
export class Textarea {
  readonly rotulo = input.required<string>();
  readonly controle = input.required<FormControl>();
  readonly erro = input<string | null>(null);
}
