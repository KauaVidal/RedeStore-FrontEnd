import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Agenda } from './agenda';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
import { Evento } from '../../../core/events/evento.model';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-09-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  foto: 'https://picsum.photos/seed/x/480/480',
};

const EVENTO_PASSADO: Evento = {
  id: '9',
  titulo: 'Encontro que já aconteceu',
  descricao: 'Evento antigo.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Templo sede, Vila Maria',
  preco: 0,
  vagasTotais: 50,
  foto: 'https://picsum.photos/seed/antigo/480/480',
};

describe('Agenda', () => {
  let fixture: ComponentFixture<Agenda>;
  let eventServiceFalso: jasmine.SpyObj<Pick<EventService, 'listar'>>;
  let registrationServiceFalso: jasmine.SpyObj<Pick<RegistrationService, 'vagasRestantes'>>;

  async function montar(eventos: Evento[], vagasRestantes = 2): Promise<void> {
    eventServiceFalso = jasmine.createSpyObj('EventService', ['listar']);
    eventServiceFalso.listar.and.resolveTo(eventos);

    registrationServiceFalso = jasmine.createSpyObj('RegistrationService', ['vagasRestantes']);
    registrationServiceFalso.vagasRestantes.and.resolveTo(vagasRestantes);

    await TestBed.configureTestingModule({
      imports: [Agenda],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventServiceFalso },
        { provide: RegistrationService, useValue: registrationServiceFalso },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Agenda);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra os eventos com título, data, local e preço', async () => {
    await montar([EVENTO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('Sítio Vida Nova, Ibiúna');
    expect(texto).toContain('250,00');
    expect(texto).toContain(new DataBrPipe().transform(EVENTO.dataHora));
  });

  it('mostra as vagas restantes de cada evento', async () => {
    await montar([EVENTO], 3);
    expect(fixture.nativeElement.textContent).toContain('3 vagas restantes');
  });

  it('mostra "Gratuito" para eventos com preco 0', async () => {
    await montar([{ ...EVENTO, id: '2', preco: 0 }]);
    expect(fixture.nativeElement.textContent).toContain('Gratuito');
  });

  it('cada evento linka para a página de detalhes', async () => {
    await montar([EVENTO]);
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/eventos/1');
  });

  it('mostra o estado vazio quando não há eventos', async () => {
    await montar([]);
    expect(fixture.nativeElement.textContent).toContain('Nenhum evento programado no momento.');
  });

  it('não mostra eventos que já aconteceram', async () => {
    await montar([EVENTO, EVENTO_PASSADO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).not.toContain('Encontro que já aconteceu');
  });
});
