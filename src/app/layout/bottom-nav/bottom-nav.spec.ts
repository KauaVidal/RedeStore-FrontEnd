import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BottomNav } from './bottom-nav';

describe('BottomNav', () => {
  let fixture: ComponentFixture<BottomNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNav],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BottomNav);
    fixture.detectChanges();
  });

  it('renderiza os 4 destinos principais', () => {
    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('a');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/loja', '/eventos', '/perfil']);
  });

  it('mostra os rótulos corretos', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Início');
    expect(texto).toContain('Loja');
    expect(texto).toContain('Eventos');
    expect(texto).toContain('Perfil');
  });
});
