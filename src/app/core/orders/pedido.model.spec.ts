import { proximoStatus } from './pedido.model';

describe('proximoStatus', () => {
  it('de pago avança para em_preparo, independente da forma de entrega', () => {
    expect(proximoStatus({ status: 'pago', formaEntrega: 'retirada' })).toBe('em_preparo');
    expect(proximoStatus({ status: 'pago', formaEntrega: 'entrega' })).toBe('em_preparo');
  });

  it('de em_preparo avança para retirado quando a entrega é retirada', () => {
    expect(proximoStatus({ status: 'em_preparo', formaEntrega: 'retirada' })).toBe('retirado');
  });

  it('de em_preparo avança para entregue quando a entrega é por entrega', () => {
    expect(proximoStatus({ status: 'em_preparo', formaEntrega: 'entrega' })).toBe('entregue');
  });

  it('retorna null para os status finais (retirado, entregue)', () => {
    expect(proximoStatus({ status: 'retirado', formaEntrega: 'retirada' })).toBeNull();
    expect(proximoStatus({ status: 'entregue', formaEntrega: 'entrega' })).toBeNull();
  });
});
