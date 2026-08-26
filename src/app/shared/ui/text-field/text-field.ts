import { Component, computed, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-field',
  imports: [ReactiveFormsModule],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
})
export class TextField {
  readonly rotulo = input.required<string>();
  readonly tipo = input<'text' | 'email' | 'password' | 'tel' | 'number' | 'datetime-local'>('text');
  readonly controle = input.required<FormControl>();
  readonly erro = input<string | null>(null);

  protected readonly mostrarSenha = signal(false);

  protected readonly tipoEfetivo = computed(() =>
    this.tipo() === 'password' ? (this.mostrarSenha() ? 'text' : 'password') : this.tipo(),
  );

  protected alternarMostrarSenha(): void {
    this.mostrarSenha.update((valor) => !valor);
  }
}
