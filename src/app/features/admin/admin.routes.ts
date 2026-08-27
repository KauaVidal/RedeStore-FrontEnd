import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'produtos', pathMatch: 'full' },
  { path: 'produtos', loadComponent: () => import('./produtos/produtos').then((m) => m.Produtos) },
  { path: 'pedidos', loadComponent: () => import('./pedidos/pedidos').then((m) => m.Pedidos) },
  { path: 'eventos', loadComponent: () => import('./eventos/eventos').then((m) => m.Eventos) },
  {
    path: 'eventos/:id/inscricoes',
    loadComponent: () => import('./eventos/inscricoes/inscricoes').then((m) => m.Inscricoes),
  },
];
