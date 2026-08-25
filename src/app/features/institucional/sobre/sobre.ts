import { Component } from '@angular/core';
import { SectionDivider } from '../../../shared/ui/section-divider/section-divider';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-sobre',
  imports: [SectionDivider, EmptyState],
  templateUrl: './sobre.html',
  styleUrl: './sobre.scss',
})
export class Sobre {}
