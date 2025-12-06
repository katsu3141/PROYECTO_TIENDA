// Contrato de datos para Movimientos de Inventario
// Este modelo es clave para la trazabilidad del negocio
export interface MovimientoInventario {
  id?: number;
  productoId: number;
  productoNombre: string;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'ACTUALIZACION';
  cantidadAnterior: number;
  cantidadNueva: number;
  cantidadMovida: number;
  motivo?: string;
  fecha: string;
}

// Tipos de movimiento para el sistema
export const TIPOS_MOVIMIENTO = {
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA',
  AJUSTE: 'AJUSTE',
  ACTUALIZACION: 'ACTUALIZACION'
} as const;