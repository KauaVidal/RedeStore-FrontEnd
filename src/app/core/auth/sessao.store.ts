import { computed, Injectable, signal } from '@angular/core';
import { Usuario } from './usuario.model';

export interface Sessao {
  usuario: Usuario;
  token: string;
}

const CHAVE_SESSAO = 'rede_sessao';
const CHAVE_SESSAO_MOCK = 'rede_sessao_usuario';

/**
 * Guarda usuário + JWT. Não depende de nada (nem de HttpClient) para o interceptor
 * poder ler o token sem criar um ciclo de injeção com o AuthService.
 */
@Injectable({ providedIn: 'root' })
export class SessaoStore {
  private readonly _sessao = signal<Sessao | null>(this.carregar());

  readonly sessao = this._sessao.asReadonly();
  readonly usuario = computed(() => this._sessao()?.usuario ?? null);
  readonly token = computed(() => this._sessao()?.token ?? null);

  definir(sessao: Sessao | null): void {
    this._sessao.set(sessao);
    if (sessao) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    else localStorage.removeItem(CHAVE_SESSAO);
  }

  atualizarUsuario(usuario: Usuario): void {
    const atual = this._sessao();
    if (atual) this.definir({ ...atual, usuario });
  }

  private carregar(): Sessao | null {
    // Sessões gravadas pelo mock antigo não têm token: descartadas.
    localStorage.removeItem(CHAVE_SESSAO_MOCK);
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    try {
      const sessao = JSON.parse(bruto) as Partial<Sessao> | null;
      return sessao?.token && sessao.usuario ? (sessao as Sessao) : null;
    } catch {
      return null;
    }
  }
}
