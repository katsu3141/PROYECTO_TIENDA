// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario, ROLES } from '../models/usuario.model';
import { Router } from '@angular/router';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser$: Observable<Usuario | null>;

  constructor(
    private router: Router,
    private dbService: DatabaseService
  ) {
    const storedUser = localStorage.getItem('currentUser');
    const user = storedUser ? JSON.parse(storedUser) : null;
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public getUsuarioActual(): Usuario | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * ✅ CORREGIDO: Verificar si es admin
   */
  public isAdmin(): boolean {
    const user = this.getUsuarioActual();
    if (!user) return false;
    
    return user.rol === ROLES.ADMIN;
  }

  /**
   * ✅ CORREGIDO: Verificar si es cliente
   */
  public isCliente(): boolean {
    const user = this.getUsuarioActual();
    if (!user) return false;
    
    return user.rol === ROLES.CLIENTE;
  }

  public async login(username: string, password: string): Promise<boolean> {
    try {
      console.log('🔐 Login:', username);
      await this.dbService.waitForDB();
      
      const usuario = await this.dbService.getUsuarioByUsername(username);

      if (!usuario || !usuario.activo || usuario.password !== password) {
        console.log('❌ Login fallido');
        return false;
      }

      console.log('✅ Usuario encontrado:', usuario);
      console.log('✅ Rol del usuario:', usuario.rol);
      console.log('✅ Es admin?', this.isAdminFromUser(usuario));
      console.log('✅ Es cliente?', this.isClienteFromUser(usuario));

      const { password: _, ...userSinPassword } = usuario;
      localStorage.setItem('currentUser', JSON.stringify(userSinPassword));
      this.currentUserSubject.next(usuario);
      
      console.log('✅ Login OK:', usuario.nombre, '| Rol:', usuario.rol);
      this.router.navigate(['/home']);
      return true;

    } catch (error) {
      console.error('❌ Error login:', error);
      return false;
    }
  }

  // Métodos auxiliares para verificar desde un objeto usuario
  private isAdminFromUser(user: Usuario): boolean {
    return user.rol === ROLES.ADMIN;
  }

  private isClienteFromUser(user: Usuario): boolean {
    return user.rol === ROLES.CLIENTE;
  }

  public logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  public async registrar(datosUsuario: {
    username: string;
    password: string;
    nombre: string;
    email: string;
    telefono?: string;
    direccion?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      await this.dbService.waitForDB();
      
      const usuarioExistente = await this.dbService.getUsuarioByUsername(datosUsuario.username);
      if (usuarioExistente) {
        return { success: false, message: 'El nombre de usuario ya está en uso' };
      }

      const emailExistente = await this.dbService.getUsuarioByEmail(datosUsuario.email);
      if (emailExistente) {
        return { success: false, message: 'El correo electrónico ya está registrado' };
      }

      const nuevoUsuario: Omit<Usuario, 'id'> = {
        username: datosUsuario.username,
        password: datosUsuario.password,
        rol: ROLES.CLIENTE,
        nombre: datosUsuario.nombre,
        email: datosUsuario.email,
        telefono: datosUsuario.telefono,
        direccion: datosUsuario.direccion,
        fechaRegistro: new Date().toISOString(),
        activo: true
      };

      const userId = await this.dbService.crearUsuario(nuevoUsuario);

      if (userId > 0) {
        console.log('✅ Usuario registrado:', userId);
        return { success: true, message: 'Usuario registrado exitosamente' };
      } else {
        return { success: false, message: 'Error al crear el usuario' };
      }

    } catch (error) {
      console.error('❌ Error registro:', error);
      return { success: false, message: 'Error al registrar usuario' };
    }
  }

  public validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  public validarPassword(password: string): { valida: boolean; mensaje: string } {
    if (password.length < 6) {
      return { valida: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' };
    }
    if (!/[A-Za-z]/.test(password)) {
      return { valida: false, mensaje: 'La contraseña debe contener al menos una letra' };
    }
    if (!/[0-9]/.test(password)) {
      return { valida: false, mensaje: 'La contraseña debe contener al menos un número' };
    }
    return { valida: true, mensaje: 'Contraseña válida' };
  }

  /**
   * 🔧 Método para reparar manualmente los usuarios (solución temporal)
   */
  public async repararUsuariosManual(): Promise<void> {
    if (confirm('⚠️ Esto eliminará y recreará los usuarios por defecto.\n¿Desea continuar?')) {
      await this.dbService.repararUsuariosPorDefecto();
      this.logout();
    }
  }
}