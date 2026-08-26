import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';

describe('Rotas do app (integração)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
  });

  it('"/" renderiza a Home da loja', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });

  it('"/loja" renderiza as Categorias', async () => {
    const harness = await RouterTestingHarness.create('/loja');
    expect(harness.routeNativeElement?.textContent).toContain('Camisetas');
  });

  it('"/loja/carrinho" sem login redireciona para "/login"', async () => {
    const harness = await RouterTestingHarness.create('/loja/carrinho');
    expect(harness.routeNativeElement?.textContent).toContain('Entrar na REDE');
  });

  it('"/loja/carrinho" logado renderiza o Carrinho', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.login('jovem@rede.com', 'jovem123');

    const harness = await RouterTestingHarness.create('/loja/carrinho');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.textContent).not.toContain('Entrar na REDE');
  });

  it('"/eventos" renderiza a Agenda de eventos', async () => {
    const harness = await RouterTestingHarness.create('/eventos');
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).toContain('Agenda de eventos');
  });

  it('"/eventos/:id" renderiza os Detalhes do evento', async () => {
    const harness = await RouterTestingHarness.create('/eventos/1');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Retiro de Verão REDE');
  });

  it('"/eventos/minhas-inscricoes" sem login redireciona para "/login"', async () => {
    const harness = await RouterTestingHarness.create('/eventos/minhas-inscricoes');
    expect(harness.routeNativeElement?.textContent).toContain('Entrar na REDE');
  });

  it('"/eventos/1/confirmacao" sem login redireciona para "/login"', async () => {
    const harness = await RouterTestingHarness.create('/eventos/1/confirmacao');
    expect(harness.routeNativeElement?.textContent).toContain('Entrar na REDE');
  });

  it('"/eventos/minhas-inscricoes" logado renderiza Minhas inscrições, não a rota :id', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.login('jovem@rede.com', 'jovem123');

    const harness = await RouterTestingHarness.create('/eventos/minhas-inscricoes');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.textContent).not.toContain('Entrar na REDE');
    expect(harness.routeNativeElement?.textContent).toContain('Minhas inscrições');
  });

  it('uma rota desconhecida redireciona para "/"', async () => {
    const harness = await RouterTestingHarness.create('/rota-que-nao-existe');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });
});
