import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const LOJA_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./listagem/listagem').then((m) => m.Listagem) },
  // Endereço antigo do catálogo: mantém links e favoritos funcionando (query params são preservados).
  { path: 'produtos', pathMatch: 'full', redirectTo: '' },
  {
    path: 'produtos/:id',
    loadComponent: () => import('./produto-detalhes/produto-detalhes').then((m) => m.ProdutoDetalhes),
  },
  {
    path: 'carrinho',
    canActivate: [authGuard],
    loadComponent: () => import('./carrinho/carrinho').then((m) => m.Carrinho),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'checkout/confirmacao',
    canActivate: [authGuard],
    loadComponent: () => import('./confirmacao/confirmacao').then((m) => m.Confirmacao),
  },
  {
    path: 'meus-pedidos',
    canActivate: [authGuard],
    loadComponent: () => import('./meus-pedidos/meus-pedidos').then((m) => m.MeusPedidos),
  },
];
