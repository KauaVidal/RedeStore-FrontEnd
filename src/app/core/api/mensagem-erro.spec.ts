import { mensagemDeErro } from './mensagem-erro';

describe('mensagemDeErro', () => {
  it('usa a mensagem específica da tela quando o código bate', () => {
    expect(mensagemDeErro(new Error('ESTOQUE_INSUFICIENTE'), { ESTOQUE_INSUFICIENTE: 'Acabou.' }, 'Padrão')).toBe(
      'Acabou.',
    );
  });

  it('usa a mensagem comum para SEM_CONEXAO e VALIDACAO', () => {
    expect(mensagemDeErro(new Error('SEM_CONEXAO'), {}, 'Padrão')).toContain('servidor');
    expect(mensagemDeErro(new Error('VALIDACAO'), {}, 'Padrão')).toContain('validação');
  });

  it('cai no padrão para códigos desconhecidos e não-Errors', () => {
    expect(mensagemDeErro(new Error('XYZ'), {}, 'Padrão')).toBe('Padrão');
    expect(mensagemDeErro('qualquer coisa', {}, 'Padrão')).toBe('Padrão');
  });
});
