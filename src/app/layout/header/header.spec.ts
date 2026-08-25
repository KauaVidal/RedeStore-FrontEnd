import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Header } from './header';
import { AuthService } from '../../core/auth/auth.service';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let estaAutenticado: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    estaAutenticado = signal(false);
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), { provide: AuthService, useValue: { estaAutenticado } }],
    }).compileComponents();
    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
  });

  it('link de perfil aponta para /login quando não autenticado', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('[data-testid="link-perfil"]');
    expect(link.getAttribute('href')).toBe('/login');
  });

  it('link de perfil aponta para /perfil quando autenticado', async () => {
    // Segundo detectChanges() após mutar um signal já lido no template —
    // precisa de whenStable() pra garantir que a atualização assente antes
    // da asserção (achado real da Task 8: ver ledger do SDD).
    estaAutenticado.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('[data-testid="link-perfil"]');
    expect(link.getAttribute('href')).toBe('/perfil');
  });

  it('mostra a logo e os links de navegação', () => {
    expect(fixture.nativeElement.querySelector('app-logo')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Loja');
    expect(fixture.nativeElement.textContent).toContain('Eventos');
    expect(fixture.nativeElement.textContent).toContain('Sobre');
  });
});
