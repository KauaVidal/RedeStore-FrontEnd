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
    let resultado: Awaited<ReturnType<typeof service.inscrever>> | undefined;
    service
      .inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250, vagasTotais: 4 })
      .then((r) => (resultado = r));
    tick(400);
    expect(resultado?.resultado).toBe('criada');
    const inscricao = resultado?.resultado === 'criada' ? resultado.inscricao : undefined;
    expect(inscricao?.status).toBe('confirmada');
    expect(inscricao?.eventoId).toBe('1');
    expect(inscricao?.valorPago).toBe(250);
  }));

  it('inscrever() é idempotente: não cria uma segunda inscrição confirmada para o mesmo usuário e evento', fakeAsync(() => {
    let primeiro: Awaited<ReturnType<typeof service.inscrever>> | undefined;
    let segundo: Awaited<ReturnType<typeof service.inscrever>> | undefined;

    service
      .inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250, vagasTotais: 4 })
      .then((r) => (primeiro = r));
    tick(400);
    service
      .inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250, vagasTotais: 4 })
      .then((r) => (segundo = r));
    tick(400);

    expect(primeiro?.resultado).toBe('criada');
    expect(segundo?.resultado).toBe('ja_inscrito');
    if (primeiro?.resultado !== 'esgotado' && segundo?.resultado !== 'esgotado') {
      expect(segundo?.inscricao.id).toBe(primeiro?.inscricao.id);
    }
    expect(INSCRICOES_MOCK.filter((i) => i.eventoId === '1' && i.usuarioId === 'u1').length).toBe(1);
  }));

  it('inscrever() rejeita quando o evento já está com todas as vagas ocupadas', fakeAsync(() => {
    let a: Awaited<ReturnType<typeof service.inscrever>> | undefined;
    let b: Awaited<ReturnType<typeof service.inscrever>> | undefined;
    let c: Awaited<ReturnType<typeof service.inscrever>> | undefined;

    service.inscrever({ eventoId: '4', usuarioId: 'u1', valorPago: 180, vagasTotais: 2 }).then((r) => (a = r));
    tick(400);
    service.inscrever({ eventoId: '4', usuarioId: 'u2', valorPago: 180, vagasTotais: 2 }).then((r) => (b = r));
    tick(400);
    service.inscrever({ eventoId: '4', usuarioId: 'u3', valorPago: 180, vagasTotais: 2 }).then((r) => (c = r));
    tick(400);

    expect(a?.resultado).toBe('criada');
    expect(b?.resultado).toBe('criada');
    expect(c?.resultado).toBe('esgotado');
    expect(INSCRICOES_MOCK.filter((i) => i.eventoId === '4' && i.status === 'confirmada').length).toBe(2);
  }));

  it('cancelar() muda o status da inscrição para cancelada', fakeAsync(() => {
    let resultado: Awaited<ReturnType<typeof service.inscrever>> | undefined;
    service
      .inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250, vagasTotais: 4 })
      .then((r) => (resultado = r));
    tick(400);
    const inscricao = resultado?.resultado !== 'esgotado' ? resultado?.inscricao : undefined;
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

    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250, vagasTotais: 4 });
    tick(400);
    service.inscrever({ eventoId: '2', usuarioId: 'u2', valorPago: 0, vagasTotais: 4 });
    tick(400);
    service.inscrever({ eventoId: '3', usuarioId: 'u1', valorPago: 0, vagasTotais: 4 });
    tick(400);

    let lista: Inscricao[] = [];
    service.listarPorUsuario('u1').then((i) => (lista = i));
    tick(400);
    expect(lista.length).toBe(2);
    expect(lista[0].eventoId).toBe('3');
  }));

  it('vagasRestantes() desconta apenas inscrições confirmadas', fakeAsync(() => {
    let b: Awaited<ReturnType<typeof service.inscrever>> | undefined;
    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250, vagasTotais: 4 });
    tick(400);
    service.inscrever({ eventoId: '1', usuarioId: 'u2', valorPago: 250, vagasTotais: 4 }).then((r) => (b = r));
    tick(400);
    const inscricaoB = b?.resultado !== 'esgotado' ? b?.inscricao : undefined;
    service.cancelar(inscricaoB!.id);
    tick(400);

    let vagas = -1;
    service.vagasRestantes('1', 4).then((v) => (vagas = v));
    tick(400);
    expect(vagas).toBe(3);
  }));

  it('vagasRestantes() ignora inscrições de outros eventos', fakeAsync(() => {
    service.inscrever({ eventoId: '1', usuarioId: 'u1', valorPago: 250, vagasTotais: 4 });
    tick(400);
    service.inscrever({ eventoId: '2', usuarioId: 'u1', valorPago: 0, vagasTotais: 100 });
    tick(400);

    let vagas = -1;
    service.vagasRestantes('2', 100).then((v) => (vagas = v));
    tick(400);
    expect(vagas).toBe(99);
  }));
});
