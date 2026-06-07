import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { gsap } from 'gsap';
import { ReporteService, REPORTES_ACTUALIZADOS_EVENT } from '../../services/reporte.service';
import { AuthService } from '../../services/auth.service';
import { GsapAnimationService } from '../../services/gsap-animation.service';
import {
  ResumenDiario,
  ResumenMensual,
  ResumenPorMetodoPago,
  DetalleReporteItem,
  ResumenBarberoPago
} from '../../models/reporte.model';

Chart.register(...registerables);

type VistaReporte = 'diario' | 'mensual' | 'metodoPago';
type FiltroMetodoPago = 'Todos' | 'Efectivo' | 'Tarjeta';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('metodoPagoSection') metodoPagoSection?: ElementRef<HTMLElement>;
  @ViewChild('chartMetodoPago') chartCanvas?: ElementRef<HTMLCanvasElement>;

  resumenDiario: ResumenDiario | null = null;
  resumenMensual: ResumenMensual | null = null;
  resumenMetodoPago: ResumenPorMetodoPago | null = null;
  detalleReporte: DetalleReporteItem[] = [];
  resumenBarberosPago: ResumenBarberoPago[] = [];

  fechaConsulta: string = this.obtenerFechaLocal();
  mesConsulta: string = this.obtenerMesLocal();
  fechaInicioPago: string = this.obtenerPrimerDiaMesLocal();
  fechaFinPago: string = this.obtenerFechaLocal();

  cargando = true;
  cargandoMetodoPago = false;
  vista: VistaReporte = 'diario';
  filtroMetodo: FiltroMetodoPago = 'Todos';
  busquedaDetalle = '';

  private barberosExpandidosDiario = new Set<number>();
  private barberosExpandidosMensual = new Set<number>();
  private readonly onReportesDatosExternos = () => this.refrescar();
  private chartMetodoPago?: Chart;
  private gsapCtx?: gsap.Context;

  constructor(
    private reporteService: ReporteService,
    private authService: AuthService,
    private gsap: GsapAnimationService
  ) {}

  ngOnInit(): void {
    this.authService.ensureUserInitialized();
    setTimeout(() => this.cargarTodosLosReportes(), 100);
    window.addEventListener(REPORTES_ACTUALIZADOS_EVENT, this.onReportesDatosExternos);
  }

  ngAfterViewInit(): void {
    this.inicializarAnimacionesMetodoPago();
  }

  ngOnDestroy(): void {
    window.removeEventListener(REPORTES_ACTUALIZADOS_EVENT, this.onReportesDatosExternos);
    this.destruirChart();
    this.gsap.revert(this.gsapCtx);
  }

  cargarTodosLosReportes(): void {
    this.cargarResumenDiario();
    this.cargarResumenMensual();
    if (this.vista === 'metodoPago') {
      this.cargarReporteMetodoPago();
    }
  }

  cargarResumenDiario(): void {
    this.cargando = true;
    this.reporteService.getResumenPorFecha(this.fechaConsulta).subscribe({
      next: (data) => {
        this.resumenDiario = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar resumen diario:', error);
        this.cargando = false;
      }
    });
  }

  cargarResumenMensual(): void {
    this.reporteService.getResumenMensual(this.mesConsulta).subscribe({
      next: (data) => {
        this.resumenMensual = data;
      },
      error: (error) => {
        console.error('Error al cargar resumen mensual:', error);
      }
    });
  }

  cargarReporteMetodoPago(): void {
    if (!this.fechaInicioPago || !this.fechaFinPago) {
      return;
    }
    if (this.fechaFinPago < this.fechaInicioPago) {
      return;
    }

    this.cargandoMetodoPago = true;
    const metodo = this.filtroMetodo === 'Todos' ? undefined : this.filtroMetodo;

    this.reporteService.getResumenPorMetodoPago(this.fechaInicioPago, this.fechaFinPago).subscribe({
      next: (resumen) => {
        this.resumenMetodoPago = resumen;
        this.cargandoMetodoPago = false;
        setTimeout(() => this.actualizarGraficaMetodoPago(), 50);
        this.animarSeccionMetodoPago();
      },
      error: (error) => {
        console.error('Error al cargar resumen por método de pago:', error);
        this.cargandoMetodoPago = false;
      }
    });

    this.reporteService.getDetalleReporte(this.fechaInicioPago, this.fechaFinPago, metodo).subscribe({
      next: (detalle) => {
        this.detalleReporte = detalle;
      },
      error: (error) => {
        console.error('Error al cargar detalle:', error);
        this.detalleReporte = [];
      }
    });

    this.reporteService.getResumenPorBarberoPago(this.fechaInicioPago, this.fechaFinPago).subscribe({
      next: (barberos) => {
        this.resumenBarberosPago = barberos;
      },
      error: (error) => {
        console.error('Error al cargar resumen por barbero:', error);
        this.resumenBarberosPago = [];
      }
    });
  }

  consultarPorFecha(): void {
    this.cargarResumenDiario();
  }

  consultarPorMes(): void {
    this.cargando = true;
    this.reporteService.getResumenMensual(this.mesConsulta).subscribe({
      next: (data) => {
        this.resumenMensual = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al consultar por mes:', error);
        this.cargando = false;
      }
    });
  }

  consultarMetodoPago(): void {
    this.cargarReporteMetodoPago();
  }

  refrescar(): void {
    this.cargarTodosLosReportes();
  }

  cambiarVista(nuevaVista: VistaReporte): void {
    this.vista = nuevaVista;
    if (nuevaVista === 'metodoPago' && !this.resumenMetodoPago) {
      this.cargarReporteMetodoPago();
    }
    if (nuevaVista === 'metodoPago') {
      setTimeout(() => {
        this.inicializarAnimacionesMetodoPago();
        this.actualizarGraficaMetodoPago();
      }, 100);
    }
  }

  cambiarFiltroMetodo(filtro: FiltroMetodoPago): void {
    this.filtroMetodo = filtro;
    const metodo = filtro === 'Todos' ? undefined : filtro;
    this.reporteService.getDetalleReporte(this.fechaInicioPago, this.fechaFinPago, metodo).subscribe({
      next: (detalle) => {
        this.detalleReporte = detalle;
      },
      error: () => {
        this.detalleReporte = [];
      }
    });
  }

  get detalleFiltrado(): DetalleReporteItem[] {
    const termino = this.busquedaDetalle.trim().toLowerCase();
    if (!termino) {
      return this.detalleReporte;
    }
    return this.detalleReporte.filter(item =>
      item.barberoNombre?.toLowerCase().includes(termino) ||
      item.cliente?.toLowerCase().includes(termino) ||
      item.tipoCorte?.toLowerCase().includes(termino)
    );
  }

  get totalesDetalle(): { precioBase: number; total: number } {
    return this.detalleFiltrado.reduce(
      (acc, item) => ({
        precioBase: acc.precioBase + (item.precioOriginal ?? 0),
        total: acc.total + (item.total ?? 0)
      }),
      { precioBase: 0, total: 0 }
    );
  }

  get totalesBarberosPago(): { cortesEfectivo: number; cortesTarjeta: number; totalCortes: number; monto: number; comision: number } {
    return this.resumenBarberosPago.reduce(
      (acc, b) => ({
        cortesEfectivo: acc.cortesEfectivo + b.cortesEfectivo,
        cortesTarjeta: acc.cortesTarjeta + b.cortesTarjeta,
        totalCortes: acc.totalCortes + b.totalCortes,
        monto: acc.monto + b.montoTotal,
        comision: acc.comision + b.comisionCalculada
      }),
      { cortesEfectivo: 0, cortesTarjeta: 0, totalCortes: 0, monto: 0, comision: 0 }
    );
  }

  exportarCsv(): void {
    const filas = this.detalleFiltrado;
    if (!filas.length) {
      return;
    }

    const encabezados = [
      'Fecha', 'Hora', 'Barbero', 'Cliente', 'Tipo de corte',
      'Precio base', 'Descuento %', 'Total', 'Método de pago'
    ];

    const lineas = filas.map(item => [
      item.fecha,
      item.hora,
      item.barberoNombre,
      item.cliente,
      item.tipoCorte,
      item.precioOriginal?.toFixed(2) ?? '0.00',
      item.descuentoPorcentaje?.toString() ?? '0',
      item.total?.toFixed(2) ?? '0.00',
      item.metodoPago
    ].map(campo => `"${String(campo ?? '').replace(/"/g, '""')}"`).join(','));

    const csv = [encabezados.join(','), ...lineas].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-metodo-pago_${this.fechaInicioPago}_${this.fechaFinPago}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  claseBadgeMetodoPago(metodo: string): string {
    const normalizado = (metodo ?? '').toLowerCase();
    if (normalizado.includes('efectivo')) {
      return 'papus-badge-efectivo';
    }
    if (normalizado.includes('tarjeta')) {
      return 'papus-badge-tarjeta';
    }
    return 'papus-badge-muted';
  }

  alternarDetalleBarbero(barberoId: number, vista: 'diario' | 'mensual'): void {
    const setObjetivo = vista === 'diario' ? this.barberosExpandidosDiario : this.barberosExpandidosMensual;
    if (setObjetivo.has(barberoId)) {
      setObjetivo.delete(barberoId);
      return;
    }
    setObjetivo.add(barberoId);
  }

  detalleVisible(barberoId: number, vista: 'diario' | 'mensual'): boolean {
    const setObjetivo = vista === 'diario' ? this.barberosExpandidosDiario : this.barberosExpandidosMensual;
    return setObjetivo.has(barberoId);
  }

  private actualizarGraficaMetodoPago(): void {
    if (this.vista !== 'metodoPago' || !this.resumenMetodoPago) {
      return;
    }

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    this.destruirChart();

    const efectivo = this.resumenMetodoPago.efectivo?.total ?? 0;
    const tarjeta = this.resumenMetodoPago.tarjeta?.total ?? 0;

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Efectivo', 'Tarjeta'],
        datasets: [{
          data: [efectivo, tarjeta],
          backgroundColor: ['#C9A84C', '#6B6B6B'],
          borderColor: ['#E2C878', '#8A8A8A'],
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#E5E5E5', padding: 16, font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const valor = ctx.parsed ?? 0;
                const total = efectivo + tarjeta;
                const pct = total > 0 ? ((valor / total) * 100).toFixed(1) : '0';
                return ` Q${valor.toFixed(2)} (${pct}%)`;
              }
            }
          }
        }
      }
    };

    this.chartMetodoPago = new Chart(canvas, config);
  }

  private destruirChart(): void {
    this.chartMetodoPago?.destroy();
    this.chartMetodoPago = undefined;
  }

  private inicializarAnimacionesMetodoPago(): void {
    const section = this.metodoPagoSection?.nativeElement;
    if (!section || this.gsapCtx) {
      return;
    }
    this.gsapCtx = this.gsap.context(section, () => {
      this.gsap.scrollReveal(section, '.papus-pago-card');
      this.gsap.scrollReveal(section, '.papus-report-block');
    });
  }

  private animarSeccionMetodoPago(): void {
    if (this.gsap.prefersReducedMotion) {
      return;
    }
    const section = this.metodoPagoSection?.nativeElement;
    if (!section) {
      return;
    }
    gsap.from(section.querySelectorAll('.papus-pago-card'), {
      autoAlpha: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out'
    });
    gsap.from(section.querySelectorAll('.papus-report-block'), {
      autoAlpha: 0,
      y: 32,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out',
      delay: 0.15
    });
  }

  private obtenerFechaLocal(): string {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private obtenerMesLocal(): string {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    return `${anio}-${mes}`;
  }

  private obtenerPrimerDiaMesLocal(): string {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    return `${anio}-${mes}-01`;
  }
}
