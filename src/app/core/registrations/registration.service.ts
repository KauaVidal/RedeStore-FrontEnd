import { Injectable } from '@angular/core';
import { mockLatency } from '../mock/mock-latency';
import { INSCRICOES_MOCK } from './registration-mock-store';
import { Inscricao } from './inscricao.model';

/**
 * Resultado de uma tentativa de inscrição:
 * - 'criada': uma nova inscrição confirmada foi criada.
 * - 'ja_inscrito': o usuário já tinha uma inscrição confirmada para o evento;
 *   nenhuma nova linha foi criada (idempotente) e a inscrição existente é retornada.
 * - 'esgotado': não havia vagas disponíveis; nenhuma inscrição foi criada.
 */
export type ResultadoInscricao =
  | { resultado: 'criada'; inscricao: Inscricao }
  | { resultado: 'ja_inscrito'; inscricao: Inscricao }
  | { resultado: 'esgotado' };

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  async inscrever(dados: {
    eventoId: string;
    usuarioId: string;
    valorPago: number;
    vagasTotais: number;
  }): Promise<ResultadoInscricao> {
    await mockLatency(undefined);

    const existente = INSCRICOES_MOCK.find(
      (i) => i.eventoId === dados.eventoId && i.usuarioId === dados.usuarioId && i.status === 'confirmada',
    );
    if (existente) {
      // Idempotente: remontar a tela de confirmação (voltar/avançar no navegador,
      // ou navegar direto pra URL) não cria uma segunda inscrição.
      return { resultado: 'ja_inscrito', inscricao: existente };
    }

    const confirmadas = INSCRICOES_MOCK.filter(
      (i) => i.eventoId === dados.eventoId && i.status === 'confirmada',
    ).length;
    if (confirmadas >= dados.vagasTotais) {
      return { resultado: 'esgotado' };
    }

    const inscricao: Inscricao = {
      id: String(INSCRICOES_MOCK.length + 1),
      eventoId: dados.eventoId,
      usuarioId: dados.usuarioId,
      status: 'confirmada',
      valorPago: dados.valorPago,
      criadoEm: new Date().toISOString(),
    };
    INSCRICOES_MOCK.push(inscricao);
    return { resultado: 'criada', inscricao };
  }

  async cancelar(inscricaoId: string): Promise<void> {
    await mockLatency(undefined);
    const indice = INSCRICOES_MOCK.findIndex((i) => i.id === inscricaoId);
    if (indice >= 0) {
      INSCRICOES_MOCK[indice] = { ...INSCRICOES_MOCK[indice], status: 'cancelada' };
    }
  }

  async listarPorUsuario(usuarioId: string): Promise<Inscricao[]> {
    await mockLatency(undefined);
    return INSCRICOES_MOCK.filter((i) => i.usuarioId === usuarioId).sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    );
  }

  async listarPorEvento(eventoId: string): Promise<Inscricao[]> {
    await mockLatency(undefined);
    return INSCRICOES_MOCK.filter((i) => i.eventoId === eventoId).sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    );
  }

  async vagasRestantes(eventoId: string, vagasTotais: number): Promise<number> {
    await mockLatency(undefined);
    const confirmadas = INSCRICOES_MOCK.filter(
      (i) => i.eventoId === eventoId && i.status === 'confirmada',
    ).length;
    return vagasTotais - confirmadas;
  }
}
