// src/app/pages/registro/registro.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonHeader, LoadingController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, 
  lockClosedOutline, 
  mailOutline,
  callOutline,
  locationOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class RegistroPage {
  // Datos del formulario
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  nombre: string = '';
  email: string = '';
  telefono: string = '';
  direccion: string = '';
  
  // Estados
  errorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ 
      personOutline, 
      lockClosedOutline, 
      mailOutline,
      callOutline,
      locationOutline,
      arrowBackOutline,
      checkmarkCircleOutline,
      eyeOutline,
      eyeOffOutline
    });
  }

  /**
   * ✅ Registrar nuevo usuario
   */
  async registrar() {
    this.errorMessage = '';

    // Validaciones
    if (!this.validarCampos()) {
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrando usuario...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const resultado = await this.authService.registrar({
        username: this.username.trim(),
        password: this.password,
        nombre: this.nombre.trim(),
        email: this.email.trim().toLowerCase(),
        telefono: this.telefono.trim(),
        direccion: this.direccion.trim()
      });

      await loading.dismiss();

      if (resultado.success) {
        await this.mostrarToast('¡Registro exitoso! Ya puedes iniciar sesión', 'success');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      } else {
        this.errorMessage = resultado.message;
        await this.mostrarToast(resultado.message, 'danger');
      }

    } catch (error) {
      await loading.dismiss();
      console.error('Error en registro:', error);
      this.errorMessage = 'Error al registrar usuario. Intenta nuevamente.';
      await this.mostrarToast('Error al registrar usuario', 'danger');
    }
  }

  /**
   * 🔍 Validar todos los campos
   */
  private validarCampos(): boolean {
    // Usuario
    if (!this.username.trim()) {
      this.errorMessage = 'El nombre de usuario es obligatorio';
      return false;
    }
    if (this.username.length < 4) {
      this.errorMessage = 'El usuario debe tener al menos 4 caracteres';
      return false;
    }

    // Nombre completo
    if (!this.nombre.trim()) {
      this.errorMessage = 'El nombre completo es obligatorio';
      return false;
    }

    // Email
    if (!this.email.trim()) {
      this.errorMessage = 'El correo electrónico es obligatorio';
      return false;
    }
    if (!this.authService.validarEmail(this.email)) {
      this.errorMessage = 'El correo electrónico no es válido';
      return false;
    }

    // Contraseña
    if (!this.password) {
      this.errorMessage = 'La contraseña es obligatoria';
      return false;
    }
    const validacionPassword = this.authService.validarPassword(this.password);
    if (!validacionPassword.valida) {
      this.errorMessage = validacionPassword.mensaje;
      return false;
    }

    // Confirmar contraseña
    if (!this.confirmPassword) {
      this.errorMessage = 'Debes confirmar tu contraseña';
      return false;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return false;
    }

    return true;
  }

  /**
   * 👁️ Alternar visibilidad de contraseña
   */
  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  /**
   * ⬅️ Volver al login
   */
  volverLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * 💬 Mostrar toast
   */
  private async mostrarToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}