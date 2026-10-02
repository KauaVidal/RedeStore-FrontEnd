import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { mensagemDeErro } from '../../../core/api/mensagem-erro';
import { senhaForte, senhasIguais } from '../../../shared/validators/senha.validators';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { Button } from '../../../shared/ui/button/button';
import { Logo } from '../../../shared/ui/logo/logo';

type Estado = 'formulario' | 'sucesso' | 'token_invalido';

@Component({
  selector: 'app-redefinir-senha',
  imports: [ReactiveFormsModule, RouterLink, TextField, Button, Logo],
  templateUrl: './redefinir-senha.html',
  styleUrl: './redefinir-senha.scss',
})
export class RedefinirSenha {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  /** Vem de `?token=` (link do e-mail), via withComponentInputBinding. */
  readonly token = input<string | undefined>();

  protected readonly form = this.fb.nonNullable.group(
    {
      novaSenha: ['', [Validators.required, senhaForte()]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: senhasIguais('novaSenha', 'confirmarSenha') },
  );

  protected readonly estado = signal<Estado>('formulario');
  protected readonly enviando = signal(false);
  protected readonly erroGeral = signal<string | null>(null);

  protected get erroNovaSenha(): string {
    const c = this.form.controls.novaSenha;
    if (c.touched && c.hasError('required')) return 'Crie uma nova senha.';
    if (c.touched && c.hasError('senhaFraca')) return 'A senha precisa ter pelo menos 8 caracteres.';
    return '';
  }

  protected get erroConfirmarSenha(): string {
    if (!this.form.controls.confirmarSenha.touched) return '';
    if (this.form.controls.confirmarSenha.hasError('required')) return 'Confirme a nova senha.';
    if (this.form.hasError('senhasDiferentes')) return 'As senhas não coincidem.';
    return '';
  }

  protected async aoEnviar(): Promise<void> {
    const token = this.token();
    if (!token) {
      this.estado.set('token_invalido');
      return;
    }
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erroGeral.set(null);
    try {
      await this.auth.redefinirSenha(token, this.form.getRawValue().novaSenha);
      this.estado.set('sucesso');
    } catch (erro) {
      if (erro instanceof Error && erro.message === 'TOKEN_INVALIDO') {
        this.estado.set('token_invalido');
      } else {
        this.erroGeral.set(
          mensagemDeErro(erro, {}, 'Não deu pra trocar sua senha agora. Tenta de novo em instantes.'),
        );
      }
    } finally {
      this.enviando.set(false);
    }
  }
}
