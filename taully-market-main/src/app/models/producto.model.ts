// src/app/models/producto.model.ts
export interface Producto {
  id?: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  descripcion?: string;
  imagen?: string; // 🆕 Base64 string o ruta del archivo
  imagenThumbnail?: string; // 🆕 Miniatura para listas
  tieneImagen?: boolean; // 🆕 Flag rápido
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

// Categorías predefinidas para el sistema
export const CATEGORIAS = [
  'Alimentos',
  'Bebidas',
  'Limpieza',
  'Higiene',
  'Snacks',
  'Lácteos',
  'Otros'
];