import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Produto } from '../../../core/products/produto.model';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  readonly produto = input.required<Produto>();
}
