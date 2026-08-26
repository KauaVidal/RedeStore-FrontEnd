export type StatusInscricao = 'confirmada' | 'cancelada';

export interface Inscricao {
  id: string;
  eventoId: string;
  usuarioId: string;
  status: StatusInscricao;
  valorPago: number;
  criadoEm: string;
}
