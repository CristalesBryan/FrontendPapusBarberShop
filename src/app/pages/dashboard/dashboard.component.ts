import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ServicioService } from '../../services/servicio.service';
import { VentaProductoService } from '../../services/venta-producto.service';
import { BarberoService } from '../../services/barbero.service';
import { ProductoService } from '../../services/producto.service';
import { ReporteService } from '../../services/reporte.service';
import { GsapAnimationService } from '../../services/gsap-animation.service';
import { gsap } from 'gsap';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statsRow') statsRow?: ElementRef<HTMLElement>;
  private gsapCtx?: gsap.Context;

  estadisticas = {
    totalBarberos: 0,
    totalServicios: 0,
    totalVentas: 0,
    totalProductos: 0,
    totalHoy: 0
  };

  resumenDiario: any = null;
  cargando = true;

  constructor(
    private servicioService: ServicioService,
    private ventaService: VentaProductoService,
    private barberoService: BarberoService,
    private productoService: ProductoService,
    private reporteService: ReporteService,
    private gsap: GsapAnimationService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    // Cargar resumen diario
    this.reporteService.getResumenDiario().subscribe({
      next: (resumen) => {
        this.resumenDiario = resumen;
        this.estadisticas.totalHoy = resumen.totalGeneral || 0;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar resumen:', error);
        this.cargando = false;
      }
    });

    // Cargar estadísticas generales
    this.barberoService.getAll().subscribe({
      next: (barberos) => {
        this.estadisticas.totalBarberos = barberos.length;
      }
    });

    this.servicioService.getAll().subscribe({
      next: (servicios) => {
        this.estadisticas.totalServicios = servicios.length;
      }
    });

    this.ventaService.getAll().subscribe({
      next: (ventas) => {
        this.estadisticas.totalVentas = ventas.length;
      }
    });

    this.productoService.getAll().subscribe({
      next: (productos) => {
        this.estadisticas.totalProductos = productos.length;
        setTimeout(() => this.runCounterAnimations(), 100);
      }
    });
  }

  ngAfterViewInit(): void {
    const row = this.statsRow?.nativeElement;
    if (!row) return;
    this.gsapCtx = this.gsap.context(row, () => {
      this.gsap.scrollReveal(row, '.papus-stat-card');
    });
  }

  ngOnDestroy(): void {
    this.gsap.revert(this.gsapCtx);
  }

  private runCounterAnimations(): void {
    const row = this.statsRow?.nativeElement;
    if (row) {
      this.gsap.animateCounters(row);
    }
  }
}

