import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { MinhasInscricoes } from './minhas-inscricoes';
import { AuthService } from '../../../core/auth/auth.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { EventService } from '../../../core/events/event.service';
import { Inscricao } from '../../../core/registrations/inscricao.model';
import { Evento } from '../../../core/events/evento.model';

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

describe('MinhasInscricoes', () => {
  let fixture: ComponentFixture<MinhasInscricoes>;
  let registrationServiceFalso: jasmine.SpyObj<Pick<RegistrationService, 'listarPorUsuario' | 'cancelar'>>;

  async function montar(inscricoes: Inscricao[]): Promise<void> {
    registrationServiceFalso = jasmine.createSpyObj('RegistrationService', ['listarPorUsuario', 'cancelar']);
    registrationServiceFalso.listarPorUsuario.and.resolveTo(inscricoes);
    registrationServiceFalso.cancelar.and.resolveTo();

    const eventServiceFalso = jasmine.createSpyObj('EventService', ['buscarPorId']);
    eventServiceFalso.buscarPorId.and.resolveTo(EVENTO);

    await TestBed.configureTestingModule({
      imports: [MinhasInscricoes],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { usuarioAtual: signal({ id: 'u1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' }) },
        },
        { provide: RegistrationService, useValue: registrationServiceFalso },
        { provide: EventService, useValue: eventServiceFalso },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhasInscricoes);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o estado vazio quando não há inscrições', async () => {
    await montar([]);
    expect(fixture.nativeElement.textContent).toContain('Você ainda não se inscreveu em nenhum evento.');
  });

  it('mostra as inscrições com o título do evento e o status', async () => {
    await montar([INSCRICAO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('Confirmada');
  });

  it('mostra o botão "Cancelar inscrição" só para inscrições confirmadas', async () => {
    await montar([INSCRICAO]);
    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('.minhas-inscricoes__cancelar');
    expect(botao).not.toBeNull();
  });

  it('não mostra o botão "Cancelar inscrição" para inscrições já canceladas', async () => {
    await montar([{ ...INSCRICAO, status: 'cancelada' }]);
    expect(fixture.nativeElement.querySelector('.minhas-inscricoes__cancelar')).toBeNull();
  });

  it('chama cancelar() ao clicar em "Cancelar inscrição"', async () => {
    await montar([INSCRICAO]);
    fixture.nativeElement.querySelector('.minhas-inscricoes__cancelar').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(registrationServiceFalso.cancelar).toHaveBeenCalledWith('1');
  });
});
