import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { ItemCarrinho } from './item-carrinho.model';

const ITEM_A: Omit<ItemCarrinho, 'quantidade'> = {
  produtoId: '1',
  nome: 'Camiseta REDE Clássica',
  precoUnitario: 79.9,
  fotoUrl: 'https://picsum.photos/seed/x/480/480',
  tamanho: 'M',
  cor: 'Preto',
};

const ITEM_B: Omit<ItemCarrinho, 'quantidade'> = {
  produtoId: '6',
  nome: 'Boné REDE',
  precoUnitario: 59.9,
  fotoUrl: 'https://picsum.photos/seed/y/480/480',
  tamanho: 'Único',
  cor: 'Amarelo',
};

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('começa vazio', () => {
    expect(service.itens()).toEqual([]);
    expect(service.quantidadeTotal()).toBe(0);
  });

  it('adicionar() adiciona um item novo com a quantidade informada', () => {
    service.adicionar(ITEM_A, 2);
    expect(service.itens().length).toBe(1);
    expect(service.itens()[0].quantidade).toBe(2);
  });

  it('adicionar() o mesmo produto+tamanho+cor soma a quantidade em vez de duplicar', () => {
    service.adicionar(ITEM_A, 1);
    service.adicionar(ITEM_A, 2);
    expect(service.itens().length).toBe(1);
    expect(service.itens()[0].quantidade).toBe(3);
  });

  it('adicionar() produto, tamanho ou cor diferentes cria itens separados', () => {
    service.adicionar(ITEM_A, 1);
    service.adicionar(ITEM_B, 1);
    expect(service.itens().length).toBe(2);
  });

  it('quantidadeTotal soma as quantidades de todos os itens', () => {
    service.adicionar(ITEM_A, 2);
    service.adicionar(ITEM_B, 3);
    expect(service.quantidadeTotal()).toBe(5);
  });

  it('subtotal soma preço vezes quantidade de todos os itens', () => {
    service.adicionar(ITEM_A, 2);
    service.adicionar(ITEM_B, 1);
    expect(service.subtotal()).toBeCloseTo(79.9 * 2 + 59.9 * 1, 2);
  });

  it('atualizarQuantidade() altera a quantidade de um item existente', () => {
    service.adicionar(ITEM_A, 1);
    service.atualizarQuantidade(ITEM_A.produtoId, ITEM_A.tamanho, ITEM_A.cor, 5);
    expect(service.itens()[0].quantidade).toBe(5);
  });

  it('atualizarQuantidade() para 0 remove o item', () => {
    service.adicionar(ITEM_A, 1);
    service.atualizarQuantidade(ITEM_A.produtoId, ITEM_A.tamanho, ITEM_A.cor, 0);
    expect(service.itens().length).toBe(0);
  });

  it('removerItem() remove o item certo', () => {
    service.adicionar(ITEM_A, 1);
    service.adicionar(ITEM_B, 1);
    service.removerItem(ITEM_A.produtoId, ITEM_A.tamanho, ITEM_A.cor);
    expect(service.itens().length).toBe(1);
    expect(service.itens()[0].produtoId).toBe(ITEM_B.produtoId);
  });

  it('limpar() esvazia o carrinho', () => {
    service.adicionar(ITEM_A, 1);
    service.limpar();
    expect(service.itens()).toEqual([]);
  });

  it('adicionar() respeita o limite de estoqueDisponivel ao somar quantidade', () => {
    const itemComLimite = { ...ITEM_A, estoqueDisponivel: 3 };
    service.adicionar(itemComLimite, 2);
    service.adicionar(itemComLimite, 2);
    expect(service.itens()[0].quantidade).toBe(3);
  });

  it('atualizarQuantidade() respeita o limite de estoqueDisponivel', () => {
    const itemComLimite = { ...ITEM_A, estoqueDisponivel: 3 };
    service.adicionar(itemComLimite, 1);
    service.atualizarQuantidade(ITEM_A.produtoId, ITEM_A.tamanho, ITEM_A.cor, 10);
    expect(service.itens()[0].quantidade).toBe(3);
  });

  it('persiste no localStorage e restaura numa nova instância', () => {
    service.adicionar(ITEM_A, 2);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const novaInstancia = TestBed.inject(CartService);

    expect(novaInstancia.itens().length).toBe(1);
    expect(novaInstancia.itens()[0].quantidade).toBe(2);
  });
});
