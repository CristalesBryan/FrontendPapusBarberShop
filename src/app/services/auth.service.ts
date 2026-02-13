import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  username: string;
  rol: string;
  success: boolean;
  message: string;
}

export interface User {
  id: number;
  username: string;
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeUser();
    // Escuchar cambios en sessionStorage desde otras pestañas (si se usa localStorage como respaldo)
    // Esto no es necesario con sessionStorage, pero lo dejamos por si acaso
    this.setupStorageListener();
  }

  private setupStorageListener(): void {
    // Escuchar cambios en el storage (útil si en el futuro se quiere sincronizar entre pestañas)
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' && event.newValue !== event.oldValue) {
        // Si el token cambió en otra pestaña, actualizar el usuario
        this.initializeUser();
      }
    });
  }

  private initializeUser(): void {
    const token = this.getToken();
    if (token) {
      try {
        // Verificar si el token es válido
        if (!this.isAuthenticated()) {
          console.warn('Token expirado, limpiando...');
          this.logout();
          return;
        }
        
        // Intentar recuperar el usuario del token
        const user = this.getUserFromToken(token);
        if (user && user.rol) {
          this.currentUserSubject.next(user);
          console.log('Usuario inicializado desde token:', user);
        } else {
          console.warn('No se pudo recuperar el usuario del token');
          // No hacer logout aquí, solo limpiar el usuario
          // El token podría ser válido pero el formato del payload podría ser diferente
          this.currentUserSubject.next(null);
        }
      } catch (error) {
        console.error('Error al inicializar usuario desde token:', error);
        // No hacer logout automáticamente, solo limpiar el usuario
        this.currentUserSubject.next(null);
      }
    } else {
      // Si no hay token, asegurarse de que el usuario sea null
      this.currentUserSubject.next(null);
    }
  }

  /**
   * Asegura que el usuario esté inicializado desde el token.
   * Útil para llamar antes de verificar roles en guards.
   * Retorna true si el usuario está disponible, false si no.
   */
  ensureUserInitialized(): boolean {
    const token = this.getToken();
    if (token && this.isAuthenticated()) {
      if (!this.currentUserSubject.value) {
        console.log('Inicializando usuario desde token...');
        this.initializeUser();
        // Esperar un momento para que la inicialización se complete
        // y luego verificar nuevamente
        const user = this.currentUserSubject.value;
        if (!user) {
          // Si aún no hay usuario, intentar recuperarlo directamente
          const userFromToken = this.getUserFromToken(token);
          if (userFromToken && userFromToken.rol) {
            this.currentUserSubject.next(userFromToken);
            console.log('Usuario inicializado directamente:', userFromToken);
            return true;
          }
          return false;
        }
        return true;
      } else {
        console.log('Usuario ya está inicializado:', this.currentUserSubject.value);
        return true;
      }
    } else {
      console.warn('No hay token válido para inicializar usuario');
      return false;
    }
  }

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, loginRequest)
      .pipe(
        tap({
          next: (response) => {
            if (response.success && response.token) {
              this.setToken(response.token);
              const user: User = {
                id: response.userId,
                username: response.username,
                rol: response.rol
              };
              this.currentUserSubject.next(user);
              console.log('Usuario autenticado:', user);
            }
          },
          error: (error) => {
            console.error('Error en login:', error);
          }
        })
      );
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = this.decodeToken(token);
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    // Usar sessionStorage en lugar de localStorage para que cada pestaña tenga su propio token
    return sessionStorage.getItem('token');
  }

  private setToken(token: string): void {
    // Usar sessionStorage en lugar de localStorage para que cada pestaña tenga su propio token
    sessionStorage.setItem('token', token);
  }

  getCurrentUser(): User | null {
    let user = this.currentUserSubject.value;
    // Si no hay usuario en el contexto pero hay token, intentar recuperarlo
    if (!user) {
      const token = this.getToken();
      if (token && this.isAuthenticated()) {
        try {
          user = this.getUserFromToken(token);
          if (user && user.rol) {
            this.currentUserSubject.next(user);
            console.log('Usuario recuperado del token:', user);
          } else {
            console.warn('Usuario del token no tiene rol válido');
          }
        } catch (error) {
          console.error('Error al recuperar usuario del token:', error);
        }
      }
    }
    return user;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.rol === role : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.rol) {
      // Si no hay usuario en el contexto, intentar recuperarlo del token
      const token = this.getToken();
      if (token && this.isAuthenticated()) {
        const userFromToken = this.getUserFromToken(token);
        if (userFromToken && userFromToken.rol) {
          this.currentUserSubject.next(userFromToken);
          return roles.includes(userFromToken.rol);
        }
      }
      return false;
    }
    return roles.includes(user.rol);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isBarbero(): boolean {
    return this.hasRole('BARBERO');
  }

  private decodeToken(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  private getUserFromToken(token: string): User | null {
    try {
      const payload = this.decodeToken(token);
      console.log('Payload del token decodificado:', payload);
      
      const user: User = {
        id: payload.userId || payload.id,
        username: payload.sub || payload.username,
        rol: payload.rol
      };
      
      if (!user.rol) {
        console.error('El token no contiene el campo "rol"');
        return null;
      }
      
      console.log('Usuario extraído del token:', user);
      return user;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

