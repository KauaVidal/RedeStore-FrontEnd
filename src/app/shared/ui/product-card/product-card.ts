import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Produto } from '../../../core/products/produto.model';
import { PrecoBrPipe } from '../../pipes/preco-br.pipe';
import { tomDaCor } from './cores';

const ROTULOS_CATEGORIA: Record<Produto['categoria'], string> = {
  camisetas: 'Camiseta',
  moletons: 'Moletom',
  acessorios: 'Acessório',
};

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, PrecoBrPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  readonly produto = input.required<Produto>();
  /** `catalogo`: card da listagem de produtos, com categoria e amostra de cores. */
  readonly variante = input<'padrao' | 'catalogo'>('padrao');

  protected readonly rotuloCategoria = computed(() => ROTULOS_CATEGORIA[this.produto().categoria]);
  protected readonly tomPrincipal = computed(() => {
    const cor = this.produto().cores[0];
    return cor ? tomDaCor(cor) : null;
  });
  protected readonly coresExtras = computed(() => Math.max(this.produto().cores.length - 1, 0));
}
