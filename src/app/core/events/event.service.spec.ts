import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EventService } from './event.service';
import { DadosEvento, Evento } from './evento.model';

const API = 'http://localhost:5052';
const EVENTO: Evento = {
  id: 'e1',
  titulo: 'Retiro',
  descricao: 'Imersão',
  dataHora: '2026-12-20T19:00:00Z',
  local: 'Sítio',
  preco: 150,
  vagasTotais: 100,
  vagasRestantes: 37,
  foto: 'https://x/e.jpg',
};
const { id: _id, vagasRestantes: _v, ...DADOS } = EVENTO;

describe('EventService', () => {
  let service: EventService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EventService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar faz GET /eventos e traz vagasRestantes', async () => {
    const promessa = service.listar();
    http.expectOne(`${API}/eventos`).flush([EVENTO]);
    expect((await promessa)[0].vagasRestantes).toBe(37);
  });

  it('buscarPorId faz GET /eventos/{id}', async () => {
    const promessa = service.buscarPorId('e1');
    http.expectOne(`${API}/eventos/e1`).flush(EVENTO);
    expect((await promessa)?.titulo).toBe('Retiro');
  });

  it('buscarPorId devolve undefined em 404 (inclui id que não é GUID)', async () => {
    const promessa = service.buscarPorId('1');
    http.expectOne(`${API}/eventos/1`).flush(null, { status: 404, statusText: 'Not Found' });
    expect(await promessa).toBeUndefined();
  });

  it('criar faz POST /eventos com os dados (sem id nem vagasRestantes)', async () => {
    const promessa = service.criar(DADOS as DadosEvento);
    const req = http.expectOne(`${API}/eventos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(DADOS);
    req.flush(EVENTO);
    expect((await promessa).id).toBe('e1');
  });

  it('atualizar faz PATCH /eventos/{id} e propaga EVENTO_VAGAS_TOTAIS_INSUFICIENTES', async () => {
    const promessa = service.atualizar('e1', { vagasTotais: 1 });
    const req = http.expectOne(`${API}/eventos/e1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ vagasTotais: 1 });
    req.flush(
      { status: 409, title: 'EVENTO_VAGAS_TOTAIS_INSUFICIENTES' },
      { status: 409, statusText: 'Conflict' },
    );
    await expectAsync(promessa).toBeRejectedWithError('EVENTO_VAGAS_TOTAIS_INSUFICIENTES');
  });

  it('remover faz DELETE /eventos/{id}', async () => {
    const promessa = service.remover('e1');
    const req = http.expectOne(`${API}/eventos/e1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await promessa;
  });
});
