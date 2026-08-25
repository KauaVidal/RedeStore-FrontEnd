import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../core/cart/cart.service';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Button } from '../../../shared/ui/button/button';

@Component({
  selector: 'app-carrinho',
  imports: [EmptyState, Button],
  templateUrl: './carrinho.html',
  styleUrl: './carrinho.scss',
})
export class Carrinho {
  protected readonly carrinho = inject(CartService);
  private readonly router = inject(Router);

  protected alterarQuantidade(produtoId: string, tamanho: string, cor: string, quantidade: number): void {
    this.carrinho.atualizarQuantidade(produtoId, tamanho, cor, quantidade);
  }

  protected remover(produtoId: string, tamanho: string, cor: string): void {
    this.carrinho.removerItem(produtoId, tamanho, cor);
  }

  protected irParaCheckout(): void {
    this.router.navigateByUrl('/loja/checkout');
  }
}
