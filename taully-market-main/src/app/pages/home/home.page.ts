import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonButton, IonIcon,
  IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cubeOutline, receiptOutline, analyticsOutline,
  logOutOutline, personOutline, cartOutline, storefrontOutline, checkmarkCircleOutline, alertCircleOutline, arrowForwardOutline, addCircleOutline, shieldCheckmarkOutline, notificationsOutline, searchOutline, lockClosedOutline, bagCheckOutline, flashOutline, cardOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { Usuario, ROLES } from '../../models/usuario.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonGrid, IonRow, IonCol, IonButton, IonIcon,
    IonButtons
  ]
})
export class HomePage implements OnInit {
  currentUser: Usuario | null = null;
  totalProductos: number = 0;
  ROLES = ROLES;

  constructor(
    private authService: AuthService,
    private dbService: DatabaseService,
    private router: Router
  ) {
    addIcons({storefrontOutline,logOutOutline,personOutline,cubeOutline,checkmarkCircleOutline,alertCircleOutline,arrowForwardOutline,analyticsOutline,addCircleOutline,shieldCheckmarkOutline,notificationsOutline,searchOutline,lockClosedOutline,cartOutline,bagCheckOutline,receiptOutline,flashOutline,cardOutline});
  }

  async ngOnInit() {
    this.currentUser = this.authService.getUsuarioActual();
    await this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    const productos = await this.dbService.getAllProductos();
    this.totalProductos = productos.length;
  }

  navegarA(ruta: string) {
    this.router.navigate([ruta]);
  }

  logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
      this.authService.logout();
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isCliente(): boolean {
    return this.authService.isCliente();
  }
}