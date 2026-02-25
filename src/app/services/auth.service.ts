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

  /**
   * Inicializa el usuario desde el token almacenado.
   * Busca el token en sessionStorage primero, luego en localStorage como fallback.
   * Valida el token y extrae la información del usuario.
   */
  private initializeUser(): void {
    const token = this.getToken();
    if (token) {
      try {
        // Verificar si el token es válido (no expirado)
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
   * Busca el token en sessionStorage primero, luego en localStorage como fallback.
   * Útil para llamar antes de verificar roles en guards.
   * 
   * @returns true si el usuario está disponible y autenticado, false si no
   */
  ensureUserInitialized(): boolean {
    const token = this.getToken();
    if (token && this.isAuthenticated()) {
      if (!this.currentUserSubject.value) {
        console.log('Inicializando usuario desde token...');
        this.initializeUser();
        // Verificar nuevamente después de la inicialización
        const user = this.currentUserSubject.value;
        if (!user) {
          // Si aún no hay usuario, intentar recuperarlo directamente del token
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

  /**
   * Cierra la sesión del usuario eliminando el token de ambos almacenamientos.
   * Limpia tanto sessionStorage como localStorage para asegurar un logout completo.
   */
  logout(): void {
    // Limpiar token de sessionStorage
    sessionStorage.removeItem('token');
    // Limpiar token de localStorage para asegurar logout completo
    localStorage.removeItem('token');
    // Limpiar el usuario del contexto
    this.currentUserSubject.next(null);
  }

  /**
   * Verifica si el usuario está autenticado.
   * Busca el token en sessionStorage primero, luego en localStorage como fallback.
   * Valida que el token exista y no esté expirado.
   * 
   * @returns true si el usuario está autenticado, false si no
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = this.decodeToken(token);
      const currentTime = Date.now() / 1000;
      // Verificar que el token no haya expirado
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el token de autenticación.
   * Busca primero en sessionStorage (preferido) y luego en localStorage (fallback para compatibilidad).
   * Si encuentra el token en localStorage pero no en sessionStorage, lo migra a sessionStorage.
   * 
   * @returns El token JWT o null si no existe
   */
  getToken(): string | null {
    // Prioridad 1: Buscar en sessionStorage (almacenamiento preferido)
    let token = sessionStorage.getItem('token');
    
    if (token) {
      return token;
    }
    
    // Prioridad 2: Buscar en localStorage como fallback (compatibilidad con usuarios existentes)
    token = localStorage.getItem('token');
    
    if (token) {
      // Migrar el token de localStorage a sessionStorage para futuras consultas
      sessionStorage.setItem('token', token);
      // Opcional: mantener también en localStorage para compatibilidad durante la transición
      // O eliminar de localStorage si se prefiere solo sessionStorage
      console.log('Token migrado de localStorage a sessionStorage');
      return token;
    }
    
    return null;
  }

  /**
   * Guarda el token de autenticación en sessionStorage.
   * También mantiene una copia en localStorage para compatibilidad con usuarios existentes.
   * 
   * @param token El token JWT a guardar
   */
  private setToken(token: string): void {
    // Guardar en sessionStorage (almacenamiento principal)
    sessionStorage.setItem('token', token);
    
    // También guardar en localStorage para compatibilidad con usuarios que ya tienen sesión
    // Esto permite que usuarios existentes sigan funcionando durante la transición
    localStorage.setItem('token', token);
  }

  /**
   * Obtiene el usuario actual autenticado.
   * Busca primero en el contexto, y si no existe, intenta recuperarlo del token.
   * El token se busca en sessionStorage primero, luego en localStorage como fallback.
   * 
   * @returns El usuario actual o null si no está autenticado
   */
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

  isCesia(): boolean {
    return this.hasRole('CESIA');
  }

  /**
   * Acceso a vistas de barbero o Cesia (Servicios, Ventas).
   */
  isBarberoOrCesia(): boolean {
    return this.hasAnyRole(['BARBERO', 'CESIA']);
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

  /**
   * Cambiar la contraseña del usuario actual (solo ADMIN).
   * Requiere contraseña actual y nueva.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<string> {
    return this.http.post(`${this.API_URL}/admin/change-password`, {
      currentPassword,
      newPassword
    }, { responseType: 'text' });
  }

  /**
   * Restablece la contraseña del usuario admin a "admin123".
   * Útil cuando el admin no puede acceder (ej. olvidó la contraseña o un cambio no se guardó).
   * No requiere autenticación.
   */
  resetAdminPassword(): Observable<string> {
    return this.http.post(`${this.API_URL}/admin/reset-admin-password`, null, { responseType: 'text' });
  }
}

