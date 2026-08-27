import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Modal } from './modal';

describe('Modal', () => {
  let fixture: ComponentFixture<Modal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Modal] }).compileComponents();
    fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('titulo', 'Novo produto');
  });

  it('não renderiza nada quando aberto é false', () => {
    fixture.componentRef.setInput('aberto', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal__overlay')).toBeNull();
  });

  it('renderiza o título quando aberto é true', () => {
    fixture.componentRef.setInput('aberto', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Novo produto');
  });

  it('clicar no overlay emite fechar', () => {
    fixture.componentRef.setInput('aberto', true);
    fixture.detectChanges();
    let fechou = false;
    fixture.componentInstance.fechar.subscribe(() => (fechou = true));
    fixture.nativeElement.querySelector('.modal__overlay').click();
    expect(fechou).toBeTrue();
  });

  it('clicar dentro da caixa não emite fechar', () => {
    fixture.componentRef.setInput('aberto', true);
    fixture.detectChanges();
    let fechou = false;
    fixture.componentInstance.fechar.subscribe(() => (fechou = true));
    fixture.nativeElement.querySelector('.modal__caixa').click();
    expect(fechou).toBeFalse();
  });

  it('clicar no botão de fechar emite fechar', () => {
    fixture.componentRef.setInput('aberto', true);
    fixture.detectChanges();
    let fechou = false;
    fixture.componentInstance.fechar.subscribe(() => (fechou = true));
    fixture.nativeElement.querySelector('.modal__fechar').click();
    expect(fechou).toBeTrue();
  });
});
