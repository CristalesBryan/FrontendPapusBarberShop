import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Verificar autenticación primero
    if (!this.authService.isAuthenticated()) {
      console.warn('Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return false;
    }

    // Asegurar que el usuario esté inicializado antes de verificar
    if (!this.authService.ensureUserInitialized()) {
      console.warn('No se pudo inicializar el usuario, redirigiendo a login');
      this.router.navigate(['/login']);
      return false;
    }

    const allowedRoles = route.data['roles'] as string[];
    
    // Si no hay restricciones de rol, permitir acceso
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    // Obtener el usuario (intentará recuperarlo del token si no está en el contexto)
    const user = this.authService.getCurrentUser();
    if (!user || !user.rol) {
      console.warn('No se pudo obtener el rol del usuario, redirigiendo a login');
      console.warn('Token disponible:', !!this.authService.getToken());
      console.warn('Token válido:', this.authService.isAuthenticated());
      console.warn('Usuario actual:', user);
      
      // Último intento: recuperar directamente del token
      const token = this.authService.getToken();
      if (token) {
        try {
          // Decodificar el token manualmente para ver qué contiene
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(jsonPayload);
          console.warn('Payload del token:', payload);
        } catch (e) {
          console.error('Error al decodificar token:', e);
        }
      }
      
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar si el usuario tiene alguno de los roles permitidos
    if (this.authService.hasAnyRole(allowedRoles)) {
      console.log(`Acceso permitido para usuario ${user.username} con rol ${user.rol}`);
      return true;
    }

    console.warn(`Acceso denegado: Usuario ${user.username} con rol ${user.rol} no tiene acceso. Roles permitidos: ${allowedRoles.join(', ')}`);
    this.router.navigate(['/access-denied']);
    return false;
  }
}

