import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonHeader } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, 
  lockClosedOutline, 
  storefrontOutline,
  arrowForwardOutline,
  alertCircleOutline,
  shieldCheckmarkOutline,
  personCircleOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonHeader, 
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class LoginPage {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ 
      personOutline, 
      lockClosedOutline, 
      storefrontOutline,
      arrowForwardOutline,
      alertCircleOutline,
      shieldCheckmarkOutline,
      personCircleOutline
    });
  }

  login() {
    this.errorMessage = '';

    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor ingrese usuario y contraseña';
      return;
    }

    const success = this.authService.login(this.username, this.password);

    if (!success) {
      this.errorMessage = 'Usuario o contraseña incorrectos';
    }
  }

  loginAdmin() {
    this.username = 'admin';
    this.password = 'admin123';
    this.login();
  }

  loginCliente() {
    this.username = 'cliente';
    this.password = 'cliente123';
    this.login();
  }
}