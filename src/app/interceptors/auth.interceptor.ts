import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // CRÍTICO: Ignorar peticiones a S3 (amazonaws.com)
  // S3 rechaza peticiones con headers Authorization externos que rompen la firma presignada
  if (req.url.includes('amazonaws.com')) {
    // Para peticiones a S3, no agregar ningún header adicional
    // Dejar que la petición pase sin modificación
    return next(req);
  }
  
  if (req.url.includes('/auth/login')) {
    const loginHeaders: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const loginRequest = req.clone({
      setHeaders: loginHeaders
    });
    
    return next(loginRequest);
  }
  
  const token = authService.getToken();
  
  let headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Interceptor: Token agregado a la petición', req.url);
  } else {
    console.warn('Interceptor: No hay token disponible para la petición', req.url);
  }
  
  const clonedRequest = req.clone({
    setHeaders: headers
  });
  
  return next(clonedRequest);
};

