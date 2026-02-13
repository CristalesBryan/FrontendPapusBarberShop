export interface TipoCorteAPI {
  id: number;
  nombre: string;
  descripcion?: string;
  tiempoMinutos: number;
  precio: number;
  activo: boolean;
  barberoId?: number;
  barberoNombre?: string;
}

