export interface VarianteMerch {
  id?: number;
  talla: string;
  precio?: number;
  stock: number;
}

export interface ImagenMerch {
  id?: number;
  s3Key: string;
  url: string;
  orden: number;
}

export interface ProductoMerch {
  id: number;
  nombre: string;
  categoria: string;
  descripcion?: string;
  precioBase: number;
  activo: boolean;
  permitePersonalizacion: boolean;
  esNuevo: boolean;
  badge?: string;
  stockTotal?: number;
  precioMin?: number;
  precioMax?: number;
  imagenes: ImagenMerch[];
  variantes: VarianteMerch[];
}

export interface ProductoMerchCreate {
  nombre: string;
  categoria: string;
  descripcion?: string;
  precioBase: number;
  activo: boolean;
  permitePersonalizacion: boolean;
  esNuevo: boolean;
  badge?: string;
  variantes: VarianteMerch[];
}

export interface VentaMerchCreate {
  productoId: number;
  varianteId?: number;
  cantidad: number;
  metodoPago: string;
  personalizacionNombre?: string;
  personalizacionNumero?: string;
}

export const CATEGORIAS_MERCH = ['Camisas', 'Gorras', 'Llaveros', 'Otros'] as const;
export const TALLAS_MERCH = ['S', 'M', 'L', 'XL', 'XXL', 'UNICA'] as const;
