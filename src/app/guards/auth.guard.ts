import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de autenticación que protege las rutas.
 * Verifica que el usuario esté autenticado antes de permitir el acceso.
 * 
 * El AuthService busca el token primero en sessionStorage y luego en localStorage
 * como fallback, por lo que este guard funciona con ambos almacenamientos.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Verifica si la ruta puede ser activada.
   * Comprueba la autenticación y la inicialización del usuario.
   * 
   * @param route La ruta que se intenta activar
   * @param state El estado del router
   * @returns true si la ruta puede ser activada, false si no
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Verificar autenticación primero
    // El AuthService buscará el token en sessionStorage primero, luego en localStorage
    if (!this.authService.isAuthenticated()) {
      console.warn('Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return false;
    }
    
    // Asegurar que el usuario esté inicializado antes de continuar
    // Esto garantiza que el usuario esté disponible para verificación de roles
    if (!this.authService.ensureUserInitialized()) {
      console.warn('No se pudo inicializar el usuario en AuthGuard');
      this.router.navigate(['/login']);
      return false;
    }
    
    return true;
  }
}

