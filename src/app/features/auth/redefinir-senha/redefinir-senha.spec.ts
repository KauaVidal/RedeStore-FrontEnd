import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RedefinirSenha } from './redefinir-senha';
import { AuthService } from '../../../core/auth/auth.service';

describe('RedefinirSenha', () => {
  let fixture: ComponentFixture<RedefinirSenha>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'redefinirSenha'>>;

  async function montar(token?: string): Promise<void> {
    authServiceFalso = jasmine.createSpyObj('AuthService', ['redefinirSenha']);
    authServiceFalso.redefinirSenha.and.resolveTo();
    await TestBed.configureTestingModule({
      imports: [RedefinirSenha],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();
    fixture = TestBed.createComponent(RedefinirSenha);
    if (token !== undefined) fixture.componentRef.setInput('token', token);
    fixture.detectChanges();
  }

  async function enviar(novaSenha: string, confirmarSenha: string): Promise<void> {
    fixture.componentInstance['form'].setValue({ novaSenha, confirmarSenha });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('sem token na URL mostra "link inválido" e não mostra o formulário', async () => {
    await montar();
    expect(fixture.nativeElement.textContent).toContain('Link inválido');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('não envia quando as senhas não coincidem', async () => {
    await montar('tok');
    await enviar('senhaNova123', 'outraSenha123');
    expect(authServiceFalso.redefinirSenha).not.toHaveBeenCalled();
  });

  it('não envia senha com menos de 8 caracteres', async () => {
    await montar('tok');
    await enviar('curta', 'curta');
    expect(authServiceFalso.redefinirSenha).not.toHaveBeenCalled();
  });

  it('envia token e nova senha e mostra o sucesso com link para o login', async () => {
    await montar('tok');
    await enviar('senhaNova123', 'senhaNova123');
    expect(authServiceFalso.redefinirSenha).toHaveBeenCalledWith('tok', 'senhaNova123');
    expect(fixture.nativeElement.textContent).toContain('Senha alterada');
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="/login"]');
    expect(link).not.toBeNull();
  });

  it('TOKEN_INVALIDO mostra que o link expirou, com link para pedir outro', async () => {
    await montar('tok');
    authServiceFalso.redefinirSenha.and.rejectWith(new Error('TOKEN_INVALIDO'));
    await enviar('senhaNova123', 'senhaNova123');
    expect(fixture.nativeElement.textContent).toContain('expirou ou já foi usado');
    expect(fixture.nativeElement.querySelector('a[href="/recuperar-senha"]')).not.toBeNull();
  });

  it('outros erros mostram mensagem geral e mantêm o formulário', async () => {
    await montar('tok');
    authServiceFalso.redefinirSenha.and.rejectWith(new Error('SEM_CONEXAO'));
    await enviar('senhaNova123', 'senhaNova123');
    expect(fixture.nativeElement.textContent).toContain('Não conseguimos falar com o servidor');
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(fixture.componentInstance['enviando']()).toBeFalse();
  });
});
