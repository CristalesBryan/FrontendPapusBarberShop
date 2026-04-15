export interface Servicio {
  id: number;
  fecha: string;
  hora: string;
  barberoId: number;
  barberoNombre: string;
  tipoCorte: string;
  metodoPago: string;
  precioOriginal: number;
  descuentoPorcentaje: number;
  precio: number; // precio final con descuento
}

export interface ServicioCreate {
  fecha: string;
  hora: string;
  barberoId: number;
  tipoCorte: string;
  metodoPago: string;
  precio: number; // precio base
  descuentoPorcentaje: number;
}
