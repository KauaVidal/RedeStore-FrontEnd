import { Component, input } from '@angular/core';

@Component({
  selector: 'app-em-breve',
  templateUrl: './em-breve.html',
  styleUrl: './em-breve.scss',
})
export class EmBreve {
  readonly titulo = input<string>('');
}
