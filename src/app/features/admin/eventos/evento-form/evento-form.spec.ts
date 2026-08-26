import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventoForm } from './evento-form';
import { Evento } from '../../../../core/events/evento.model';

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

describe('EventoForm', () => {
  let fixture: ComponentFixture<EventoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EventoForm] }).compileComponents();
    fixture = TestBed.createComponent(EventoForm);
    fixture.detectChanges();
  });

  it('não emite salvar quando o formulário está inválido', () => {
    let emitiu = false;
    fixture.componentInstance.salvar.subscribe(() => (emitiu = true));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(emitiu).toBeFalse();
  });

  it('em modo edição, pré-preenche o formulário com os dados do evento', () => {
    fixture.componentRef.setInput('evento', EVENTO);
    fixture.detectChanges();
    // Checa o valor do FormControl, não o textContent: um <textarea> só reflete
    // no textContent o markup estático inicial, não o valor definido via
    // [formControl] (isso é feito via propriedade DOM `value`, não innerHTML).
    expect(fixture.componentInstance['form'].controls.titulo.value).toBe('Retiro de Verão REDE');
    expect(fixture.componentInstance['form'].controls.descricao.value).toBe('Um fim de semana de imersão.');
  });

  it('emite salvar com os dados preenchidos e a data convertida para ISO', () => {
    fixture.componentInstance['form'].setValue({
      titulo: 'Culto de Jovens',
      descricao: 'Descrição',
      dataHora: '2026-11-01T19:00',
      local: 'Templo sede, Vila Maria',
      preco: 0,
      vagasTotais: 50,
      foto: 'https://picsum.photos/seed/novo/480/480',
    });
    fixture.detectChanges();

    let emitido: Omit<Evento, 'id'> | undefined;
    fixture.componentInstance.salvar.subscribe((dados) => (emitido = dados));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(emitido?.titulo).toBe('Culto de Jovens');
    expect(emitido?.vagasTotais).toBe(50);
    expect(emitido?.dataHora).toBe(new Date('2026-11-01T19:00').toISOString());
  });

  it('emite cancelar ao clicar em Cancelar', () => {
    let emitiu = false;
    fixture.componentInstance.cancelar.subscribe(() => (emitiu = true));
    const botoes: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    const cancelar = Array.from(botoes).find((b) => b.textContent?.includes('Cancelar'));
    cancelar?.click();
    expect(emitiu).toBeTrue();
  });
});
