import { HttpErrorResponse } from '@angular/common/http';

const CODIGO = /^[A-Z_]+$/;

/**
 * Converte qualquer erro de requisição em `Error(código)`, o contrato que as telas usam
 * (ex.: `erro.message === 'EMAIL_EM_USO'`). O código vem do `title` do ProblemDetails
 * do backend; quando não há código, usa um sintético por status.
 */
export function paraErroApi(erro: unknown): Error {
  if (!(erro instanceof HttpErrorResponse)) {
    return erro instanceof Error ? erro : new Error('ERRO_INTERNO');
  }
  if (erro.status === 0) return new Error('SEM_CONEXAO');

  const corpo = erro.error as { title?: unknown; errors?: unknown } | null;
  if (corpo && typeof corpo === 'object') {
    if (corpo.errors && typeof corpo.errors === 'object') return new Error('VALIDACAO');
    if (typeof corpo.title === 'string' && CODIGO.test(corpo.title)) return new Error(corpo.title);
  }

  switch (erro.status) {
    case 401:
      return new Error('NAO_AUTENTICADO');
    case 403:
      return new Error('ACESSO_NEGADO');
    case 404:
      return new Error('NAO_ENCONTRADO');
    default:
      return new Error('ERRO_INTERNO');
  }
}
