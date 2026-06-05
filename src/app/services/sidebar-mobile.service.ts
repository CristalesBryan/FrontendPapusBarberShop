import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const MOBILE_QUERY = '(max-width: 768px)';

@Injectable({ providedIn: 'root' })
export class SidebarMobileService implements OnDestroy {
  private readonly openSubject = new BehaviorSubject(false);
  readonly mobileOpen$ = this.openSubject.asObservable();
  private readonly mq = typeof window !== 'undefined'
    ? window.matchMedia(MOBILE_QUERY)
    : null;
  private readonly onMqChange = () => {
    if (!this.isMobile()) {
      this.close();
    }
  };

  constructor() {
    this.mq?.addEventListener('change', this.onMqChange);
  }

  ngOnDestroy(): void {
    this.mq?.removeEventListener('change', this.onMqChange);
    this.setBodyScrollLocked(false);
  }

  get isOpen(): boolean {
    return this.openSubject.value;
  }

  isMobile(): boolean {
    return this.mq?.matches ?? false;
  }

  toggle(): void {
    if (!this.isMobile()) {
      return;
    }
    this.openSubject.next(!this.openSubject.value);
    this.syncBodyScroll();
  }

  open(): void {
    if (!this.isMobile()) {
      return;
    }
    this.openSubject.next(true);
    this.syncBodyScroll();
  }

  close(): void {
    if (!this.openSubject.value) {
      return;
    }
    this.openSubject.next(false);
    this.syncBodyScroll();
  }

  private syncBodyScroll(): void {
    this.setBodyScrollLocked(this.openSubject.value && this.isMobile());
  }

  private setBodyScrollLocked(locked: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.style.overflow = locked ? 'hidden' : '';
    document.body.classList.toggle('sidebar-mobile-open', locked);
  }
}
