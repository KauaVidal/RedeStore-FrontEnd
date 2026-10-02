import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { SessaoStore } from '../auth/sessao.store';
import { AuthService } from '../auth/auth.service';

const API = 'http://localhost:5052';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controle: HttpTestingController;
  let sessao: SessaoStore;
  let authFalso: { encerrarSessaoExpirada: jasmine.Spy };
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    authFalso = { encerrarSessaoExpirada: jasmine.createSpy('encerrarSessaoExpirada') };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authFalso },
      ],
    });
    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
    sessao = TestBed.inject(SessaoStore);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
  });

  afterEach(() => controle.verify());

  function logar(): void {
    sessao.definir({ usuario: { id: 'u1', nome: 'J', email: 'j@rede.com', papel: 'jovem' }, token: 'jwt-1' });
  }

  it('adiciona Authorization: Bearer quando há token', () => {
    logar();
    http.get(`${API}/usuarios/me/pedidos`).subscribe();
    const req = controle.expectOne(`${API}/usuarios/me/pedidos`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-1');
    req.flush([]);
  });

  it('não adiciona Authorization sem token', () => {
    http.get(`${API}/produtos`).subscribe();
    const req = controle.expectOne(`${API}/produtos`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('não envia o token para domínio que só começa com a URL da API', () => {
    logar();
    http.get(`${API}.dominio-malicioso.com/x`).subscribe();
    const req = controle.expectOne(`${API}.dominio-malicioso.com/x`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('não envia o token para outros domínios', () => {
    logar();
    http.get('https://picsum.photos/x').subscribe();
    const req = controle.expectOne('https://picsum.photos/x');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush('');
  });

  it('401 com sessão ativa encerra a sessão, vai para /login e repassa o erro', async () => {
    logar();
    const promessa = firstValueFrom(http.get(`${API}/usuarios/me/pedidos`));
    controle.expectOne(`${API}/usuarios/me/pedidos`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await expectAsync(promessa).toBeRejected();
    expect(authFalso.encerrarSessaoExpirada).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('401 do próprio /auth/login (senha errada) não desloga nem redireciona', async () => {
    logar();
    const promessa = firstValueFrom(http.post(`${API}/auth/login`, {}));
    controle
      .expectOne(`${API}/auth/login`)
      .flush({ title: 'CREDENCIAIS_INVALIDAS' }, { status: 401, statusText: 'Unauthorized' });
    await expectAsync(promessa).toBeRejected();
    expect(authFalso.encerrarSessaoExpirada).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('401 sem sessão (visitante) não redireciona', async () => {
    const promessa = firstValueFrom(http.get(`${API}/auth/me`));
    controle.expectOne(`${API}/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await expectAsync(promessa).toBeRejected();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
