import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { buscarOuIndefinido, requisitar } from './api';

const falha = (status: number, error: unknown = null) =>
  throwError(() => new HttpErrorResponse({ status, error }));

describe('requisitar', () => {
  it('resolve com o primeiro valor emitido', async () => {
    expect(await requisitar(of(42))).toBe(42);
  });

  it('rejeita com Error(código) convertido do ProblemDetails', async () => {
    await expectAsync(requisitar(falha(409, { title: 'EMAIL_EM_USO' }))).toBeRejectedWithError('EMAIL_EM_USO');
  });
});

describe('buscarOuIndefinido', () => {
  it('devolve undefined para 404 sem corpo (ex.: id que não é GUID)', async () => {
    expect(await buscarOuIndefinido(falha(404))).toBeUndefined();
  });

  it('devolve undefined para *_NAO_ENCONTRADO', async () => {
    expect(await buscarOuIndefinido(falha(404, { title: 'PRODUTO_NAO_ENCONTRADO' }))).toBeUndefined();
  });

  it('repassa outros erros', async () => {
    await expectAsync(buscarOuIndefinido(falha(0))).toBeRejectedWithError('SEM_CONEXAO');
  });
});
