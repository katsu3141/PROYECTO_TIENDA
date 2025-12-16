// src/app/services/reportes.service.ts
import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { EstadisticasInventario, FormatoExportacion } from '../models/estadisticas.model';
import { Producto } from '../models/producto.model';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  constructor(private dbService: DatabaseService) {}

  /**
   * 📊 Exportar reporte completo a Excel
   */
  async exportarReporteExcel(): Promise<void> {
    try {
      console.log('📊 Iniciando exportación a Excel...');
      
      const estadisticas = await this.dbService.getEstadisticasCompletas();
      const productos = await this.dbService.getAllProductos();
      
      // Crear libro de Excel
      const workbook = XLSX.utils.book_new();
      
      // HOJA 1: Resumen General
      const hojaResumen = this.crearHojaResumen(estadisticas);
      XLSX.utils.book_append_sheet(workbook, hojaResumen, 'Resumen General');
      
      // HOJA 2: Lista de Productos
      const hojaProductos = this.crearHojaProductos(productos);
      XLSX.utils.book_append_sheet(workbook, hojaProductos, 'Productos');
      
      // HOJA 3: Análisis por Categoría
      const hojaCategorias = this.crearHojaCategorias(estadisticas.categorias);
      XLSX.utils.book_append_sheet(workbook, hojaCategorias, 'Por Categoría');
      
      // HOJA 4: Top Productos
      const hojaTop = this.crearHojaTopProductos(estadisticas);
      XLSX.utils.book_append_sheet(workbook, hojaTop, 'Top Productos');
      
      // HOJA 5: Stock Crítico
      if (Array.isArray(estadisticas.productosStockCritico) && estadisticas.productosStockCritico.length > 0) {
        const hojaStockCritico = this.crearHojaStockCritico(estadisticas.productosStockCritico);
        XLSX.utils.book_append_sheet(workbook, hojaStockCritico, 'Stock Crítico');
      }
      
      // Generar nombre de archivo
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Reporte_Inventario_${fecha}.xlsx`;
      
      // Descargar archivo
      XLSX.writeFile(workbook, nombreArchivo);
      
      console.log('✅ Reporte Excel generado exitosamente');
      this.mostrarMensaje('✅ Reporte Excel descargado exitosamente', 'success');
      
    } catch (error) {
      console.error('❌ Error exportando a Excel:', error);
      this.mostrarMensaje('❌ Error al exportar reporte', 'danger');
      throw error;
    }
  }

  /**
   * 📄 Crear hoja de resumen general
   */
  private crearHojaResumen(estadisticas: EstadisticasInventario): XLSX.WorkSheet {
    const datos = [
      ['REPORTE DE INVENTARIO - TAULLY MARKET'],
      ['Fecha de Generación:', new Date().toLocaleString()],
      [''],
      ['RESUMEN GENERAL'],
      ['Total de Productos:', estadisticas.totalProductos],
      ['Valor Total del Inventario:', `S/ ${estadisticas.valorTotalInventario.toFixed(2)}`],
      ['Stock Total (unidades):', estadisticas.stockTotal],
      [''],
      ['ESTADO DEL STOCK'],
      ['Productos con Stock:', estadisticas.productosConStock],
      ['Productos sin Stock:', estadisticas.productosSinStock],
      ['Productos con Stock Bajo (<10):', estadisticas.productosStockBajo],
      ['Productos con Stock Crítico (<5):', estadisticas.productosStockCritico],
      [''],
      ['PROMEDIOS'],
      ['Valor Promedio por Producto:', `S/ ${estadisticas.valorPromedio.toFixed(2)}`],
      ['Stock Promedio:', estadisticas.stockPromedio.toFixed(2)],
      [''],
      ['CATEGORÍAS'],
      ['Total de Categorías:', estadisticas.totalCategorias]
    ];
    
    const hoja = XLSX.utils.aoa_to_sheet(datos);
    
    // Aplicar estilos básicos (ancho de columnas)
    hoja['!cols'] = [
      { wch: 35 },
      { wch: 20 }
    ];
    
    return hoja;
  }

  /**
   * 📦 Crear hoja de productos
   */
  private crearHojaProductos(productos: Producto[]): XLSX.WorkSheet {
    const datos = productos.map(p => ({
      'ID': p.id,
      'Nombre': p.nombre,
      'Categoría': p.categoria,
      'Precio (S/)': p.precio,
      'Stock': p.stock,
      'Valor Total (S/)': p.precio * p.stock,
      'Estado': p.stock === 0 ? 'SIN STOCK' : p.stock < 5 ? 'CRÍTICO' : p.stock < 10 ? 'BAJO' : 'NORMAL',
      'Descripción': p.descripcion || '-'
    }));
    
    const hoja = XLSX.utils.json_to_sheet(datos);
    
    // Configurar anchos de columna
    hoja['!cols'] = [
      { wch: 8 },  // ID
      { wch: 30 }, // Nombre
      { wch: 15 }, // Categoría
      { wch: 12 }, // Precio
      { wch: 10 }, // Stock
      { wch: 15 }, // Valor Total
      { wch: 12 }, // Estado
      { wch: 40 }  // Descripción
    ];
    
    return hoja;
  }

  /**
   * 📊 Crear hoja de análisis por categoría
   */
  private crearHojaCategorias(categorias: any[]): XLSX.WorkSheet {
    const datos = categorias.map(c => ({
      'Categoría': c.categoria,
      'Productos': c.totalProductos,
      'Stock Total': c.stockTotal,
      'Valor Total (S/)': c.valorTotal.toFixed(2),
      '% del Valor': c.porcentajeValor.toFixed(2) + '%',
      '% de Productos': c.porcentajeProductos.toFixed(2) + '%'
    }));
    
    const hoja = XLSX.utils.json_to_sheet(datos);
    
    hoja['!cols'] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 }
    ];
    
    return hoja;
  }

  /**
   * 🏆 Crear hoja de top productos
   */
  private crearHojaTopProductos(estadisticas: EstadisticasInventario): XLSX.WorkSheet {
    const datos: any[] = [];
    
    // Título
    datos.push(['TOP 5 PRODUCTOS POR VALOR']);
    datos.push([]);
    
    // Top por valor
    datos.push(['Posición', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Valor Total']);
    estadisticas.topProductosPorValor.forEach((p, index) => {
      datos.push([
        index + 1,
        p.nombre,
        p.categoria,
        p.precio,
        p.stock,
        p.valorInventario
      ]);
    });
    
    // Espacio
    datos.push([]);
    datos.push(['TOP 5 PRODUCTOS POR STOCK']);
    datos.push([]);
    
    // Top por stock
    datos.push(['Posición', 'Nombre', 'Categoría', 'Stock', 'Precio', 'Valor Total']);
    estadisticas.topProductosPorStock.forEach((p, index) => {
      datos.push([
        index + 1,
        p.nombre,
        p.categoria,
        p.stock,
        p.precio,
        p.valorInventario
      ]);
    });
    
    const hoja = XLSX.utils.aoa_to_sheet(datos);
    
    hoja['!cols'] = [
      { wch: 10 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 }
    ];
    
    return hoja;
  }

  /**
   * ⚠️ Crear hoja de stock crítico
   */
  private crearHojaStockCritico(productos: any[]): XLSX.WorkSheet {
    const datos = productos.map(p => ({
      'ID': p.id,
      'Nombre': p.nombre,
      'Categoría': p.categoria,
      'Stock Actual': p.stock,
      'Precio (S/)': p.precio,
      'Nivel': p.nivelCriticidad
    }));
    
    const hoja = XLSX.utils.json_to_sheet(datos);
    
    hoja['!cols'] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 }
    ];
    
    return hoja;
  }

  /**
   * 📄 Exportar reporte a CSV
   */
  async exportarReporteCSV(): Promise<void> {
    try {
      console.log('📄 Iniciando exportación a CSV...');
      
      const productos = await this.dbService.getAllProductos();
      
      // Crear CSV
      const datos = productos.map(p => ({
        'ID': p.id,
        'Nombre': p.nombre,
        'Categoría': p.categoria,
        'Precio': p.precio,
        'Stock': p.stock,
        'Valor Total': p.precio * p.stock,
        'Estado': p.stock === 0 ? 'SIN STOCK' : p.stock < 5 ? 'CRÍTICO' : p.stock < 10 ? 'BAJO' : 'NORMAL'
      }));
      
      // Convertir a CSV
      const worksheet = XLSX.utils.json_to_sheet(datos);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      // Crear blob y descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fecha = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `Reporte_Inventario_${fecha}.csv`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      console.log('✅ Reporte CSV generado exitosamente');
      this.mostrarMensaje('✅ Reporte CSV descargado exitosamente', 'success');
      
    } catch (error) {
      console.error('❌ Error exportando a CSV:', error);
      this.mostrarMensaje('❌ Error al exportar reporte', 'danger');
      throw error;
    }
  }

  /**
   * 📊 Exportar análisis por categoría a Excel
   */
  async exportarAnalisisCategorias(): Promise<void> {
    try {
      const estadisticas = await this.dbService.getEstadisticasCompletas();
      
      const workbook = XLSX.utils.book_new();
      const hoja = this.crearHojaCategorias(estadisticas.categorias);
      XLSX.utils.book_append_sheet(workbook, hoja, 'Análisis por Categoría');
      
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Analisis_Categorias_${fecha}.xlsx`);
      
      this.mostrarMensaje('✅ Análisis descargado exitosamente', 'success');
      
    } catch (error) {
      console.error('❌ Error exportando análisis:', error);
      this.mostrarMensaje('❌ Error al exportar análisis', 'danger');
    }
  }

  /**
   * ⚠️ Exportar productos con stock crítico
   */
  async exportarStockCritico(): Promise<void> {
    try {
      const estadisticas = await this.dbService.getEstadisticasCompletas();
      
      if (!Array.isArray(estadisticas.productosStockCritico) || estadisticas.productosStockCritico.length === 0) {
        this.mostrarMensaje('ℹ️ No hay productos con stock crítico', 'warning');
        return;
      }
      
      const workbook = XLSX.utils.book_new();
      const hoja = this.crearHojaStockCritico(estadisticas.productosStockCritico);
      XLSX.utils.book_append_sheet(workbook, hoja, 'Stock Crítico');
      
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Stock_Critico_${fecha}.xlsx`);
      
      this.mostrarMensaje('✅ Reporte de stock crítico descargado', 'success');
      
    } catch (error) {
      console.error('❌ Error exportando stock crítico:', error);
      this.mostrarMensaje('❌ Error al exportar reporte', 'danger');
    }
  }

  /**
   * 📈 Obtener datos para gráficos
   */
  async getDatosParaGraficos(): Promise<any> {
    const estadisticas = await this.dbService.getEstadisticasCompletas();
    
    return {
      // Gráfico de pastel: Distribución por categoría
      distribucionCategorias: {
        labels: estadisticas.distribucionPorCategoria.map(d => d.categoria),
        data: estadisticas.distribucionPorCategoria.map(d => d.cantidad),
        colors: estadisticas.distribucionPorCategoria.map(d => d.color)
      },
      
      // Gráfico de barras: Top productos por valor
      topProductosValor: {
        labels: estadisticas.topProductosPorValor.map(p => p.nombre),
        data: estadisticas.topProductosPorValor.map(p => p.valorInventario)
      },
      
      // Gráfico de barras: Análisis por categoría
      valorPorCategoria: {
        labels: estadisticas.categorias.map(c => c.categoria),
        data: estadisticas.categorias.map(c => c.valorTotal)
      },
      
      // Gráfico de línea: Tendencia de stock
      tendenciaStock: {
        labels: estadisticas.tendenciaStock.map(t => {
          const fecha = new Date(t.fecha);
          return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
        }),
        stockData: estadisticas.tendenciaStock.map(t => t.totalStock),
        valorData: estadisticas.tendenciaStock.map(t => t.valorInventario)
      }
    };
  }

  /**
   * 💬 Mostrar mensaje toast
   */
  private mostrarMensaje(mensaje: string, tipo: 'success' | 'danger' | 'warning' = 'success'): void {
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = mensaje;
    
    const colores = {
      success: 'rgba(0, 184, 148, 0.95)',
      danger: 'rgba(255, 107, 107, 0.95)',
      warning: 'rgba(255, 165, 2, 0.95)'
    };
    
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: ${colores[tipo]};
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
    }, 3000);
  }
}