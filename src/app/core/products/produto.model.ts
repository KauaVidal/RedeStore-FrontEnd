export type Categoria = 'camisetas' | 'moletons' | 'acessorios';

export interface Variacao {
  tamanho: string;
  cor: string;
  estoque: number;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: Categoria;
  preco: number;
  descricao: string;
  fotos: string[];
  tamanhos: string[];
  cores: string[];
  variacoes: Variacao[];
  destaque: boolean;
}

export interface FiltroProdutos {
  categoria?: Categoria;
  busca?: string;
}
