import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Cadastro } from './cadastro';
import { AuthService } from '../../../core/auth/auth.service';

describe('Cadastro', () => {
  let fixture: ComponentFixture<Cadastro>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'cadastrar'>>;
  let router: Router;

  beforeEach(async () => {
    authServiceFalso = jasmine.createSpyObj('AuthService', ['cadastrar']);
    await TestBed.configureTestingModule({
      imports: [Cadastro],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();
    fixture = TestBed.createComponent(Cadastro);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('mostra erro quando as senhas não coincidem', () => {
    fixture.componentInstance['form'].setValue({
      nome: 'Jovem Novo',
      email: 'novo@rede.com',
      senha: 'senha1234',
      confirmarSenha: 'senha1235',
    });
    fixture.componentInstance['form'].markAllAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('As senhas não coincidem');
    expect(authServiceFalso.cadastrar).not.toHaveBeenCalled();
  });

  it('cadastra e navega para / quando os dados são válidos', async () => {
    authServiceFalso.cadastrar.and.resolveTo({ id: '3', nome: 'Jovem Novo', email: 'novo@rede.com', papel: 'jovem' });
    fixture.componentInstance['form'].setValue({
      nome: 'Jovem Novo',
      email: 'novo@rede.com',
      senha: 'senha1234',
      confirmarSenha: 'senha1234',
    });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(authServiceFalso.cadastrar).toHaveBeenCalledWith({
      nome: 'Jovem Novo',
      email: 'novo@rede.com',
      senha: 'senha1234',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('mostra mensagem específica quando o e-mail já está em uso', async () => {
    authServiceFalso.cadastrar.and.rejectWith(new Error('EMAIL_EM_USO'));
    fixture.componentInstance['form'].setValue({
      nome: 'Jovem Novo',
      email: 'jovem@rede.com',
      senha: 'senha1234',
      confirmarSenha: 'senha1234',
    });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Esse e-mail já está cadastrado');
  });
});
