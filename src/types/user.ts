export type Rol = 'Auditor' | 'Jefatura' | 'Gerente' | 'Director';

export const ROLES: Rol[] = ['Auditor', 'Jefatura', 'Gerente', 'Director'];

export interface User {
  id: number;
  nombre: string;
  apellido_p: string;
  apellido_m: string | null;
  fecha_ingreso: string;
  rol: Rol;
  estado: boolean;
  direccion: string | null;
  correo: string;
  created_at: string;
}

export interface UserInput {
  nombre: string;
  apellido_p: string;
  apellido_m: string;
  fecha_ingreso: string;
  rol: Rol;
  contrasena: string;
  correo: string;
  estado: boolean;
  direccion: string;
}

export type UserInputPartial = Partial<UserInput> & { id: number };
