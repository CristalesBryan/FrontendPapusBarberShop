import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
    menuOpen = false;
    currentUser: User | null = null;

    mostrarModalPassword = false;
    passwordActual = '';
    passwordNueva = '';
    passwordRepetir = '';
    mensajeErrorPassword = '';
    mensajeOkPassword = '';
    enviandoPassword = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
        });
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    abrirModalCambiarPassword(): void {
        this.mostrarModalPassword = true;
        this.passwordActual = '';
        this.passwordNueva = '';
        this.passwordRepetir = '';
        this.mensajeErrorPassword = '';
        this.mensajeOkPassword = '';
    }

    cerrarModalPassword(event?: Event): void {
        if (event) event.preventDefault();
        this.mostrarModalPassword = false;
        this.mensajeErrorPassword = '';
        this.mensajeOkPassword = '';
    }

    enviarCambioPassword(): void {
        this.mensajeErrorPassword = '';
        this.mensajeOkPassword = '';
        if (!this.passwordActual?.trim()) {
            this.mensajeErrorPassword = 'Indica la contraseña actual.';
            return;
        }
        if (!this.passwordNueva?.trim()) {
            this.mensajeErrorPassword = 'Indica la nueva contraseña.';
            return;
        }
        if (this.passwordNueva.trim().length < 4) {
            this.mensajeErrorPassword = 'La nueva contraseña debe tener al menos 4 caracteres.';
            return;
        }
        if (this.passwordNueva !== this.passwordRepetir) {
            this.mensajeErrorPassword = 'La nueva contraseña y la repetición no coinciden.';
            return;
        }
        this.enviandoPassword = true;
        this.authService.changePassword(this.passwordActual.trim(), this.passwordNueva.trim()).subscribe({
            next: (msg) => {
                this.enviandoPassword = false;
                this.mensajeOkPassword = msg || 'Contraseña actualizada correctamente.';
                this.passwordActual = '';
                this.passwordNueva = '';
                this.passwordRepetir = '';
                setTimeout(() => this.cerrarModalPassword(), 2000);
            },
            error: (err) => {
                this.enviandoPassword = false;
                const msg = err?.error?.message ?? err?.error ?? err?.message ?? 'Error al cambiar la contraseña.';
                this.mensajeErrorPassword = typeof msg === 'string' ? msg : JSON.stringify(msg);
            }
        });
    }

    isAdmin(): boolean {
        return this.authService.isAdmin();
    }

    isBarbero(): boolean {
        return this.authService.isBarbero();
    }

    isCesia(): boolean {
        return this.authService.isCesia();
    }

    canAccessProductos(): boolean {
        return this.authService.hasRole('ADMIN');
    }

    canAccessGestionCatalogo(): boolean {
        return this.authService.hasAnyRole(['ADMIN', 'CESIA']);
    }

    canAccessCompraAqui(): boolean {
        return this.authService.hasAnyRole(['ADMIN', 'CESIA']);
    }

    canAccessServiciosOVentas(): boolean {
        return this.authService.hasAnyRole(['ADMIN', 'BARBERO', 'CESIA']);
    }
}

