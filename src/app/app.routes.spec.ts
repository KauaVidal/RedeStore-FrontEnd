import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { SessaoStore } from './core/auth/sessao.store';
import { Usuario } from './core/auth/usuario.model';
import { ProductService } from './core/products/product.service';
import { EventService } from './core/events/event.service';
import { RegistrationService } from './core/registrations/registration.service';
import { OrderService } from './core/orders/order.service';
import { Evento } from './core/events/evento.model';

const JOVEM: Usuario = { id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' };
const ADMIN: Usuario = { id: 'a1', nome: 'Admin', email: 'admin@rede.com', papel: 'admin' };
const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2099-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  vagasRestantes: 4,
  foto: 'https://picsum.photos/seed/x/480/480',
};

describe('Rotas do app (integração)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ProductService,
          useValue: { listar: async () => [], listarDestaques: async () => [], buscarPorId: async () => undefined },
        },
        { provide: EventService, useValue: { listar: async () => [EVENTO], buscarPorId: async () => EVENTO } },
        { provide: RegistrationService, useValue: { listarMinhas: async () => [], listarPorEvento: async () => [] } },
        {
          provide: OrderService,
          useValue: {
            listarTodos: async () => [],
            listarMeus: async () => [],
            ultimoPedido: signal(null),
            limparUltimoPedido: () => undefined,
          },
        },
      ],
    });
  });

  function logarComo(usuario: Usuario): void {
    TestBed.inject(SessaoStore).definir({ usuario, token: 'jwt-teste' });
  }

  it('"/" renderiza a Home da loja', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });

  it('"/loja" renderiza direto o catálogo de produtos', async () => {
    const harness = await RouterTestingHarness.create('/loja');
    expect(harness.fixture.nativeElement.querySelector('app-listagem')).not.toBeNull();
  });

  it('"/loja/produtos" redireciona para o catálogo em "/loja", mantendo os filtros', async () => {
    const harness = await RouterTestingHarness.create('/loja/produtos?categoria=calcas');
    expect(TestBed.inject(Router).url).toBe('/loja?categoria=calcas');
    expect(harness.fixture.nativeElement.querySelector('app-listagem')).not.toBeNull();
  });

  it('"/loja/carrinho" sem login redireciona para "/login"', async () => {
    const harness = await RouterTestingHarness.create('/loja/carrinho');
    expect(harness.routeNativeElement?.textContent).toContain('Entrar na REDE');
  });

  it('"/loja/carrinho" logado renderiza o Carrinho', async () => {
    logarComo(JOVEM);
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
    logarComo(JOVEM);
    const harness = await RouterTestingHarness.create('/eventos/minhas-inscricoes');
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).not.toContain('Entrar na REDE');
    expect(harness.routeNativeElement?.textContent).toContain('Minhas inscrições');
  });

  it('"/redefinir-senha" sem token mostra link inválido', async () => {
    const harness = await RouterTestingHarness.create('/redefinir-senha');
    expect(harness.routeNativeElement?.textContent).toContain('Link inválido');
  });

  it('"/redefinir-senha?token=abc" mostra o formulário de nova senha', async () => {
    const harness = await RouterTestingHarness.create('/redefinir-senha?token=abc');
    expect(harness.routeNativeElement?.textContent).toContain('Nova senha');
  });

  it('"/admin" sem login redireciona para "/"', async () => {
    const harness = await RouterTestingHarness.create('/admin');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });

  it('"/admin" logado como jovem redireciona para "/"', async () => {
    logarComo(JOVEM);
    const harness = await RouterTestingHarness.create('/admin');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });

  it('"/admin" logado como admin renderiza a tela de Produtos', async () => {
    logarComo(ADMIN);
    const harness = await RouterTestingHarness.create('/admin');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Produtos');
  });

  it('"/admin/pedidos" logado como admin renderiza a tela de Pedidos', async () => {
    logarComo(ADMIN);
    const harness = await RouterTestingHarness.create('/admin/pedidos');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Pedidos');
  });

  it('uma rota desconhecida redireciona para "/"', async () => {
    const harness = await RouterTestingHarness.create('/rota-que-nao-existe');
    expect(harness.routeNativeElement?.textContent).toContain('Destaques');
  });
});
