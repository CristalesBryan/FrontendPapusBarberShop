import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResumenDiario, ResumenMensual } from '../models/reporte.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly API_URL = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) { }

  getResumenDiario(): Observable<ResumenDiario> {
    return this.http.get<ResumenDiario>(`${this.API_URL}/diario`);
  }

  getResumenMensual(mes?: string): Observable<ResumenMensual> {
    const url = mes ? `${this.API_URL}/mensual?mes=${mes}` : `${this.API_URL}/mensual`;
    return this.http.get<ResumenMensual>(url);
  }

  getResumenPorFecha(fecha: string): Observable<ResumenDiario> {
    return this.http.get<ResumenDiario>(`${this.API_URL}/fecha/${fecha}`);
  }
}

