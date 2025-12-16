import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonButton, IonIcon,
  IonButtons, IonBadge, IonProgressBar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cubeOutline, receiptOutline, analyticsOutline,
  logOutOutline, personOutline, cartOutline, storefrontOutline, 
  checkmarkCircleOutline, alertCircleOutline, arrowForwardOutline, 
  addCircleOutline, shieldCheckmarkOutline, notificationsOutline, 
  searchOutline, lockClosedOutline, bagCheckOutline, flashOutline, 
  cardOutline, buildOutline, trendingUpOutline, trendingDownOutline,
  cashOutline, warningOutline, bulbOutline, pricetagOutline, barChartOutline, pulseOutline, personCircleOutline, syncOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { Subscription } from 'rxjs';

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
    IonButtons, IonBadge, IonProgressBar
  ]
})
export class HomePage implements OnInit, OnDestroy {
  currentUser: any | null = null;
  
  // ✅ Métricas mejoradas
  totalProductos: number = 0;
  valorInventario: number = 0;
  stockBajo: number = 0;
  stockCritico: number = 0;
  productosConStock: number = 0;
  productosSinStock: number = 0;
  
  // 📊 Estadísticas adicionales
  categoriaConMasProductos: string = '-';
  productoMasCaro: string = '-';
  stockTotal: number = 0;
  
  // 🎨 Indicadores visuales
  porcentajeStockSaludable: number = 0;
  estadoInventario: 'excelente' | 'bueno' | 'alerta' | 'critico' = 'bueno';
  
  // ✅ Importar ROLES directamente
  readonly ROLES = {
    ADMIN: 'admin',
    CLIENTE: 'cliente'
  };

  // ✅ Suscripción para actualizar productos automáticamente
  private productosSubscription!: Subscription;
  private intervalId: any;

  constructor(
    private authService: AuthService,
    private dbService: DatabaseService,
    private router: Router
  ) {
    addIcons({storefrontOutline,logOutOutline,personCircleOutline,cubeOutline,trendingUpOutline,cashOutline,alertCircleOutline,checkmarkCircleOutline,warningOutline,analyticsOutline,bulbOutline,pricetagOutline,shieldCheckmarkOutline,arrowForwardOutline,addCircleOutline,notificationsOutline,syncOutline,cartOutline,bagCheckOutline,receiptOutline,flashOutline,cardOutline,barChartOutline,pulseOutline,personOutline,lockClosedOutline,searchOutline,buildOutline,trendingDownOutline});
  }

  async ngOnInit() {
    // ✅ Obtener usuario actual
    this.currentUser = this.authService.getUsuarioActual();
    
    // ✅ DEBUG: Verificar datos del usuario
    console.log('🏠 HomePage iniciado');
    console.log('👤 Usuario actual:', this.currentUser);
    console.log('👤 Rol del usuario:', this.currentUser?.rol);
    
    // ✅ Suscribirse a cambios en los productos
    this.suscribirseAProductos();
    
    // ✅ Cargar estadísticas iniciales
    await this.cargarEstadisticasCompletas();
    
    // ✅ Actualizar estadísticas cada 30 segundos
    this.intervalId = setInterval(() => {
      this.cargarEstadisticasCompletas();
    }, 30000);
  }

  ngOnDestroy() {
    // ✅ Limpiar suscripciones al destruir el componente
    if (this.productosSubscription) {
      this.productosSubscription.unsubscribe();
      console.log('🧹 Suscripción a productos eliminada');
    }
    
    // ✅ Limpiar intervalo
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('🧹 Intervalo de actualización eliminado');
    }
  }

  /**
   * 🔄 Suscribirse a cambios en los productos
   */
  private suscribirseAProductos() {
    this.productosSubscription = this.dbService.productos$.subscribe({
      next: async (productos) => {
        console.log('🔄 Productos actualizados desde observable:', productos.length);
        this.totalProductos = productos.length;
        
        // Recalcular estadísticas cuando cambien los productos
        await this.cargarEstadisticasCompletas();
      },
      error: (error) => {
        console.error('❌ Error en suscripción a productos:', error);
      }
    });
  }

  /**
   * 📊 Cargar estadísticas completas
   */
  async cargarEstadisticasCompletas() {
    try {
      console.log('📊 Cargando estadísticas completas...');
      
      const resumen = await this.dbService.getResumenDashboard();
      const productos = await this.dbService.getAllProductos();
      
      // Métricas principales
      this.totalProductos = resumen.totalProductos;
      this.valorInventario = resumen.valorInventario;
      this.stockBajo = resumen.stockBajo;
      this.stockCritico = resumen.cantidadStockCritico;  // ✅ CAMBIADO AQUÍ
      
      // Calcular productos con/sin stock
      this.productosConStock = productos.filter(p => p.stock > 0).length;
      this.productosSinStock = productos.filter(p => p.stock === 0).length;
      
      // Stock total
      this.stockTotal = productos.reduce((sum, p) => sum + p.stock, 0);
      
      // Estadísticas adicionales
      this.calcularEstadisticasAdicionales(productos);
      
      // Calcular estado del inventario
      this.calcularEstadoInventario();
      
      console.log('✅ Estadísticas cargadas:', {
        totalProductos: this.totalProductos,
        valorInventario: this.valorInventario,
        stockBajo: this.stockBajo,
        stockCritico: this.stockCritico,  // ✅ Ahora funciona
        estadoInventario: this.estadoInventario
      });
      
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      this.resetearMetricas();
    }
  }

  /**
   * 📈 Calcular estadísticas adicionales
   */
  private calcularEstadisticasAdicionales(productos: any[]) {
    if (productos.length === 0) {
      this.categoriaConMasProductos = '-';
      this.productoMasCaro = '-';
      return;
    }
    
    // Categoría con más productos
    const categorias = new Map<string, number>();
    productos.forEach(p => {
      categorias.set(p.categoria, (categorias.get(p.categoria) || 0) + 1);
    });
    
    let maxCantidad = 0;
    let categoriaMax = '-';
    categorias.forEach((cantidad, categoria) => {
      if (cantidad > maxCantidad) {
        maxCantidad = cantidad;
        categoriaMax = categoria;
      }
    });
    this.categoriaConMasProductos = categoriaMax;
    
    // Producto más caro
    const productosCaro = productos.sort((a, b) => b.precio - a.precio);
    this.productoMasCaro = productosCaro[0]?.nombre || '-';
  }

  /**
   * 🎨 Calcular estado del inventario
   */
  private calcularEstadoInventario() {
    if (this.totalProductos === 0) {
      this.porcentajeStockSaludable = 0;
      this.estadoInventario = 'critico';
      return;
    }
    
    // Calcular porcentaje de productos con stock saludable (>= 10 unidades)
    const productosConStockSaludable = this.totalProductos - this.stockBajo - this.productosSinStock;
    this.porcentajeStockSaludable = (productosConStockSaludable / this.totalProductos) * 100;
    
    // Determinar estado
    if (this.porcentajeStockSaludable >= 80) {
      this.estadoInventario = 'excelente';
    } else if (this.porcentajeStockSaludable >= 60) {
      this.estadoInventario = 'bueno';
    } else if (this.porcentajeStockSaludable >= 40) {
      this.estadoInventario = 'alerta';
    } else {
      this.estadoInventario = 'critico';
    }
  }

  /**
   * 🎨 Obtener color del estado
   */
  getEstadoColor(): string {
    switch (this.estadoInventario) {
      case 'excelente': return 'success';
      case 'bueno': return 'primary';
      case 'alerta': return 'warning';
      case 'critico': return 'danger';
      default: return 'medium';
    }
  }

  /**
   * 📊 Obtener texto del estado
   */
  getEstadoTexto(): string {
    switch (this.estadoInventario) {
      case 'excelente': return 'Excelente';
      case 'bueno': return 'Bueno';
      case 'alerta': return 'Requiere Atención';
      case 'critico': return 'Crítico';
      default: return '-';
    }
  }

  /**
   * 🔄 Actualizar estadísticas manualmente
   */
  async actualizarEstadisticas() {
    console.log('🔄 Actualizando estadísticas manualmente...');
    await this.cargarEstadisticasCompletas();
    await this.mostrarToast('✅ Estadísticas actualizadas', 'success');
  }

  /**
   * 🗑️ Resetear métricas
   */
  private resetearMetricas() {
    this.totalProductos = 0;
    this.valorInventario = 0;
    this.stockBajo = 0;
    this.stockCritico = 0;
    this.productosConStock = 0;
    this.productosSinStock = 0;
    this.stockTotal = 0;
    this.categoriaConMasProductos = '-';
    this.productoMasCaro = '-';
    this.porcentajeStockSaludable = 0;
    this.estadoInventario = 'critico';
  }

  navegarA(ruta: string) {
    console.log(`🔗 Navegando a: ${ruta}`);
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

  /**
   * 🔧 Reparar usuarios manualmente (solución temporal)
   */
  async repararUsuarios() {
    await this.authService.repararUsuariosManual();
  }

  /**
   * 🔍 Verificar estado de la base de datos
   */
  async verificarEstadoDB() {
    try {
      const usuarios = await this.dbService.getAllUsuarios();
      console.log('📊 Usuarios en BD:', usuarios);
      
      const productos = await this.dbService.getAllProductos();
      console.log('📊 Productos en BD:', productos.length);
      
      alert(`Estado de BD:\n- Usuarios: ${usuarios.length}\n- Productos: ${productos.length}`);
    } catch (error) {
      console.error('❌ Error verificando BD:', error);
      alert('Error al verificar la base de datos');
    }
  }

  /**
   * 💬 Mostrar toast
   */
  private async mostrarToast(mensaje: string, color: string = 'primary') {
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = mensaje;
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: ${color === 'success' ? 'rgba(0, 184, 148, 0.95)' : 'rgba(50, 130, 184, 0.95)'};
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
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}