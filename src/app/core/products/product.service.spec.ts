import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Produto } from './produto.model';

const API = 'http://localhost:5052';
const PRODUTO: Produto = {
  id: 'p1',
  nome: 'Camiseta REDE',
  categoria: 'camisetas',
  preco: 79.9,
  descricao: 'Algodão',
  fotos: ['https://x/1.jpg'],
  tamanhos: ['P'],
  cores: ['Preto'],
  destaque: true,
  variacoes: [{ id: 'v1', tamanho: 'P', cor: 'Preto', estoque: 3 }],
};

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar sem filtro faz GET /produtos sem parâmetros', async () => {
    const promessa = service.listar();
    const req = http.expectOne(`${API}/produtos`);
    expect(req.request.params.keys()).toEqual([]);
    req.flush([PRODUTO]);
    expect(await promessa).toEqual([PRODUTO]);
  });

  it('listar envia categoria e busca (aparada) como query params', async () => {
    const promessa = service.listar({ categoria: 'moletons', busca: '  rede ' });
    const req = http.expectOne((r) => r.url === `${API}/produtos`);
    expect(req.request.params.get('categoria')).toBe('moletons');
    expect(req.request.params.get('busca')).toBe('rede');
    req.flush([]);
    await promessa;
  });

  it('listar ignora busca vazia', async () => {
    const promessa = service.listar({ busca: '   ' });
    const req = http.expectOne((r) => r.url === `${API}/produtos`);
    expect(req.request.params.has('busca')).toBeFalse();
    req.flush([]);
    await promessa;
  });

  it('listarDestaques faz GET /produtos/destaques', async () => {
    const promessa = service.listarDestaques();
    http.expectOne(`${API}/produtos/destaques`).flush([PRODUTO]);
    expect((await promessa).length).toBe(1);
  });

  it('buscarPorId faz GET /produtos/{id}', async () => {
    const promessa = service.buscarPorId('p1');
    http.expectOne(`${API}/produtos/p1`).flush(PRODUTO);
    expect((await promessa)?.nome).toBe('Camiseta REDE');
  });

  it('buscarPorId devolve undefined para id inexistente ou que não é GUID (404)', async () => {
    const promessa = service.buscarPorId('abc');
    http.expectOne(`${API}/produtos/abc`).flush(null, { status: 404, statusText: 'Not Found' });
    expect(await promessa).toBeUndefined();
  });

  it('criar faz POST /produtos sem tamanhos/cores e sem ids de variação', async () => {
    const { id: _id, ...dados } = PRODUTO;
    const promessa = service.criar(dados);
    const req = http.expectOne(`${API}/produtos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nome: 'Camiseta REDE',
      categoria: 'camisetas',
      preco: 79.9,
      descricao: 'Algodão',
      fotos: ['https://x/1.jpg'],
      destaque: true,
      variacoes: [{ tamanho: 'P', cor: 'Preto', estoque: 3 }],
    });
    req.flush(PRODUTO);
    expect((await promessa).id).toBe('p1');
  });

  it('atualizar faz PATCH /produtos/{id} só com os campos enviados', async () => {
    const promessa = service.atualizar('p1', { preco: 69.9, tamanhos: ['P'] });
    const req = http.expectOne(`${API}/produtos/p1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ preco: 69.9 });
    req.flush({ ...PRODUTO, preco: 69.9 });
    expect((await promessa).preco).toBe(69.9);
  });

  it('remover faz DELETE /produtos/{id}', async () => {
    const promessa = service.remover('p1');
    const req = http.expectOne(`${API}/produtos/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await promessa;
  });
});
