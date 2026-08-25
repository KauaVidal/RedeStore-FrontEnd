import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Login } from './login';
import { AuthService } from '../../../core/auth/auth.service';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'login'>>;
  let router: Router;

  beforeEach(async () => {
    authServiceFalso = jasmine.createSpyObj('AuthService', ['login']);
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('não chama login e marca os campos como tocados ao enviar formulário vazio', () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(authServiceFalso.login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.campo__erro').length).toBeGreaterThan(0);
  });

  it('faz login e navega para / quando as credenciais são válidas', async () => {
    authServiceFalso.login.and.resolveTo({ id: '1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' });
    fixture.componentInstance['form'].setValue({ email: 'jovem@rede.com', senha: 'jovem123' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(authServiceFalso.login).toHaveBeenCalledWith('jovem@rede.com', 'jovem123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('mostra mensagem de erro quando o login falha', async () => {
    authServiceFalso.login.and.rejectWith(new Error('CREDENCIAIS_INVALIDAS'));
    fixture.componentInstance['form'].setValue({ email: 'jovem@rede.com', senha: 'errada' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('E-mail ou senha incorretos');
  });
});
