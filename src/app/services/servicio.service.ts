import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Servicio, ServicioCreate } from '../models/servicio.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private readonly API_URL = `${environment.apiUrl}/servicios`;

  constructor(private http: HttpClient) { }

  create(servicio: ServicioCreate): Observable<Servicio> {
    return this.http.post<Servicio>(this.API_URL, servicio);
  }

  getAll(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(this.API_URL);
  }

  getByFecha(fecha: string): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.API_URL}/fecha/${fecha}`);
  }

  getResumenDiario(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/resumen/diario`);
  }

  getResumenMensual(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/resumen/mensual`);
  }

  getResumenBarbero(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/resumen/barbero/${id}`);
  }

  getById(id: number): Observable<Servicio> {
    return this.http.get<Servicio>(`${this.API_URL}/${id}`);
  }

  update(id: number, servicio: ServicioCreate): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.API_URL}/${id}`, servicio);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

