import { Injectable } from '@angular/core';
import { mockLatency } from '../mock/mock-latency';
import { INSCRICOES_MOCK } from './registration-mock-store';
import { Inscricao } from './inscricao.model';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  async inscrever(dados: { eventoId: string; usuarioId: string; valorPago: number }): Promise<Inscricao> {
    await mockLatency(undefined);
    const inscricao: Inscricao = {
      id: String(INSCRICOES_MOCK.length + 1),
      eventoId: dados.eventoId,
      usuarioId: dados.usuarioId,
      status: 'confirmada',
      valorPago: dados.valorPago,
      criadoEm: new Date().toISOString(),
    };
    INSCRICOES_MOCK.push(inscricao);
    return inscricao;
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

  async vagasRestantes(eventoId: string, vagasTotais: number): Promise<number> {
    await mockLatency(undefined);
    const confirmadas = INSCRICOES_MOCK.filter(
      (i) => i.eventoId === eventoId && i.status === 'confirmada',
    ).length;
    return vagasTotais - confirmadas;
  }
}
