// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario, ROLES } from '../models/usuario.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser$: Observable<Usuario | null>;

  constructor(private router: Router) {
    // Intentar recuperar usuario del localStorage al iniciar
    const storedUser = localStorage.getItem('currentUser');
    const user = storedUser ? JSON.parse(storedUser) : null;
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  // Obtener usuario actual
  public getUsuarioActual(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // Verificar si está autenticado
  public isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // Verificar si es admin
  public isAdmin(): boolean {
    const user = this.getUsuarioActual();
    return user?.rol === ROLES.ADMIN;
  }

  // Verificar si es cliente
  public isCliente(): boolean {
    const user = this.getUsuarioActual();
    return user?.rol === ROLES.CLIENTE;
  }

  // Login (simulado - deberías conectar con base de datos)
  public login(username: string, password: string): boolean {
    // IMPORTANTE: Esta es una implementación temporal
    // Debes reemplazar esto con tu lógica real de base de datos
    
    // Usuarios de prueba
    const usuariosPrueba: Usuario[] = [
      {
        id: 1,
        username: 'admin',
        password: 'admin123',
        rol: ROLES.ADMIN,
        nombre: 'Administrador',
        email: 'admin@taully.com',
        fechaRegistro: new Date().toISOString(),
        activo: true
      },
      {
        id: 2,
        username: 'cliente',
        password: 'cliente123',
        rol: ROLES.CLIENTE,
        nombre: 'Cliente Demo',
        email: 'cliente@taully.com',
        telefono: '987654321',
        direccion: 'Av. Principal 123',
        fechaRegistro: new Date().toISOString(),
        activo: true
      }
    ];

    // Buscar usuario
    const usuario = usuariosPrueba.find(
      u => u.username === username && u.password === password && u.activo
    );

    if (usuario) {
      // Guardar usuario (sin password por seguridad)
      const { password: _, ...userSinPassword } = usuario;
      localStorage.setItem('currentUser', JSON.stringify(userSinPassword));
      this.currentUserSubject.next(usuario);
      
      // ✅ CORREGIDO: Redirigir según rol
      if (usuario.rol === ROLES.ADMIN) {
        this.router.navigate(['/home']);
      } else {
        // Cliente va al home también (donde puede elegir tienda o pedidos)
        this.router.navigate(['/home']);
      }
      
      return true;
    }

    return false;
  }

  // Logout
  public logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Registrar nuevo usuario (para implementar después)
  public registrar(usuario: Omit<Usuario, 'id' | 'fechaRegistro'>): boolean {
    // TODO: Implementar con base de datos
    console.log('Registro de usuario:', usuario);
    return false;
  }
}