export interface Horario {
  id: number;
  barberoId: number;
  barberoNombre: string;
  horaEntrada: string; // Formato HH:mm
  horaSalida: string; // Formato HH:mm
  activo: boolean;
  fecha: string; // Formato YYYY-MM-DD
}

export interface HorarioCreate {
  barberoId: number;
  horaEntrada: string; // Formato HH:mm
  horaSalida: string; // Formato HH:mm
  activo?: boolean;
  fecha?: string; // Formato YYYY-MM-DD (opcional)
}

