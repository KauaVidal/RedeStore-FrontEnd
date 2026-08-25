import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { senhaForte, senhasIguais } from '../../../shared/validators/senha.validators';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { Button } from '../../../shared/ui/button/button';
import { Logo } from '../../../shared/ui/logo/logo';

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink, TextField, Button, Logo],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss',
})
export class Cadastro {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, senhaForte()]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: senhasIguais('senha', 'confirmarSenha') },
  );

  protected readonly enviando = signal(false);
  protected readonly erroGeral = signal<string | null>(null);

  protected get erroNome(): string {
    const c = this.form.controls.nome;
    return c.touched && c.invalid ? 'Informe seu nome.' : '';
  }

  protected get erroEmail(): string {
    const c = this.form.controls.email;
    if (c.touched && c.hasError('required')) return 'Informe seu e-mail.';
    if (c.touched && c.hasError('email')) return 'Informe um e-mail válido.';
    return '';
  }

  protected get erroSenha(): string {
    const c = this.form.controls.senha;
    if (c.touched && c.hasError('required')) return 'Crie uma senha.';
    if (c.touched && c.hasError('senhaFraca')) return 'A senha precisa ter pelo menos 8 caracteres.';
    return '';
  }

  protected get erroConfirmarSenha(): string {
    if (!this.form.controls.confirmarSenha.touched) return '';
    if (this.form.controls.confirmarSenha.hasError('required')) return 'Confirme sua senha.';
    if (this.form.hasError('senhasDiferentes')) return 'As senhas não coincidem.';
    return '';
  }

  protected async aoEnviar(): Promise<void> {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erroGeral.set(null);
    const { nome, email, senha } = this.form.getRawValue();
    try {
      await this.auth.cadastrar({ nome, email, senha });
      this.router.navigateByUrl('/');
    } catch (erro) {
      this.erroGeral.set(
        erro instanceof Error && erro.message === 'EMAIL_EM_USO'
          ? 'Esse e-mail já está cadastrado. Tenta entrar em vez de criar conta de novo.'
          : 'Não deu pra criar sua conta agora. Tenta de novo em instantes.',
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
