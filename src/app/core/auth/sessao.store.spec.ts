import { TestBed } from '@angular/core/testing';
import { Sessao, SessaoStore } from './sessao.store';

const SESSAO: Sessao = {
  usuario: { id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' },
  token: 'jwt-abc',
};

function novoStore(): SessaoStore {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(SessaoStore);
}

describe('SessaoStore', () => {
  beforeEach(() => localStorage.clear());

  it('começa vazio sem nada salvo', () => {
    const store = novoStore();
    expect(store.sessao()).toBeNull();
    expect(store.usuario()).toBeNull();
    expect(store.token()).toBeNull();
  });

  it('definir() expõe usuário e token e persiste em rede_sessao', () => {
    const store = novoStore();
    store.definir(SESSAO);
    expect(store.usuario()?.email).toBe('jovem@rede.com');
    expect(store.token()).toBe('jwt-abc');
    expect(JSON.parse(localStorage.getItem('rede_sessao')!)).toEqual(SESSAO);
  });

  it('restaura a sessão salva numa nova instância', () => {
    novoStore().definir(SESSAO);
    expect(novoStore().token()).toBe('jwt-abc');
  });

  it('definir(null) limpa memória e localStorage', () => {
    const store = novoStore();
    store.definir(SESSAO);
    store.definir(null);
    expect(store.sessao()).toBeNull();
    expect(localStorage.getItem('rede_sessao')).toBeNull();
  });

  it('atualizarUsuario() troca o usuário e mantém o token', () => {
    const store = novoStore();
    store.definir(SESSAO);
    store.atualizarUsuario({ ...SESSAO.usuario, nome: 'Novo Nome' });
    expect(store.usuario()?.nome).toBe('Novo Nome');
    expect(store.token()).toBe('jwt-abc');
  });

  it('ignora e remove a sessão antiga do mock (rede_sessao_usuario, sem token)', () => {
    localStorage.setItem('rede_sessao_usuario', JSON.stringify(SESSAO.usuario));
    const store = novoStore();
    expect(store.sessao()).toBeNull();
    expect(localStorage.getItem('rede_sessao_usuario')).toBeNull();
  });

  it('ignora sessão corrompida ou sem token', () => {
    localStorage.setItem('rede_sessao', '{quebrado');
    expect(novoStore().sessao()).toBeNull();
    localStorage.setItem('rede_sessao', JSON.stringify({ usuario: SESSAO.usuario }));
    expect(novoStore().sessao()).toBeNull();
  });
});
