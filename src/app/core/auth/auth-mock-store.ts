import { Usuario } from './usuario.model';

export interface UsuarioMock extends Usuario {
  senha: string;
}

export const USUARIOS_MOCK: UsuarioMock[] = [
  { id: '1', nome: 'Admin REDE', email: 'admin@rede.com', senha: 'admin123', papel: 'admin' },
  { id: '2', nome: 'Jovem Teste', email: 'jovem@rede.com', senha: 'jovem123', papel: 'jovem' },
];
