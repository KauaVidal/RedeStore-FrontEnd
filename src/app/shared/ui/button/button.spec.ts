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
    await TestBed.configureTestingModule({ imports: [HospedeTeste] }).compileComponents();
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

  it('não emite clicado quando desabilitado', () => {
    fixture.componentInstance.desabilitado = true;
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(fixture.componentInstance.cliques).toBe(0);
  });

  it('mostra "Enviando…" e não emite clicado quando carregando', () => {
    fixture.componentInstance.carregando = true;
    fixture.detectChanges();
    const botao = fixture.nativeElement.querySelector('button');
    expect(botao.textContent).toContain('Enviando');
    botao.click();
    expect(fixture.componentInstance.cliques).toBe(0);
  });
});
