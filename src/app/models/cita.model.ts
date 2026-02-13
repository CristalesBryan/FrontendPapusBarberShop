export interface Cita {
  id: number;
  fecha: string;
  hora: string;
  barberoId: number;
  barberoNombre: string;
  tipoCorteId: number;
  tipoCorteNombre: string;
  tipoCorteDescripcion?: string;
  tipoCorteTiempoMinutos: number;
  tipoCortePrecio: number;
  nombreCliente: string;
  correoCliente: string;
  telefonoCliente?: string;
  comentarios?: string;
  estado: string;
}

export interface CitaCreate {
  fecha: string;
  hora: string;
  barberoId: number;
  tipoCorteId: number;
  nombreCliente: string;
  correoCliente: string;
  telefonoCliente?: string;
  comentarios?: string;
  correosConfirmacion: string[];
}

export interface Disponibilidad {
  barberoId: number;
  barberoNombre: string;
  horaEntrada: string;
  horaSalida: string;
  horasDisponibles: string[];
  horasOcupadas: string[];
}

