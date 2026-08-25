import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Perfil } from './perfil';
import { AuthService } from '../../core/auth/auth.service';
import { OrderService } from '../../core/orders/order.service';
import { RegistrationService } from '../../core/registrations/registration.service';
import { Pedido } from '../../core/orders/pedido.model';
import { Inscricao } from '../../core/registrations/inscricao.model';

describe('Perfil', () => {
  let fixture: ComponentFixture<Perfil>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'atualizarPerfil' | 'logout'>> & {
    usuarioAtual: ReturnType<typeof signal>;
  };
  let orderServiceFalso: jasmine.SpyObj<Pick<OrderService, 'listarPorUsuario'>>;
  let registrationServiceFalso: jasmine.SpyObj<Pick<RegistrationService, 'listarPorUsuario'>>;
  let router: Router;

  async function montar(pedidos: Pedido[], inscricoes: Inscricao[]): Promise<void> {
    authServiceFalso = {
      usuarioAtual: signal({ id: '2', nome: 'Jovem Teste', email: 'jovem@rede.com', papel: 'jovem' as const }),
      atualizarPerfil: jasmine.createSpy('atualizarPerfil').and.resolveTo(),
      logout: jasmine.createSpy('logout'),
    };
    orderServiceFalso = jasmine.createSpyObj('OrderService', ['listarPorUsuario']);
    orderServiceFalso.listarPorUsuario.and.resolveTo(pedidos);
    registrationServiceFalso = jasmine.createSpyObj('RegistrationService', ['listarPorUsuario']);
    registrationServiceFalso.listarPorUsuario.and.resolveTo(inscricoes);

    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceFalso },
        { provide: OrderService, useValue: orderServiceFalso },
        { provide: RegistrationService, useValue: registrationServiceFalso },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Perfil);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('preenche o formulário com os dados do usuário atual', async () => {
    await montar([], []);
    expect(fixture.componentInstance['form'].value.nome).toBe('Jovem Teste');
    expect(fixture.componentInstance['form'].value.email).toBe('jovem@rede.com');
  });

  it('mostra estado vazio de pedidos e de eventos quando não há pedidos nem inscrições', async () => {
    await montar([], []);
    expect(fixture.nativeElement.textContent).toContain('nenhum pedido');
    expect(fixture.nativeElement.textContent).toContain('nenhum evento');
  });

  it('mostra a quantidade de pedidos e o link quando há pedidos', async () => {
    const pedido: Pedido = {
      id: '1',
      usuarioId: '2',
      itens: [],
      formaEntrega: 'retirada',
      valorTotal: 100,
      status: 'pago',
      criadoEm: new Date().toISOString(),
    };
    await montar([pedido], []);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Você já fez 1 pedido.');
    expect(fixture.nativeElement.querySelector('a[href="/loja/meus-pedidos"]')).not.toBeNull();
  });

  it('mostra a quantidade de inscrições confirmadas e o link quando há inscrições', async () => {
    const inscricao: Inscricao = {
      id: '1',
      eventoId: '1',
      usuarioId: '2',
      status: 'confirmada',
      valorPago: 250,
      criadoEm: new Date().toISOString(),
    };
    await montar([], [inscricao]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Você está inscrito em 1 evento.');
    expect(fixture.nativeElement.querySelector('a[href="/eventos/minhas-inscricoes"]')).not.toBeNull();
  });

  it('conta só as inscrições confirmadas, ignorando as canceladas', async () => {
    const confirmada: Inscricao = {
      id: '1',
      eventoId: '1',
      usuarioId: '2',
      status: 'confirmada',
      valorPago: 250,
      criadoEm: new Date().toISOString(),
    };
    const cancelada: Inscricao = { ...confirmada, id: '2', eventoId: '2', status: 'cancelada' };
    await montar([], [confirmada, cancelada]);
    expect(fixture.nativeElement.textContent).toContain('Você está inscrito em 1 evento.');
  });

  it('chama atualizarPerfil ao salvar', async () => {
    await montar([], []);
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(authServiceFalso.atualizarPerfil).toHaveBeenCalled();
  });

  it('faz logout e navega para /login', async () => {
    await montar([], []);
    fixture.nativeElement.querySelector('[data-testid="botao-sair"]').click();
    expect(authServiceFalso.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('reseta o estado de carregamento mesmo quando atualizarPerfil falha', async () => {
    await montar([], []);
    authServiceFalso.atualizarPerfil.and.rejectWith(new Error('NAO_AUTENTICADO'));

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance['salvando']()).toBeFalse();
    expect(fixture.componentInstance['erroGeral']()).toContain('Não deu pra salvar');
    expect(fixture.componentInstance['salvo']()).toBeFalse();
  });
});
