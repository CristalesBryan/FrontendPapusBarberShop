import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PresignedUrlResponse {
  url: string;
  key: string;
}

export interface UploadResponse {
  key: string;
  url: string;
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class S3Service {
  private apiUrl = environment.apiUrl;
  private bucketName = environment.s3.bucketName;
  private region = environment.s3.region;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene una URL presignada para subir un archivo a S3
   * @param fileName Nombre del archivo
   * @param folder Carpeta donde se guardará (ej: 'productos', 'barberos', 'cortes')
   * @param contentType Tipo de contenido (ej: 'image/jpeg', 'image/png')
   * @returns Observable con la URL presignada y la key del objeto
   */
  getPresignedUploadUrl(fileName: string, folder: string = 'general', contentType: string = 'image/jpeg'): Observable<PresignedUrlResponse> {
    // Normalizar Content-Type antes de enviarlo al backend
    const normalizedContentType = contentType.toLowerCase().trim();
    
    const endpoint = `${this.apiUrl}/api/s3/presigned-url/upload`;
    const body = {
      fileName,
      folder,
      contentType: normalizedContentType
    };
    
    console.log(`[S3Service] Solicitando URL presignada con Content-Type: ${normalizedContentType}`);

    return this.http.post<PresignedUrlResponse>(endpoint, body);
  }

  /**
   * Obtiene una URL presignada para descargar/ver un archivo de S3
   * @param key Clave del objeto en S3
   * @param expirationTime Tiempo de expiración en segundos (por defecto 1 hora)
   * @returns Observable con la URL presignada
   */
  getPresignedDownloadUrl(key: string, expirationTime: number = 3600): Observable<string> {
    const endpoint = `${this.apiUrl}/api/s3/presigned-url/download`;
    const body = {
      key,
      expirationTime
    };

    return this.http.post<{ url: string }>(endpoint, body).pipe(
      map(response => response.url)
    );
  }

  /**
   * Sube un archivo a S3 usando una URL presignada
   * @param file Archivo a subir
   * @param folder Carpeta donde se guardará
   * @param customFileName Nombre personalizado del archivo (opcional)
   * @returns Observable con la información del archivo subido
   */
  uploadFile(file: File, folder: string = 'general', customFileName?: string): Observable<UploadResponse> {
    const fileName = customFileName || this.generateFileName(file.name);
    // Normalizar Content-Type: lowercase, sin espacios, con fallback
    let contentType = (file.type || 'application/octet-stream').toLowerCase().trim();
    
    // Si el tipo está vacío después de normalizar, usar el fallback
    if (!contentType || contentType === '') {
      contentType = 'application/octet-stream';
    }
    
    // Detectar tipo de imagen basado en extensión si file.type está vacío
    if (contentType === 'application/octet-stream') {
      const extension = file.name.toLowerCase().split('.').pop();
      const imageTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
      };
      if (extension && imageTypes[extension]) {
        contentType = imageTypes[extension];
      }
    }

    console.log(`[S3Service] Subiendo archivo: ${fileName}, Content-Type: ${contentType}`);

    return this.getPresignedUploadUrl(fileName, folder, contentType).pipe(
      switchMap((presignedData: PresignedUrlResponse) => {
        console.log(`[S3Service] URL presignada obtenida, subiendo con PUT sin headers extra`);
        return this.uploadToS3(file, presignedData.url).pipe(
          map(() => ({
            key: presignedData.key,
            url: this.getPublicUrl(presignedData.key),
            success: true,
            message: 'Archivo subido exitosamente'
          }))
        );
      })
    );
  }

  /**
   * Sube un archivo directamente a S3 usando la URL presignada.
   *
   * Usa fetch() en lugar de HttpClient para no enviar ningún header extra:
   * la URL presignada solo firma el header "host". Cualquier header adicional
   * (p. ej. Content-Type que Angular añade con File) provoca preflight CORS
   * o SignatureDoesNotMatch.
   *
   * - Método: PUT
   * - Body: contenido del archivo como ArrayBuffer (sin Content-Type)
   * - Headers: ninguno personalizado
   */
  private uploadToS3(file: File, presignedUrl: string): Observable<void> {
    return from(
      (async () => {
        const arrayBuffer = await file.arrayBuffer();
        const response = await fetch(presignedUrl, {
          method: 'PUT',
          body: arrayBuffer,
          mode: 'cors'
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`S3 upload failed: ${response.status} ${response.statusText}${text ? ' - ' + text : ''}`);
        }
      })()
    ).pipe(
      map(() => {
        console.log('[S3Service] Archivo subido exitosamente');
        return;
      }),
      catchError(error => {
        console.error('[S3Service] Error al subir archivo a S3:', error);
        return throwError(() => error instanceof Error ? error : new Error(String(error)));
      })
    );
  }

  /**
   * Elimina un archivo de S3
   * @param key Clave del objeto en S3
   * @returns Observable que se completa cuando la eliminación termina
   */
  deleteFile(key: string): Observable<void> {
    const endpoint = `${this.apiUrl}/api/s3/delete`;
    const body = { key };

    return this.http.delete<void>(`${endpoint}?key=${encodeURIComponent(key)}`);
  }

  /**
   * Obtiene la URL pública de un archivo en S3
   * @param key Clave del objeto en S3
   * @returns URL pública del archivo
   */
  getPublicUrl(key: string): string {
    // Si el bucket tiene acceso público, puedes usar esta URL
    // De lo contrario, usa getPresignedDownloadUrl
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Genera un nombre de archivo único basado en el nombre original
   * @param originalName Nombre original del archivo
   * @returns Nombre de archivo único con timestamp
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop() || 'jpg';
    const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
    const sanitizedName = nameWithoutExtension
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50);
    
    return `${sanitizedName}-${timestamp}-${randomString}.${extension}`;
  }

  /**
   * Valida si un archivo es una imagen válida
   * @param file Archivo a validar
   * @returns true si es una imagen válida
   */
  isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
  }

  /**
   * Valida el tamaño del archivo
   * @param file Archivo a validar
   * @param maxSizeMB Tamaño máximo en MB (por defecto 5MB)
   * @returns true si el tamaño es válido
   */
  isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Guarda la referencia de imagen S3 de un producto en el backend
   * @param productoId ID del producto
   * @param s3Key Clave S3 de la imagen
   * @returns Observable con la respuesta del backend
   */
  guardarReferenciaImagenBackend(productoId: number, s3Key: string): Observable<any> {
    const endpoint = `${this.apiUrl}/api/s3/producto-imagen`;
    const body = {
      productoId,
      s3Key
    };

    return this.http.post<any>(endpoint, body);
  }

  /**
   * Obtiene la referencia de imagen de un producto desde el backend
   * @param productoId ID del producto
   * @returns Observable con la referencia de imagen
   */
  obtenerReferenciaImagenBackend(productoId: number): Observable<any> {
    const endpoint = `${this.apiUrl}/api/s3/producto-imagen/${productoId}`;
    return this.http.get<any>(endpoint);
  }

  /**
   * Obtiene todas las referencias de imágenes desde el backend
   * @returns Observable con todas las referencias
   */
  obtenerTodasLasReferenciasBackend(): Observable<any> {
    const endpoint = `${this.apiUrl}/api/s3/producto-imagenes`;
    return this.http.get<any>(endpoint);
  }

  /**
   * Sincroniza múltiples referencias de imágenes al backend
   * @param referencias Mapa con las referencias a sincronizar (productoId -> {s3Key, timestamp})
   * @returns Observable con la respuesta del backend
   */
  sincronizarReferenciasBackend(referencias: any): Observable<any> {
    const endpoint = `${this.apiUrl}/api/s3/producto-imagenes/sincronizar`;
    return this.http.post<any>(endpoint, referencias);
  }
}

