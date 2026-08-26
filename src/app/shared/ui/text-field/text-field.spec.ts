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

  it('não mostra o botão de alternar senha quando tipo é "email"', () => {
    expect(fixture.nativeElement.querySelector('.campo__alternar-senha')).toBeNull();
  });

  it('não mostra o botão de alternar senha quando tipo é "text"', () => {
    const comp = TestBed.createComponent(TextField);
    comp.componentRef.setInput('rotulo', 'Nome');
    comp.componentRef.setInput('controle', new FormControl(''));
    comp.componentRef.setInput('tipo', 'text');
    comp.detectChanges();
    expect(comp.nativeElement.querySelector('.campo__alternar-senha')).toBeNull();
  });

  it('mostra o botão de alternar senha quando tipo é "password"', () => {
    const comp = TestBed.createComponent(TextField);
    comp.componentRef.setInput('rotulo', 'Senha');
    comp.componentRef.setInput('controle', new FormControl(''));
    comp.componentRef.setInput('tipo', 'password');
    comp.detectChanges();
    expect(comp.nativeElement.querySelector('.campo__alternar-senha')).not.toBeNull();
  });

  it('alterna o type do input entre "password" e "text" ao clicar no botão', async () => {
    const comp = TestBed.createComponent(TextField);
    comp.componentRef.setInput('rotulo', 'Senha');
    comp.componentRef.setInput('controle', new FormControl(''));
    comp.componentRef.setInput('tipo', 'password');
    comp.detectChanges();

    const input: HTMLInputElement = comp.nativeElement.querySelector('input');
    const botao: HTMLButtonElement = comp.nativeElement.querySelector('.campo__alternar-senha');
    expect(input.type).toBe('password');
    expect(botao.getAttribute('aria-pressed')).toBe('false');
    expect(botao.getAttribute('aria-label')).toBe('Mostrar senha');

    botao.click();
    comp.detectChanges();
    await comp.whenStable();
    expect(input.type).toBe('text');
    expect(botao.getAttribute('aria-pressed')).toBe('true');
    expect(botao.getAttribute('aria-label')).toBe('Ocultar senha');

    botao.click();
    comp.detectChanges();
    await comp.whenStable();
    expect(input.type).toBe('password');
    expect(botao.getAttribute('aria-pressed')).toBe('false');
  });

  it('usa type="number" quando tipo é "number"', () => {
    const comp = TestBed.createComponent(TextField);
    comp.componentRef.setInput('rotulo', 'Preço');
    comp.componentRef.setInput('controle', new FormControl(0));
    comp.componentRef.setInput('tipo', 'number');
    comp.detectChanges();
    const input: HTMLInputElement = comp.nativeElement.querySelector('input');
    expect(input.type).toBe('number');
  });

  it('usa type="datetime-local" quando tipo é "datetime-local"', () => {
    const comp = TestBed.createComponent(TextField);
    comp.componentRef.setInput('rotulo', 'Data e hora');
    comp.componentRef.setInput('controle', new FormControl(''));
    comp.componentRef.setInput('tipo', 'datetime-local');
    comp.detectChanges();
    const input: HTMLInputElement = comp.nativeElement.querySelector('input');
    expect(input.type).toBe('datetime-local');
  });
});
