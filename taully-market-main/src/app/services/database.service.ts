// src/app/services/database.service.ts
import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { MovimientoInventario } from '../models/movimiento.model';
import { Usuario, ROLES } from '../models/usuario.model';
import { 
  EstadisticasInventario, 
  AnalisisCategoria, 
  ProductoTop, 
  ProductoCritico, 
  DistribucionCategoria, 
  COLORES_CATEGORIAS 
} from '../models/estadisticas.model';

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

  private async initDB() {
    try {
      const platform = Capacitor.getPlatform();
      console.log(`🚀 Inicializando BD en plataforma: ${platform}`);
      
      if (platform === 'web') {
        console.log('🌐 Usando IndexedDB para web');
        this.isDbReady.next(true);
        await this.inicializarUsuariosPorDefecto();
        await this.loadProductos();
        console.log('✅ IndexedDB inicializado');
        return;
      }

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
      this.isDbReady.next(true);
      await this.inicializarUsuariosPorDefecto();
      await this.loadProductos();
    }
  }

  private async createTables() {
    try {
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

      const sqlUsuarios = `
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          rol TEXT NOT NULL,
          nombre TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          telefono TEXT,
          direccion TEXT,
          fechaRegistro TEXT NOT NULL,
          activo INTEGER DEFAULT 1
        );
      `;

      await this.db.execute(sqlProductos);
      await this.db.execute(sqlMovimientos);
      await this.db.execute(sqlUsuarios);
      
      console.log('✅ Tablas creadas exitosamente');
      await this.inicializarUsuariosPorDefecto();
      
    } catch (error) {
      console.error('❌ Error creando tablas:', error);
      throw error;
    }
  }

  private async inicializarUsuariosPorDefecto() {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      const usuarios = this.getUsuariosIndexedDB();
      if (usuarios.length === 0) {
        const usuariosDefecto = [
          {
            id: 1,
            username: 'admin',
            password: 'admin123',
            rol: ROLES.ADMIN,
            nombre: 'Administrador',
            email: 'admin@taully.com',
            fechaRegistro: new Date().toISOString(),
            activo: true
          },
          {
            id: 2,
            username: 'cliente',
            password: 'cliente123',
            rol: ROLES.CLIENTE,
            nombre: 'Cliente Demo',
            email: 'cliente@taully.com',
            telefono: '987654321',
            direccion: 'Av. Principal 123, Lima',
            fechaRegistro: new Date().toISOString(),
            activo: true
          }
        ];
        localStorage.setItem('taully_usuarios', JSON.stringify(usuariosDefecto));
        console.log('✅ Usuarios por defecto creados en IndexedDB');
      }
      return;
    }

    try {
      const result = await this.db.query('SELECT COUNT(*) as count FROM usuarios');
      const count = result.values?.[0]?.count || 0;

      if (count === 0) {
        await this.db.run(
          `INSERT INTO usuarios (username, password, rol, nombre, email, fechaRegistro, activo) VALUES (?, ?, ?, ?, ?, ?, ?);`,
          ['admin', 'admin123', ROLES.ADMIN, 'Administrador', 'admin@taully.com', new Date().toISOString(), 1]
        );

        await this.db.run(
          `INSERT INTO usuarios (username, password, rol, nombre, email, telefono, direccion, fechaRegistro, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          ['cliente', 'cliente123', ROLES.CLIENTE, 'Cliente Demo', 'cliente@taully.com', '987654321', 'Av. Principal 123, Lima', new Date().toISOString(), 1]
        );

        console.log('✅ Usuarios por defecto creados en SQLite');
      }
    } catch (error) {
      console.error('❌ Error creando usuarios por defecto:', error);
    }
  }

  async repararUsuariosPorDefecto(): Promise<void> {
    try {
      console.log('🔧 Reparando usuarios por defecto...');
      
      const platform = Capacitor.getPlatform();
      
      if (platform === 'web') {
        localStorage.removeItem('taully_usuarios');
        
        const usuariosDefecto = [
          {
            id: 1,
            username: 'admin',
            password: 'admin123',
            rol: ROLES.ADMIN,
            nombre: 'Administrador',
            email: 'admin@taully.com',
            fechaRegistro: new Date().toISOString(),
            activo: true
          },
          {
            id: 2,
            username: 'cliente',
            password: 'cliente123',
            rol: ROLES.CLIENTE,
            nombre: 'Cliente Demo',
            email: 'cliente@taully.com',
            telefono: '987654321',
            direccion: 'Av. Principal 123, Lima',
            fechaRegistro: new Date().toISOString(),
            activo: true
          }
        ];
        
        localStorage.setItem('taully_usuarios', JSON.stringify(usuariosDefecto));
        console.log('✅ Usuarios reparados en IndexedDB');
      } else {
        await this.db.execute('DELETE FROM usuarios');
        
        await this.db.run(
          `INSERT INTO usuarios (username, password, rol, nombre, email, fechaRegistro, activo) VALUES (?, ?, ?, ?, ?, ?, ?);`,
          ['admin', 'admin123', ROLES.ADMIN, 'Administrador', 'admin@taully.com', new Date().toISOString(), 1]
        );

        await this.db.run(
          `INSERT INTO usuarios (username, password, rol, nombre, email, telefono, direccion, fechaRegistro, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          ['cliente', 'cliente123', ROLES.CLIENTE, 'Cliente Demo', 'cliente@taully.com', '987654321', 'Av. Principal 123, Lima', new Date().toISOString(), 1]
        );

        console.log('✅ Usuarios reparados en SQLite');
      }
      
      alert('✅ Usuarios reparados exitosamente. Por favor reinicia sesión.');
    } catch (error) {
      console.error('❌ Error reparando usuarios:', error);
      alert('❌ Error al reparar usuarios');
    }
  }

  getDatabaseState(): Observable<boolean> {
    return this.isDbReady.asObservable();
  }

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

  async crearProducto(producto: Producto): Promise<number> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      return this.crearProductoIndexedDB(producto);
    }
    
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

  async getAllProductos(): Promise<Producto[]> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      return this.getProductosIndexedDB();
    }
    
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

  private getProductosIndexedDB(): Producto[] {
    try {
      const productosStr = localStorage.getItem('taully_productos');
      return productosStr ? JSON.parse(productosStr) : [];
    } catch (error) {
      console.error('❌ Error obteniendo productos de IndexedDB:', error);
      return [];
    }
  }

  async getProducto(id: number): Promise<Producto | null> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      const productos = this.getProductosIndexedDB();
      return productos.find(p => p.id === id) || null;
    }
    
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

  async actualizarProducto(producto: Producto): Promise<void> {
    if (!producto.id) {
      throw new Error('El producto debe tener un ID');
    }

    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      this.actualizarProductoIndexedDB(producto);
      return;
    }
    
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

  async eliminarProducto(id: number): Promise<void> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      this.eliminarProductoIndexedDB(id);
      return;
    }
    
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

  private async loadMovimientos() {
    try {
      const movimientos = await this.getAllMovimientos();
      this.movimientosSubject.next(movimientos);
    } catch (error) {
      console.error('❌ Error cargando movimientos:', error);
    }
  }

  // ==========================================
  // 👤 CRUD - USUARIOS
  // ==========================================

  async crearUsuario(usuario: Omit<Usuario, 'id'>): Promise<number> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      return this.crearUsuarioIndexedDB(usuario);
    }
    
    try {
      const sql = `
        INSERT INTO usuarios (
          username, password, rol, nombre, email, telefono, direccion, fechaRegistro, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      
      const result = await this.db.run(sql, [
        usuario.username,
        usuario.password,
        usuario.rol,
        usuario.nombre,
        usuario.email,
        usuario.telefono || null,
        usuario.direccion || null,
        usuario.fechaRegistro,
        usuario.activo ? 1 : 0
      ]);

      const userId = result.changes?.lastId || 0;
      console.log(`✅ Usuario creado con ID: ${userId}`);
      return userId;
      
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      throw error;
    }
  }

  private crearUsuarioIndexedDB(usuario: Omit<Usuario, 'id'>): number {
    try {
      const usuarios = this.getUsuariosIndexedDB();
      const nuevoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id || 0)) + 1 : 1;
      
      const nuevoUsuario = {
        ...usuario,
        id: nuevoId
      };
      
      usuarios.push(nuevoUsuario);
      localStorage.setItem('taully_usuarios', JSON.stringify(usuarios));
      
      console.log(`✅ Usuario creado en IndexedDB con ID: ${nuevoId}`);
      return nuevoId;
    } catch (error) {
      console.error('❌ Error creando usuario en IndexedDB:', error);
      throw error;
    }
  }

  async getUsuarioByUsername(username: string): Promise<Usuario | null> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      const usuarios = this.getUsuariosIndexedDB();
      return usuarios.find(u => u.username === username) || null;
    }
    
    try {
      const result = await this.db.query('SELECT * FROM usuarios WHERE username = ?', [username]);
      
      if (result.values && result.values.length > 0) {
        const user = result.values[0];
        return {
          ...user,
          activo: user.activo === 1
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      return null;
    }
  }

  async getUsuarioByEmail(email: string): Promise<Usuario | null> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      const usuarios = this.getUsuariosIndexedDB();
      return usuarios.find(u => u.email === email) || null;
    }
    
    try {
      const result = await this.db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
      
      if (result.values && result.values.length > 0) {
        const user = result.values[0];
        return {
          ...user,
          activo: user.activo === 1
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo usuario por email:', error);
      return null;
    }
  }

  async getAllUsuarios(): Promise<Usuario[]> {
    await this.waitForDB();
    
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      return this.getUsuariosIndexedDB();
    }
    
    try {
      const result = await this.db.query('SELECT * FROM usuarios ORDER BY fechaRegistro DESC');
      
      return (result.values || []).map(u => ({
        ...u,
        activo: u.activo === 1
      }));
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return [];
    }
  }

  private getUsuariosIndexedDB(): Usuario[] {
    try {
      const usuariosStr = localStorage.getItem('taully_usuarios');
      return usuariosStr ? JSON.parse(usuariosStr) : [];
    } catch (error) {
      console.error('❌ Error obteniendo usuarios de IndexedDB:', error);
      return [];
    }
  }

  // ==========================================
  // 🔧 UTILIDADES
  // ==========================================

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

  // ==========================================
  // 📊 MÉTODOS PARA ESTADÍSTICAS Y REPORTES
  // ==========================================

  async getEstadisticasCompletas(): Promise<EstadisticasInventario> {
    await this.waitForDB();
    
    const productos = await this.getAllProductos();
    
    if (productos.length === 0) {
      return this.getEstadisticasVacias();
    }
    
    const totalProductos = productos.length;
    const valorTotalInventario = productos.reduce((sum, p) => sum + (p.precio * p.stock), 0);
    const productosConStock = productos.filter(p => p.stock > 0).length;
    const productosSinStock = productos.filter(p => p.stock === 0).length;
    const productosStockBajo = productos.filter(p => p.stock > 0 && p.stock < 10).length;
    const cantidadStockCritico = productos.filter(p => p.stock === 0 || p.stock < 5).length;
    const stockTotal = productos.reduce((sum, p) => sum + p.stock, 0);
    
    const valorPromedio = totalProductos > 0 ? valorTotalInventario / totalProductos : 0;
    const stockPromedio = totalProductos > 0 ? stockTotal / totalProductos : 0;
    
    const categorias = await this.getAnalisisPorCategoria(productos, valorTotalInventario);
    const totalCategorias = categorias.length;
    
    const topProductosPorValor = await this.getTopProductosPorValor(productos, 5);
    const topProductosPorStock = await this.getTopProductosPorStock(productos, 5);
    
    const productosCriticos = await this.getProductosStockCritico(productos);
    
    const distribucionPorCategoria = await this.getDistribucionPorCategoria(productos);
    
    const tendenciaStock = await this.getTendenciaStock(productos);
    
    return {
      totalProductos,
      valorTotalInventario,
      productosConStock,
      productosSinStock,
      productosStockBajo,
      cantidadStockCritico,
      valorPromedio,
      stockPromedio,
      stockTotal,
      totalCategorias,
      categorias,
      topProductosPorValor,
      topProductosPorStock,
      productosStockCritico: productosCriticos,
      distribucionPorCategoria,
      tendenciaStock
    };
  }

  private async getAnalisisPorCategoria(productos: Producto[], valorTotal: number): Promise<AnalisisCategoria[]> {
    const categorias = new Map<string, { total: number, valor: number, stock: number }>();
    
    productos.forEach(p => {
      const actual = categorias.get(p.categoria) || { total: 0, valor: 0, stock: 0 };
      categorias.set(p.categoria, {
        total: actual.total + 1,
        valor: actual.valor + (p.precio * p.stock),
        stock: actual.stock + p.stock
      });
    });
    
    const totalProductos = productos.length;
    
    return Array.from(categorias.entries())
      .map(([categoria, data]) => ({
        categoria,
        totalProductos: data.total,
        valorTotal: data.valor,
        stockTotal: data.stock,
        porcentajeValor: valorTotal > 0 ? (data.valor / valorTotal) * 100 : 0,
        porcentajeProductos: totalProductos > 0 ? (data.total / totalProductos) * 100 : 0
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal);
  }

  private async getTopProductosPorValor(productos: Producto[], limite: number = 5): Promise<ProductoTop[]> {
    return productos
      .map(p => ({
        id: p.id || 0,
        nombre: p.nombre,
        categoria: p.categoria,
        precio: p.precio,
        stock: p.stock,
        valorInventario: p.precio * p.stock
      }))
      .sort((a, b) => b.valorInventario - a.valorInventario)
      .slice(0, limite);
  }

  private async getTopProductosPorStock(productos: Producto[], limite: number = 5): Promise<ProductoTop[]> {
    return productos
      .map(p => ({
        id: p.id || 0,
        nombre: p.nombre,
        categoria: p.categoria,
        precio: p.precio,
        stock: p.stock,
        valorInventario: p.precio * p.stock
      }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, limite);
  }

  private async getProductosStockCritico(productos: Producto[]): Promise<ProductoCritico[]> {
    return productos
      .filter(p => p.stock <= 10)
      .map(p => ({
        id: p.id || 0,
        nombre: p.nombre,
        categoria: p.categoria,
        stock: p.stock,
        precio: p.precio,
        nivelCriticidad: p.stock === 0 ? 'CRITICO' as const : p.stock < 5 ? 'CRITICO' as const : 'BAJO' as const
      }))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10);
  }

  private async getDistribucionPorCategoria(productos: Producto[]): Promise<DistribucionCategoria[]> {
    const categorias = new Map<string, number>();
    
    productos.forEach(p => {
      categorias.set(p.categoria, (categorias.get(p.categoria) || 0) + 1);
    });
    
    const total = productos.length;
    
    return Array.from(categorias.entries())
      .map(([categoria, cantidad]) => ({
        categoria,
        cantidad,
        porcentaje: total > 0 ? (cantidad / total) * 100 : 0,
        color: COLORES_CATEGORIAS[categoria] || '#b8bcc8'
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  private async getTendenciaStock(productos: Producto[]): Promise<any[]> {
    const hoy = new Date();
    const tendencia = [];
    
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      
      const variacion = Math.random() * 0.2 + 0.9;
      
      tendencia.push({
        fecha: fecha.toISOString().split('T')[0],
        totalStock: Math.round(productos.reduce((sum, p) => sum + p.stock, 0) * variacion),
        valorInventario: Math.round(productos.reduce((sum, p) => sum + (p.precio * p.stock), 0) * variacion),
        productosSinStock: Math.round(productos.filter(p => p.stock === 0).length * variacion)
      });
    }
    
    return tendencia;
  }

  async getResumenDashboard(): Promise<{
    totalProductos: number;
    valorInventario: number;
    stockBajo: number;
    cantidadStockCritico: number;
  }> {
    await this.waitForDB();
    
    const productos = await this.getAllProductos();
    
    return {
      totalProductos: productos.length,
      valorInventario: productos.reduce((sum, p) => sum + (p.precio * p.stock), 0),
      stockBajo: productos.filter(p => p.stock > 0 && p.stock < 10).length,
      cantidadStockCritico: productos.filter(p => p.stock === 0 || p.stock < 5).length
    };
  }

  private getEstadisticasVacias(): EstadisticasInventario {
    return {
      totalProductos: 0,
      valorTotalInventario: 0,
      productosConStock: 0,
      productosSinStock: 0,
      productosStockBajo: 0,
      cantidadStockCritico: 0,
      valorPromedio: 0,
      stockPromedio: 0,
      stockTotal: 0,
      totalCategorias: 0,
      categorias: [],
      topProductosPorValor: [],
      topProductosPorStock: [],
      productosStockCritico: [],
      distribucionPorCategoria: [],
      tendenciaStock: []
    };
  }

  async getVentasPorPeriodo(tipo: 'dia' | 'semana' | 'mes' | 'año'): Promise<number> {
    await this.waitForDB();
    
    const hoy = new Date();
    let fechaInicio: Date;
    
    switch(tipo) {
      case 'dia':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        break;
      case 'semana':
        fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'año':
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        break;
    }
    
    const movimientos = await this.getAllMovimientos();
    
    const movimientosFiltrados = movimientos.filter(m => {
      const fechaMovimiento = new Date(m.fecha);
      return fechaMovimiento >= fechaInicio && 
             fechaMovimiento <= hoy && 
             m.tipoMovimiento === 'SALIDA';
    });
    
    return movimientosFiltrados.reduce((total, m) => total + m.cantidadMovida, 0);
  }

  async getVentasDetalladasPorFecha(fechaInicio: string, fechaFin: string): Promise<any[]> {
    await this.waitForDB();
    
    const movimientos = await this.getAllMovimientos();
    
    return movimientos
      .filter(m => {
        const fechaMovimiento = new Date(m.fecha);
        return fechaMovimiento >= new Date(fechaInicio) && 
               fechaMovimiento <= new Date(fechaFin) && 
               m.tipoMovimiento === 'SALIDA';
      })
      .map(m => ({
        fecha: m.fecha,
        productoNombre: m.productoNombre,
        cantidad: m.cantidadMovida,
        tipo: m.tipoMovimiento,
        motivo: m.motivo
      }))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }
}