export interface TipoCorte {
  id: string;
  nombre: string;
  imagen: string;
  descripcion?: string;
}

export const TIPOS_CORTE: TipoCorte[] = [
  {
    id: 'corte-caballero',
    nombre: 'Corte de Caballero',
    imagen: 'assets/images/cortes/Corte de Caballero.png',
    descripcion: 'Corte clásico para caballero'
  },
  {
    id: 'corte-nino',
    nombre: 'Corte para Niño',
    imagen: 'assets/images/cortes/Corte para niño.png',
    descripcion: 'Corte especial para niños'
  },
  {
    id: 'corte-barba',
    nombre: 'Arreglo de Barba',
    imagen: 'assets/images/cortes/Arreglo de Barba.png',
    descripcion: 'Arreglo y diseño de barba'
  },
  {
    id: 'corte-barba-completo',
    nombre: 'Corte y Barba',
    imagen: 'assets/images/cortes/Corte y Barba.png',
    descripcion: 'Corte completo con arreglo de barba'
  }
];

