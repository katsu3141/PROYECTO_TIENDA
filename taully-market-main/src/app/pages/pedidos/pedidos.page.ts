// src/app/pages/pedidos/pedidos.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonCard,
  IonCardContent, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, receiptOutline, cartOutline,
  timeOutline, checkmarkCircleOutline, cubeOutline,
  calendarOutline, cashOutline
} from 'ionicons/icons';

interface Pedido {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  items: {
    productoId: number;
    productoNombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  total: number;
  fecha: string;
  estado: string;
}

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonCard,
    IonCardContent, IonBadge
  ]
})
export class PedidosPage implements OnInit {
  pedidos: Pedido[] = [];
  cargando: boolean = true;

  constructor(private router: Router) {
    addIcons({ 
      arrowBackOutline, receiptOutline, cartOutline,
      timeOutline, checkmarkCircleOutline, cubeOutline,
      calendarOutline, cashOutline
    });
  }

  ngOnInit() {
    this.cargarPedidos();
  }

  /**
   * 📦 Cargar historial de pedidos desde localStorage
   */
  cargarPedidos() {
    this.cargando = true;
    
    try {
      const historialStr = localStorage.getItem('pedidos_historial');
      if (historialStr) {
        this.pedidos = JSON.parse(historialStr);
        console.log('✅ Pedidos cargados:', this.pedidos.length);
      }
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
    } finally {
      this.cargando = false;
    }
  }

  /**
   * 🎨 Obtener color del estado
   */
  getEstadoColor(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'warning';
      case 'en proceso':
        return 'primary';
      case 'entregado':
        return 'success';
      case 'cancelado':
        return 'danger';
      default:
        return 'medium';
    }
  }

  /**
   * 📅 Formatear fecha
   */
  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('es-PE', opciones);
  }

  /**
   * 🔢 Obtener total de items de un pedido
   */
  getTotalItems(pedido: Pedido): number {
    return pedido.items.reduce((total, item) => total + item.cantidad, 0);
  }

  /**
   * 🛒 Ir a la tienda
   */
  irATienda() {
    this.router.navigate(['/tienda']);
  }

  /**
   * 💰 Calcular total gastado en todos los pedidos
   */
  getTotalGastado(): number {
    return this.pedidos.reduce((total, pedido) => total + pedido.total, 0);
  }

  /**
   * 🏠 Volver al home
   */
  volver() {
    this.router.navigate(['/home']);
  }
}