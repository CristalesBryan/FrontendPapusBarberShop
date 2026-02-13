import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="access-denied-container">
      <div class="text-center">
        <i class="fas fa-ban fa-5x text-danger mb-4"></i>
        <h1 class="display-4">Acceso Denegado</h1>
        <p class="lead">No tiene permisos para acceder a esta página.</p>
        <button (click)="volver()" class="btn btn-primary mt-3">
          <i class="fas fa-home"></i> {{ botonTexto }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .access-denied-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
    }
  `]
})
export class AccessDeniedComponent implements OnInit {
  botonTexto = 'Volver al Dashboard';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Cambiar el texto del botón según el rol
    if (this.authService.isBarbero()) {
      this.botonTexto = 'Volver a Servicios';
    } else {
      this.botonTexto = 'Volver al Dashboard';
    }
  }

  volver(): void {
    // Redirigir según el rol del usuario
    if (this.authService.isBarbero()) {
      this.router.navigate(['/servicios']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}

