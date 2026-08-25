import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  imports: [Button],
  standalone: true,
  template: `<app-button [desabilitado]="desabilitado" [carregando]="carregando" (clicado)="aoClicar()">Entrar</app-button>`,
})
class HospedeTeste {
  desabilitado = false;
  carregando = false;
  cliques = 0;
  aoClicar() {
    this.cliques++;
  }
}

describe('Button', () => {
  let fixture: ComponentFixture<HospedeTeste>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeTeste, Button] }).compileComponents();
    fixture = TestBed.createComponent(HospedeTeste);
    fixture.detectChanges();
  });

  it('renderiza o conteúdo projetado', () => {
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Entrar');
  });

  it('emite clicado ao ser clicado', () => {
    fixture.nativeElement.querySelector('button').click();
    expect(fixture.componentInstance.cliques).toBe(1);
  });

  it('não emite clicado quando desabilitado', async () => {
    const comp = TestBed.createComponent(Button);
    comp.componentRef.setInput('desabilitado', true);
    comp.detectChanges();
    await comp.whenStable();

    let clicked = false;
    comp.componentInstance.clicado.subscribe(() => { clicked = true; });
    comp.nativeElement.querySelector('button').click();

    expect(clicked).toBe(false);
  });

  it('mostra "Enviando…" e não emite clicado quando carregando', async () => {
    const comp = TestBed.createComponent(Button);
    comp.componentRef.setInput('carregando', true);
    comp.detectChanges();
    await comp.whenStable();

    const botao = comp.nativeElement.querySelector('button');
    expect(botao.textContent).toContain('Enviando');

    let clicked = false;
    comp.componentInstance.clicado.subscribe(() => { clicked = true; });
    botao.click();

    expect(clicked).toBe(false);
  });
});
