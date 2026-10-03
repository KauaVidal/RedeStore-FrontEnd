/** Tom aproximado de cada nome de cor usado no cadastro, para as amostras do card. Cores desconhecidas usam grafite. */
const TONS: Record<string, string> = {
  preto: '#0D0D0D',
  branco: '#F6F4EC',
  'off-white': '#EBE7DB',
  'off white': '#EBE7DB',
  creme: '#EBE7DB',
  bege: '#D8C8A8',
  cinza: '#8A8A8A',
  mescla: '#A3A3A3',
  grafite: '#3A3835',
  azul: '#2F4F8F',
  marinho: '#1F2A44',
  verde: '#3F6B4A',
  vermelho: '#B23A2E',
  vinho: '#5E1F2A',
  amarelo: '#F4C617',
  laranja: '#D9733B',
  rosa: '#D98BA0',
  roxo: '#5E3F8F',
  marrom: '#6B4A33',
  caramelo: '#A86A32',
};

export function tomDaCor(nome: string): string {
  return TONS[nome.trim().toLowerCase()] ?? 'var(--rede-graphite)';
}
