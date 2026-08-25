import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecuperarSenha } from './recuperar-senha';
import { AuthService } from '../../../core/auth/auth.service';

describe('RecuperarSenha', () => {
  let fixture: ComponentFixture<RecuperarSenha>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'recuperarSenha'>>;

  beforeEach(async () => {
    authServiceFalso = jasmine.createSpyObj('AuthService', ['recuperarSenha']);
    authServiceFalso.recuperarSenha.and.resolveTo();
    await TestBed.configureTestingModule({
      imports: [RecuperarSenha],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();
    fixture = TestBed.createComponent(RecuperarSenha);
    fixture.detectChanges();
  });

  it('não envia quando o e-mail é inválido', () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(authServiceFalso.recuperarSenha).not.toHaveBeenCalled();
  });

  it('mostra a confirmação após envio com e-mail válido', async () => {
    fixture.componentInstance['form'].setValue({ email: 'jovem@rede.com' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(authServiceFalso.recuperarSenha).toHaveBeenCalledWith('jovem@rede.com');
    expect(fixture.nativeElement.textContent).toContain('enviamos um link');
  });
});
