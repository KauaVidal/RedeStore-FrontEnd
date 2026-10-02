import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API, buscarOuIndefinido, requisitar } from '../api/api';
import { FiltroProdutos, Produto } from './produto.model';

type DadosProduto = Omit<Produto, 'id'>;

/** `tamanhos`/`cores` são calculados pelo backend e ids de variação são regerados: nunca enviados. */
function paraCorpo(dados: Partial<DadosProduto>): Record<string, unknown> {
  const { tamanhos: _tamanhos, cores: _cores, variacoes, ...resto } = dados;
  return variacoes
    ? { ...resto, variacoes: variacoes.map(({ tamanho, cor, estoque }) => ({ tamanho, cor, estoque })) }
    : resto;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  async listar(filtro?: FiltroProdutos): Promise<Produto[]> {
    let params = new HttpParams();
    if (filtro?.categoria) params = params.set('categoria', filtro.categoria);
    const busca = filtro?.busca?.trim();
    if (busca) params = params.set('busca', busca);
    return requisitar(this.http.get<Produto[]>(`${API}/produtos`, { params }));
  }

  async listarDestaques(): Promise<Produto[]> {
    return requisitar(this.http.get<Produto[]>(`${API}/produtos/destaques`));
  }

  async buscarPorId(id: string): Promise<Produto | undefined> {
    return buscarOuIndefinido(this.http.get<Produto>(`${API}/produtos/${id}`));
  }

  async criar(dados: DadosProduto): Promise<Produto> {
    return requisitar(this.http.post<Produto>(`${API}/produtos`, paraCorpo(dados)));
  }

  async atualizar(id: string, dados: Partial<DadosProduto>): Promise<Produto> {
    return requisitar(this.http.patch<Produto>(`${API}/produtos/${id}`, paraCorpo(dados)));
  }

  async remover(id: string): Promise<void> {
    await requisitar(this.http.delete<void>(`${API}/produtos/${id}`));
  }
}
