// src/app/pages/reportes/reportes.page.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList,
  IonItem, IonLabel, IonBadge, IonIcon, IonButton, IonSpinner,
  IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cashOutline, cubeOutline, trendingUpOutline, analyticsOutline,
  listOutline, arrowBackOutline, alertCircleOutline, pricetagOutline,
  barChartOutline, pieChartOutline, trophyOutline, warningOutline,
  documentTextOutline, layersOutline, closeCircleOutline, checkmarkCircleOutline,
  appsOutline, walletOutline, starOutline, downloadOutline, refreshOutline,
  documentOutline, gridOutline
} from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { ReportesService } from '../../services/reportes.service';
import { Producto } from '../../models/producto.model';
import { EstadisticasInventario } from '../../models/estadisticas.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Registrar componentes de Chart.js
Chart.register(...registerables);

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
    IonItem, IonLabel, IonBadge, IonIcon, IonButton, IonSpinner,
    IonFab, IonFabButton
  ]
})
export class ReportesPage implements OnInit, AfterViewInit {
  // Referencias a los canvas de los gráficos
  @ViewChild('chartDistribucion', { static: false }) chartDistribucionRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartTopProductos', { static: false }) chartTopProductosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCategorias', { static: false }) chartCategoriasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartTendencia', { static: false }) chartTendenciaRef!: ElementRef<HTMLCanvasElement>;

  productos: Producto[] = [];
  estadisticas!: EstadisticasInventario;
  
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

  // Control de carga y gráficos
  cargando = true;
  graficosCreados = false;
  
  // Instancias de gráficos
  private chartDistribucion?: Chart;
  private chartTopProductos?: Chart;
  private chartCategorias?: Chart;
  private chartTendencia?: Chart;

  constructor(
    private dbService: DatabaseService,
    private reportesService: ReportesService
  ) {
    addIcons({ 
      cashOutline, cubeOutline, trendingUpOutline, analyticsOutline,
      listOutline, arrowBackOutline, alertCircleOutline, pricetagOutline,
      barChartOutline, pieChartOutline, trophyOutline, warningOutline,
      documentTextOutline, layersOutline, closeCircleOutline, checkmarkCircleOutline,
      appsOutline, walletOutline, starOutline, downloadOutline, refreshOutline,
      documentOutline, gridOutline
    });
  }

  async ngOnInit() {
    await this.cargarDatos();
  }

  ngAfterViewInit() {
    // Esperar un poco más para asegurar que el DOM esté listo
    setTimeout(() => {
      if (this.estadisticas && !this.graficosCreados) {
        this.crearGraficos();
      }
    }, 500);
  }

  async cargarDatos() {
    try {
      this.cargando = true;
      console.log('📊 Cargando estadísticas...');
      
      // Obtener estadísticas completas
      this.estadisticas = await this.dbService.getEstadisticasCompletas();
      this.productos = await this.dbService.getAllProductos();
      
      // Actualizar métricas
      this.actualizarMetricas();
      
      console.log('✅ Estadísticas cargadas:', this.estadisticas);
      
      // Crear gráficos después de cargar datos
      setTimeout(() => {
        this.crearGraficos();
      }, 300);
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    } finally {
      this.cargando = false;
    }
  }

  actualizarMetricas() {
    this.totalProductos = this.estadisticas.totalProductos;
    this.valorTotalInventario = this.estadisticas.valorTotalInventario;
    this.productosStockBajo = this.estadisticas.productosStockBajo;
    this.totalCategorias = this.estadisticas.totalCategorias;
    
    this.analisisPorCategoria = this.estadisticas.categorias;
    this.top5Productos = this.estadisticas.topProductosPorValor.map(p => ({
      nombre: p.nombre,
      categoria: p.categoria,
      valorInventario: p.valorInventario
    }));
    
    this.productosStockCritico = this.estadisticas.productosStockCritico.map(p => ({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio,
      stock: p.stock
    }));
    
    this.productosConStock = this.estadisticas.productosConStock;
    this.productosSinStock = this.estadisticas.productosSinStock;
    this.valorPromedio = this.estadisticas.valorPromedio;
    this.stockTotal = this.estadisticas.stockTotal;
  }

  /**
   * 📊 Crear todos los gráficos
   */
  async crearGraficos() {
    if (this.graficosCreados) {
      console.log('⚠️ Gráficos ya creados');
      return;
    }

    try {
      console.log('📊 Creando gráficos...');
      
      // Verificar que los elementos canvas existan
      if (!this.chartDistribucionRef || !this.chartTopProductosRef || 
          !this.chartCategoriasRef || !this.chartTendenciaRef) {
        console.warn('⚠️ Referencias a canvas no disponibles aún, reintentando...');
        setTimeout(() => this.crearGraficos(), 500);
        return;
      }
      
      const datosGraficos = await this.reportesService.getDatosParaGraficos();
      
      console.log('📊 Datos para gráficos:', datosGraficos);
      
      // Crear cada gráfico
      this.crearGraficoDistribucion(datosGraficos.distribucionCategorias);
      this.crearGraficoTopProductos(datosGraficos.topProductosValor);
      this.crearGraficoCategorias(datosGraficos.valorPorCategoria);
      this.crearGraficoTendencia(datosGraficos.tendenciaStock);
      
      this.graficosCreados = true;
      console.log('✅ Gráficos creados exitosamente');
      
    } catch (error) {
      console.error('❌ Error creando gráficos:', error);
    }
  }

  /**
   * 🥧 Gráfico de Pastel: Distribución por Categoría
   */
  private crearGraficoDistribucion(datos: any) {
    if (!this.chartDistribucionRef || !this.chartDistribucionRef.nativeElement) {
      console.warn('⚠️ Canvas de distribución no disponible');
      return;
    }

    const ctx = this.chartDistribucionRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('⚠️ No se pudo obtener contexto 2D');
      return;
    }

    console.log('📊 Creando gráfico de distribución:', datos);

    this.chartDistribucion = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: datos.labels,
        datasets: [{
          data: datos.data,
          backgroundColor: datos.colors,
          borderColor: '#16213e',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#e8eaf6',
              font: { size: 12, weight: 'bold' },
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(22, 33, 62, 0.95)',
            titleColor: '#e8eaf6',
            bodyColor: '#b8bcc8',
            borderColor: '#3282b8',
            borderWidth: 1,
            padding: 12,
            displayColors: true
          }
        }
      }
    });
  }

  /**
   * 📊 Gráfico de Barras Horizontal: Top Productos
   */
  private crearGraficoTopProductos(datos: any) {
    if (!this.chartTopProductosRef || !this.chartTopProductosRef.nativeElement) {
      console.warn('⚠️ Canvas de top productos no disponible');
      return;
    }

    const ctx = this.chartTopProductosRef.nativeElement.getContext('2d');
    if (!ctx) return;

    console.log('📊 Creando gráfico de top productos:', datos);

    this.chartTopProductos = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.labels,
        datasets: [{
          label: 'Valor en Inventario (S/)',
          data: datos.data,
          backgroundColor: 'rgba(50, 130, 184, 0.8)',
          borderColor: '#3282b8',
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(22, 33, 62, 0.95)',
            titleColor: '#e8eaf6',
            bodyColor: '#b8bcc8',
            borderColor: '#3282b8',
            borderWidth: 1,
            padding: 12
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(232, 234, 246, 0.1)'
            },
            ticks: {
              color: '#b8bcc8',
              font: { size: 11, weight: 'bold' }
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              color: '#e8eaf6',
              font: { size: 11, weight: 'bold' }
            }
          }
        }
      }
    });
  }

  /**
   * 📊 Gráfico de Barras: Valor por Categoría
   */
  private crearGraficoCategorias(datos: any) {
    if (!this.chartCategoriasRef || !this.chartCategoriasRef.nativeElement) {
      console.warn('⚠️ Canvas de categorías no disponible');
      return;
    }

    const ctx = this.chartCategoriasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    console.log('📊 Creando gráfico de categorías:', datos);

    this.chartCategorias = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.labels,
        datasets: [{
          label: 'Valor Total (S/)',
          data: datos.data,
          backgroundColor: 'rgba(0, 184, 148, 0.8)',
          borderColor: '#00b894',
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(22, 33, 62, 0.95)',
            titleColor: '#e8eaf6',
            bodyColor: '#b8bcc8',
            borderColor: '#00b894',
            borderWidth: 1,
            padding: 12
          }
        },
        scales: {
          y: {
            grid: {
              color: 'rgba(232, 234, 246, 0.1)'
            },
            ticks: {
              color: '#b8bcc8',
              font: { size: 11, weight: 'bold' }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#e8eaf6',
              font: { size: 11, weight: 'bold' }
            }
          }
        }
      }
    });
  }

  /**
   * 📈 Gráfico de Línea: Tendencia de Stock
   */
  private crearGraficoTendencia(datos: any) {
    if (!this.chartTendenciaRef || !this.chartTendenciaRef.nativeElement) {
      console.warn('⚠️ Canvas de tendencia no disponible');
      return;
    }

    const ctx = this.chartTendenciaRef.nativeElement.getContext('2d');
    if (!ctx) return;

    console.log('📊 Creando gráfico de tendencia:', datos);

    this.chartTendencia = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datos.labels,
        datasets: [
          {
            label: 'Stock Total',
            data: datos.stockData,
            borderColor: '#3282b8',
            backgroundColor: 'rgba(50, 130, 184, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#3282b8',
            pointBorderColor: '#e8eaf6',
            pointBorderWidth: 2,
            pointRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#e8eaf6',
              font: { size: 12, weight: 'bold' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(22, 33, 62, 0.95)',
            titleColor: '#e8eaf6',
            bodyColor: '#b8bcc8',
            borderColor: '#3282b8',
            borderWidth: 1,
            padding: 12
          }
        },
        scales: {
          y: {
            grid: {
              color: 'rgba(232, 234, 246, 0.1)'
            },
            ticks: {
              color: '#b8bcc8',
              font: { size: 11, weight: 'bold' }
            }
          },
          x: {
            grid: {
              color: 'rgba(232, 234, 246, 0.05)'
            },
            ticks: {
              color: '#e8eaf6',
              font: { size: 11, weight: 'bold' }
            }
          }
        }
      }
    });
  }

  /**
   * 🔄 Actualizar todos los datos y gráficos
   */
  async actualizarTodo() {
    this.destruirGraficos();
    this.graficosCreados = false;
    await this.cargarDatos();
    setTimeout(() => this.crearGraficos(), 100);
    this.mostrarToast('✅ Reportes actualizados', 'success');
  }

  /**
   * 🗑️ Destruir gráficos existentes
   */
  private destruirGraficos() {
    if (this.chartDistribucion) {
      this.chartDistribucion.destroy();
      this.chartDistribucion = undefined;
    }
    if (this.chartTopProductos) {
      this.chartTopProductos.destroy();
      this.chartTopProductos = undefined;
    }
    if (this.chartCategorias) {
      this.chartCategorias.destroy();
      this.chartCategorias = undefined;
    }
    if (this.chartTendencia) {
      this.chartTendencia.destroy();
      this.chartTendencia = undefined;
    }
  }

  /**
   * 📥 Exportar reportes
   */
  async exportarExcel() {
    await this.reportesService.exportarReporteExcel();
  }

  async exportarCSV() {
    await this.reportesService.exportarReporteCSV();
  }

  async exportarCategorias() {
    await this.reportesService.exportarAnalisisCategorias();
  }

  async exportarStockCritico() {
    await this.reportesService.exportarStockCritico();
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

  private mostrarToast(mensaje: string, color: string = 'success') {
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
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}