// src/app/guards/role.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const RoleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Obtener roles permitidos de la ruta
  const allowedRoles = route.data['roles'] as string[];
  
  // Obtener usuario actual del localStorage
  const userStr = localStorage.getItem('currentUser');
  
  if (!userStr) {
    router.navigate(['/login']);
    return false;
  }
  
  try {
    const user = JSON.parse(userStr);
    
    // Verificar si el usuario tiene un rol permitido
    if (allowedRoles && allowedRoles.includes(user.rol)) {
      return true;
    }
    
    // Si no tiene permiso, redirigir a home
    router.navigate(['/home']);
    return false;
  } catch (error) {
    console.error('Error al verificar roles:', error);
    router.navigate(['/login']);
    return false;
  }
};