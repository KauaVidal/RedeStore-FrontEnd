import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Logo } from '../../shared/ui/logo/logo';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { Icone } from '../../shared/ui/icone/icone';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Logo, Icone],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly carrinho = inject(CartService);

  protected readonly estaAutenticado = this.auth.estaAutenticado;
  protected readonly quantidadeCarrinho = this.carrinho.quantidadeTotal;
  protected readonly isAdmin = this.auth.isAdmin;
}
