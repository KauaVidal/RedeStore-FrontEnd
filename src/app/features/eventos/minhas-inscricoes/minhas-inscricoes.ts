import { Component, OnInit, inject, signal } from '@angular/core';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { EventService } from '../../../core/events/event.service';
import { Inscricao, StatusInscricao } from '../../../core/registrations/inscricao.model';
import { Evento } from '../../../core/events/evento.model';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

interface InscricaoExibicao {
  inscricao: Inscricao;
  evento: Evento | undefined;
}

const ROTULO_STATUS: Record<StatusInscricao, string> = {
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
};

@Component({
  selector: 'app-minhas-inscricoes',
  imports: [EmptyState, DataBrPipe],
  templateUrl: './minhas-inscricoes.html',
  styleUrl: './minhas-inscricoes.scss',
})
export class MinhasInscricoes implements OnInit {
  private readonly registrations = inject(RegistrationService);
  private readonly eventService = inject(EventService);

  protected readonly lista = signal<InscricaoExibicao[]>([]);
  protected readonly rotuloStatus = ROTULO_STATUS;

  async ngOnInit(): Promise<void> {
    const inscricoes = await this.registrations.listarMinhas();
    const lista = await Promise.all(
      inscricoes.map(async (inscricao) => ({
        inscricao,
        evento: await this.eventService.buscarPorId(inscricao.eventoId),
      })),
    );
    this.lista.set(lista);
  }

  protected async cancelar(inscricaoId: string): Promise<void> {
    await this.registrations.cancelar(inscricaoId);
    this.lista.set(
      this.lista().map((item) =>
        item.inscricao.id === inscricaoId
          ? { ...item, inscricao: { ...item.inscricao, status: 'cancelada' } }
          : item,
      ),
    );
  }
}
