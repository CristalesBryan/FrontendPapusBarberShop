export interface VentaProducto {
  id: number;
  fecha: string;
  hora: string;
  barberoId: number;
  barberoNombre: string;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  importeOriginal: number;
  descuentoPorcentaje: number;
  importe: number; // importe final con descuento
  stockAntes: number;
  stockDespues: number;
  metodoPago: string;
}

export interface VentaProductoCreate {
  fecha: string;
  hora: string;
  barberoId: number;
  productoId: number;
  cantidad: number;
  metodoPago: string;
  descuentoPorcentaje: number;
}
