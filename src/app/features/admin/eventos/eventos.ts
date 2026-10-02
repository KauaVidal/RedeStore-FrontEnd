import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../core/events/event.service';
import { DadosEvento, Evento } from '../../../core/events/evento.model';
import { Table } from '../../../shared/ui/table/table';
import { Modal } from '../../../shared/ui/modal/modal';
import { Button } from '../../../shared/ui/button/button';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { EventoForm } from './evento-form/evento-form';
import { mensagemDeErro } from '../../../core/api/mensagem-erro';

const ERROS_EVENTO: Record<string, string> = {
  EVENTO_COM_INSCRICOES_CONFIRMADAS: 'Esse evento tem inscrições confirmadas. Cancele-as antes de remover.',
  EVENTO_VAGAS_TOTAIS_INSUFICIENTES: 'O total de vagas não pode ficar abaixo das inscrições já confirmadas.',
};

@Component({
  selector: 'app-eventos',
  imports: [RouterLink, Table, Modal, Button, EmptyState, DataBrPipe, EventoForm],
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss',
})
export class Eventos implements OnInit {
  private readonly eventosService = inject(EventService);

  protected readonly lista = signal<Evento[]>([]);
  protected readonly modalAberto = signal(false);
  protected readonly eventoEditando = signal<Evento | null>(null);
  protected readonly eventoParaRemover = signal<Evento | null>(null);
  protected readonly erro = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    this.lista.set(await this.eventosService.listar());
  }

  protected ocupadas(evento: Evento): number {
    return evento.vagasTotais - evento.vagasRestantes;
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

  protected async salvar(dados: DadosEvento): Promise<void> {
    this.erro.set(null);
    const editando = this.eventoEditando();
    try {
      if (editando) {
        await this.eventosService.atualizar(editando.id, dados);
      } else {
        await this.eventosService.criar(dados);
      }
    } catch (erro) {
      this.erro.set(mensagemDeErro(erro, ERROS_EVENTO, 'Não deu pra salvar o evento agora. Tenta de novo em instantes.'));
      this.modalAberto.set(false);
      return;
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
    this.erro.set(null);
    try {
      await this.eventosService.remover(evento.id);
    } catch (erro) {
      this.erro.set(mensagemDeErro(erro, ERROS_EVENTO, 'Não deu pra remover o evento agora. Tenta de novo em instantes.'));
    }
    this.eventoParaRemover.set(null);
    await this.carregar();
  }
}
