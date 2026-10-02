import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API, requisitar } from '../api/api';
import { Inscricao } from './inscricao.model';

/**
 * Resultado de uma tentativa de inscrição:
 * - 'criada': uma nova inscrição confirmada foi criada.
 * - 'ja_inscrito': o usuário já tinha inscrição confirmada (idempotente) — devolve a existente.
 * - 'esgotado': não havia vagas; nenhuma inscrição foi criada.
 */
export type ResultadoInscricao =
  | { resultado: 'criada'; inscricao: Inscricao }
  | { resultado: 'ja_inscrito'; inscricao: Inscricao }
  | { resultado: 'esgotado' };

interface ResultadoInscricaoDto {
  resultado: 'criada' | 'ja_inscrito' | 'esgotado';
  inscricao: Inscricao | null;
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);

  /** Inscreve o usuário logado (identificado pelo token). Seguro contra overbooking no backend. */
  async inscrever(eventoId: string): Promise<ResultadoInscricao> {
    const dto = await requisitar(
      this.http.post<ResultadoInscricaoDto>(`${API}/eventos/${eventoId}/inscricoes`, null),
    );
    if (dto.resultado === 'esgotado' || !dto.inscricao) return { resultado: 'esgotado' };
    return { resultado: dto.resultado, inscricao: dto.inscricao };
  }

  async cancelar(inscricaoId: string): Promise<void> {
    await requisitar(this.http.patch<Inscricao>(`${API}/inscricoes/${inscricaoId}/cancelar`, null));
  }

  async listarMinhas(): Promise<Inscricao[]> {
    return requisitar(this.http.get<Inscricao[]>(`${API}/usuarios/me/inscricoes`));
  }

  async listarPorEvento(eventoId: string): Promise<Inscricao[]> {
    return requisitar(this.http.get<Inscricao[]>(`${API}/eventos/${eventoId}/inscricoes`));
  }
}
