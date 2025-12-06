// src/app/pages/carrito/carrito.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonButtons,
  AlertController, ToastController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, trashOutline, cartOutline,
  cubeOutline, cashOutline, imageOutline, pricetagOutline,
  checkmarkCircle, alertCircle, add, remove, storefrontOutline,
  checkmarkCircleOutline, receiptOutline
} from 'ionicons/icons';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import { DatabaseService } from '../../services/database.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.page.html',
  styleUrls: ['./carrito.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonButtons
  ]
})
export class CarritoPage implements OnInit {
  carrito: ItemCarrito[] = [];

  constructor(
    private carritoService: CarritoService,
    private dbService: DatabaseService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ 
      arrowBackOutline, trashOutline, cartOutline,
      cubeOutline, cashOutline, imageOutline, pricetagOutline,
      checkmarkCircle, alertCircle, add, remove, storefrontOutline,
      checkmarkCircleOutline, receiptOutline
    });
  }

  ngOnInit() {
    console.log('🛒 Inicializando carrito...');
    this.carritoService.carrito$.subscribe(carrito => {
      this.carrito = carrito;
      console.log(`📦 Carrito actualizado: ${carrito.length} productos`);
    });
  }

  /**
   * ➕ Incrementar cantidad de un producto
   */
  incrementarCantidad(item: ItemCarrito) {
    if (item.cantidad < item.producto.stock) {
      this.carritoService.actualizarCantidad(item.producto.id!, item.cantidad + 1);
      this.mostrarToast('Cantidad actualizada', 'success');
    } else {
      this.mostrarToast('Stock máximo alcanzado', 'warning');
    }
  }

  /**
   * ➖ Decrementar cantidad de un producto
   */
  decrementarCantidad(item: ItemCarrito) {
    if (item.cantidad > 1) {
      this.carritoService.actualizarCantidad(item.producto.id!, item.cantidad - 1);
      this.mostrarToast('Cantidad actualizada', 'success');
    }
  }

  /**
   * 🗑️ Eliminar producto del carrito
   */
  async eliminarProducto(productoId: number) {
    const alert = await this.alertController.create({
      header: '¿Eliminar producto?',
      message: '¿Deseas eliminar este producto del carrito?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.carritoService.eliminarProducto(productoId);
            this.mostrarToast('Producto eliminado del carrito', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * 🧹 Limpiar todo el carrito
   */
  async limpiarCarrito() {
    const alert = await this.alertController.create({
      header: '¿Vaciar carrito?',
      message: '¿Estás seguro de eliminar todos los productos del carrito?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Vaciar',
          role: 'destructive',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.carritoService.limpiarCarrito();
            this.mostrarToast('Carrito vaciado', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * 📊 Obtener total de items
   */
  getTotalItems(): number {
    return this.carritoService.getTotalItems();
  }

  /**
   * 💰 Obtener precio total
   */
  getTotalPrecio(): number {
    return this.carritoService.getTotalPrecio();
  }

  /**
   * ⬅️ Volver a la tienda
   */
  volver() {
    this.router.navigate(['/tienda']);
  }

  /**
   * ✅ Realizar pedido
   */
  async realizarPedido() {
    if (this.carrito.length === 0) {
      this.mostrarToast('El carrito está vacío', 'warning');
      return;
    }

    // Validar stock disponible
    const sinStock = this.carrito.find(item => item.cantidad > item.producto.stock);
    if (sinStock) {
      this.mostrarToast(`Stock insuficiente para ${sinStock.producto.nombre}`, 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: '¿Confirmar Pedido?',
      message: `Total de productos: ${this.getTotalItems()}\n\nTotal a pagar: S/ ${this.getTotalPrecio().toFixed(2)}\n\n⚠️ Esta acción actualizará el stock de los productos.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Confirmar Pedido',
          cssClass: 'alert-button-confirm',
          handler: async () => {
            await this.procesarPedido();
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * 📦 Procesar el pedido completo
   */
  private async procesarPedido() {
    const loading = await this.loadingController.create({
      message: 'Procesando pedido...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      console.log('📦 Procesando pedido...');
      console.log('Items:', this.carrito);
      console.log('Total:', this.getTotalPrecio());

      // ✅ 1. Actualizar stock de cada producto
      for (const item of this.carrito) {
        const producto = await this.dbService.getProducto(item.producto.id!);
        
        if (producto) {
          // Restar del stock
          const nuevoStock = producto.stock - item.cantidad;
          
          if (nuevoStock < 0) {
            await loading.dismiss();
            this.mostrarToast(`Stock insuficiente para ${producto.nombre}`, 'danger');
            return;
          }

          // Actualizar producto
          await this.dbService.actualizarProducto({
            ...producto,
            stock: nuevoStock
          });

          console.log(`✅ Stock actualizado: ${producto.nombre} (${producto.stock} → ${nuevoStock})`);
        }
      }

      // ✅ 2. Guardar registro del pedido en localStorage
      // (En el futuro, esto debería ir a una tabla de pedidos en la BD)
      this.guardarPedidoEnHistorial();

      // ✅ 3. Limpiar carrito
      this.carritoService.limpiarCarrito();

      await loading.dismiss();
      
      // ✅ 4. Mostrar confirmación
      await this.mostrarConfirmacionPedido();

      // ✅ 5. Redirigir
      setTimeout(() => {
        this.router.navigate(['/pedidos']);
      }, 2000);

    } catch (error) {
      console.error('❌ Error procesando pedido:', error);
      await loading.dismiss();
      this.mostrarToast('Error al procesar el pedido', 'danger');
    }
  }

  /**
   * 💾 Guardar pedido en historial (localStorage temporal)
   */
  private guardarPedidoEnHistorial() {
    const usuario = this.authService.getUsuarioActual();
    
    const pedido = {
      id: Date.now(),
      usuarioId: usuario?.id || 0,
      usuarioNombre: usuario?.nombre || 'Cliente',
      items: this.carrito.map(item => ({
        productoId: item.producto.id,
        productoNombre: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.producto.precio,
        subtotal: item.producto.precio * item.cantidad
      })),
      total: this.getTotalPrecio(),
      fecha: new Date().toISOString(),
      estado: 'Pendiente'
    };

    // Obtener historial actual
    const historialStr = localStorage.getItem('pedidos_historial');
    const historial = historialStr ? JSON.parse(historialStr) : [];

    // Agregar nuevo pedido
    historial.unshift(pedido); // Agregar al inicio

    // Guardar
    localStorage.setItem('pedidos_historial', JSON.stringify(historial));

    console.log('💾 Pedido guardado en historial:', pedido);
  }

  /**
   * 🎉 Mostrar confirmación del pedido
   */
  private async mostrarConfirmacionPedido() {
    const alert = await this.alertController.create({
      header: '¡Pedido Realizado! 🎉',
      subHeader: 'Tu pedido ha sido procesado exitosamente',
      message: `
Total de productos: ${this.getTotalItems()}
Total pagado: S/ ${this.getTotalPrecio().toFixed(2)}
Estado: Pendiente

Puedes ver tu pedido en la sección "Mis Pedidos"
      `,
      buttons: [{
        text: 'Aceptar',
        cssClass: 'alert-button-confirm'
      }]
    });

    await alert.present();
  }

  /**
   * 💬 Mostrar toast de notificación
   */
  private async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: color,
      cssClass: 'custom-toast'
    });
    await toast.present();
  }
}