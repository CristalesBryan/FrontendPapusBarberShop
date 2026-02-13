import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { AuthService } from '../../services/auth.service';
import { ResumenDiario, ResumenMensual, ResumenBarbero } from '../../models/reporte.model';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit, OnDestroy {
  resumenDiario: ResumenDiario | null = null;
  resumenMensual: ResumenMensual | null = null;
  fechaConsulta: string = this.obtenerFechaLocal();
  mesConsulta: string = this.obtenerMesLocal();
  cargando = true;
  vista: 'diario' | 'mensual' = 'diario';
  private autoRefreshInterval?: any;

  constructor(
    private reporteService: ReporteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Asegurar que el usuario esté inicializado antes de cargar los reportes
    this.authService.ensureUserInitialized();
    
    // Esperar un momento para asegurar que el token esté disponible
    setTimeout(() => {
      this.cargarTodosLosReportes();
      
      // Auto-refrescar cada 30 segundos para mantener los datos actualizados
      this.autoRefreshInterval = setInterval(() => {
        this.cargarTodosLosReportes();
      }, 30000);
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  cargarTodosLosReportes(): void {
    this.cargarResumenDiario();
    this.cargarResumenMensual();
  }

  cargarResumenDiario(): void {
    this.cargando = true;
    this.reporteService.getResumenDiario().subscribe({
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

  consultarPorFecha(): void {
    this.cargando = true;
    this.reporteService.getResumenPorFecha(this.fechaConsulta).subscribe({
      next: (data) => {
        this.resumenDiario = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al consultar por fecha:', error);
        this.cargando = false;
      }
    });
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

  refrescar(): void {
    this.cargarTodosLosReportes();
  }

  cambiarVista(nuevaVista: 'diario' | 'mensual'): void {
    this.vista = nuevaVista;
    // Recargar los datos cuando se cambia de vista
    if (nuevaVista === 'diario') {
      this.cargarResumenDiario();
    } else {
      this.cargarResumenMensual();
    }
  }

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD usando la zona horaria local.
   * Esto evita problemas con toISOString() que devuelve la fecha en UTC.
   */
  private obtenerFechaLocal(): string {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  /**
   * Obtiene el mes actual en formato YYYY-MM usando la zona horaria local.
   */
  private obtenerMesLocal(): string {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    return `${año}-${mes}`;
  }
}

