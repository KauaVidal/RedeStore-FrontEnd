import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessaoStore } from '../auth/sessao.store';
import { AuthService } from '../auth/auth.service';

/** Rotas em que 401 significa "credencial errada", não "sessão expirada". */
const ROTAS_DE_CREDENCIAL = ['/auth/login', '/auth/cadastro'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(SessaoStore).token();
  const auth = inject(AuthService);
  const router = inject(Router);

  const ehApi = req.url.startsWith(environment.apiUrl);
  const requisicao = token && ehApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requisicao).pipe(
    catchError((erro: unknown) => {
      const sessaoExpirou =
        erro instanceof HttpErrorResponse &&
        erro.status === 401 &&
        !!token &&
        ehApi &&
        !ROTAS_DE_CREDENCIAL.some((rota) => req.url.endsWith(rota));
      if (sessaoExpirou) {
        auth.encerrarSessaoExpirada();
        router.navigateByUrl('/login');
      }
      return throwError(() => erro);
    }),
  );
};
