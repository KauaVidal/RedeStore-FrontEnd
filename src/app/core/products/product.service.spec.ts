import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ProductService } from './product.service';
import { Produto } from './produto.model';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
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
});
