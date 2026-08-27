import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', loadComponent: () => import('./features/loja/home/home').then((m) => m.Home) },
      { path: 'loja', loadChildren: () => import('./features/loja/loja.routes').then((m) => m.LOJA_ROUTES) },
      { path: 'eventos', loadChildren: () => import('./features/eventos/eventos.routes').then((m) => m.EVENTOS_ROUTES) },
      { path: 'sobre', loadComponent: () => import('./features/institucional/sobre/sobre').then((m) => m.Sobre) },
      { path: 'perfil', canActivate: [authGuard], loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil) },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layout/admin-shell/admin-shell').then((m) => m.AdminShell),
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
