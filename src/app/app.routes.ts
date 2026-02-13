import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'access-denied',
    loadComponent: () => import('./pages/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'barberos',
    loadComponent: () => import('./pages/barberos/barberos.component').then(m => m.BarberosComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'servicios',
    loadComponent: () => import('./pages/servicios/servicios.component').then(m => m.ServiciosComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'BARBERO'] }
  },
  {
    path: 'productos',
    loadComponent: () => import('./pages/productos/productos.component').then(m => m.ProductosComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'ventas',
    loadComponent: () => import('./pages/ventas/ventas.component').then(m => m.VentasComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'BARBERO'] }
  },
  {
    path: 'reportes',
    loadComponent: () => import('./pages/reportes/reportes.component').then(m => m.ReportesComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'horarios',
    loadComponent: () => import('./pages/horarios/horarios.component').then(m => m.HorariosComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'citas',
    loadComponent: () => import('./pages/citas/citas.component').then(m => m.CitasComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'mobiliario-equipo',
    loadComponent: () => import('./pages/mobiliario-equipo/mobiliario-equipo.component').then(m => m.MobiliarioEquipoComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'tipos-corte',
    loadComponent: () => import('./pages/tipos-corte/tipos-corte.component').then(m => m.TiposCorteComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'compra-aqui',
    loadComponent: () => import('./pages/compra-aqui/compra-aqui.component').then(m => m.CompraAquiComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'acerca-de-nosotros',
    loadComponent: () => import('./pages/acerca-de-nosotros/acerca-de-nosotros.component').then(m => m.AcercaDeNosotrosComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'academia',
    loadComponent: () => import('./pages/academia/academia.component').then(m => m.AcademiaComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'gestion-catalogo',
    loadComponent: () => import('./pages/gestion-catalogo/gestion-catalogo.component').then(m => m.GestionCatalogoComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

