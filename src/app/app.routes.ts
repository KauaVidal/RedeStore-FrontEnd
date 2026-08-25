import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', loadComponent: () => import('./features/loja/home/home').then((m) => m.Home) },
      { path: 'loja', loadChildren: () => import('./features/loja/loja.routes').then((m) => m.LOJA_ROUTES) },
      { path: 'eventos', loadComponent: () => import('./shared/em-breve/em-breve').then((m) => m.EmBreve), data: { titulo: 'Eventos' } },
      { path: 'sobre', loadComponent: () => import('./features/institucional/sobre/sobre').then((m) => m.Sobre) },
      { path: 'perfil', canActivate: [authGuard], loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil) },
    ],
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
