export interface Usuario {
  id?: number;
  username: string;
  password: string;
  rol: 'admin' | 'cliente';
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fechaRegistro: string;
  activo: boolean;
}

export const ROLES = {
  ADMIN: 'admin',
  CLIENTE: 'cliente'
} as const;