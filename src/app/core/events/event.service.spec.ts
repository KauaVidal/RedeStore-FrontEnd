import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EventService } from './event.service';
import { EVENTOS_MOCK } from './event-mock-store';
import { Evento } from './evento.model';

describe('EventService', () => {
  let service: EventService;
  let snapshot: Evento[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventService);
    snapshot = EVENTOS_MOCK.map((e) => ({ ...e }));
  });

  afterEach(() => {
    EVENTOS_MOCK.length = 0;
    EVENTOS_MOCK.push(...snapshot);
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

  it('criar() adiciona um novo evento com id sequencial', fakeAsync(() => {
    let evento: Evento | undefined;
    service
      .criar({
        titulo: 'Culto de Jovens',
        descricao: 'Descrição',
        dataHora: '2026-11-01T19:00:00.000Z',
        local: 'Templo sede, Vila Maria',
        preco: 0,
        vagasTotais: 50,
        foto: 'https://picsum.photos/seed/novo-evento/480/480',
      })
      .then((e) => (evento = e));
    tick(400);
    expect(evento?.id).toBe('7');

    let todos: Evento[] = [];
    service.listar().then((e) => (todos = e));
    tick(400);
    expect(todos.length).toBe(7);
  }));

  it('atualizar() altera os campos informados sem afetar os demais', fakeAsync(() => {
    let evento: Evento | undefined;
    service.atualizar('1', { vagasTotais: 10 }).then((e) => (evento = e));
    tick(400);
    expect(evento?.vagasTotais).toBe(10);
    expect(evento?.titulo).toBe('Retiro de Verão REDE');
  }));

  it('atualizar() rejeita quando o id não existe', fakeAsync(() => {
    let erro: Error | undefined;
    service.atualizar('inexistente', { vagasTotais: 10 }).catch((e) => (erro = e));
    tick(400);
    expect(erro?.message).toBe('EVENTO_NAO_ENCONTRADO');
  }));

  it('remover() tira o evento da listagem', fakeAsync(() => {
    service.remover('1');
    tick(400);
    let todos: Evento[] = [];
    service.listar().then((e) => (todos = e));
    tick(400);
    expect(todos.find((e) => e.id === '1')).toBeUndefined();
    expect(todos.length).toBe(5);
  }));

  it('remover() com id inexistente não lança erro nem altera a lista', fakeAsync(() => {
    service.remover('inexistente');
    tick(400);
    let todos: Evento[] = [];
    service.listar().then((e) => (todos = e));
    tick(400);
    expect(todos.length).toBe(6);
  }));
});
