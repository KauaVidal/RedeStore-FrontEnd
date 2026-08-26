import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Evento } from '../../../core/events/evento.model';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

@Component({
  selector: 'app-evento-detalhes',
  imports: [RouterLink, PrecoBrPipe, DataBrPipe],
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
  protected readonly carregado = signal(false);

  protected readonly esgotado = computed(() => {
    const vagas = this.vagasRestantes();
    return vagas !== null && vagas <= 0;
  });

  async ngOnInit(): Promise<void> {
    const id = this.rota.snapshot.paramMap.get('id')!;
    const evento = (await this.eventService.buscarPorId(id)) ?? null;
    this.evento.set(evento);
    if (!evento) {
      this.carregado.set(true);
      return;
    }

    const usuario = this.auth.usuarioAtual();
    const [vagas, inscricoes] = await Promise.all([
      this.registrations.vagasRestantes(id, evento.vagasTotais),
      usuario ? this.registrations.listarPorUsuario(usuario.id) : Promise.resolve([]),
    ]);

    this.vagasRestantes.set(vagas);
    this.jaInscrito.set(inscricoes.some((i) => i.eventoId === id && i.status === 'confirmada'));
    this.carregado.set(true);
  }

  protected rotuloVagas(vagas: number): string {
    return vagas === 1 ? '1 vaga restante' : `${vagas} vagas restantes`;
  }
}
