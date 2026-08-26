import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Textarea } from './textarea';

@Component({
  imports: [Textarea, ReactiveFormsModule],
  template: `<app-textarea rotulo="Descrição" [controle]="controle" [erro]="erro"></app-textarea>`,
})
class HospedeTeste {
  controle = new FormControl('');
  erro: string | null = null;
}

describe('Textarea', () => {
  let fixture: ComponentFixture<HospedeTeste>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeTeste] }).compileComponents();
    fixture = TestBed.createComponent(HospedeTeste);
    fixture.detectChanges();
  });

  it('renderiza o rótulo', () => {
    expect(fixture.nativeElement.textContent).toContain('Descrição');
  });

  it('propaga digitação para o FormControl', () => {
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    textarea.value = 'Camiseta 100% algodão.';
    textarea.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.controle.value).toBe('Camiseta 100% algodão.');
  });

  it('não mostra mensagem de erro quando erro é null', () => {
    expect(fixture.nativeElement.querySelector('.campo__erro')).toBeNull();
  });

  it('mostra a mensagem de erro quando informada', () => {
    const comp = TestBed.createComponent(Textarea);
    comp.componentRef.setInput('rotulo', 'Descrição');
    comp.componentRef.setInput('controle', new FormControl(''));
    comp.componentRef.setInput('erro', 'Informe a descrição.');
    comp.detectChanges();
    expect(comp.nativeElement.querySelector('.campo__erro').textContent).toContain('Informe a descrição.');
  });
});
