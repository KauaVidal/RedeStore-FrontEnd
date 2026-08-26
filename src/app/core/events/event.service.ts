import { Injectable } from '@angular/core';
import { mockLatency } from '../mock/mock-latency';
import { EVENTOS_MOCK } from './event-mock-store';
import { Evento } from './evento.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  async listar(): Promise<Evento[]> {
    return mockLatency([...EVENTOS_MOCK]);
  }

  async buscarPorId(id: string): Promise<Evento | undefined> {
    return mockLatency(EVENTOS_MOCK.find((e) => e.id === id));
  }

  async criar(dados: Omit<Evento, 'id'>): Promise<Evento> {
    await mockLatency(undefined);
    const evento: Evento = { ...dados, id: String(EVENTOS_MOCK.length + 1) };
    EVENTOS_MOCK.push(evento);
    return evento;
  }

  async atualizar(id: string, dados: Partial<Omit<Evento, 'id'>>): Promise<Evento> {
    await mockLatency(undefined);
    const indice = EVENTOS_MOCK.findIndex((e) => e.id === id);
    if (indice < 0) throw new Error('EVENTO_NAO_ENCONTRADO');
    EVENTOS_MOCK[indice] = { ...EVENTOS_MOCK[indice], ...dados };
    return EVENTOS_MOCK[indice];
  }

  async remover(id: string): Promise<void> {
    await mockLatency(undefined);
    const indice = EVENTOS_MOCK.findIndex((e) => e.id === id);
    if (indice >= 0) EVENTOS_MOCK.splice(indice, 1);
  }
}
