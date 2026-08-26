import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Table } from './table';

@Component({
  imports: [Table],
  template: `
    <app-table [cabecalhos]="['Nome', 'Preço']">
      <tr>
        <td>Camiseta REDE</td>
        <td>R$ 79,90</td>
      </tr>
    </app-table>
  `,
})
class HospedeTeste {}

describe('Table', () => {
  let fixture: ComponentFixture<HospedeTeste>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeTeste] }).compileComponents();
    fixture = TestBed.createComponent(HospedeTeste);
    fixture.detectChanges();
  });

  it('renderiza um <th> por cabeçalho, na ordem informada', () => {
    const cabecalhos: NodeListOf<HTMLTableCellElement> = fixture.nativeElement.querySelectorAll('th');
    expect(cabecalhos.length).toBe(2);
    expect(cabecalhos[0].textContent).toContain('Nome');
    expect(cabecalhos[1].textContent).toContain('Preço');
  });

  it('renderiza o conteúdo projetado dentro do tbody', () => {
    const tbody = fixture.nativeElement.querySelector('tbody');
    expect(tbody.textContent).toContain('Camiseta REDE');
    expect(tbody.textContent).toContain('R$ 79,90');
  });
});
