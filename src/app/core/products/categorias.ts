import { Categoria } from './produto.model';

export interface CategoriaExibicao {
  valor: Categoria;
  /** Nome da seção no catálogo e no admin, ex.: "Calças". */
  rotulo: string;
  /** Nome de um item, usado no card do produto, ex.: "Calça". */
  singular: string;
  /** Aparece nas etiquetas de atalho no topo do catálogo. */
  atalho: boolean;
}

/** Categorias aceitas pela API, na ordem em que aparecem para o usuário. */
export const CATEGORIAS: readonly CategoriaExibicao[] = [
  { valor: 'camisetas', rotulo: 'Camisetas', singular: 'Camiseta', atalho: true },
  { valor: 'camisas', rotulo: 'Camisas', singular: 'Camisa', atalho: true },
  { valor: 'polos', rotulo: 'Polos', singular: 'Polo', atalho: false },
  { valor: 'regatas', rotulo: 'Regatas', singular: 'Regata', atalho: false },
  { valor: 'moletons', rotulo: 'Moletons', singular: 'Moletom', atalho: true },
  { valor: 'jaquetas', rotulo: 'Jaquetas', singular: 'Jaqueta', atalho: true },
  { valor: 'calcas', rotulo: 'Calças', singular: 'Calça', atalho: true },
  { valor: 'bermudas', rotulo: 'Bermudas', singular: 'Bermuda', atalho: true },
  { valor: 'saias', rotulo: 'Saias', singular: 'Saia', atalho: false },
  { valor: 'vestidos', rotulo: 'Vestidos', singular: 'Vestido', atalho: true },
  { valor: 'calcados', rotulo: 'Calçados', singular: 'Calçado', atalho: false },
  { valor: 'acessorios', rotulo: 'Acessórios', singular: 'Acessório', atalho: true },
];

const POR_VALOR = new Map(CATEGORIAS.map((c) => [c.valor, c]));

export function categoriaPorValor(valor: string | null | undefined): CategoriaExibicao | undefined {
  return valor ? POR_VALOR.get(valor as Categoria) : undefined;
}
