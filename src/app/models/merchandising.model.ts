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
export const TALLAS_ROPA = ['S', 'M', 'L', 'XL', 'XXL'] as const;
export const TALLA_UNICA = 'UNICA' as const;
export const TALLAS_MERCH = [...TALLAS_ROPA, TALLA_UNICA] as const;

export function tallasParaCategoria(categoria: string): readonly string[] {
  const cat = (categoria ?? '').trim();
  if (cat === 'Llaveros') {
    return [TALLA_UNICA];
  }
  return TALLAS_ROPA;
}

export function normalizarTallaMerch(talla: string | undefined | null): string {
  return (talla ?? '').trim().toUpperCase();
}
