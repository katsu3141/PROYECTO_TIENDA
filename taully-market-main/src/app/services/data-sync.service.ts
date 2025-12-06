// src/app/services/data-sync.service.ts
import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Producto } from '../models/producto.model';
import { MovimientoInventario } from '../models/movimiento.model';

interface BackupData {
  version: string;
  fecha: string;
  productos: Producto[];
  movimientos: MovimientoInventario[];
}

@Injectable({
  providedIn: 'root'
})
export class DataSyncService {

  constructor(private dbService: DatabaseService) {}

  /**
   * 💾 Exportar todos los datos a JSON
   * Útil para backup o migración entre dispositivos
   */
  async exportarDatos(): Promise<string> {
    try {
      const productos = await this.dbService.getAllProductos();
      const movimientos = await this.dbService.getAllMovimientos();

      const backup: BackupData = {
        version: '1.0.0',
        fecha: new Date().toISOString(),
        productos,
        movimientos
      };

      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('❌ Error exportando datos:', error);
      throw error;
    }
  }

  /**
   * 📥 Importar datos desde JSON
   * ADVERTENCIA: Esto REEMPLAZARÁ todos los datos actuales
   */
  async importarDatos(jsonData: string): Promise<boolean> {
    try {
      const backup: BackupData = JSON.parse(jsonData);

      // Validar estructura
      if (!backup.productos || !backup.movimientos) {
        throw new Error('Formato de backup inválido');
      }

      // Confirmar con el usuario
      const confirmar = confirm(
        `⚠️ ADVERTENCIA: Esto reemplazará todos los datos actuales.\n\n` +
        `Se importarán:\n` +
        `- ${backup.productos.length} productos\n` +
        `- ${backup.movimientos.length} movimientos\n\n` +
        `¿Desea continuar?`
      );

      if (!confirmar) {
        return false;
      }

      // Limpiar base de datos actual
      await this.dbService.limpiarBaseDatos();

      // Importar productos
      for (const producto of backup.productos) {
        // Eliminar ID para que se genere uno nuevo
        const { id, ...productoSinId } = producto;
        await this.dbService.crearProducto(productoSinId as Producto);
      }

      // Importar movimientos
      for (const movimiento of backup.movimientos) {
        await this.dbService.registrarMovimiento(movimiento);
      }

      alert('✅ Datos importados exitosamente');
      return true;

    } catch (error) {
      console.error('❌ Error importando datos:', error);
      alert('❌ Error al importar datos. Verifica el formato del archivo.');
      return false;
    }
  }

  /**
   * 📤 Descargar backup como archivo JSON
   */
  async descargarBackup(): Promise<void> {
    try {
      const jsonData = await this.exportarDatos();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `taully-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      alert('✅ Backup descargado exitosamente');
    } catch (error) {
      console.error('❌ Error descargando backup:', error);
      alert('❌ Error al descargar backup');
    }
  }

  /**
   * 📁 Cargar backup desde archivo
   */
  async cargarBackupDesdeArchivo(): Promise<void> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e: any) => {
        try {
          const file = e.target.files[0];
          if (!file) {
            reject('No se seleccionó ningún archivo');
            return;
          }

          const reader = new FileReader();
          reader.onload = async (event: any) => {
            try {
              const jsonData = event.target.result;
              await this.importarDatos(jsonData);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.readAsText(file);
        } catch (error) {
          reject(error);
        }
      };

      input.click();
    });
  }

  /**
   * 🔄 Sincronizar con servidor remoto (FUTURO)
   * Esta función está preparada para cuando implementes un backend
   */
  async sincronizarConServidor(serverUrl: string): Promise<void> {
    // TODO: Implementar cuando tengas un servidor backend
    console.log('⚠️ Sincronización con servidor aún no implementada');
    console.log('URL objetivo:', serverUrl);
    
    // Ejemplo de implementación futura:
    /*
    const datos = await this.exportarDatos();
    const response = await fetch(`${serverUrl}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: datos
    });
    */
  }

  /**
   * 📊 Obtener estadísticas de los datos
   */
  async obtenerEstadisticas(): Promise<{
    totalProductos: number;
    totalMovimientos: number;
    valorTotalInventario: number;
    productosConImagen: number;
  }> {
    const productos = await this.dbService.getAllProductos();
    const movimientos = await this.dbService.getAllMovimientos();

    return {
      totalProductos: productos.length,
      totalMovimientos: movimientos.length,
      valorTotalInventario: productos.reduce((sum, p) => sum + (p.precio * p.stock), 0),
      productosConImagen: productos.filter(p => p.tieneImagen).length
    };
  }
}