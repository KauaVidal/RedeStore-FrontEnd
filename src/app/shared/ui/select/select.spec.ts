import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Select } from './select';

@Component({
  imports: [Select, ReactiveFormsModule],
  template: `<app-select
    rotulo="Categoria"
    [opcoes]="opcoes"
    [controle]="controle"
    [erro]="erro"
  ></app-select>`,
})
class HospedeTeste {
  opcoes = [
    { valor: 'camisetas', rotulo: 'Camisetas' },
    { valor: 'moletons', rotulo: 'Moletons' },
  ];
  controle = new FormControl('camisetas');
  erro: string | null = null;
}

describe('Select', () => {
  let fixture: ComponentFixture<HospedeTeste>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeTeste] }).compileComponents();
    fixture = TestBed.createComponent(HospedeTeste);
    fixture.detectChanges();
  });

  it('renderiza o rótulo e as opções', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Categoria');
    expect(texto).toContain('Camisetas');
    expect(texto).toContain('Moletons');
  });

  it('reflete o valor inicial do FormControl', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.value).toBe('camisetas');
  });

  it('propaga a mudança de seleção para o FormControl', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = 'moletons';
    select.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.controle.value).toBe('moletons');
  });

  it('não mostra mensagem de erro quando erro é null', () => {
    expect(fixture.nativeElement.querySelector('.campo__erro')).toBeNull();
  });

  it('mostra a mensagem de erro quando informada', () => {
    const comp = TestBed.createComponent(Select);
    comp.componentRef.setInput('rotulo', 'Categoria');
    comp.componentRef.setInput('opcoes', [{ valor: 'a', rotulo: 'A' }]);
    comp.componentRef.setInput('controle', new FormControl(''));
    comp.componentRef.setInput('erro', 'Selecione uma categoria.');
    comp.detectChanges();
    expect(comp.nativeElement.querySelector('.campo__erro').textContent).toContain('Selecione uma categoria.');
  });
});
