import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MobiliarioEquipo, MobiliarioEquipoCreate } from '../models/mobiliario-equipo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MobiliarioEquipoService {
  private readonly API_URL = `${environment.apiUrl}/mobiliario-equipo`;

  constructor(private http: HttpClient) { }

  create(mobiliarioEquipo: MobiliarioEquipoCreate): Observable<MobiliarioEquipo> {
    return this.http.post<MobiliarioEquipo>(this.API_URL, mobiliarioEquipo);
  }

  update(id: number, mobiliarioEquipo: MobiliarioEquipoCreate): Observable<MobiliarioEquipo> {
    return this.http.put<MobiliarioEquipo>(`${this.API_URL}/${id}`, mobiliarioEquipo);
  }

  getAll(): Observable<MobiliarioEquipo[]> {
    return this.http.get<MobiliarioEquipo[]>(this.API_URL);
  }

  getById(id: number): Observable<MobiliarioEquipo> {
    return this.http.get<MobiliarioEquipo>(`${this.API_URL}/${id}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

