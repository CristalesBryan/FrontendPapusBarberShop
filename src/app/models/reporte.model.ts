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
  totalVentasImporteOriginal: number;
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

export interface ResumenMetodoPagoItem {
  cantidad: number;
  total: number;
}

export interface ResumenPorMetodoPago {
  efectivo: ResumenMetodoPagoItem;
  tarjeta: ResumenMetodoPagoItem;
}

export interface DetalleReporteItem {
  fecha: string;
  hora: string;
  barberoNombre: string;
  cliente: string;
  tipoCorte: string;
  precioOriginal: number;
  descuentoPorcentaje: number;
  total: number;
  metodoPago: string;
}

export interface ResumenBarberoPago {
  barberoId: number;
  barberoNombre: string;
  cortesEfectivo: number;
  cortesTarjeta: number;
  totalCortes: number;
  montoTotal: number;
  comisionCalculada: number;
}

export interface VentaMerchReporte {
  id: number;
  productoNombre: string;
  categoria: string;
  talla?: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  metodoPago: string;
  fecha: string;
  hora: string;
}

export interface TopProductoMerch {
  nombre: string;
  cantidad: number;
  total: number;
}

export interface CategoriaMerchReporte {
  categoria: string;
  cantidad: number;
  total: number;
}

export interface ResumenMerchandising {
  totalVendido: number;
  totalUnidades: number;
  productoMasVendido: string;
  ventas: VentaMerchReporte[];
  topProductos: TopProductoMerch[];
  distribucionCategoria: CategoriaMerchReporte[];
}
