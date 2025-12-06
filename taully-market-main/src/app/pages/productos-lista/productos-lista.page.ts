import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonFab, IonFabButton, IonGrid, IonRow, IonCol, 
  IonBackButton, IonButtons, IonSearchbar 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, createOutline, trashOutline, cubeOutline,
  checkmarkCircle, alertCircle, 
  closeCircle, imageOutline, pricetagOutline, 
  appsOutline, cashOutline, documentTextOutline,
  closeCircleOutline, listOutline 
} from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { Producto } from '../../models/producto.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-productos',
  templateUrl: './productos-lista.page.html',
  styleUrls: ['./productos-lista.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonSearchbar,
    IonButtons, 
    IonBackButton, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButton, 
    IonIcon, 
    IonCard, 
    IonCardHeader,
    IonCardTitle, 
    IonCardContent, 
    IonItem, 
    IonLabel,
    IonFab, 
    IonFabButton, 
    IonGrid, 
    IonRow, 
    IonCol
  ]
})
export class ProductosPage implements OnInit, OnDestroy {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  
  // Búsqueda y filtros
  terminoBusqueda: string = '';
  categoriaSeleccionada: string = '';
  categorias: string[] = [];
  
  // Vista y ordenamiento
  vistaActual: 'grid' | 'list' = 'grid';
  ordenActual: string = 'nombre-asc';
  
  private productosSubscription?: Subscription;

  constructor(
    private dbService: DatabaseService,
    private router: Router
  ) {
    // ✅ Iconos optimizados (se eliminaron los no usados)
    addIcons({
      cubeOutline,
      checkmarkCircle,
      alertCircle,
      closeCircle,
      imageOutline,
      pricetagOutline,
      createOutline,
      trashOutline,
      addOutline, // ✅ Usado en el FAB
      appsOutline,
      cashOutline,
      documentTextOutline,
      closeCircleOutline,
      listOutline
    });
  }

  async ngOnInit() {
    console.log('📋 Inicializando lista de productos...');
    
    // ✅ Suscribirse a cambios automáticos
    this.productosSubscription = this.dbService.productos$.subscribe(productos => {
      console.log(`✅ Productos actualizados: ${productos.length} items`);
      this.productos = productos;
      this.extraerCategorias();
      this.aplicarFiltros();
    });
    
    // Cargar productos inicialmente
    await this.cargarProductos();
  }

  ngOnDestroy() {
    // ✅ Limpiar suscripción al destruir el componente
    if (this.productosSubscription) {
      this.productosSubscription.unsubscribe();
      console.log('🧹 Suscripción a productos limpiada');
    }
  }

  /**
   * 🔄 Cargar productos desde la base de datos
   */
  async cargarProductos() {
    console.log('🔄 Cargando productos desde la BD...');
    this.productos = await this.dbService.getAllProductos();
    this.extraerCategorias();
    this.aplicarFiltros();
    console.log(`✅ ${this.productos.length} productos cargados`);
  }

  /**
   * 🏷️ Extraer categorías únicas de los productos
   */
  extraerCategorias() {
    const categoriasSet = new Set(this.productos.map(p => p.categoria));
    this.categorias = Array.from(categoriasSet).sort();
    console.log(`🏷️ Categorías extraídas: ${this.categorias.join(', ')}`);
  }

  /**
   * 🔍 Buscar productos
   */
  buscarProductos() {
    console.log(`🔍 Buscando: "${this.terminoBusqueda}"`);
    this.aplicarFiltros();
  }

  /**
   * 🔧 Aplicar todos los filtros (búsqueda + categoría)
   */
  aplicarFiltros() {
    let productosFiltrados = [...this.productos];

    // Filtro de búsqueda
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      productosFiltrados = productosFiltrados.filter(p =>
        p.nombre.toLowerCase().includes(termino) ||
        p.categoria.toLowerCase().includes(termino) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(termino))
      );
    }

    // Filtro de categoría
    if (this.categoriaSeleccionada) {
      productosFiltrados = productosFiltrados.filter(p =>
        p.categoria === this.categoriaSeleccionada
      );
    }

    this.productosFiltrados = productosFiltrados;
    this.ordenarProductos();
    
    console.log(`📊 Productos filtrados: ${this.productosFiltrados.length}`);
  }

  /**
   * 🏷️ Filtrar por categoría
   */
  filtrarPorCategoria(categoria: string) {
    console.log(`🏷️ Filtrando por categoría: ${categoria || 'Todas'}`);
    this.categoriaSeleccionada = categoria;
    this.aplicarFiltros();
  }

  /**
   * 🔀 Ordenar productos según criterio seleccionado
   */
  ordenarProductos() {
    switch (this.ordenActual) {
      case 'nombre-asc':
        this.productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'nombre-desc':
        this.productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case 'precio-asc':
        this.productosFiltrados.sort((a, b) => a.precio - b.precio);
        break;
      case 'precio-desc':
        this.productosFiltrados.sort((a, b) => b.precio - a.precio);
        break;
      case 'stock-asc':
        this.productosFiltrados.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock-desc':
        this.productosFiltrados.sort((a, b) => b.stock - a.stock);
        break;
    }
    console.log(`🔀 Productos ordenados por: ${this.ordenActual}`);
  }

  /**
   * 🎨 Cambiar vista (grid/list)
   */
  cambiarVista(vista: 'grid' | 'list') {
    console.log(`🎨 Cambiando vista a: ${vista}`);
    this.vistaActual = vista;
  }

  /**
   * 🧹 Limpiar búsqueda
   */
  limpiarBusqueda() {
    console.log('🧹 Limpiando búsqueda');
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  /**
   * ➕ Navegar a formulario de nuevo producto
   */
  nuevoProducto() {
    console.log('➕ Navegando a nuevo producto');
    this.router.navigate(['/producto-form']);
  }

  /**
   * ✏️ Editar producto existente
   */
  editarProducto(id: number) {
    console.log(`✏️ Navegando a editar producto ID: ${id}`);
    this.router.navigate(['/producto-form', id]);
  }

  /**
   * 🗑️ Eliminar producto con confirmación
   */
  async eliminarProducto(id: number) {
    const producto = this.productos.find(p => p.id === id);
    const nombre = producto?.nombre || 'este producto';
    
    if (confirm(`¿Está seguro de eliminar "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      try {
        console.log(`🗑️ Eliminando producto ID: ${id}`);
        await this.dbService.eliminarProducto(id);
        console.log('✅ Producto eliminado correctamente');
      } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        alert('❌ Error al eliminar el producto');
      }
    }
  }

  /**
   * 📊 Contar productos con stock saludable (> 10 unidades)
   */
  contarProductosEnStock(): number {
    return this.productosFiltrados.filter(p => p.stock > 10).length;
  }

  /**
   * ⚠️ Contar productos con stock bajo (1-10 unidades)
   */
  contarProductosStockBajo(): number {
    return this.productosFiltrados.filter(p => p.stock > 0 && p.stock <= 10).length;
  }

  /**
   * 💰 Calcular valor total del inventario
   */
  calcularValorTotal(): number {
    return this.productosFiltrados.reduce((total, p) => total + (p.precio * p.stock), 0);
  }
}