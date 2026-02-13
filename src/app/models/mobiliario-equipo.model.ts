export interface MobiliarioEquipo {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria: string;
  estado: string;
  fechaAdquisicion?: string;
  valor: number;
  cantidad: number;
  ubicacion?: string;
  numeroSerie?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MobiliarioEquipoCreate {
  nombre: string;
  descripcion?: string;
  categoria: string;
  estado: string;
  fechaAdquisicion?: string;
  valor: number;
  cantidad: number;
  ubicacion?: string;
  numeroSerie?: string;
}

