import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Logo } from './logo';

describe('Logo', () => {
  let fixture: ComponentFixture<Logo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Logo] }).compileComponents();
    fixture = TestBed.createComponent(Logo);
  });

  it('usa a variante amarelo-transparente por padrão', () => {
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toContain('logo-rede-amarelo-transparente.svg');
  });

  it('troca o src conforme a variante informada', () => {
    fixture.componentRef.setInput('variante', 'preto-fundo-amarelo');
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toContain('logo-rede-preto-fundo-amarelo.svg');
  });

  it('aplica o tamanho informado como largura e altura', () => {
    fixture.componentRef.setInput('tamanho', '80px');
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.style.width).toBe('80px');
    expect(img.style.height).toBe('80px');
  });
});
