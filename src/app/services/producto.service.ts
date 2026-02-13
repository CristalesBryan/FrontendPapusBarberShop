import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ProductoCreate } from '../models/producto.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private readonly API_URL = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) { }

  create(producto: ProductoCreate): Observable<Producto> {
    return this.http.post<Producto>(this.API_URL, producto);
  }

  update(id: number, producto: ProductoCreate): Observable<Producto> {
    return this.http.put<Producto>(`${this.API_URL}/${id}`, producto);
  }

  getAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.API_URL);
  }

  getById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.API_URL}/${id}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

