import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { Evento } from '../../../core/events/evento.model';
import { Table } from '../../../shared/ui/table/table';
import { Modal } from '../../../shared/ui/modal/modal';
import { Button } from '../../../shared/ui/button/button';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { EventoForm } from './evento-form/evento-form';

@Component({
  selector: 'app-eventos',
  imports: [RouterLink, Table, Modal, Button, EmptyState, DataBrPipe, EventoForm],
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss',
})
export class Eventos implements OnInit {
  private readonly eventosService = inject(EventService);
  private readonly inscricoesService = inject(RegistrationService);

  protected readonly lista = signal<Evento[]>([]);
  protected readonly vagasRestantes = signal<Record<string, number>>({});
  protected readonly modalAberto = signal(false);
  protected readonly eventoEditando = signal<Evento | null>(null);
  protected readonly eventoParaRemover = signal<Evento | null>(null);

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    const eventos = await this.eventosService.listar();
    this.lista.set(eventos);
    const vagas = await Promise.all(
      eventos.map((e) => this.inscricoesService.vagasRestantes(e.id, e.vagasTotais)),
    );
    const mapa: Record<string, number> = {};
    eventos.forEach((e, indice) => (mapa[e.id] = vagas[indice]));
    this.vagasRestantes.set(mapa);
  }

  protected ocupadas(evento: Evento): number {
    return evento.vagasTotais - (this.vagasRestantes()[evento.id] ?? evento.vagasTotais);
  }

  protected abrirNovo(): void {
    this.eventoEditando.set(null);
    this.modalAberto.set(true);
  }

  protected abrirEdicao(evento: Evento): void {
    this.eventoEditando.set(evento);
    this.modalAberto.set(true);
  }

  protected fecharModal(): void {
    this.modalAberto.set(false);
  }

  protected async salvar(dados: Omit<Evento, 'id'>): Promise<void> {
    const editando = this.eventoEditando();
    if (editando) {
      await this.eventosService.atualizar(editando.id, dados);
    } else {
      await this.eventosService.criar(dados);
    }
    this.modalAberto.set(false);
    await this.carregar();
  }

  protected pedirRemocao(evento: Evento): void {
    this.eventoParaRemover.set(evento);
  }

  protected cancelarRemocao(): void {
    this.eventoParaRemover.set(null);
  }

  protected async confirmarRemocao(): Promise<void> {
    const evento = this.eventoParaRemover();
    if (!evento) return;
    await this.eventosService.remover(evento.id);
    this.eventoParaRemover.set(null);
    await this.carregar();
  }
}
