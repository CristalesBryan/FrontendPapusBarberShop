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
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.loginRequest.username) {
      this.errorMessage = 'Por favor, ingrese su usuario';
      return;
    }
    
    if (!this.loginRequest.password) {
      this.errorMessage = 'Por favor, ingrese su contraseña';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginRequest).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          // Redirigir según el rol del usuario
          if (response.rol === 'BARBERO') {
            this.router.navigate(['/servicios']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.errorMessage = response.message || 'Error al iniciar sesión';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error de login completo:', error);
        console.error('Error status:', error.status);
        console.error('Error error:', error.error);
        
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
}

