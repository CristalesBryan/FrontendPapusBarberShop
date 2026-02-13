import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TipoCorteAPI } from '../models/tipo-corte-api.model';

@Injectable({
  providedIn: 'root'
})
export class TipoCorteService {
  private apiUrl = `${environment.apiUrl}/api/tipos-corte`;

  constructor(private http: HttpClient) { }

  obtenerTodosActivos(): Observable<TipoCorteAPI[]> {
    return this.http.get<TipoCorteAPI[]>(this.apiUrl);
  }

  obtenerTodos(): Observable<TipoCorteAPI[]> {
    return this.http.get<TipoCorteAPI[]>(`${this.apiUrl}/todos`);
  }

  obtenerPorId(id: number): Observable<TipoCorteAPI> {
    return this.http.get<TipoCorteAPI>(`${this.apiUrl}/${id}`);
  }

  crear(tipoCorte: TipoCorteAPI): Observable<TipoCorteAPI> {
    return this.http.post<TipoCorteAPI>(this.apiUrl, tipoCorte);
  }

  actualizar(id: number, tipoCorte: TipoCorteAPI): Observable<TipoCorteAPI> {
    return this.http.put<TipoCorteAPI>(`${this.apiUrl}/${id}`, tipoCorte);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

