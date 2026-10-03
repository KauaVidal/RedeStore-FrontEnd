import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Icone, NomeIcone } from './icone';

describe('Icone', () => {
  let fixture: ComponentFixture<Icone>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Icone] }).compileComponents();
    fixture = TestBed.createComponent(Icone);
  });

  const nomes: NomeIcone[] = [
    'carrinho',
    'usuario',
    'inicio',
    'loja',
    'eventos',
    'fechar',
    'voltar',
  ];
  for (const nome of nomes) {
    it(`desenha o ícone "${nome}" em SVG`, () => {
      fixture.componentRef.setInput('nome', nome);
      fixture.detectChanges();
      const svg: SVGElement = fixture.nativeElement.querySelector('svg');
      expect(svg.children.length).toBeGreaterThan(0);
      expect(svg.getAttribute('stroke')).toBe('currentColor');
    });
  }

  it('é decorativo e respeita o tamanho pedido', () => {
    fixture.componentRef.setInput('nome', 'carrinho');
    fixture.componentRef.setInput('tamanho', 24);
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('aria-hidden')).toBe('true');
    expect(fixture.nativeElement.querySelector('svg').getAttribute('width')).toBe('24');
  });
});
