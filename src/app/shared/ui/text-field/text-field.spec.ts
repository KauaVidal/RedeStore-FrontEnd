import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextField } from './text-field';

@Component({
  imports: [TextField, ReactiveFormsModule],
  template: `<app-text-field rotulo="E-mail" [controle]="controle" [erro]="erro"></app-text-field>`,
})
class HospedeTeste {
  controle = new FormControl('');
  erro: string | null = null;
}

describe('TextField', () => {
  let fixture: ComponentFixture<HospedeTeste>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeTeste] }).compileComponents();
    fixture = TestBed.createComponent(HospedeTeste);
    fixture.detectChanges();
  });

  it('renderiza o rótulo', () => {
    expect(fixture.nativeElement.textContent).toContain('E-mail');
  });

  it('não mostra mensagem de erro quando erro é null', () => {
    expect(fixture.nativeElement.querySelector('.campo__erro')).toBeNull();
  });

  it('mostra a mensagem de erro quando informada', async () => {
    // Atualização dinâmica de um input signal testada via componentRef.setInput()
    // diretamente no componente, não via mutação de propriedade do host + detectChanges()
    // — esse segundo padrão não propaga de forma confiável nesta versão do Angular
    // (achado real da Task 4: ver ledger do SDD).
    const comp = TestBed.createComponent(TextField);
    comp.componentRef.setInput('rotulo', 'E-mail');
    comp.componentRef.setInput('controle', new FormControl(''));
    comp.componentRef.setInput('erro', 'Informe um e-mail válido.');
    comp.detectChanges();
    await comp.whenStable();
    expect(comp.nativeElement.querySelector('.campo__erro').textContent).toContain('Informe um e-mail válido.');
  });

  it('propaga digitação para o FormControl', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'jovem@rede.com';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.controle.value).toBe('jovem@rede.com');
  });
});
