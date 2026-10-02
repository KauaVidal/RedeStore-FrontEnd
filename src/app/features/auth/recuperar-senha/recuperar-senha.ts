import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { Button } from '../../../shared/ui/button/button';
import { Logo } from '../../../shared/ui/logo/logo';
import { mensagemDeErro } from '../../../core/api/mensagem-erro';

@Component({
  selector: 'app-recuperar-senha',
  imports: [ReactiveFormsModule, RouterLink, TextField, Button, Logo],
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.scss',
})
export class RecuperarSenha {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erroGeral = signal<string | null>(null);

  protected get erroEmail(): string {
    const c = this.form.controls.email;
    if (c.touched && c.hasError('required')) return 'Informe seu e-mail.';
    if (c.touched && c.hasError('email')) return 'Informe um e-mail válido.';
    return '';
  }

  protected async aoEnviar(): Promise<void> {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erroGeral.set(null);
    try {
      await this.auth.recuperarSenha(this.form.getRawValue().email);
      this.enviado.set(true);
    } catch (erro) {
      this.erroGeral.set(mensagemDeErro(erro, {}, 'Não deu pra enviar o link agora. Tenta de novo em instantes.'));
    } finally {
      this.enviando.set(false);
    }
  }
}
