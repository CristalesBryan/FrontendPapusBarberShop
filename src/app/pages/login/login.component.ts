import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginRequest: LoginRequest = {
    username: '',
    password: ''
  };
  
  loading = false;
  loadingResetPassword = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Maneja el envío del formulario de login.
   * Valida las credenciales, guarda el token en sessionStorage (y localStorage para compatibilidad),
   * y redirige al usuario según su rol.
   */
  onSubmit(): void {
    // Validar que se haya ingresado el usuario
    if (!this.loginRequest.username) {
      this.errorMessage = 'Por favor, ingrese su usuario';
      return;
    }
    
    // Validar que se haya ingresado la contraseña
    if (!this.loginRequest.password) {
      this.errorMessage = 'Por favor, ingrese su contraseña';
      return;
    }

    // Activar el spinner de carga
    this.loading = true;
    this.errorMessage = '';

    // Realizar la petición de login
    this.authService.login(this.loginRequest).subscribe({
      next: (response) => {
        // Desactivar el spinner de carga
        this.loading = false;
        
        // Verificar que el login fue exitoso
        if (response.success) {
          // El token ya fue guardado en sessionStorage y localStorage por el AuthService
          // Redirigir según el rol del usuario
          if (response.rol === 'BARBERO' || response.rol === 'CESIA') {
            this.router.navigate(['/servicios']).catch(err => {
              console.error('Error al redirigir a /servicios:', err);
            });
          } else {
            // Los administradores y otros roles van al dashboard
            this.router.navigate(['/dashboard']).catch(err => {
              console.error('Error al redirigir a /dashboard:', err);
            });
          }
        } else {
          // Mostrar mensaje de error si el login falló
          this.errorMessage = response.message || 'Error al iniciar sesión';
        }
      },
      error: (error) => {
        // Desactivar el spinner de carga en caso de error
        this.loading = false;
        console.error('Error de login completo:', error);
        console.error('Error status:', error.status);
        console.error('Error error:', error.error);
        
        // Manejar diferentes tipos de errores
        if (error.error) {
          if (error.error.message) {
            this.errorMessage = error.error.message;
          } else if (error.error.validationErrors) {
            const errors = error.error.validationErrors;
            this.errorMessage = 'Errores de validación: ' + JSON.stringify(errors);
          } else {
            this.errorMessage = JSON.stringify(error.error);
          }
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Error de conexión. Por favor, intente nuevamente.';
        }
      }
    });
  }

  /**
   * Restablece la contraseña del usuario admin a "admin123".
   * Útil cuando el admin no puede entrar porque cambió la contraseña y no se guardó o la olvidó.
   */
  restablecerPasswordAdmin(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.loadingResetPassword = true;
    this.authService.resetAdminPassword().subscribe({
      next: (msg) => {
        this.loadingResetPassword = false;
        this.successMessage = (msg && msg.trim()) ? msg : 'Contraseña de admin restablecida a "admin123". Inicia sesión y cámbiala desde el menú.';
      },
      error: (err) => {
        this.loadingResetPassword = false;
        const msg = err?.error ?? err?.message ?? 'Error al restablecer. Comprueba que el backend esté en marcha.';
        this.errorMessage = typeof msg === 'string' ? msg : JSON.stringify(msg);
      }
    });
  }
}

