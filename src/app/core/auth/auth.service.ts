import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API, requisitar } from '../api/api';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../orders/order.service';
import { Sessao, SessaoStore } from './sessao.store';
import { Usuario } from './usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessao = inject(SessaoStore);
  private readonly carrinho = inject(CartService);
  private readonly pedidos = inject(OrderService);

  readonly usuarioAtual = this.sessao.usuario;
  readonly estaAutenticado = computed(() => this.usuarioAtual() !== null);
  readonly isAdmin = computed(() => this.usuarioAtual()?.papel === 'admin');

  async login(email: string, senha: string): Promise<Usuario> {
    const resposta = await requisitar(this.http.post<Sessao>(`${API}/auth/login`, { email, senha }));
    this.sessao.definir(resposta);
    return resposta.usuario;
  }

  async cadastrar(dados: { nome: string; email: string; senha: string }): Promise<Usuario> {
    const resposta = await requisitar(this.http.post<Sessao>(`${API}/auth/cadastro`, dados));
    this.sessao.definir(resposta);
    return resposta.usuario;
  }

  async buscarPorId(id: string): Promise<Usuario | undefined> {
    try {
      return await requisitar(this.http.get<Usuario>(`${API}/usuarios/${id}`));
    } catch (erro) {
      if (erro instanceof Error && ['NAO_ENCONTRADO', 'ACESSO_NEGADO'].includes(erro.message)) return undefined;
      throw erro;
    }
  }

  async recuperarSenha(email: string): Promise<void> {
    await requisitar(this.http.post<void>(`${API}/auth/recuperar-senha`, { email }));
  }

  async redefinirSenha(token: string, novaSenha: string): Promise<void> {
    await requisitar(this.http.post<void>(`${API}/auth/redefinir-senha`, { token, novaSenha }));
  }

  async atualizarPerfil(
    dados: Partial<Pick<Usuario, 'nome' | 'email' | 'telefone'>>,
  ): Promise<Usuario> {
    const atualizado = await requisitar(this.http.patch<Usuario>(`${API}/auth/perfil`, dados));
    this.sessao.atualizarUsuario(atualizado);
    return atualizado;
  }

  /** Confere o token salvo com o servidor e atualiza os dados do usuário. 401 é tratado pelo interceptor. */
  async validarSessao(): Promise<void> {
    if (!this.sessao.token()) return;
    try {
      this.sessao.atualizarUsuario(await requisitar(this.http.get<Usuario>(`${API}/auth/me`)));
    } catch {
      // Servidor fora do ar: mantém a sessão local; a próxima requisição autenticada decide.
    }
  }

  encerrarSessaoExpirada(): void {
    this.logout();
  }

  logout(): void {
    this.sessao.definir(null);
    this.carrinho.limpar();
    this.pedidos.limparUltimoPedido();
  }
}
