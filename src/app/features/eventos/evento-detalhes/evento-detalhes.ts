import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Evento } from '../../../core/events/evento.model';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';

@Component({
  selector: 'app-evento-detalhes',
  imports: [RouterLink, PrecoBrPipe],
  templateUrl: './evento-detalhes.html',
  styleUrl: './evento-detalhes.scss',
})
export class EventoDetalhes implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly registrations = inject(RegistrationService);
  private readonly auth = inject(AuthService);
  private readonly rota = inject(ActivatedRoute);

  protected readonly evento = signal<Evento | null>(null);
  protected readonly vagasRestantes = signal<number | null>(null);
  protected readonly jaInscrito = signal(false);

  protected readonly esgotado = computed(() => (this.vagasRestantes() ?? 0) <= 0);

  async ngOnInit(): Promise<void> {
    const id = this.rota.snapshot.paramMap.get('id')!;
    const evento = (await this.eventService.buscarPorId(id)) ?? null;
    this.evento.set(evento);
    if (!evento) return;

    this.vagasRestantes.set(await this.registrations.vagasRestantes(id, evento.vagasTotais));

    const usuario = this.auth.usuarioAtual();
    if (usuario) {
      const inscricoes = await this.registrations.listarPorUsuario(usuario.id);
      this.jaInscrito.set(inscricoes.some((i) => i.eventoId === id && i.status === 'confirmada'));
    }
  }

  protected rotuloVagas(vagas: number): string {
    return vagas === 1 ? '1 vaga restante' : `${vagas} vagas restantes`;
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
