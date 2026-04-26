export interface Producto {
  id: number;
  nombre: string;
  stock: number;
  precioCosto: number;
  precioVenta: number;
  comision: number | null;
  comisionHabilitada?: boolean;
  descripcion?: string;
  imagenUrl?: string; // URL presignada de la imagen en S3 (generada por el backend)
}

export interface ProductoCreate {
  nombre: string;
  stock: number;
  precioCosto: number;
  precioVenta: number;
  comision: number | null;
  comisionHabilitada: boolean;
  descripcion?: string;
}

