import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonGrid, IonRow, IonCol,
  IonIcon, IonSearchbar, IonBadge, IonButtons, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cartOutline, searchOutline, storefrontOutline, 
  cart, pricetag, apps, imageOutline, checkmarkCircle,
  alertCircle, closeCircle, pricetagOutline, add, remove,
  arrowForward, closeCircleOutline, logOutOutline, appsOutline } from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { Producto } from '../../models/producto.model';
import { CarritoService } from '../../services/carrito.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tienda',
  templateUrl: './tienda.page.html',
  styleUrls: ['./tienda.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonGrid, IonRow, IonCol,
    IonIcon, IonSearchbar, IonBadge, IonButtons, IonFab, IonFabButton
  ]
})
export class TiendaPage implements OnInit, OnDestroy {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  terminoBusqueda: string = '';
  categoriaSeleccionada: string = '';
  categorias: string[] = [];
  cargando: boolean = false;
  
  // Control de cantidades seleccionadas por producto
  private cantidadesSeleccionadas: Map<number, number> = new Map();
  
  private productosSubscription?: Subscription;

  constructor(
    private dbService: DatabaseService,
    private carritoService: CarritoService,
    private router: Router
  ) {
    addIcons({storefrontOutline,logOutOutline,cartOutline,closeCircleOutline,appsOutline,pricetagOutline,remove,add,cart,searchOutline,pricetag,apps,imageOutline,checkmarkCircle,alertCircle,closeCircle,arrowForward});
  }

  async ngOnInit() {
    console.log('🛍️ Inicializando tienda...');
    
    // ✅ Suscribirse a cambios automáticos de productos
    this.productosSubscription = this.dbService.productos$.subscribe(productos => {
      console.log(`✅ Productos actualizados: ${productos.length} items`);
      this.productos = productos;
      this.extraerCategorias();
      this.aplicarFiltro();
    });
    
    await this.cargarProductos();
  }

  ngOnDestroy() {
    if (this.productosSubscription) {
      this.productosSubscription.unsubscribe();
    }
  }

  /**
   * 📦 Cargar productos desde la base de datos
   */
  async cargarProductos() {
    this.cargando = true;
    console.log('📦 Cargando productos de la tienda...');
    
    try {
      this.productos = await this.dbService.getAllProductos();
      this.extraerCategorias();
      this.aplicarFiltro();
      console.log(`✅ ${this.productos.length} productos cargados`);
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
    } finally {
      this.cargando = false;
    }
  }

  /**
   * 🏷️ Extraer categorías únicas
   */
  extraerCategorias() {
    const categoriasSet = new Set(this.productos.map(p => p.categoria));
    this.categorias = Array.from(categoriasSet).sort();
  }

  /**
   * 🔍 Filtrar productos
   */
  filtrarProductos() {
    this.aplicarFiltro();
  }

  /**
   * 🎯 Aplicar filtros
   */
  aplicarFiltro() {
    let productosFiltrados = [...this.productos];

    // Filtrar por término de búsqueda
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      productosFiltrados = productosFiltrados.filter(p =>
        p.nombre.toLowerCase().includes(termino) ||
        p.categoria.toLowerCase().includes(termino) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(termino))
      );
    }

    // Filtrar por categoría
    if (this.categoriaSeleccionada) {
      productosFiltrados = productosFiltrados.filter(p =>
        p.categoria === this.categoriaSeleccionada
      );
    }

    this.productosFiltrados = productosFiltrados;
  }

  /**
   * 🏷️ Filtrar por categoría específica
   */
  filtrarPorCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
    this.aplicarFiltro();
  }

  /**
   * 🧹 Limpiar búsqueda
   */
  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.categoriaSeleccionada = '';
    this.aplicarFiltro();
  }

  /**
   * 🔢 Obtener cantidad seleccionada de un producto
   */
  getCantidadSeleccionada(productoId: number): number {
    return this.cantidadesSeleccionadas.get(productoId) || 1;
  }

  /**
   * ➕ Incrementar cantidad
   */
  incrementarCantidad(producto: Producto) {
    const cantidadActual = this.getCantidadSeleccionada(producto.id!);
    if (cantidadActual < producto.stock) {
      this.cantidadesSeleccionadas.set(producto.id!, cantidadActual + 1);
    }
  }

  /**
   * ➖ Decrementar cantidad
   */
  decrementarCantidad(producto: Producto) {
    const cantidadActual = this.getCantidadSeleccionada(producto.id!);
    if (cantidadActual > 1) {
      this.cantidadesSeleccionadas.set(producto.id!, cantidadActual - 1);
    }
  }

  /**
   * 🛒 Agregar producto al carrito
   */
  agregarAlCarrito(producto: Producto) {
    if (producto.stock <= 0) {
      console.warn('⚠️ Producto sin stock');
      return;
    }

    const cantidad = this.getCantidadSeleccionada(producto.id!);
    this.carritoService.agregarProducto(producto, cantidad);
    
    console.log(`✅ Agregado: ${cantidad}x ${producto.nombre}`);
    
    // Resetear cantidad seleccionada
    this.cantidadesSeleccionadas.set(producto.id!, 1);
    
    // Mostrar feedback visual (opcional)
    this.mostrarToast(`${cantidad}x ${producto.nombre} agregado al carrito`);
  }

  /**
   * 🛒 Ir al carrito
   */
  irACarrito() {
    this.router.navigate(['/carrito']);
  }

  /**
   * 🔢 Obtener total de items en carrito
   */
  getTotalCarrito(): number {
    return this.carritoService.getTotalItems();
  }

  /**
   * 💬 Mostrar toast (feedback)
   */
  private mostrarToast(mensaje: string) {
    // Implementación simple con alert (puedes mejorar con ToastController)
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = mensaje;
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 173, 181, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      animation: slideUp 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}