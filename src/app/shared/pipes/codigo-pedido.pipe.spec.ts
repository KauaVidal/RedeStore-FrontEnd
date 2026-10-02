import { CodigoPedidoPipe } from './codigo-pedido.pipe';

describe('CodigoPedidoPipe', () => {
  const pipe = new CodigoPedidoPipe();

  it('encurta um GUID para os 8 primeiros caracteres em maiúsculas', () => {
    expect(pipe.transform('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')).toBe('A1B2C3D4');
  });

  it('mantém ids curtos como estão', () => {
    expect(pipe.transform('1')).toBe('1');
  });
});
