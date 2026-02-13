import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
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
      this.router.navigate(['/login']);
      return false;
    }
    
    // Asegurar que el usuario esté inicializado antes de continuar
    if (!this.authService.ensureUserInitialized()) {
      console.warn('No se pudo inicializar el usuario en AuthGuard');
      this.router.navigate(['/login']);
      return false;
    }
    
    return true;
  }
}

