import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList,
  IonItem, IonLabel, IonBadge, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cashOutline, cubeOutline, trendingUpOutline, analyticsOutline,
  listOutline, arrowBackOutline, alertCircleOutline, pricetagOutline,
  barChartOutline, pieChartOutline, trophyOutline, warningOutline,
  documentTextOutline, layersOutline, closeCircleOutline, checkmarkCircleOutline,
  appsOutline, walletOutline, starOutline
} from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { Producto } from '../../models/producto.model';

interface AnalisisCategoria {
  categoria: string;
  totalProductos: number;
  valorTotal: number;
  stockTotal: number;
}

interface ProductoTop {
  nombre: string;
  categoria: string;
  valorInventario: number;
}

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList,
    IonItem, IonLabel, IonBadge, IonIcon
  ]
})
export class ReportesPage implements OnInit {
  productos: Producto[] = [];
  
  // Métricas principales
  totalProductos = 0;
  valorTotalInventario = 0;
  productosStockBajo = 0;
  totalCategorias = 0;
  
  // Análisis detallado
  analisisPorCategoria: AnalisisCategoria[] = [];
  top5Productos: ProductoTop[] = [];
  productosStockCritico: Producto[] = [];
  
  // Resumen general
  productosConStock = 0;
  productosSinStock = 0;
  valorPromedio = 0;
  stockTotal = 0;

  constructor(private dbService: DatabaseService) {
    addIcons({ 
      cashOutline, cubeOutline, trendingUpOutline, analyticsOutline,
      listOutline, arrowBackOutline, alertCircleOutline, pricetagOutline,
      barChartOutline, pieChartOutline, trophyOutline, warningOutline,
      documentTextOutline, layersOutline, closeCircleOutline, checkmarkCircleOutline,
      appsOutline, walletOutline, starOutline
    });
  }

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.productos = await this.dbService.getAllProductos();
    this.calcularMetricas();
  }

  calcularMetricas() {
    if (this.productos.length === 0) {
      this.resetearMetricas();
      return;
    }

    // Total de productos
    this.totalProductos = this.productos.length;
    
    // Valor total del inventario
    this.valorTotalInventario = this.productos.reduce(
      (sum, p) => sum + (p.precio * p.stock), 0
    );

    // Productos con stock bajo (menos de 10 unidades)
    this.productosStockBajo = this.productos.filter(p => p.stock > 0 && p.stock < 10).length;

    // Total de categorías únicas
    const categoriasUnicas = new Set(this.productos.map(p => p.categoria));
    this.totalCategorias = categoriasUnicas.size;

    // Análisis por categoría
    this.calcularAnalisisPorCategoria();

    // Top 5 productos por valor
    this.calcularTop5Productos();

    // Productos con stock crítico
    this.productosStockCritico = this.productos
      .filter(p => p.stock <= 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10);

    // Resumen general
    this.productosConStock = this.productos.filter(p => p.stock > 0).length;
    this.productosSinStock = this.productos.filter(p => p.stock === 0).length;
    this.valorPromedio = this.totalProductos > 0 ? this.valorTotalInventario / this.totalProductos : 0;
    this.stockTotal = this.productos.reduce((sum, p) => sum + p.stock, 0);
  }

  calcularAnalisisPorCategoria() {
    const categorias = new Map<string, { total: number, valor: number, stock: number }>();
    
    this.productos.forEach(p => {
      const actual = categorias.get(p.categoria) || { total: 0, valor: 0, stock: 0 };
      categorias.set(p.categoria, {
        total: actual.total + 1,
        valor: actual.valor + (p.precio * p.stock),
        stock: actual.stock + p.stock
      });
    });

    this.analisisPorCategoria = Array.from(categorias.entries())
      .map(([categoria, data]) => ({
        categoria,
        totalProductos: data.total,
        valorTotal: data.valor,
        stockTotal: data.stock
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal);
  }

  calcularTop5Productos() {
    this.top5Productos = this.productos
      .map(p => ({
        nombre: p.nombre,
        categoria: p.categoria,
        valorInventario: p.precio * p.stock
      }))
      .sort((a, b) => b.valorInventario - a.valorInventario)
      .slice(0, 5);
  }

  resetearMetricas() {
    this.totalProductos = 0;
    this.valorTotalInventario = 0;
    this.productosStockBajo = 0;
    this.totalCategorias = 0;
    this.analisisPorCategoria = [];
    this.top5Productos = [];
    this.productosStockCritico = [];
    this.productosConStock = 0;
    this.productosSinStock = 0;
    this.valorPromedio = 0;
    this.stockTotal = 0;
  }

  getCategoryColor(categoria: string): string {
    const colores: { [key: string]: string } = {
      'Alimentos': 'primary',
      'Bebidas': 'success',
      'Limpieza': 'warning',
      'Higiene': 'purple',
      'Snacks': 'primary',
      'Lácteos': 'success',
      'Otros': 'warning'
    };
    return colores[categoria] || 'primary';
  }
}