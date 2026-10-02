export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  dataHora: string;
  local: string;
  preco: number;
  vagasTotais: number;
  /** Calculado pelo backend: vagasTotais − inscrições confirmadas. */
  vagasRestantes: number;
  foto: string;
}

/** O que o admin envia ao criar/editar: sem id e sem o campo calculado. */
export type DadosEvento = Omit<Evento, 'id' | 'vagasRestantes'>;
