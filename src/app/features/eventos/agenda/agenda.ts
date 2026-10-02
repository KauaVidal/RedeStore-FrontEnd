import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../core/events/event.service';
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

  protected readonly lista = signal<Evento[]>([]);

  async ngOnInit(): Promise<void> {
    const agora = Date.now();
    this.lista.set(
      (await this.eventos.listar()).filter((evento) => new Date(evento.dataHora).getTime() >= agora),
    );
  }

  protected rotuloVagas(vagas: number): string {
    return vagas === 1 ? '1 vaga restante' : `${vagas} vagas restantes`;
  }
}
