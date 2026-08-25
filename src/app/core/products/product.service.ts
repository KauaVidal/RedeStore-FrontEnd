import { Injectable } from '@angular/core';
import { mockLatency } from '../mock/mock-latency';
import { PRODUTOS_MOCK } from './product-mock-store';
import { FiltroProdutos, Produto } from './produto.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  async listar(filtro?: FiltroProdutos): Promise<Produto[]> {
    let resultado = PRODUTOS_MOCK;
    if (filtro?.categoria) {
      resultado = resultado.filter((p) => p.categoria === filtro.categoria);
    }
    if (filtro?.busca) {
      const termo = filtro.busca.trim().toLowerCase();
      resultado = resultado.filter((p) => p.nome.toLowerCase().includes(termo));
    }
    return mockLatency(resultado);
  }

  async listarDestaques(): Promise<Produto[]> {
    return mockLatency(PRODUTOS_MOCK.filter((p) => p.destaque));
  }

  async buscarPorId(id: string): Promise<Produto | undefined> {
    return mockLatency(PRODUTOS_MOCK.find((p) => p.id === id));
  }
}
