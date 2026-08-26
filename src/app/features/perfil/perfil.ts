import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OrderService } from '../../core/orders/order.service';
import { RegistrationService } from '../../core/registrations/registration.service';
import { Pedido } from '../../core/orders/pedido.model';
import { Inscricao } from '../../core/registrations/inscricao.model';
import { TextField } from '../../shared/ui/text-field/text-field';
import { Button } from '../../shared/ui/button/button';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, RouterLink, TextField, Button, EmptyState],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly pedidosService = inject(OrderService);
  private readonly registrations = inject(RegistrationService);
  private readonly router = inject(Router);

  protected readonly usuario = this.auth.usuarioAtual;
  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly inscricoesConfirmadas = signal<Inscricao[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    nome: [this.usuario()?.nome ?? '', [Validators.required]],
    email: [this.usuario()?.email ?? '', [Validators.required, Validators.email]],
    telefone: [this.usuario()?.telefone ?? ''],
  });

  protected readonly salvando = signal(false);
  protected readonly salvo = signal(false);
  protected readonly erroGeral = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const usuario = this.usuario();
    if (!usuario) return;
    const [pedidos, inscricoes] = await Promise.all([
      this.pedidosService.listarPorUsuario(usuario.id),
      this.registrations.listarPorUsuario(usuario.id),
    ]);
    this.pedidos.set(pedidos);
    this.inscricoesConfirmadas.set(inscricoes.filter((i) => i.status === 'confirmada'));
  }

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
