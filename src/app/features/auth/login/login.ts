import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { Button } from '../../../shared/ui/button/button';
import { Logo } from '../../../shared/ui/logo/logo';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TextField, Button, Logo],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  protected readonly enviando = signal(false);
  protected readonly erroGeral = signal<string | null>(null);

  protected get erroEmail(): string {
    const c = this.form.controls.email;
    if (c.touched && c.hasError('required')) return 'Informe seu e-mail.';
    if (c.touched && c.hasError('email')) return 'Informe um e-mail válido.';
    return '';
  }

  protected get erroSenha(): string {
    const c = this.form.controls.senha;
    if (c.touched && c.hasError('required')) return 'Informe sua senha.';
    return '';
  }

  protected async aoEnviar(): Promise<void> {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erroGeral.set(null);
    const { email, senha } = this.form.getRawValue();
    try {
      await this.auth.login(email, senha);
      this.router.navigateByUrl('/');
    } catch {
      this.erroGeral.set('E-mail ou senha incorretos. Confira e tente de novo.');
    } finally {
      this.enviando.set(false);
    }
  }
}
