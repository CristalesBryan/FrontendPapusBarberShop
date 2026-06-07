export interface Barbero {
  id: number;
  nombre: string;
  porcentajeServicio: number;
  correo?: string;
}

/** Payload para crear/actualizar (sin id en el cuerpo de la petición). */
export interface BarberoUpdate {
  nombre: string;
  porcentajeServicio: number;
  correo?: string;
}

