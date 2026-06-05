import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { GsapAnimationService } from './services/gsap-animation.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="app-container" [class.papus-admin-shell]="showSidebar()">
      <app-navbar *ngIf="showNavbar()"></app-navbar>
      <div class="main-wrapper" [class.with-sidebar]="showSidebar()">
        <app-sidebar *ngIf="showSidebar()"></app-sidebar>
        <div class="content-area" [class.with-sidebar]="showSidebar()">
          <div #routeHost class="route-enter">
            <router-outlet (activate)="onRouteActivate()" />
          </div>
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
      margin-top: var(--navbar-height, 64px);
      position: relative;
    }

    .content-area {
      flex: 1;
      min-height: calc(100vh - var(--navbar-height, 64px));
      transition: margin-left 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      width: 100%;
    }

    @media (max-width: 768px) {
      .content-area.with-sidebar {
        margin-left: 0 !important;
      }
    }
  `]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('routeHost') routeHost?: ElementRef<HTMLElement>;
  private navSub?: Subscription;

  constructor(
    private router: Router,
    private gsap: GsapAnimationService
  ) {}

  ngOnInit(): void {
    document.body.classList.add('papus-admin');
    this.gsap.initSmoothScroll();
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const host = this.routeHost?.nativeElement;
        if (host) {
          this.gsap.pageTransition(host, 'in');
        }
      });
  }

  ngAfterViewInit(): void {
    const host = this.routeHost?.nativeElement;
    if (host) {
      this.gsap.pageTransition(host, 'in');
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('papus-admin');
    this.navSub?.unsubscribe();
    this.gsap.killAllScrollTriggers();
  }

  onRouteActivate(): void {
    const host = this.routeHost?.nativeElement;
    if (host) {
      this.gsap.pageTransition(host, 'in');
    }
  }

  showNavbar(): boolean {
    const path = window.location.pathname;
    return path !== '/login' && path !== '/access-denied';
  }

  showSidebar(): boolean {
    const path = window.location.pathname;
    return path !== '/login' && path !== '/access-denied';
  }
}
