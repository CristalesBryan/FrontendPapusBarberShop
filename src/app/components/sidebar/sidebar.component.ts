import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = true; // Iniciar colapsado por defecto
  private routerSubscription?: Subscription;

  menuItems = [
    { path: '/dashboard', icon: 'fas fa-home', label: 'Dashboard' },
    { path: '/barberos', icon: 'fas fa-user-tie', label: 'Barberos' },
    { path: '/horarios', icon: 'fas fa-clock', label: 'Horarios' },
    { path: '/citas', icon: 'fas fa-calendar-check', label: 'Citas' },
    { path: '/servicios', icon: 'fas fa-scissors', label: 'Servicios', adminAndBarbero: true },
    { path: '/ventas', icon: 'fas fa-shopping-cart', label: 'Ventas', adminAndBarbero: true },
    { path: '/compra-aqui', icon: 'fas fa-shopping-bag', label: 'Compra Aquí' },
    { path: '/productos', icon: 'fas fa-box', label: 'Productos', adminOnly: true },
    { path: '/gestion-catalogo', icon: 'fas fa-images', label: 'Gestión de Catálogo', adminOnly: true },
    { path: '/mobiliario-equipo', icon: 'fas fa-couch', label: 'Mobiliario y Equipo', adminOnly: true },
    { path: '/tipos-corte', icon: 'fas fa-cut', label: 'Gestión de Tipos de Corte', adminOnly: true },
    { path: '/reportes', icon: 'fas fa-chart-bar', label: 'Reportes' },
    { path: '/acerca-de-nosotros', icon: 'fas fa-info-circle', label: 'Acerca de Nosotros' },
    { path: '/academia', icon: 'fas fa-graduation-cap', label: 'Academia' },
    { path: 'https://www.facebook.com/share/1XmXmG651q/?mibextid=wwXIfr', icon: 'fab fa-facebook', label: 'Facebook', external: true },
    { path: 'https://www.tiktok.com/@papusbarbershopgt?is_from_webapp=1&sender_device=pc', icon: 'fab fa-tiktok', label: 'TikTok', external: true }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Aplicar el estado inicial (colapsado)
    this.updateBodyClass();
    
    // Escuchar eventos de navegación para colapsar el sidebar automáticamente
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // No colapsar automáticamente en navegación, solo en hover
      });
  }

  onMouseEnter(): void {
    // Expandir cuando el mouse entra
    if (this.isCollapsed) {
      this.isCollapsed = false;
      this.updateBodyClass();
    }
  }

  onMouseLeave(): void {
    // Colapsar cuando el mouse sale
    if (!this.isCollapsed) {
      this.isCollapsed = true;
      this.updateBodyClass();
    }
  }

  ngOnDestroy(): void {
    // Limpiar la clase al destruir el componente
    document.body.classList.remove('sidebar-collapsed');
    // Cancelar la suscripción
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
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

  canShowItem(item: any): boolean {
    // Si es barbero, solo mostrar Servicios y Ventas
    if (this.authService.isBarbero()) {
      return item.adminAndBarbero === true;
    }
    
    // Si es admin, mostrar todo incluyendo Servicios y Ventas
    if (this.authService.isAdmin()) {
      if (item.adminOnly || item.adminAndBarbero) {
        return true;
      }
      return true;
    }
    
    // Para otros casos (no debería llegar aquí)
    return true;
  }
}

