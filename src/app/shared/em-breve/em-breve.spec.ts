import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmBreve } from './em-breve';

describe('EmBreve', () => {
  let fixture: ComponentFixture<EmBreve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EmBreve] }).compileComponents();
    fixture = TestBed.createComponent(EmBreve);
  });

  it('mostra o título informado', () => {
    fixture.componentRef.setInput('titulo', 'Loja');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loja');
    expect(fixture.nativeElement.textContent).toContain('em breve');
  });
});
