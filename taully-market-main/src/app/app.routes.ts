// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { ROLES } from './models/usuario.model';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
    canActivate: [AuthGuard]
  },
  
  // ==========================================
  // 🔐 RUTAS SOLO PARA ADMIN
  // ==========================================
  {
    path: 'productos',
    loadComponent: () => import('./pages/productos-lista/productos-lista.page').then(m => m.ProductosPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [ROLES.ADMIN] }
  },
  {
    path: 'producto-form',
    loadComponent: () => import('./pages/producto-form/producto-form.page').then(m => m.ProductoFormPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [ROLES.ADMIN] }
  },
  {
    path: 'producto-form/:id',
    loadComponent: () => import('./pages/producto-form/producto-form.page').then(m => m.ProductoFormPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [ROLES.ADMIN] }
  },
  {
    path: 'reportes', // 🆕 RUTA AGREGADA
    loadComponent: () => import('./pages/reportes/reportes.page').then(m => m.ReportesPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [ROLES.ADMIN] }
  },
  
  // ==========================================
  // 👤 RUTAS PARA CLIENTE
  // ==========================================
  {
    path: 'tienda',
    loadComponent: () => import('./pages/tienda/tienda.page').then(m => m.TiendaPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [ROLES.CLIENTE] }
  },
  {
    path: 'carrito',
    loadComponent: () => import('./pages/carrito/carrito.page').then(m => m.CarritoPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [ROLES.CLIENTE] }
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./pages/pedidos/pedidos.page').then(m => m.PedidosPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [ROLES.CLIENTE] }
  },
  
  // ==========================================
  // 🔀 RUTA 404
  // ==========================================
  {
    path: '**',
    redirectTo: 'login'
  }
];