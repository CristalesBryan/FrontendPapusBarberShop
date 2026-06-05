import { Injectable, NgZone } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Injectable({ providedIn: 'root' })
export class GsapAnimationService {
  private reducedMotion = false;

  constructor(private ngZone: NgZone) {
    if (typeof window !== 'undefined') {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  get prefersReducedMotion(): boolean {
    return this.reducedMotion;
  }

  context(scope: Element | string, fn: () => void): gsap.Context {
    return gsap.context(fn, scope);
  }

  revert(ctx?: gsap.Context): void {
    ctx?.revert();
  }

  splitTextChars(element: HTMLElement): HTMLElement[] {
    const text = element.textContent?.trim() ?? '';
    element.textContent = '';
    element.setAttribute('aria-label', text);
    const chars: HTMLElement[] = [];
    for (const char of text) {
      const span = document.createElement('span');
      span.className = 'char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = char === ' ' ? '\u00A0' : char;
      element.appendChild(span);
      chars.push(span);
    }
    return chars;
  }

  animateHeroTitle(element: HTMLElement, onComplete?: () => void): void {
    if (this.reducedMotion) {
      element.style.opacity = '1';
      onComplete?.();
      return;
    }
    const chars = this.splitTextChars(element);
    gsap.from(chars, {
      autoAlpha: 0,
      y: 40,
      rotateX: -90,
      stagger: 0.03,
      duration: 0.8,
      ease: 'power4.out',
      onComplete
    });
  }

  scrollReveal(
    scope: Element,
    selector: string,
    vars: gsap.TweenVars = {}
  ): void {
    if (this.reducedMotion) return;
    const targets = scope.querySelectorAll(selector);
    if (!targets.length) return;
    gsap.from(targets, {
      autoAlpha: 0,
      y: 48,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: targets[0],
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      ...vars
    });
  }

  animateCounters(
    scope: Element,
    selector = '[data-count]'
  ): void {
    const els = scope.querySelectorAll<HTMLElement>(selector);
    els.forEach(el => {
      const end = parseFloat(el.dataset['count'] ?? '0');
      const obj = { val: 0 };
      if (this.reducedMotion) {
        el.textContent = this.formatCount(end, el);
        return;
      }
      gsap.to(obj, {
        val: end,
        duration: 1.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true
        },
        onUpdate: () => {
          el.textContent = this.formatCount(obj.val, el);
        }
      });
    });
  }

  private formatCount(value: number, el: HTMLElement): string {
    const prefix = el.dataset['prefix'] ?? '';
    const suffix = el.dataset['suffix'] ?? '';
    const decimals = parseInt(el.dataset['decimals'] ?? '0', 10);
    const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
    return `${prefix}${formatted}${suffix}`;
  }

  cardHoverGSAP(cards: HTMLElement[]): () => void {
    if (this.reducedMotion) return () => {};
    const cleanups: (() => void)[] = [];
    cards.forEach(card => {
      const enter = () => {
        gsap.to(card, {
          y: -8,
          boxShadow: '0 16px 40px rgba(201, 168, 76, 0.2)',
          borderColor: 'rgba(201, 168, 76, 0.6)',
          duration: 0.4,
          ease: 'power2.out'
        });
      };
      const leave = () => {
        gsap.to(card, {
          y: 0,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          borderColor: 'rgba(201, 168, 76, 0.25)',
          duration: 0.4,
          ease: 'power2.out'
        });
      };
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
      cleanups.push(() => {
        card.removeEventListener('mouseenter', enter);
        card.removeEventListener('mouseleave', leave);
      });
    });
    return () => cleanups.forEach(fn => fn());
  }

  magneticButton(btn: HTMLElement): () => void {
    if (this.reducedMotion) return () => {};
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
    const move = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      xTo((e.clientX - cx) * 0.25);
      yTo((e.clientY - cy) * 0.25);
    };
    const reset = () => {
      xTo(0);
      yTo(0);
    };
    btn.addEventListener('mousemove', move);
    btn.addEventListener('mouseleave', reset);
    return () => {
      btn.removeEventListener('mousemove', move);
      btn.removeEventListener('mouseleave', reset);
    };
  }

  pageTransition(element: HTMLElement, direction: 'in' | 'out'): gsap.core.Tween {
    if (this.reducedMotion) {
      gsap.set(element, { autoAlpha: direction === 'in' ? 1 : 0 });
      return gsap.to(element, { duration: 0 });
    }
    if (direction === 'in') {
      return gsap.fromTo(
        element,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }
      );
    }
    return gsap.to(element, {
      autoAlpha: 0,
      y: -16,
      duration: 0.35,
      ease: 'power2.in'
    });
  }

  modalEnter(modal: HTMLElement): gsap.core.Tween {
    if (this.reducedMotion) {
      gsap.set(modal, { autoAlpha: 1, scale: 1 });
      return gsap.to(modal, { duration: 0 });
    }
    return gsap.fromTo(
      modal,
      { autoAlpha: 0, scale: 0.92 },
      { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power3.out' }
    );
  }

  parallaxHero(bg: HTMLElement, intensity = 80): ScrollTrigger | null {
    if (this.reducedMotion) return null;
    return ScrollTrigger.create({
      trigger: bg.parentElement,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: self => {
        gsap.set(bg, { y: self.progress * intensity });
      }
    });
  }

  initSmoothScroll(): void {
    if (this.reducedMotion || typeof document === 'undefined') return;
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  killAllScrollTriggers(): void {
    ScrollTrigger.getAll().forEach(st => st.kill());
  }
}
