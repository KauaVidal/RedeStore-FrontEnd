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

  protected async aoSalvar(): Promise<void> {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    this.salvo.set(false);
    await this.auth.atualizarPerfil(this.form.getRawValue());
    this.salvando.set(false);
    this.salvo.set(true);
  }

  protected sair(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
