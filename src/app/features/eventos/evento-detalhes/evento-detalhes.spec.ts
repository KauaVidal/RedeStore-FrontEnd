import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { EventoDetalhes } from './evento-detalhes';
import { EventService } from '../../../core/events/event.service';
import { RegistrationService } from '../../../core/registrations/registration.service';
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

describe('EventoDetalhes', () => {
  let fixture: ComponentFixture<EventoDetalhes>;

  async function montar(opcoes: { vagasRestantes: number; inscricoes: Inscricao[] }): Promise<void> {
    const eventServiceFalso = jasmine.createSpyObj('EventService', ['buscarPorId']);
    eventServiceFalso.buscarPorId.and.resolveTo(EVENTO);

    const registrationServiceFalso = jasmine.createSpyObj('RegistrationService', [
      'vagasRestantes',
      'listarPorUsuario',
    ]);
    registrationServiceFalso.vagasRestantes.and.resolveTo(opcoes.vagasRestantes);
    registrationServiceFalso.listarPorUsuario.and.resolveTo(opcoes.inscricoes);

    await TestBed.configureTestingModule({
      imports: [EventoDetalhes],
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

    fixture = TestBed.createComponent(EventoDetalhes);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra os dados do evento', async () => {
    await montar({ vagasRestantes: 2, inscricoes: [] });
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('250,00');
  });

  it('mostra o botão "Inscrever-se" com link pra confirmação quando há vaga e o usuário não está inscrito', async () => {
    await montar({ vagasRestantes: 2, inscricoes: [] });
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.detalhes-evento__acao');
    expect(link.textContent).toContain('Inscrever-se');
    expect(link.getAttribute('href')).toBe('/eventos/1/confirmacao');
  });

  it('mostra "Esgotado" quando não há vagas restantes', async () => {
    await montar({ vagasRestantes: 0, inscricoes: [] });
    expect(fixture.nativeElement.textContent).toContain('Esgotado');
    expect(fixture.nativeElement.querySelector('a.detalhes-evento__acao')).toBeNull();
  });

  it('mostra "Você já está inscrito" quando o usuário já tem inscrição confirmada', async () => {
    const inscricaoExistente: Inscricao = {
      id: '9',
      eventoId: '1',
      usuarioId: 'u1',
      status: 'confirmada',
      valorPago: 250,
      criadoEm: new Date().toISOString(),
    };
    await montar({ vagasRestantes: 2, inscricoes: [inscricaoExistente] });
    expect(fixture.nativeElement.textContent).toContain('Você já está inscrito');
    expect(fixture.nativeElement.querySelector('a.detalhes-evento__acao')).toBeNull();
  });

  it('não mostra nenhum estado de CTA (nem "Esgotado" nem "Inscrever-se") antes de vagas e inscrição carregarem', async () => {
    let resolverVagas!: (vagas: number) => void;
    let resolverInscricoes!: (inscricoes: Inscricao[]) => void;
    const vagasPromise = new Promise<number>((resolve) => (resolverVagas = resolve));
    const inscricoesPromise = new Promise<Inscricao[]>((resolve) => (resolverInscricoes = resolve));

    const eventServiceFalso = jasmine.createSpyObj('EventService', ['buscarPorId']);
    eventServiceFalso.buscarPorId.and.resolveTo(EVENTO);
    const registrationServiceFalso = jasmine.createSpyObj('RegistrationService', [
      'vagasRestantes',
      'listarPorUsuario',
    ]);
    registrationServiceFalso.vagasRestantes.and.returnValue(vagasPromise);
    registrationServiceFalso.listarPorUsuario.and.returnValue(inscricoesPromise);

    await TestBed.configureTestingModule({
      imports: [EventoDetalhes],
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

    fixture = TestBed.createComponent(EventoDetalhes);
    fixture.detectChanges();
    // Deixa o microtask de buscarPorId resolver (evento carregado), sem resolver
    // ainda vagasRestantes/listarPorUsuario — reproduz a janela descrita em I1.
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const textoAntes = fixture.nativeElement.textContent;
    expect(textoAntes).not.toContain('Esgotado');
    expect(textoAntes).not.toContain('Você já está inscrito');
    expect(fixture.nativeElement.querySelector('a.detalhes-evento__acao')).toBeNull();

    resolverVagas(0);
    resolverInscricoes([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Esgotado');
  });
});
