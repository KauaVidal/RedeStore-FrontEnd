import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const EVENTOS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./agenda/agenda').then((m) => m.Agenda) },
  {
    path: 'minhas-inscricoes',
    canActivate: [authGuard],
    loadComponent: () => import('./minhas-inscricoes/minhas-inscricoes').then((m) => m.MinhasInscricoes),
  },
  {
    path: ':id',
    loadComponent: () => import('./evento-detalhes/evento-detalhes').then((m) => m.EventoDetalhes),
  },
  {
    path: ':id/confirmacao',
    canActivate: [authGuard],
    loadComponent: () => import('./confirmacao/confirmacao').then((m) => m.Confirmacao),
  },
];
