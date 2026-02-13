import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="app-container">
      <app-navbar *ngIf="showNavbar()"></app-navbar>
      <div class="main-wrapper" [class.with-sidebar]="showSidebar()">
        <app-sidebar *ngIf="showSidebar()"></app-sidebar>
        <div class="content-area" [class.with-sidebar]="showSidebar()">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .main-wrapper {
      display: flex;
      flex: 1;
      margin-top: 56px;
      position: relative;
    }
    
    .content-area {
      flex: 1;
      padding: 20px;
      background-color: #f5f5f5;
      min-height: calc(100vh - 56px);
      transition: margin-left 0.3s ease;
      width: 100%;
    }
    
    /* Cuando hay sidebar visible - ancho normal (250px) */
    .content-area.with-sidebar {
      margin-left: 250px;
    }
    
    /* Nota: El ajuste cuando el sidebar está colapsado se maneja en styles.css global */
    
    /* Responsive: en pantallas pequeñas, el sidebar se oculta */
    @media (max-width: 768px) {
      .content-area.with-sidebar {
        margin-left: 0 !important;
      }
      
      .sidebar {
        transform: translateX(-100%);
      }
      
      .sidebar.show {
        transform: translateX(0);
        z-index: 1050;
      }
    }
  `]
})
export class AppComponent {
  showNavbar(): boolean {
    const path = window.location.pathname;
    return path !== '/login' && path !== '/access-denied';
  }

  showSidebar(): boolean {
    const path = window.location.pathname;
    return path !== '/login' && path !== '/access-denied';
  }
}

