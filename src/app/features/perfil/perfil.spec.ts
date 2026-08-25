import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Perfil } from './perfil';
import { AuthService } from '../../core/auth/auth.service';

describe('Perfil', () => {
  let fixture: ComponentFixture<Perfil>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'atualizarPerfil' | 'logout'>> & {
    usuarioAtual: ReturnType<typeof signal>;
  };
  let router: Router;

  beforeEach(async () => {
    authServiceFalso = {
      usuarioAtual: signal({ id: '2', nome: 'Jovem Teste', email: 'jovem@rede.com', papel: 'jovem' as const }),
      atualizarPerfil: jasmine.createSpy('atualizarPerfil').and.resolveTo(),
      logout: jasmine.createSpy('logout'),
    };
    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();
    fixture = TestBed.createComponent(Perfil);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('preenche o formulário com os dados do usuário atual', () => {
    expect(fixture.componentInstance['form'].value.nome).toBe('Jovem Teste');
    expect(fixture.componentInstance['form'].value.email).toBe('jovem@rede.com');
  });

  it('mostra estados vazios de pedidos e eventos', () => {
    expect(fixture.nativeElement.textContent).toContain('nenhum pedido');
    expect(fixture.nativeElement.textContent).toContain('nenhum evento');
  });

  it('chama atualizarPerfil ao salvar', async () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(authServiceFalso.atualizarPerfil).toHaveBeenCalled();
  });

  it('faz logout e navega para /login', () => {
    fixture.nativeElement.querySelector('[data-testid="botao-sair"]').click();
    expect(authServiceFalso.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
