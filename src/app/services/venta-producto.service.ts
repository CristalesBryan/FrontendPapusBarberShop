import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VentaProducto, VentaProductoCreate } from '../models/venta-producto.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VentaProductoService {
  private readonly API_URL = `${environment.apiUrl}/ventas-productos`;

  constructor(private http: HttpClient) { }

  create(venta: VentaProductoCreate): Observable<VentaProducto> {
    return this.http.post<VentaProducto>(this.API_URL, venta);
  }

  getAll(): Observable<VentaProducto[]> {
    return this.http.get<VentaProducto[]>(this.API_URL);
  }

  getByFecha(fecha: string): Observable<VentaProducto[]> {
    return this.http.get<VentaProducto[]>(`${this.API_URL}/fecha/${fecha}`);
  }

  getById(id: number): Observable<VentaProducto> {
    return this.http.get<VentaProducto>(`${this.API_URL}/${id}`);
  }

  update(id: number, venta: VentaProductoCreate): Observable<VentaProducto> {
    return this.http.put<VentaProducto>(`${this.API_URL}/${id}`, venta);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

