import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Shell } from './shell';
import { AuthService } from '../../core/auth/auth.service';

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { estaAutenticado: signal(false) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
  });

  it('renderiza header, bottom-nav, router-outlet e footer', () => {
    expect(fixture.nativeElement.querySelector('app-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-bottom-nav')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-footer')).not.toBeNull();
  });
});
