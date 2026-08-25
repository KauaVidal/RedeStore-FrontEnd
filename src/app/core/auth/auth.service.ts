import { computed, Injectable, signal } from '@angular/core';
import { mockLatency } from '../mock/mock-latency';
import { USUARIOS_MOCK, UsuarioMock } from './auth-mock-store';
import { Usuario } from './usuario.model';

const CHAVE_SESSAO = 'rede_sessao_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _usuarioAtual = signal<Usuario | null>(this.carregarSessao());

  readonly usuarioAtual = this._usuarioAtual.asReadonly();
  readonly estaAutenticado = computed(() => this._usuarioAtual() !== null);
  readonly isAdmin = computed(() => this._usuarioAtual()?.papel === 'admin');

  async login(email: string, senha: string): Promise<Usuario> {
    await mockLatency(undefined);
    const encontrado = USUARIOS_MOCK.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha,
    );
    if (!encontrado) throw new Error('CREDENCIAIS_INVALIDAS');
    const usuario = this.paraUsuario(encontrado);
    this.definirSessao(usuario);
    return usuario;
  }

  async cadastrar(dados: { nome: string; email: string; senha: string }): Promise<Usuario> {
    await mockLatency(undefined);
    const jaExiste = USUARIOS_MOCK.some((u) => u.email.toLowerCase() === dados.email.toLowerCase());
    if (jaExiste) throw new Error('EMAIL_EM_USO');
    const novo: UsuarioMock = {
      id: String(USUARIOS_MOCK.length + 1),
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      papel: 'jovem',
    };
    USUARIOS_MOCK.push(novo);
    const usuario = this.paraUsuario(novo);
    this.definirSessao(usuario);
    return usuario;
  }

  async recuperarSenha(_email: string): Promise<void> {
    await mockLatency(undefined);
  }

  async atualizarPerfil(
    dados: Partial<Pick<Usuario, 'nome' | 'email' | 'telefone'>>,
  ): Promise<Usuario> {
    await mockLatency(undefined);
    const atual = this._usuarioAtual();
    if (!atual) throw new Error('NAO_AUTENTICADO');
    const atualizado: Usuario = { ...atual, ...dados };
    this.definirSessao(atualizado);
    return atualizado;
  }

  logout(): void {
    this.definirSessao(null);
  }

  private paraUsuario(usuarioMock: UsuarioMock): Usuario {
    const { senha: _senha, ...usuario } = usuarioMock;
    return usuario;
  }

  private definirSessao(usuario: Usuario | null): void {
    this._usuarioAtual.set(usuario);
    if (usuario) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));
    else localStorage.removeItem(CHAVE_SESSAO);
  }

  private carregarSessao(): Usuario | null {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    try {
      return JSON.parse(bruto) as Usuario;
    } catch {
      return null;
    }
  }
}
