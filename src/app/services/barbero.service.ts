import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Barbero } from '../models/barbero.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BarberoService {
  private readonly API_URL = `${environment.apiUrl}/barberos`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Barbero[]> {
    return this.http.get<Barbero[]>(this.API_URL);
  }

  getById(id: number): Observable<Barbero> {
    return this.http.get<Barbero>(`${this.API_URL}/${id}`);
  }

  create(barbero: Barbero): Observable<Barbero> {
    return this.http.post<Barbero>(this.API_URL, barbero);
  }

  update(id: number, barbero: Barbero): Observable<Barbero> {
    return this.http.put<Barbero>(`${this.API_URL}/${id}`, barbero);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

