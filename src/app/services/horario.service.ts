import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Horario, HorarioCreate } from '../models/horario.model';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  private apiUrl = `${environment.apiUrl}/horarios`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Horario[]> {
    return this.http.get<Horario[]>(this.apiUrl);
  }

  getById(id: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.apiUrl}/${id}`);
  }

  getByBarberoId(barberoId: number): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.apiUrl}/barbero/${barberoId}`);
  }

  create(horario: HorarioCreate): Observable<Horario> {
    return this.http.post<Horario>(this.apiUrl, horario);
  }

  update(id: number, horario: HorarioCreate): Observable<Horario> {
    return this.http.put<Horario>(`${this.apiUrl}/${id}`, horario);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

