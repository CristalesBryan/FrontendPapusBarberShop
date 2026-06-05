import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="access-denied-container papus-admin-page">
      <div class="access-denied-card text-center">
        <i class="fas fa-ban fa-4x mb-4 access-icon"></i>
        <h1>Acceso denegado</h1>
        <p class="lead">No tiene permisos para acceder a esta pagina.</p>
        <button type="button" (click)="volver()" class="btn btn-papus-primary mt-3">
          <i class="fas fa-home me-2"></i>{{ botonTexto }}
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
      background: var(--ink-deep);
      padding: 2rem;
    }
    .access-denied-card {
      padding: 3rem 2.5rem;
      background: var(--ink-surface);
      border: 1px solid var(--border-gold);
      border-radius: var(--radius-lg);
      max-width: 440px;
    }
    .access-icon {
      color: var(--gold);
    }
    .access-denied-card h1 {
      font-family: var(--font-display);
      color: var(--gold);
      font-size: 1.75rem;
    }
    .access-denied-card .lead {
      color: var(--cream-muted);
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
    if (this.authService.isBarbero() || this.authService.isCesia()) {
      this.botonTexto = 'Volver a Servicios';
    } else {
      this.botonTexto = 'Volver al Dashboard';
    }
  }

  volver(): void {
    if (this.authService.isBarbero() || this.authService.isCesia()) {
      this.router.navigate(['/servicios']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}

