import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../../../core/events/event.service';
import { RegistrationService } from '../../../../core/registrations/registration.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Evento } from '../../../../core/events/evento.model';
import { Inscricao } from '../../../../core/registrations/inscricao.model';
import { Usuario } from '../../../../core/auth/usuario.model';
import { Table } from '../../../../shared/ui/table/table';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { DataBrPipe } from '../../../../shared/pipes/data-br.pipe';

@Component({
  selector: 'app-inscricoes',
  imports: [RouterLink, Table, EmptyState, DataBrPipe],
  templateUrl: './inscricoes.html',
  styleUrl: './inscricoes.scss',
})
export class Inscricoes implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventosService = inject(EventService);
  private readonly inscricoesService = inject(RegistrationService);
  private readonly auth = inject(AuthService);

  protected readonly evento = signal<Evento | undefined>(undefined);
  protected readonly lista = signal<Inscricao[]>([]);
  protected readonly inscritos = signal<Record<string, Usuario | undefined>>({});

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.evento.set(await this.eventosService.buscarPorId(id));
    const inscricoes = await this.inscricoesService.listarPorEvento(id);
    this.lista.set(inscricoes);
    const idsUnicos = [...new Set(inscricoes.map((i) => i.usuarioId))];
    const usuarios = await Promise.all(idsUnicos.map((uid) => this.auth.buscarPorId(uid)));
    const mapa: Record<string, Usuario | undefined> = {};
    idsUnicos.forEach((uid, indice) => (mapa[uid] = usuarios[indice]));
    this.inscritos.set(mapa);
  }

  protected nomeInscrito(usuarioId: string): string {
    return this.inscritos()[usuarioId]?.nome ?? 'Usuário não encontrado';
  }

  protected emailInscrito(usuarioId: string): string {
    return this.inscritos()[usuarioId]?.email ?? '';
  }

  protected async cancelar(inscricao: Inscricao): Promise<void> {
    await this.inscricoesService.cancelar(inscricao.id);
    await this.carregar();
  }
}
