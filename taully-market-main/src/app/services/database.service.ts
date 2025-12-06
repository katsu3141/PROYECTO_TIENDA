// src/app/services/database.service.ts
import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { MovimientoInventario } from '../models/movimiento.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private isDbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private dbName = 'taully_market_db';
  
  private productosSubject = new BehaviorSubject<Producto[]>([]);
  public productos$: Observable<Producto[]> = this.productosSubject.asObservable();
  
  private movimientosSubject = new BehaviorSubject<MovimientoInventario[]>([]);
  public movimientos$: Observable<MovimientoInventario[]> = this.movimientosSubject.asObservable();

  constructor() {
    this.initDB();
  }

  /**
   * 🔧 Inicializar base de datos SQLite
   */
  private async initDB() {
    try {
      const platform = Capacitor.getPlatform();
      console.log(`🚀 Inicializando BD en plataforma: ${platform}`);
      
      if (platform === 'web') {
        // 🌐 En web: Usar IndexedDB (más estable)
        console.log('🌐 Usando IndexedDB para web');
        this.isDbReady.next(true);
        await this.loadProductos();
        console.log('✅ IndexedDB inicializado');
        return;
      }

      // 📱 En móvil: Usar SQLite nativo
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();
      console.log('✅ SQLite abierto correctamente');

      await this.createTables();
      console.log('✅ Tablas creadas/verificadas');
      
      this.isDbReady.next(true);
      await this.loadProductos();
      console.log('✅ Productos cargados');
      
    } catch (error) {
      console.error('❌ Error inicializando DB:', error);
      this.isDbReady.next(true); // ✅ Continuar con IndexedDB
      await this.loadProductos();
    }
  }

  /**
   * 🌐 Inicializar store para web (jeep-sqlite)
   */
  private async initWebStore(): Promise<void> {
    try {
      await CapacitorSQLite.initWebStore();
      console.log('✅ Web Store inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Web Store:', error);
      throw error;
    }
  }

  /**
   * 📊 Crear tablas de la base de datos
   */
  private async createTables() {
    try {
      // Tabla de productos (con campos de imagen)
      const sqlProductos = `
        CREATE TABLE IF NOT EXISTS productos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          categoria TEXT NOT NULL,
          precio REAL NOT NULL,
          stock INTEGER NOT NULL,
          descripcion TEXT,
          imagen TEXT,
          imagenThumbnail TEXT,
          tieneImagen INTEGER DEFAULT 0,
          fechaCreacion TEXT NOT NULL,
          fechaActualizacion TEXT NOT NULL
        );
      `;

      const sqlMovimientos = `
        CREATE TABLE IF NOT EXISTS movimientos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          productoId INTEGER NOT NULL,
          productoNombre TEXT NOT NULL,
          tipoMovimiento TEXT NOT NULL,
          cantidadAnterior INTEGER NOT NULL,
          cantidadNueva INTEGER NOT NULL,
          cantidadMovida INTEGER NOT NULL,
          motivo TEXT,
          fecha TEXT NOT NULL,
          FOREIGN KEY (productoId) REFERENCES productos(id)
        );
      `;

      await this.db.execute(sqlProductos);
      await this.db.execute(sqlMovimientos);
      
      console.log('✅ Tablas creadas exitosamente');
    } catch (error) {
      console.error('❌ Error creando tablas:', error);
      throw error;
    }
  }

  /**
   * ✅ Verificar si la DB está lista
   */
  getDatabaseState(): Observable<boolean> {
    return this.isDbReady.asObservable();
  }

  /**
   * ⏳ Esperar a que la DB esté lista
   */
  async waitForDB(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isDbReady.value) {
        resolve();
      } else {
        const subscription = this.isDbReady.subscribe(ready => {
          if (ready) {
            subscription.unsubscribe();
            resolve();
          }
        });
      }
    });
  }

  // ==========================================
  // 📦 CRUD - PRODUCTOS
  // ==========================================

  /**
   * ➕ Crear nuevo producto
   */
  async crearProducto(producto: Producto): Promise<number> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    // 🌐 Web: Usar IndexedDB (localStorage como fallback)
    if (platform === 'web') {
      return this.crearProductoIndexedDB(producto);
    }
    
    // 📱 Móvil: Usar SQLite
    try {
      const fecha = new Date().toISOString();
      const sql = `
        INSERT INTO productos (
          nombre, categoria, precio, stock, descripcion,
          imagen, imagenThumbnail, tieneImagen,
          fechaCreacion, fechaActualizacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      
      const result = await this.db.run(sql, [
        producto.nombre,
        producto.categoria,
        producto.precio,
        producto.stock,
        producto.descripcion || '',
        producto.imagen || null,
        producto.imagenThumbnail || null,
        producto.tieneImagen ? 1 : 0,
        fecha,
        fecha
      ]);

      const productoId = result.changes?.lastId || 0;
      console.log(`✅ Producto creado con ID: ${productoId}`);
      
      await this.loadProductos();
      return productoId;
      
    } catch (error) {
      console.error('❌ Error creando producto:', error);
      throw error;
    }
  }

  /**
   * 🌐 Crear producto en IndexedDB (WEB)
   */
  private crearProductoIndexedDB(producto: Producto): number {
    try {
      const productos = this.getProductosIndexedDB();
      const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id || 0)) + 1 : 1;
      
      const fecha = new Date().toISOString();
      const nuevoProducto: Producto = {
        ...producto,
        id: nuevoId,
        fechaCreacion: fecha,
        fechaActualizacion: fecha
      };
      
      productos.push(nuevoProducto);
      localStorage.setItem('taully_productos', JSON.stringify(productos));
      this.productosSubject.next(productos);
      
      console.log(`✅ Producto creado en IndexedDB con ID: ${nuevoId}`);
      return nuevoId;
    } catch (error) {
      console.error('❌ Error creando producto en IndexedDB:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener todos los productos
   */
  async getAllProductos(): Promise<Producto[]> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    // 🌐 Web: Usar IndexedDB
    if (platform === 'web') {
      return this.getProductosIndexedDB();
    }
    
    // 📱 Móvil: Usar SQLite
    try {
      const result = await this.db.query('SELECT * FROM productos ORDER BY fechaCreacion DESC');
      
      const productos = (result.values || []).map(p => ({
        ...p,
        tieneImagen: p.tieneImagen === 1
      }));
      
      return productos;
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      return [];
    }
  }

  /**
   * 🌐 Obtener productos de IndexedDB (WEB)
   */
  private getProductosIndexedDB(): Producto[] {
    try {
      const productosStr = localStorage.getItem('taully_productos');
      return productosStr ? JSON.parse(productosStr) : [];
    } catch (error) {
      console.error('❌ Error obteniendo productos de IndexedDB:', error);
      return [];
    }
  }

  /**
   * 🔍 Obtener un producto por ID
   */
  async getProducto(id: number): Promise<Producto | null> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    // 🌐 Web: Usar IndexedDB
    if (platform === 'web') {
      const productos = this.getProductosIndexedDB();
      return productos.find(p => p.id === id) || null;
    }
    
    // 📱 Móvil: Usar SQLite
    try {
      const result = await this.db.query('SELECT * FROM productos WHERE id = ?', [id]);
      
      if (result.values && result.values.length > 0) {
        const producto = result.values[0];
        return {
          ...producto,
          tieneImagen: producto.tieneImagen === 1
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo producto:', error);
      return null;
    }
  }

  /**
   * ✏️ Actualizar producto existente
   */
  async actualizarProducto(producto: Producto): Promise<void> {
    if (!producto.id) {
      throw new Error('El producto debe tener un ID');
    }

    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    // 🌐 Web: Usar IndexedDB
    if (platform === 'web') {
      this.actualizarProductoIndexedDB(producto);
      return;
    }
    
    // 📱 Móvil: Usar SQLite
    try {
      const fecha = new Date().toISOString();
      const sql = `
        UPDATE productos 
        SET nombre = ?, categoria = ?, precio = ?, stock = ?, 
            descripcion = ?, imagen = ?, imagenThumbnail = ?,
            tieneImagen = ?, fechaActualizacion = ?
        WHERE id = ?;
      `;

      await this.db.run(sql, [
        producto.nombre,
        producto.categoria,
        producto.precio,
        producto.stock,
        producto.descripcion || '',
        producto.imagen || null,
        producto.imagenThumbnail || null,
        producto.tieneImagen ? 1 : 0,
        fecha,
        producto.id
      ]);

      console.log(`✅ Producto ${producto.id} actualizado`);
      await this.loadProductos();
      
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      throw error;
    }
  }

  /**
   * 🌐 Actualizar producto en IndexedDB (WEB)
   */
  private actualizarProductoIndexedDB(producto: Producto): void {
    try {
      const productos = this.getProductosIndexedDB();
      const index = productos.findIndex(p => p.id === producto.id);
      
      if (index !== -1) {
        productos[index] = {
          ...productos[index],
          ...producto,
          fechaActualizacion: new Date().toISOString()
        };
        
        localStorage.setItem('taully_productos', JSON.stringify(productos));
        this.productosSubject.next(productos);
        console.log(`✅ Producto ${producto.id} actualizado en IndexedDB`);
      }
    } catch (error) {
      console.error('❌ Error actualizando producto en IndexedDB:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Eliminar producto
   */
  async eliminarProducto(id: number): Promise<void> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    // 🌐 Web: Usar IndexedDB
    if (platform === 'web') {
      this.eliminarProductoIndexedDB(id);
      return;
    }
    
    // 📱 Móvil: Usar SQLite
    try {
      await this.db.run('DELETE FROM movimientos WHERE productoId = ?', [id]);
      await this.db.run('DELETE FROM productos WHERE id = ?', [id]);
      
      console.log(`✅ Producto ${id} eliminado`);
      await this.loadProductos();
      
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      throw error;
    }
  }

  /**
   * 🌐 Eliminar producto de IndexedDB (WEB)
   */
  private eliminarProductoIndexedDB(id: number): void {
    try {
      const productos = this.getProductosIndexedDB();
      const productosFiltrados = productos.filter(p => p.id !== id);
      
      localStorage.setItem('taully_productos', JSON.stringify(productosFiltrados));
      this.productosSubject.next(productosFiltrados);
      console.log(`✅ Producto ${id} eliminado de IndexedDB`);
    } catch (error) {
      console.error('❌ Error eliminando producto de IndexedDB:', error);
      throw error;
    }
  }

  /**
   * 🔄 Cargar productos y actualizar observable
   */
  private async loadProductos() {
    try {
      const productos = await this.getAllProductos();
      this.productosSubject.next(productos);
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
    }
  }

  // ==========================================
  // 📊 MOVIMIENTOS DE INVENTARIO
  // ==========================================

  /**
   * ➕ Registrar movimiento de inventario
   */
  async registrarMovimiento(movimiento: MovimientoInventario): Promise<void> {
    await this.waitForDB();
    
    try {
      const sql = `
        INSERT INTO movimientos (
          productoId, productoNombre, tipoMovimiento,
          cantidadAnterior, cantidadNueva, cantidadMovida,
          motivo, fecha
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `;
      
      await this.db.run(sql, [
        movimiento.productoId,
        movimiento.productoNombre,
        movimiento.tipoMovimiento,
        movimiento.cantidadAnterior,
        movimiento.cantidadNueva,
        movimiento.cantidadMovida,
        movimiento.motivo || '',
        movimiento.fecha
      ]);

      console.log('✅ Movimiento registrado');
      await this.loadMovimientos();
      
    } catch (error) {
      console.error('❌ Error registrando movimiento:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener todos los movimientos
   */
  async getAllMovimientos(): Promise<MovimientoInventario[]> {
    await this.waitForDB();
    
    try {
      const result = await this.db.query('SELECT * FROM movimientos ORDER BY fecha DESC');
      return result.values || [];
    } catch (error) {
      console.error('❌ Error obteniendo movimientos:', error);
      return [];
    }
  }

  /**
   * 🔄 Cargar movimientos y actualizar observable
   */
  private async loadMovimientos() {
    try {
      const movimientos = await this.getAllMovimientos();
      this.movimientosSubject.next(movimientos);
    } catch (error) {
      console.error('❌ Error cargando movimientos:', error);
    }
  }

  // ==========================================
  // 🔧 UTILIDADES
  // ==========================================

  /**
   * 🧹 Limpiar toda la base de datos (CUIDADO)
   */
  async limpiarBaseDatos(): Promise<void> {
    await this.waitForDB();
    
    try {
      await this.db.execute('DELETE FROM movimientos');
      await this.db.execute('DELETE FROM productos');
      await this.loadProductos();
      await this.loadMovimientos();
      console.log('✅ Base de datos limpiada');
    } catch (error) {
      console.error('❌ Error limpiando base de datos:', error);
      throw error;
    }
  }
}