import { HttpErrorResponse } from '@angular/common/http';
import { paraErroApi } from './api-error';

function respostaErro(status: number, error: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('paraErroApi', () => {
  it('status 0 (sem resposta do servidor) vira SEM_CONEXAO', () => {
    expect(paraErroApi(respostaErro(0)).message).toBe('SEM_CONEXAO');
  });

  it('ProblemDetails com title em código vira Error(title)', () => {
    const erro = paraErroApi(respostaErro(409, { status: 409, title: 'ESTOQUE_INSUFICIENTE', detail: 'x' }));
    expect(erro.message).toBe('ESTOQUE_INSUFICIENTE');
  });

  it('ValidationProblem (com errors) vira VALIDACAO', () => {
    const erro = paraErroApi(
      respostaErro(400, { title: 'One or more validation errors occurred.', errors: { Email: ['inválido'] } }),
    );
    expect(erro.message).toBe('VALIDACAO');
  });

  it('title genérico do ASP.NET não é tratado como código', () => {
    expect(paraErroApi(respostaErro(404, { title: 'Not Found', status: 404 })).message).toBe('NAO_ENCONTRADO');
  });

  it('401, 403 e 404 sem corpo viram códigos sintéticos', () => {
    expect(paraErroApi(respostaErro(401)).message).toBe('NAO_AUTENTICADO');
    expect(paraErroApi(respostaErro(403)).message).toBe('ACESSO_NEGADO');
    expect(paraErroApi(respostaErro(404)).message).toBe('NAO_ENCONTRADO');
  });

  it('outros status sem código viram ERRO_INTERNO', () => {
    expect(paraErroApi(respostaErro(500)).message).toBe('ERRO_INTERNO');
    expect(paraErroApi(respostaErro(503, 'texto')).message).toBe('ERRO_INTERNO');
  });

  it('um Error comum passa adiante sem mudar', () => {
    const original = new Error('QUALQUER');
    expect(paraErroApi(original)).toBe(original);
  });
});
