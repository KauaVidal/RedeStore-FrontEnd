import { Component, input } from '@angular/core';

@Component({
  selector: 'app-table',
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class Table {
  readonly cabecalhos = input.required<string[]>();
}
