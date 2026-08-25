import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Sobre } from './sobre';

describe('Sobre', () => {
  let fixture: ComponentFixture<Sobre>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sobre],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Sobre);
    fixture.detectChanges();
  });

  it('mostra as três seções principais', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Sobre a REDE');
    expect(texto).toContain('Liderança');
    expect(texto).toContain('Horário de encontro');
  });

  it('mostra o texto de visão do ministério', () => {
    expect(fixture.nativeElement.textContent).toContain('conectar jovens');
  });
});
