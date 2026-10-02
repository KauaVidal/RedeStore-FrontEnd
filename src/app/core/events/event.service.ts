import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API, buscarOuIndefinido, requisitar } from '../api/api';
import { DadosEvento, Evento } from './evento.model';

/** Garante que campos só de leitura nunca vão no corpo, mesmo se a tela passar um Evento inteiro. */
function paraCorpo(dados: Partial<DadosEvento>): Partial<DadosEvento> {
  const { id: _id, vagasRestantes: _vagas, ...corpo } = dados as Partial<Evento>;
  return corpo;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);

  async listar(): Promise<Evento[]> {
    return requisitar(this.http.get<Evento[]>(`${API}/eventos`));
  }

  async buscarPorId(id: string): Promise<Evento | undefined> {
    return buscarOuIndefinido(this.http.get<Evento>(`${API}/eventos/${id}`));
  }

  async criar(dados: DadosEvento): Promise<Evento> {
    return requisitar(this.http.post<Evento>(`${API}/eventos`, paraCorpo(dados)));
  }

  async atualizar(id: string, dados: Partial<DadosEvento>): Promise<Evento> {
    return requisitar(this.http.patch<Evento>(`${API}/eventos/${id}`, paraCorpo(dados)));
  }

  async remover(id: string): Promise<void> {
    await requisitar(this.http.delete<void>(`${API}/eventos/${id}`));
  }
}
