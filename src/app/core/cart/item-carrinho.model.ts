export interface ItemCarrinho {
  produtoId: string;
  nome: string;
  precoUnitario: number;
  fotoUrl: string;
  tamanho: string;
  cor: string;
  quantidade: number;
  estoqueDisponivel?: number;
}
