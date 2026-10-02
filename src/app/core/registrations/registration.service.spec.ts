import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RegistrationService } from './registration.service';
import { Inscricao } from './inscricao.model';

const API = 'http://localhost:5052';
const INSCRICAO: Inscricao = {
  id: 'i1',
  eventoId: 'e1',
  usuarioId: 'u1',
  status: 'confirmada',
  valorPago: 150,
  criadoEm: '2026-10-01T14:32:10.123Z',
};

describe('RegistrationService', () => {
  let service: RegistrationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RegistrationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('inscrever faz POST /eventos/{id}/inscricoes sem corpo e devolve "criada"', async () => {
    const promessa = service.inscrever('e1');
    const req = http.expectOne(`${API}/eventos/e1/inscricoes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({ resultado: 'criada', inscricao: INSCRICAO });
    expect(await promessa).toEqual({ resultado: 'criada', inscricao: INSCRICAO });
  });

  it('inscrever devolve "ja_inscrito" com a inscrição existente', async () => {
    const promessa = service.inscrever('e1');
    http.expectOne(`${API}/eventos/e1/inscricoes`).flush({ resultado: 'ja_inscrito', inscricao: INSCRICAO });
    expect(await promessa).toEqual({ resultado: 'ja_inscrito', inscricao: INSCRICAO });
  });

  it('inscrever devolve "esgotado" sem inscrição', async () => {
    const promessa = service.inscrever('e1');
    http.expectOne(`${API}/eventos/e1/inscricoes`).flush({ resultado: 'esgotado', inscricao: null });
    expect(await promessa).toEqual({ resultado: 'esgotado' });
  });

  it('listarMinhas faz GET /usuarios/me/inscricoes', async () => {
    const promessa = service.listarMinhas();
    http.expectOne(`${API}/usuarios/me/inscricoes`).flush([INSCRICAO]);
    expect(await promessa).toEqual([INSCRICAO]);
  });

  it('listarPorEvento faz GET /eventos/{id}/inscricoes', async () => {
    const promessa = service.listarPorEvento('e1');
    http.expectOne(`${API}/eventos/e1/inscricoes`).flush([INSCRICAO]);
    expect((await promessa).length).toBe(1);
  });

  it('cancelar faz PATCH /inscricoes/{id}/cancelar sem corpo', async () => {
    const promessa = service.cancelar('i1');
    const req = http.expectOne(`${API}/inscricoes/i1/cancelar`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeNull();
    req.flush({ ...INSCRICAO, status: 'cancelada' });
    await promessa;
  });
});
