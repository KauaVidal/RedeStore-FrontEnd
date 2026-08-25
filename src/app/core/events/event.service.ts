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
}
