import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AdminShell } from './admin-shell';
import { AuthService } from '../../core/auth/auth.service';

describe('AdminShell', () => {
  let fixture: ComponentFixture<AdminShell>;
  let authServiceFalso: { usuarioAtual: ReturnType<typeof signal>; logout: jasmine.Spy };
  let router: Router;

  beforeEach(async () => {
    authServiceFalso = {
      usuarioAtual: signal({ id: '1', nome: 'Admin REDE', email: 'admin@rede.com', papel: 'admin' as const }),
      logout: jasmine.createSpy('logout'),
    };

    await TestBed.configureTestingModule({
      imports: [AdminShell],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminShell);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('mostra os links de navegação e o nome do admin logado', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Produtos');
    expect(texto).toContain('Pedidos');
    expect(texto).toContain('Eventos');
    expect(texto).toContain('Admin REDE');
  });

  it('clicar em Sair chama logout() e navega para /login', () => {
    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="botao-sair"]');
    botao.click();
    expect(authServiceFalso.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
