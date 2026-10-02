import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { paraErroApi } from './api-error';

export const API = environment.apiUrl;

export async function requisitar<T>(requisicao: Observable<T>): Promise<T> {
  try {
    return await firstValueFrom(requisicao);
  } catch (erro) {
    throw paraErroApi(erro);
  }
}

/** Igual a `requisitar`, mas trata "não encontrado" (404) como ausência: devolve `undefined`. */
export async function buscarOuIndefinido<T>(requisicao: Observable<T>): Promise<T | undefined> {
  try {
    return await requisitar(requisicao);
  } catch (erro) {
    if (erro instanceof Error && erro.message.endsWith('NAO_ENCONTRADO')) return undefined;
    throw erro;
  }
}
