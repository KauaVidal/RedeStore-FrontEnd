import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EventService } from './event.service';
import { Evento } from './evento.model';

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventService);
  });

  it('listar() retorna todos os eventos', fakeAsync(() => {
    let eventos: Evento[] = [];
    service.listar().then((e) => (eventos = e));
    tick(400);
    expect(eventos.length).toBe(6);
  }));

  it('listar() não retorna a referência literal do mock store', fakeAsync(() => {
    let eventos: Evento[] = [];
    service.listar().then((e) => (eventos = e));
    tick(400);
    eventos.sort(() => 1);
    let segundaChamada: Evento[] = [];
    service.listar().then((e) => (segundaChamada = e));
    tick(400);
    expect(segundaChamada[0].id).toBe('1');
  }));

  it('buscarPorId() retorna o evento correspondente', fakeAsync(() => {
    let evento: Evento | undefined;
    service.buscarPorId('1').then((e) => (evento = e));
    tick(400);
    expect(evento?.titulo).toBe('Retiro de Verão REDE');
  }));

  it('buscarPorId() retorna undefined para um id inexistente', fakeAsync(() => {
    let evento: Evento | undefined;
    let chamou = false;
    service.buscarPorId('inexistente').then((e) => {
      evento = e;
      chamou = true;
    });
    tick(400);
    expect(chamou).toBeTrue();
    expect(evento).toBeUndefined();
  }));
});
