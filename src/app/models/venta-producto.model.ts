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
  importe: number;
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
}

