import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/products/product.service';
import { Produto } from '../../../core/products/produto.model';
import { ProductCard } from '../../../shared/ui/product-card/product-card';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly produtos = inject(ProductService);

  protected readonly destaques = signal<Produto[]>([]);

  async ngOnInit(): Promise<void> {
    this.destaques.set(await this.produtos.listarDestaques());
  }
}
