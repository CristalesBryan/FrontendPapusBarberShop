import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { SidebarMobileService } from '../../services/sidebar-mobile.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

interface SidebarMenuItem {
  path: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
  adminAndBarbero?: boolean;
  adminAndCesia?: boolean;
  external?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = true;
  mobileOpen = false;
  currentUser: User | null = null;
  private routerSubscription?: Subscription;
  private userSub?: Subscription;
  private mobileSub?: Subscription;
  private escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.closeMobileMenu();
    }
  };

  menuItemsOperaciones: SidebarMenuItem[] = [
    { path: '/dashboard', icon: 'fas fa-home', label: 'Dashboard', adminOnly: true },
    { path: '/barberos', icon: 'fas fa-user-tie', label: 'Barberos', adminOnly: true },
    { path: '/horarios', icon: 'fas fa-clock', label: 'Horarios', adminOnly: true },
    { path: '/citas', icon: 'fas fa-calendar-check', label: 'Citas', adminOnly: true },
    { path: '/servicios', icon: 'fas fa-scissors', label: 'Servicios', adminAndBarbero: true },
    { path: '/ventas', icon: 'fas fa-shopping-cart', label: 'Ventas', adminAndBarbero: true },
    { path: '/compra-aqui', icon: 'fas fa-shopping-bag', label: 'Compra Aquí', adminAndCesia: true },
    { path: '/productos', icon: 'fas fa-box', label: 'Productos', adminOnly: true },
    { path: '/merchandising', icon: 'fas fa-tshirt', label: 'Merchandising', adminOnly: true },
    { path: '/gestion-catalogo', icon: 'fas fa-images', label: 'Gestión Catálogo', adminAndCesia: true },
    { path: '/mobiliario-equipo', icon: 'fas fa-couch', label: 'Mobiliario', adminOnly: true },
    { path: '/tipos-corte', icon: 'fas fa-cut', label: 'Tipos de Corte', adminOnly: true },
    { path: '/reportes', icon: 'fas fa-chart-bar', label: 'Reportes', adminOnly: true }
  ];

  menuItemsInfo: SidebarMenuItem[] = [
    { path: '/acerca-de-nosotros', icon: 'fas fa-info-circle', label: 'Acerca de Nosotros' },
    { path: '/academia', icon: 'fas fa-graduation-cap', label: 'Academia' },
    { path: 'https://www.facebook.com/share/1XmXmG651q/?mibextid=wwXIfr', icon: 'fab fa-facebook', label: 'Facebook', external: true },
    { path: 'https://www.tiktok.com/@papusbarbershopgt?is_from_webapp=1&sender_device=pc', icon: 'fab fa-tiktok', label: 'TikTok', external: true }
  ];

  get userInitials(): string {
    const name = this.currentUser?.username ?? '?';
    return name.slice(0, 2).toUpperCase();
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private sidebarMobile: SidebarMobileService
  ) { }

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
    });
    this.mobileSub = this.sidebarMobile.mobileOpen$.subscribe(open => {
      this.mobileOpen = open;
      if (open) {
        this.isCollapsed = false;
        document.addEventListener('keydown', this.escapeHandler);
      } else {
        document.removeEventListener('keydown', this.escapeHandler);
        if (!this.sidebarMobile.isMobile()) {
          this.isCollapsed = true;
        }
      }
      this.updateBodyClass();
    });
    this.updateBodyClass();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMobileMenu();
      });
  }

  onMouseEnter(): void {
    if (this.sidebarMobile.isMobile()) {
      return;
    }
    if (this.isCollapsed) {
      this.isCollapsed = false;
      this.updateBodyClass();
    }
  }

  onMouseLeave(): void {
    if (this.sidebarMobile.isMobile() || this.mobileOpen) {
      return;
    }
    if (!this.isCollapsed) {
      this.isCollapsed = true;
      this.updateBodyClass();
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('sidebar-collapsed');
    document.removeEventListener('keydown', this.escapeHandler);
    this.sidebarMobile.close();
    this.routerSubscription?.unsubscribe();
    this.userSub?.unsubscribe();
    this.mobileSub?.unsubscribe();
  }

  closeMobileMenu(): void {
    this.sidebarMobile.close();
  }

  onNavClick(): void {
    this.closeMobileMenu();
  }

  colapsarSidebar(): void {
    if (!this.isCollapsed) {
      this.isCollapsed = true;
      this.updateBodyClass();
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.updateBodyClass();
  }

  private updateBodyClass(): void {
    if (this.isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  canShowItem(item: SidebarMenuItem): boolean {
    // BARBERO: solo Servicios y Ventas (evaluar antes que ítems “sin bandera” como Acerca/Academia/redes)
    if (this.authService.isBarbero()) {
      return item.adminAndBarbero === true;
    }
    // CESIA: Servicios, Ventas, Compra Aquí y Gestión de Catálogo
    if (this.authService.isCesia()) {
      return item.adminAndBarbero === true || item.adminAndCesia === true;
    }
    // ADMIN: todo el menú
    if (this.authService.isAdmin()) {
      return true;
    }
    // Ítems sin restricción de rol (Acerca, Academia, redes): solo si no es CESIA (ya cubierto arriba)
    if (!item.adminOnly && !item.adminAndBarbero && !item.adminAndCesia) {
      return true;
    }
    return false;
  }
}

