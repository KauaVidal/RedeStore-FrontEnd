import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Header } from './header';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let estaAutenticado: ReturnType<typeof signal<boolean>>;
  let quantidadeTotal: ReturnType<typeof signal<number>>;
  let isAdmin: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    estaAutenticado = signal(false);
    quantidadeTotal = signal(0);
    isAdmin = signal(false);
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { estaAutenticado, isAdmin } },
        { provide: CartService, useValue: { quantidadeTotal } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
  });

  it('link de perfil aponta para /login quando não autenticado', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('[data-testid="link-perfil"]');
    expect(link.getAttribute('href')).toBe('/login');
  });

  it('link de perfil aponta para /perfil quando autenticado', async () => {
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

  it('link do carrinho aponta para /loja/carrinho e não mostra badge quando vazio', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('[aria-label="Carrinho"]');
    expect(link.getAttribute('href')).toBe('/loja/carrinho');
    expect(fixture.nativeElement.querySelector('.cabecalho__badge')).toBeNull();
  });

  it('mostra a badge com a quantidade de itens no carrinho', async () => {
    quantidadeTotal.set(3);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.cabecalho__badge').textContent.trim()).toBe('3');
  });

  it('não mostra o link Admin quando isAdmin é false', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Admin');
  });

  it('mostra o link Admin quando isAdmin é true', async () => {
    isAdmin.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Admin');
  });
});
