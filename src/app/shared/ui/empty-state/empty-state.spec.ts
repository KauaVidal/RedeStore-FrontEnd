import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  let fixture: ComponentFixture<EmptyState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyState],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(EmptyState);
  });

  it('renderiza a mensagem', () => {
    fixture.componentRef.setInput('mensagem', 'Você ainda não fez nenhum pedido.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Você ainda não fez nenhum pedido.');
  });

  it('não renderiza link de ação quando textoAcao está vazio', () => {
    fixture.componentRef.setInput('mensagem', 'Nada por aqui.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('renderiza o link de ação quando textoAcao e linkAcao são informados', () => {
    fixture.componentRef.setInput('mensagem', 'Nada por aqui.');
    fixture.componentRef.setInput('textoAcao', 'Ver a loja');
    fixture.componentRef.setInput('linkAcao', '/loja');
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.textContent).toContain('Ver a loja');
    expect(link.getAttribute('href')).toBe('/loja');
  });
});
