import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Categorias } from './categorias';

describe('Categorias', () => {
  let fixture: ComponentFixture<Categorias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Categorias],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Categorias);
    fixture.detectChanges();
  });

  it('mostra as três categorias', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Camisetas');
    expect(texto).toContain('Moletons');
    expect(texto).toContain('Acessórios');
  });

  it('cada categoria linka para a listagem filtrada', () => {
    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'));
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/loja/produtos?categoria=camisetas');
  });
});
