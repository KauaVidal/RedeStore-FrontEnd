import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./login/login').then((m) => m.Login) },
  { path: 'cadastro', loadComponent: () => import('./cadastro/cadastro').then((m) => m.Cadastro) },
];
