import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductoMerch, ProductoMerchCreate } from '../models/merchandising.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MerchandisingService {
  private readonly API_URL = `${environment.apiUrl}/admin/merchandising/productos`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ProductoMerch[]> {
    return this.http.get<ProductoMerch[]>(this.API_URL);
  }

  getById(id: number): Observable<ProductoMerch> {
    return this.http.get<ProductoMerch>(`${this.API_URL}/${id}`);
  }

  create(producto: ProductoMerchCreate): Observable<ProductoMerch> {
    return this.http.post<ProductoMerch>(this.API_URL, producto);
  }

  update(id: number, producto: ProductoMerchCreate): Observable<ProductoMerch> {
    return this.http.put<ProductoMerch>(`${this.API_URL}/${id}`, producto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  addImagen(productoId: number, payload: { s3Key: string; url: string; orden?: number }): Observable<ProductoMerch> {
    return this.http.post<ProductoMerch>(`${this.API_URL}/${productoId}/imagenes`, payload);
  }

  deleteImagen(productoId: number, imagenId: number): Observable<ProductoMerch> {
    return this.http.delete<ProductoMerch>(`${this.API_URL}/${productoId}/imagenes/${imagenId}`);
  }

  reorderImagenes(productoId: number, imagenIds: number[]): Observable<ProductoMerch> {
    return this.http.put<ProductoMerch>(`${this.API_URL}/${productoId}/imagenes/orden`, imagenIds);
  }
}
