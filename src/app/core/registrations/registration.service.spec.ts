import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RegistrationService } from './registration.service';
import { INSCRICOES_MOCK } from './registration-mock-store';
import { Inscricao } from './inscricao.model';

describe('RegistrationService', () => {
  let service: RegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistrationService);
  });

  afterEach(() => {
    INSCRICOES_MOCK.length = 0;
  });

  it('inscrever() cria uma inscrição confirmada', fakeAsync(() => {
    let inscricao: Inscricao | undefined;
    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250 }).then((i) => (inscricao = i));
    tick(400);
    expect(inscricao?.status).toBe('confirmada');
    expect(inscricao?.eventoId).toBe('1');
    expect(inscricao?.valorPago).toBe(250);
  }));

  it('cancelar() muda o status da inscrição para cancelada', fakeAsync(() => {
    let inscricao: Inscricao | undefined;
    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250 }).then((i) => (inscricao = i));
    tick(400);
    service.cancelar(inscricao!.id);
    tick(400);

    let lista: Inscricao[] = [];
    service.listarPorUsuario('u1').then((i) => (lista = i));
    tick(400);
    expect(lista[0].status).toBe('cancelada');
  }));

  it('listarPorUsuario() retorna só as inscrições do usuário, mais recentes primeiro', fakeAsync(() => {
    // Timestamps forçados a serem estritamente crescentes: tick() só virtualiza
    // setTimeout, não Date — sem isso, criadoEm poderia empatar entre chamadas
    // próximas e o teste de ordenação ficaria dependente de timing real (mesma
    // licao aprendida no OrderService da Loja).
    spyOn(Date.prototype, 'toISOString').and.returnValues(
      '2024-01-01T00:00:00.000Z',
      '2024-01-01T00:00:01.000Z',
      '2024-01-01T00:00:02.000Z',
    );

    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250 });
    tick(400);
    service.inscrever({ eventoId: '2', usuarioId: 'u2', valorPago: 0 });
    tick(400);
    service.inscrever({ eventoId: '3', usuarioId: 'u1', valorPago: 0 });
    tick(400);

    let lista: Inscricao[] = [];
    service.listarPorUsuario('u1').then((i) => (lista = i));
    tick(400);
    expect(lista.length).toBe(2);
    expect(lista[0].eventoId).toBe('3');
  }));

  it('vagasRestantes() desconta apenas inscrições confirmadas', fakeAsync(() => {
    let a: Inscricao | undefined;
    let b: Inscricao | undefined;
    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250 }).then((i) => (a = i));
    tick(400);
    service.inscrever({ eventoId: '1', usuarioId: 'u2', valorPago: 250 }).then((i) => (b = i));
    tick(400);
    service.cancelar(b!.id);
    tick(400);

    let vagas = -1;
    service.vagasRestantes('1', 4).then((v) => (vagas = v));
    tick(400);
    expect(vagas).toBe(3);
  }));

  it('vagasRestantes() ignora inscrições de outros eventos', fakeAsync(() => {
    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250 });
    tick(400);
    service.inscrever({ eventoId: '2', usuarioId: 'u1', valorPago: 0 });
    tick(400);

    let vagas = -1;
    service.vagasRestantes('2', 100).then((v) => (vagas = v));
    tick(400);
    expect(vagas).toBe(99);
  }));
});
