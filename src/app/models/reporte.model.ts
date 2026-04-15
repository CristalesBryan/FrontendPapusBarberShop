export interface DetalleCorte {
  fecha: string;
  hora: string;
  tipoCorte: string;
  metodoPago: string;
  precioOriginal: number;
  descuentoPorcentaje: number;
  precio: number;
}

export interface DetalleVentaProducto {
  fecha: string;
  hora: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  importeOriginal: number;
  descuentoPorcentaje: number;
  importe: number;
  metodoPago: string;
}

export interface ResumenBarbero {
  barberoId: number;
  barberoNombre: string;
  porcentajeServicio: number;
  totalServicios: number;
  totalVentas: number;
  totalComisiones: number;
  totalGenerado: number;
  pagoBarbero: number;
  gananciaBarberia: number;
  cantidadServicios: number;
  cantidadVentas: number;
  detallesCortes: DetalleCorte[];
  detallesVentas: DetalleVentaProducto[];
}

export interface ResumenDiario {
  fecha: string;
  totalServicios: number;
  totalVentas: number;
  totalComisiones: number;
  totalGeneral: number;
  totalDescuentosAplicados: number;
  totalGananciaBarberia: number;
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
  totalDescuentosAplicados: number;
  totalGananciaBarberia: number;
  cantidadServicios: number;
  cantidadVentas: number;
  resumenBarberos: ResumenBarbero[];
}
