// src/app/models/estadisticas.model.ts

/**
 * 📊 Modelo para Estadísticas de Inventario
 * Contiene todas las métricas y análisis del sistema
 */

export interface EstadisticasInventario {
  // Métricas principales
  totalProductos: number;
  valorTotalInventario: number;
  productosConStock: number;
  productosSinStock: number;
  productosStockBajo: number; // Stock < 10
  cantidadStockCritico: number; // Stock < 5 (CANTIDAD)
  
  // Promedios
  valorPromedio: number;
  stockPromedio: number;
  stockTotal: number;
  
  // Categorías
  totalCategorias: number;
  categorias: AnalisisCategoria[];
  
  // Top productos
  topProductosPorValor: ProductoTop[];
  topProductosPorStock: ProductoTop[];
  
  // Productos críticos (LISTA DETALLADA)
  productosStockCritico: ProductoCritico[];
  
  // Distribución
  distribucionPorCategoria: DistribucionCategoria[];
  
  // Tendencias (para gráficos)
  tendenciaStock: TendenciaStock[];
}

export interface AnalisisCategoria {
  categoria: string;
  totalProductos: number;
  valorTotal: number;
  stockTotal: number;
  porcentajeValor: number;
  porcentajeProductos: number;
}

export interface ProductoTop {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  valorInventario: number;
}

export interface ProductoCritico {
  id: number;
  nombre: string;
  categoria: string;
  stock: number;
  precio: number;
  nivelCriticidad: 'CRITICO' | 'BAJO' | 'NORMAL';
}

export interface DistribucionCategoria {
  categoria: string;
  cantidad: number;
  porcentaje: number;
  color: string; // Para gráficos
}

export interface TendenciaStock {
  fecha: string;
  totalStock: number;
  valorInventario: number;
  productosSinStock: number;
}

/**
 * 🎨 Colores para gráficos por categoría
 */
export const COLORES_CATEGORIAS: { [key: string]: string } = {
  'Alimentos': '#3282b8',
  'Bebidas': '#00b894',
  'Limpieza': '#ff6b6b',
  'Higiene': '#6c5ce7',
  'Snacks': '#ffa502',
  'Lácteos': '#00adb5',
  'Otros': '#b8bcc8'
};

/**
 * 📈 Tipos de gráficos disponibles
 */
export enum TipoGrafico {
  BARRAS = 'bar',
  LINEA = 'line',
  PASTEL = 'pie',
  DONA = 'doughnut',
  AREA = 'area'
}

/**
 * 📊 Configuración de gráficos
 */
export interface ConfiguracionGrafico {
  tipo: TipoGrafico;
  titulo: string;
  datos: any[];
  etiquetas: string[];
  colores?: string[];
  mostrarLeyenda?: boolean;
  altura?: number;
}

/**
 * 📄 Formato de exportación
 */
export enum FormatoExportacion {
  CSV = 'csv',
  EXCEL = 'xlsx',
  PDF = 'pdf',
  JSON = 'json'
}

/**
 * 📦 Datos para exportación
 */
export interface DatosExportacion {
  formato: FormatoExportacion;
  nombreArchivo: string;
  datos: any[];
  incluirGraficos?: boolean;
  incluirResumen?: boolean;
}