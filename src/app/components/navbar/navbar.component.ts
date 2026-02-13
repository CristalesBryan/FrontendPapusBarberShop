import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
    menuOpen = false;
    currentUser: User | null = null;

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

    isAdmin(): boolean {
        return this.authService.isAdmin();
    }

    isBarbero(): boolean {
        return this.authService.isBarbero();
    }

    canAccessProductos(): boolean {
        return this.authService.hasRole('ADMIN');
    }
}

