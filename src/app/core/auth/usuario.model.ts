export type Papel = 'jovem' | 'admin';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  papel: Papel;
}
