import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TextField } from '../../shared/ui/text-field/text-field';
import { Button } from '../../shared/ui/button/button';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, TextField, Button, EmptyState],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly usuario = this.auth.usuarioAtual;

  protected readonly form = this.fb.nonNullable.group({
    nome: [this.usuario()?.nome ?? '', [Validators.required]],
    email: [this.usuario()?.email ?? '', [Validators.required, Validators.email]],
    telefone: [this.usuario()?.telefone ?? ''],
  });

  protected readonly salvando = signal(false);
  protected readonly salvo = signal(false);
  protected readonly erroGeral = signal<string | null>(null);

  protected async aoSalvar(): Promise<void> {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    this.salvo.set(false);
    this.erroGeral.set(null);
    try {
      await this.auth.atualizarPerfil(this.form.getRawValue());
      this.salvo.set(true);
    } catch {
      this.erroGeral.set('Não deu pra salvar suas alterações agora. Tenta de novo em instantes.');
    } finally {
      this.salvando.set(false);
    }
  }

  protected sair(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
