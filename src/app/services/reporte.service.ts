import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResumenDiario, ResumenMensual } from '../models/reporte.model';
import { environment } from '../../environments/environment';

/** Mismo nombre en `ReportesComponent` (addEventListener). */
export const REPORTES_ACTUALIZADOS_EVENT = 'reportesActualizados';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly API_URL = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) { }

  /**
   * Tras crear/editar/eliminar cortes o ventas, avisa a la vista de reportes (si está abierta)
   * para que vuelva a pedir datos al API sin recargar el navegador.
   */
  notificarCambioDatosReporte(): void {
    window.dispatchEvent(new CustomEvent(REPORTES_ACTUALIZADOS_EVENT));
  }

  /**
   * Resumen del día usando la fecha local del navegador (evita ceros cuando el servidor está en UTC
   * y "hoy" del servidor no coincide con el día de los registros en Guatemala).
   */
  getResumenDiario(): Observable<ResumenDiario> {
    const fecha = this.fechaLocalHoy();
    return this.http.get<ResumenDiario>(`${this.API_URL}/diario?fecha=${fecha}`);
  }

  private fechaLocalHoy(): string {
    const ahora = new Date();
    const y = ahora.getFullYear();
    const m = String(ahora.getMonth() + 1).padStart(2, '0');
    const d = String(ahora.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getResumenMensual(mes?: string): Observable<ResumenMensual> {
    const url = mes ? `${this.API_URL}/mensual?mes=${mes}` : `${this.API_URL}/mensual`;
    return this.http.get<ResumenMensual>(url);
  }

  getResumenPorFecha(fecha: string): Observable<ResumenDiario> {
    return this.http.get<ResumenDiario>(`${this.API_URL}/fecha/${fecha}`);
  }
}

