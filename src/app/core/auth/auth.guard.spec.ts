import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { adminGuard, authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('guards de autenticação', () => {
  let estaAutenticado: ReturnType<typeof signal<boolean>>;
  let isAdmin: ReturnType<typeof signal<boolean>>;
  let router: Router;

  beforeEach(() => {
    estaAutenticado = signal(false);
    isAdmin = signal(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { estaAutenticado, isAdmin } },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('authGuard permite acesso quando autenticado', () => {
    estaAutenticado.set(true);
    const resultado = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(resultado).toBeTrue();
  });

  it('authGuard redireciona para /login quando não autenticado', () => {
    const resultado = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(resultado).toEqual(router.parseUrl('/login'));
  });

  it('adminGuard permite acesso quando admin', () => {
    isAdmin.set(true);
    const resultado = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(resultado).toBeTrue();
  });

  it('adminGuard redireciona para / quando não é admin', () => {
    const resultado = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(resultado).toEqual(router.parseUrl('/'));
  });
});
