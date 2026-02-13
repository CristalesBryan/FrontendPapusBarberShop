export interface ResumenBarbero {
  barberoId: number;
  barberoNombre: string;
  porcentajeServicio: number;
  totalServicios: number;
  totalVentas: number;
  totalComisiones: number;
  totalGenerado: number;
  pagoBarbero: number;
  cantidadServicios: number;
  cantidadVentas: number;
}

export interface ResumenDiario {
  fecha: string;
  totalServicios: number;
  totalVentas: number;
  totalComisiones: number;
  totalGeneral: number;
  cantidadServicios: number;
  cantidadVentas: number;
  resumenBarberos: ResumenBarbero[];
}

export interface ResumenMensual {
  mes: string;
  totalServicios: number;
  totalVentas: number;
  totalComisiones: number;
  totalGeneral: number;
  cantidadServicios: number;
  cantidadVentas: number;
  resumenBarberos: ResumenBarbero[];
}

