import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Inscricoes } from './inscricoes';
import { EventService } from '../../../../core/events/event.service';
import { RegistrationService } from '../../../../core/registrations/registration.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Evento } from '../../../../core/events/evento.model';
import { Inscricao } from '../../../../core/registrations/inscricao.model';
import { Usuario } from '../../../../core/auth/usuario.model';

const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  foto: 'https://picsum.photos/seed/retiro/480/480',
};

const INSCRICAO: Inscricao = {
  id: 'i1',
  eventoId: '1',
  usuarioId: 'u1',
  status: 'confirmada',
  valorPago: 250,
  criadoEm: '2026-01-01T00:00:00.000Z',
};

const INSCRITO: Usuario = { id: 'u1', nome: 'Jovem Teste', email: 'jovem@rede.com', papel: 'jovem' };

describe('Inscricoes', () => {
  let fixture: ComponentFixture<Inscricoes>;
  let eventosServicoFalso: jasmine.SpyObj<Pick<EventService, 'buscarPorId'>>;
  let inscricoesServicoFalso: jasmine.SpyObj<Pick<RegistrationService, 'listarPorEvento' | 'cancelar'>>;
  let authServicoFalso: jasmine.SpyObj<Pick<AuthService, 'buscarPorId'>>;

  async function montar(inscricoes: Inscricao[]): Promise<void> {
    eventosServicoFalso = jasmine.createSpyObj('EventService', ['buscarPorId']);
    eventosServicoFalso.buscarPorId.and.resolveTo(EVENTO);
    inscricoesServicoFalso = jasmine.createSpyObj('RegistrationService', ['listarPorEvento', 'cancelar']);
    inscricoesServicoFalso.listarPorEvento.and.resolveTo(inscricoes);
    authServicoFalso = jasmine.createSpyObj('AuthService', ['buscarPorId']);
    authServicoFalso.buscarPorId.and.resolveTo(INSCRITO);

    await TestBed.configureTestingModule({
      imports: [Inscricoes],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventosServicoFalso },
        { provide: RegistrationService, useValue: inscricoesServicoFalso },
        { provide: AuthService, useValue: authServicoFalso },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Inscricoes);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o título do evento e o estado vazio quando não há inscrições', async () => {
    await montar([]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('Ninguém se inscreveu neste evento ainda.');
  });

  it('lista os inscritos com nome, email e status', async () => {
    await montar([INSCRICAO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Jovem Teste');
    expect(texto).toContain('jovem@rede.com');
    expect(texto).toContain('confirmada');
  });

  it('cancelar chama RegistrationService.cancelar e recarrega a lista', async () => {
    await montar([INSCRICAO]);
    inscricoesServicoFalso.cancelar.and.resolveTo();
    inscricoesServicoFalso.listarPorEvento.and.resolveTo([{ ...INSCRICAO, status: 'cancelada' }]);

    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="botao-cancelar"]');
    botao.click();
    await fixture.whenStable();

    expect(inscricoesServicoFalso.cancelar).toHaveBeenCalledWith('i1');
  });
});
