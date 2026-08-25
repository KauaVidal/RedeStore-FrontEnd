import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Evento } from '../../../core/events/evento.model';
import { Inscricao } from '../../../core/registrations/inscricao.model';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';

@Component({
  selector: 'app-confirmacao',
  imports: [RouterLink, PrecoBrPipe],
  templateUrl: './confirmacao.html',
  styleUrl: './confirmacao.scss',
})
export class Confirmacao implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly registrations = inject(RegistrationService);
  private readonly auth = inject(AuthService);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly evento = signal<Evento | null>(null);
  protected readonly inscricao = signal<Inscricao | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.rota.snapshot.paramMap.get('id')!;
    const evento = (await this.eventService.buscarPorId(id)) ?? null;
    if (!evento) {
      this.router.navigateByUrl('/eventos');
      return;
    }
    this.evento.set(evento);

    const usuario = this.auth.usuarioAtual()!;
    const inscricao = await this.registrations.inscrever({
      eventoId: evento.id,
      usuarioId: usuario.id,
      valorPago: evento.preco,
    });
    this.inscricao.set(inscricao);
  }

  protected formatarDataHora(iso: string): string {
    const data = new Date(iso);
    const dataFormatada = data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataFormatada} às ${horaFormatada}`;
  }
}
