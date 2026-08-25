import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { Evento } from '../../../core/events/evento.model';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

@Component({
  selector: 'app-agenda',
  imports: [RouterLink, EmptyState, PrecoBrPipe, DataBrPipe],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class Agenda implements OnInit {
  private readonly eventos = inject(EventService);
  private readonly registrations = inject(RegistrationService);

  protected readonly lista = signal<Evento[]>([]);
  protected readonly vagasPorEvento = signal<Record<string, number>>({});

  async ngOnInit(): Promise<void> {
    const agora = Date.now();
    const eventosFuturos = (await this.eventos.listar()).filter(
      (evento) => new Date(evento.dataHora).getTime() >= agora,
    );
    this.lista.set(eventosFuturos);

    const pares = await Promise.all(
      eventosFuturos.map(
        async (evento) => [evento.id, await this.registrations.vagasRestantes(evento.id, evento.vagasTotais)] as const,
      ),
    );
    this.vagasPorEvento.set(Object.fromEntries(pares));
  }

  protected rotuloVagas(vagas: number): string {
    return vagas === 1 ? '1 vaga restante' : `${vagas} vagas restantes`;
  }
}
