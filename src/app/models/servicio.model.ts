export interface Servicio {
  id: number;
  fecha: string;
  hora: string;
  barberoId: number;
  barberoNombre: string;
  tipoCorte: string;
  metodoPago: string;
  precio: number;
}

export interface ServicioCreate {
  fecha: string;
  hora: string;
  barberoId: number;
  tipoCorte: string;
  metodoPago: string;
  precio: number;
}

