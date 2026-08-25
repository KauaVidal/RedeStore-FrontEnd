import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { EventService } from '../../../core/events/event.service';
import { Inscricao, StatusInscricao } from '../../../core/registrations/inscricao.model';
import { Evento } from '../../../core/events/evento.model';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

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
  imports: [EmptyState],
  templateUrl: './minhas-inscricoes.html',
  styleUrl: './minhas-inscricoes.scss',
})
export class MinhasInscricoes implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly registrations = inject(RegistrationService);
  private readonly eventService = inject(EventService);

  protected readonly lista = signal<InscricaoExibicao[]>([]);
  protected readonly rotuloStatus = ROTULO_STATUS;

  async ngOnInit(): Promise<void> {
    const usuario = this.auth.usuarioAtual();
    if (!usuario) return;

    const inscricoes = await this.registrations.listarPorUsuario(usuario.id);
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
