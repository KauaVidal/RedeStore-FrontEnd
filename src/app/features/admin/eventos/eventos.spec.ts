import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Eventos } from './eventos';
import { EventService } from '../../../core/events/event.service';
import { Evento } from '../../../core/events/evento.model';

const EVENTO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  vagasRestantes: 4,
  foto: 'https://picsum.photos/seed/retiro/480/480',
};

describe('Eventos', () => {
  let fixture: ComponentFixture<Eventos>;
  let eventosServicoFalso: jasmine.SpyObj<Pick<EventService, 'listar' | 'criar' | 'atualizar' | 'remover'>>;

  async function montar(eventos: Evento[]): Promise<void> {
    eventosServicoFalso = jasmine.createSpyObj('EventService', ['listar', 'criar', 'atualizar', 'remover']);
    eventosServicoFalso.listar.and.resolveTo(eventos);

    await TestBed.configureTestingModule({
      imports: [Eventos],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventosServicoFalso },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Eventos);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o estado vazio quando não há eventos', async () => {
    await montar([]);
    expect(fixture.nativeElement.textContent).toContain('Nenhum evento cadastrado ainda.');
  });

  it('lista os eventos com título, local e vagas', async () => {
    await montar([EVENTO]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Retiro de Verão REDE');
    expect(texto).toContain('Sítio Vida Nova, Ibiúna');
    expect(texto).toContain('4');
  });

  it('mostra a ocupação calculada a partir de vagasRestantes', async () => {
    await montar([{ ...EVENTO, vagasTotais: 4, vagasRestantes: 1 }]);
    expect(fixture.nativeElement.textContent).toContain('3/4');
  });

  it('chama EventService.criar ao salvar o formulário em modo criação', async () => {
    await montar([]);
    eventosServicoFalso.criar.and.resolveTo(EVENTO);
    eventosServicoFalso.listar.and.resolveTo([EVENTO]);

    fixture.componentInstance['abrirNovo']();
    await fixture.componentInstance['salvar']({
      titulo: EVENTO.titulo,
      descricao: EVENTO.descricao,
      dataHora: EVENTO.dataHora,
      local: EVENTO.local,
      preco: EVENTO.preco,
      vagasTotais: EVENTO.vagasTotais,
      foto: EVENTO.foto,
    });

    expect(eventosServicoFalso.criar).toHaveBeenCalled();
  });

  it('chama EventService.remover ao confirmar a remoção', async () => {
    await montar([EVENTO]);
    eventosServicoFalso.remover.and.resolveTo();
    eventosServicoFalso.listar.and.resolveTo([]);

    fixture.componentInstance['pedirRemocao'](EVENTO);
    await fixture.componentInstance['confirmarRemocao']();

    expect(eventosServicoFalso.remover).toHaveBeenCalledWith('1');
  });

  it('mostra mensagem quando o evento tem inscrições confirmadas e não pode ser removido', async () => {
    await montar([EVENTO]);
    eventosServicoFalso.remover.and.rejectWith(new Error('EVENTO_COM_INSCRICOES_CONFIRMADAS'));

    fixture.componentInstance['pedirRemocao'](EVENTO);
    await fixture.componentInstance['confirmarRemocao']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cancele-as antes de remover');
  });

  it('mostra mensagem quando as vagas ficariam abaixo das inscrições confirmadas', async () => {
    await montar([EVENTO]);
    eventosServicoFalso.atualizar.and.rejectWith(new Error('EVENTO_VAGAS_TOTAIS_INSUFICIENTES'));

    fixture.componentInstance['abrirEdicao'](EVENTO);
    const { id: _id, vagasRestantes: _v, ...dados } = EVENTO;
    await fixture.componentInstance['salvar'](dados);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('não pode ficar abaixo');
  });
});
