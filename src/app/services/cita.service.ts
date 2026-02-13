import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cita, CitaCreate, Disponibilidad } from '../models/cita.model';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrl = `${environment.apiUrl}/api/citas`;

  constructor(private http: HttpClient) { }

  crearCita(cita: CitaCreate): Observable<Cita> {
    return this.http.post<Cita>(this.apiUrl, cita);
  }

  obtenerTodas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<Cita> {
    return this.http.get<Cita>(`${this.apiUrl}/${id}`);
  }

  obtenerPorBarberoYFecha(barberoId: number, fecha: string): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.apiUrl}/barbero/${barberoId}/fecha/${fecha}`);
  }

  obtenerDisponibilidad(fecha: string): Observable<Disponibilidad[]> {
    return this.http.get<Disponibilidad[]>(`${this.apiUrl}/disponibilidad/${fecha}`);
  }

  cancelarCita(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  actualizarHora(id: number, nuevaHora: string): Observable<Cita> {
    return this.http.put<Cita>(`${this.apiUrl}/${id}/hora`, { hora: nuevaHora });
  }

  completarCita(id: number): Observable<Cita> {
    return this.http.put<Cita>(`${this.apiUrl}/${id}/completar`, {});
  }

  update(id: number, cita: CitaCreate): Observable<Cita> {
    return this.http.put<Cita>(`${this.apiUrl}/${id}`, cita);
  }
}

