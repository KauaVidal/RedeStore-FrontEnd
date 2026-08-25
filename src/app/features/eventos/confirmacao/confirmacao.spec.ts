import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Confirmacao } from './confirmacao';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService, ResultadoInscricao } from '../../../core/registrations/registration.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Evento } from '../../../core/events/evento.model';
import { Inscricao } from '../../../core/registrations/inscricao.model';

const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  foto: 'https://picsum.photos/seed/x/480/480',
};

const INSCRICAO: Inscricao = {
  id: '1',
  eventoId: '1',
  usuarioId: 'u1',
  status: 'confirmada',
  valorPago: 250,
  criadoEm: new Date().toISOString(),
};

describe('Confirmacao', () => {
  let fixture: ComponentFixture<Confirmacao>;
  let eventServiceFalso: jasmine.SpyObj<Pick<EventService, 'buscarPorId'>>;
  let registrationServiceFalso: jasmine.SpyObj<Pick<RegistrationService, 'inscrever'>>;
  let router: Router;

  async function montar(evento: Evento | undefined, resultado: ResultadoInscricao = { resultado: 'criada', inscricao: INSCRICAO }): Promise<void> {
    eventServiceFalso = jasmine.createSpyObj('EventService', ['buscarPorId']);
    eventServiceFalso.buscarPorId.and.resolveTo(evento);
    registrationServiceFalso = jasmine.createSpyObj('RegistrationService', ['inscrever']);
    registrationServiceFalso.inscrever.and.resolveTo(resultado);

    await TestBed.configureTestingModule({
      imports: [Confirmacao],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventServiceFalso },
        { provide: RegistrationService, useValue: registrationServiceFalso },
        {
          provide: AuthService,
          useValue: { usuarioAtual: signal({ id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' }) },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Confirmacao);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('chama RegistrationService.inscrever com os dados certos', async () => {
    await montar(EVENTO);
    expect(registrationServiceFalso.inscrever).toHaveBeenCalledWith({
      eventoId: '1',
      usuarioId: 'u1',
      valorPago: 250,
      vagasTotais: 4,
    });
  });

  it('mostra a confirmação com os dados do evento e o valor pago', async () => {
    await montar(EVENTO);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Inscrição confirmada!');
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('250,00');
  });

  it('redireciona para a agenda quando o evento não existe', async () => {
    await montar(undefined);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/eventos');
    expect(registrationServiceFalso.inscrever).not.toHaveBeenCalled();
  });

  it('mostra "Você já está inscrito" em vez do ticket quando a inscrição já existia', async () => {
    await montar(EVENTO, { resultado: 'ja_inscrito', inscricao: INSCRICAO });
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Você já está inscrito');
    expect(texto).not.toContain('Inscrição confirmada!');
  });

  it('mostra "Esgotado" em vez do ticket quando não havia mais vagas', async () => {
    await montar(EVENTO, { resultado: 'esgotado' });
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Esgotado');
    expect(texto).not.toContain('Inscrição confirmada!');
  });
});
