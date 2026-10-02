import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { SessaoStore } from './sessao.store';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../orders/order.service';
import { Usuario } from './usuario.model';

const API = 'http://localhost:5052';
const JOVEM: Usuario = { id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', telefone: null, papel: 'jovem' };
const ADMIN: Usuario = { id: 'a1', nome: 'Admin', email: 'admin@rede.com', telefone: null, papel: 'admin' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let sessao: SessaoStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    sessao = TestBed.inject(SessaoStore);
  });

  afterEach(() => http.verify());

  it('começa sem usuário autenticado', () => {
    expect(service.usuarioAtual()).toBeNull();
    expect(service.estaAutenticado()).toBeFalse();
  });

  it('login faz POST /auth/login e guarda usuário + token', async () => {
    const promessa = service.login('jovem@rede.com', 'senha1234');
    const req = http.expectOne(`${API}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'jovem@rede.com', senha: 'senha1234' });
    req.flush({ usuario: JOVEM, token: 'jwt-1' });

    expect((await promessa).email).toBe('jovem@rede.com');
    expect(service.estaAutenticado()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
    expect(sessao.token()).toBe('jwt-1');
  });

  it('login de admin marca isAdmin', async () => {
    const promessa = service.login('admin@rede.com', 'admin1234');
    http.expectOne(`${API}/auth/login`).flush({ usuario: ADMIN, token: 'jwt-a' });
    await promessa;
    expect(service.isAdmin()).toBeTrue();
  });

  it('login com credenciais erradas rejeita com CREDENCIAIS_INVALIDAS e não autentica', async () => {
    const promessa = service.login('jovem@rede.com', 'errada');
    http
      .expectOne(`${API}/auth/login`)
      .flush({ status: 401, title: 'CREDENCIAIS_INVALIDAS' }, { status: 401, statusText: 'Unauthorized' });
    await expectAsync(promessa).toBeRejectedWithError('CREDENCIAIS_INVALIDAS');
    expect(service.usuarioAtual()).toBeNull();
  });

  it('cadastrar faz POST /auth/cadastro e já autentica', async () => {
    const promessa = service.cadastrar({ nome: 'Jovem', email: 'jovem@rede.com', senha: 'senha1234' });
    const req = http.expectOne(`${API}/auth/cadastro`);
    expect(req.request.body).toEqual({ nome: 'Jovem', email: 'jovem@rede.com', senha: 'senha1234' });
    req.flush({ usuario: JOVEM, token: 'jwt-1' });
    expect((await promessa).papel).toBe('jovem');
    expect(service.estaAutenticado()).toBeTrue();
  });

  it('cadastrar com e-mail em uso rejeita com EMAIL_EM_USO', async () => {
    const promessa = service.cadastrar({ nome: 'X', email: 'jovem@rede.com', senha: 'senha1234' });
    http
      .expectOne(`${API}/auth/cadastro`)
      .flush({ status: 409, title: 'EMAIL_EM_USO' }, { status: 409, statusText: 'Conflict' });
    await expectAsync(promessa).toBeRejectedWithError('EMAIL_EM_USO');
  });

  it('atualizarPerfil faz PATCH /auth/perfil e atualiza o usuário mantendo o token', async () => {
    sessao.definir({ usuario: JOVEM, token: 'jwt-1' });
    const promessa = service.atualizarPerfil({ nome: 'Novo', telefone: '11999999999' });
    const req = http.expectOne(`${API}/auth/perfil`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ nome: 'Novo', telefone: '11999999999' });
    req.flush({ ...JOVEM, nome: 'Novo', telefone: '11999999999' });
    await promessa;
    expect(service.usuarioAtual()?.nome).toBe('Novo');
    expect(sessao.token()).toBe('jwt-1');
  });

  it('buscarPorId faz GET /usuarios/{id}', async () => {
    const promessa = service.buscarPorId('u1');
    http.expectOne(`${API}/usuarios/u1`).flush(JOVEM);
    expect((await promessa)?.email).toBe('jovem@rede.com');
  });

  it('buscarPorId devolve undefined em 404 e em ACESSO_NEGADO', async () => {
    const naoExiste = service.buscarPorId('x');
    http.expectOne(`${API}/usuarios/x`).flush(null, { status: 404, statusText: 'Not Found' });
    expect(await naoExiste).toBeUndefined();

    const negado = service.buscarPorId('y');
    http
      .expectOne(`${API}/usuarios/y`)
      .flush({ status: 403, title: 'ACESSO_NEGADO' }, { status: 403, statusText: 'Forbidden' });
    expect(await negado).toBeUndefined();
  });

  it('recuperarSenha faz POST /auth/recuperar-senha', async () => {
    const promessa = service.recuperarSenha('jovem@rede.com');
    const req = http.expectOne(`${API}/auth/recuperar-senha`);
    expect(req.request.body).toEqual({ email: 'jovem@rede.com' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await promessa;
  });

  it('redefinirSenha faz POST /auth/redefinir-senha e propaga TOKEN_INVALIDO', async () => {
    const promessa = service.redefinirSenha('tok', 'novaSenha123');
    const req = http.expectOne(`${API}/auth/redefinir-senha`);
    expect(req.request.body).toEqual({ token: 'tok', novaSenha: 'novaSenha123' });
    req.flush({ status: 400, title: 'TOKEN_INVALIDO' }, { status: 400, statusText: 'Bad Request' });
    await expectAsync(promessa).toBeRejectedWithError('TOKEN_INVALIDO');
  });

  it('validarSessao sem token não chama a API', async () => {
    await service.validarSessao();
    http.expectNone(`${API}/auth/me`);
  });

  it('validarSessao com token atualiza o usuário a partir de /auth/me', async () => {
    sessao.definir({ usuario: JOVEM, token: 'jwt-1' });
    const promessa = service.validarSessao();
    http.expectOne(`${API}/auth/me`).flush({ ...JOVEM, nome: 'Nome do Servidor' });
    await promessa;
    expect(service.usuarioAtual()?.nome).toBe('Nome do Servidor');
  });

  it('validarSessao mantém a sessão local quando o servidor está fora do ar', async () => {
    sessao.definir({ usuario: JOVEM, token: 'jwt-1' });
    const promessa = service.validarSessao();
    http.expectOne(`${API}/auth/me`).error(new ProgressEvent('error'));
    await promessa;
    expect(service.estaAutenticado()).toBeTrue();
  });

  it('logout limpa sessão, carrinho e último pedido', () => {
    sessao.definir({ usuario: JOVEM, token: 'jwt-1' });
    const carrinho = TestBed.inject(CartService);
    const pedidos = TestBed.inject(OrderService);
    spyOn(carrinho, 'limpar');
    spyOn(pedidos, 'limparUltimoPedido');

    service.logout();

    expect(service.usuarioAtual()).toBeNull();
    expect(sessao.token()).toBeNull();
    expect(carrinho.limpar).toHaveBeenCalled();
    expect(pedidos.limparUltimoPedido).toHaveBeenCalled();
  });

  it('encerrarSessaoExpirada tem o mesmo efeito do logout', () => {
    sessao.definir({ usuario: JOVEM, token: 'jwt-1' });
    service.encerrarSessaoExpirada();
    expect(service.estaAutenticado()).toBeFalse();
  });
});
