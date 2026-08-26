import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ProductService } from './product.service';
import { PRODUTOS_MOCK } from './product-mock-store';
import { Produto } from './produto.model';

describe('ProductService', () => {
  let service: ProductService;
  let snapshot: Produto[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
    snapshot = PRODUTOS_MOCK.map((p) => ({ ...p, variacoes: p.variacoes.map((v) => ({ ...v })) }));
  });

  afterEach(() => {
    PRODUTOS_MOCK.length = 0;
    PRODUTOS_MOCK.push(...snapshot);
  });

  it('listar() sem filtro retorna todos os produtos', fakeAsync(() => {
    let produtos: Produto[] = [];
    service.listar().then((p) => (produtos = p));
    tick(400);
    expect(produtos.length).toBe(7);
  }));

  it('listar({ categoria }) filtra por categoria', fakeAsync(() => {
    let produtos: Produto[] = [];
    service.listar({ categoria: 'acessorios' }).then((p) => (produtos = p));
    tick(400);
    expect(produtos.length).toBe(2);
    expect(produtos.every((p) => p.categoria === 'acessorios')).toBeTrue();
  }));

  it('listar({ busca }) filtra por nome, sem diferenciar maiúsculas/minúsculas', fakeAsync(() => {
    let produtos: Produto[] = [];
    service.listar({ busca: 'MOLETOM' }).then((p) => (produtos = p));
    tick(400);
    expect(produtos.length).toBe(2);
    expect(produtos.every((p) => p.nome.toLowerCase().includes('moletom'))).toBeTrue();
  }));

  it('listarDestaques() retorna só os produtos em destaque', fakeAsync(() => {
    let produtos: Produto[] = [];
    service.listarDestaques().then((p) => (produtos = p));
    tick(400);
    expect(produtos.length).toBe(3);
    expect(produtos.every((p) => p.destaque)).toBeTrue();
  }));

  it('buscarPorId() retorna o produto correspondente', fakeAsync(() => {
    let produto: Produto | undefined;
    service.buscarPorId('1').then((p) => (produto = p));
    tick(400);
    expect(produto?.nome).toBe('Camiseta REDE Clássica');
  }));

  it('buscarPorId() retorna undefined para um id inexistente', fakeAsync(() => {
    let produto: Produto | undefined;
    let chamou = false;
    service.buscarPorId('inexistente').then((p) => {
      produto = p;
      chamou = true;
    });
    tick(400);
    expect(chamou).toBeTrue();
    expect(produto).toBeUndefined();
  }));

  it('criar() adiciona um novo produto com id sequencial', fakeAsync(() => {
    let produto: Produto | undefined;
    service
      .criar({
        nome: 'Camiseta Nova',
        categoria: 'camisetas',
        preco: 99.9,
        descricao: 'Descrição',
        fotos: ['https://picsum.photos/seed/nova/480/480'],
        tamanhos: ['M'],
        cores: ['Preto'],
        destaque: false,
        variacoes: [{ tamanho: 'M', cor: 'Preto', estoque: 5 }],
      })
      .then((p) => (produto = p));
    tick(400);
    expect(produto?.id).toBe('8');
    expect(produto?.nome).toBe('Camiseta Nova');

    let todos: Produto[] = [];
    service.listar().then((p) => (todos = p));
    tick(400);
    expect(todos.length).toBe(8);
  }));

  it('atualizar() altera os campos informados sem afetar os demais', fakeAsync(() => {
    let produto: Produto | undefined;
    service.atualizar('1', { preco: 89.9 }).then((p) => (produto = p));
    tick(400);
    expect(produto?.preco).toBe(89.9);
    expect(produto?.nome).toBe('Camiseta REDE Clássica');
  }));

  it('atualizar() rejeita quando o id não existe', fakeAsync(() => {
    let erro: Error | undefined;
    service.atualizar('inexistente', { preco: 10 }).catch((e) => (erro = e));
    tick(400);
    expect(erro?.message).toBe('PRODUTO_NAO_ENCONTRADO');
  }));

  it('remover() tira o produto da listagem', fakeAsync(() => {
    service.remover('1');
    tick(400);
    let todos: Produto[] = [];
    service.listar().then((p) => (todos = p));
    tick(400);
    expect(todos.find((p) => p.id === '1')).toBeUndefined();
    expect(todos.length).toBe(6);
  }));

  it('remover() com id inexistente não lança erro nem altera a lista', fakeAsync(() => {
    service.remover('inexistente');
    tick(400);
    let todos: Produto[] = [];
    service.listar().then((p) => (todos = p));
    tick(400);
    expect(todos.length).toBe(7);
  }));
});
