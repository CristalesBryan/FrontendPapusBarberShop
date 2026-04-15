import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioService } from '../../services/servicio.service';
import { BarberoService } from '../../services/barbero.service';
import { TipoCorteService } from '../../services/tipo-corte.service';
import { AuthService } from '../../services/auth.service';
import { Servicio, ServicioCreate } from '../../models/servicio.model';
import { Barbero } from '../../models/barbero.model';
import { TipoCorteAPI } from '../../models/tipo-corte-api.model';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.css']
})
export class ServiciosComponent implements OnInit, OnDestroy {
  servicios: Servicio[] = [];
  barberos: Barbero[] = [];
  tiposCorte: TipoCorteAPI[] = [];
  tipoCorteSeleccionado: TipoCorteAPI | null = null;
  nuevoServicio: ServicioCreate = {
    fecha: '',
    hora: '',
    barberoId: 0,
    tipoCorte: '',
    metodoPago: 'Efectivo',
    precio: 0,
    descuentoPorcentaje: 0
  };
  tipoCorteIdSeleccionado = 0;
  mostrarFormulario = false;
  editando = false;
  servicioEditando: Servicio | null = null;
  cargando = true;
  esBarbero = false;
  esCesia = false;

  mostrarModalNotificacion = false;
  mensajeNotificacion = '';
  tipoNotificacion: 'success' | 'error' | 'info' | 'warning' = 'info';
  mostrarModalConfirmacion = false;
  mensajeConfirmacion = '';
  accionConfirmacion: (() => void) | null = null;

  private barberosActualizadosListener = () => this.cargarBarberos();
  private tiposCorteActualizadosListener = () => this.cargarTiposCorte();

  constructor(
    private servicioService: ServicioService,
    private barberoService: BarberoService,
    private tipoCorteService: TipoCorteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.esBarbero = this.authService.isBarbero();
    this.esCesia = this.authService.isCesia();

    if (this.esBarbero || this.esCesia) {
      this.mostrarFormulario = true;
    }

    if (!this.esBarbero && !this.esCesia) {
      this.cargarServicios();
    }

    this.cargarBarberos();
    this.cargarTiposCorte();

    window.addEventListener('barberosActualizados', this.barberosActualizadosListener);
    window.addEventListener('tiposCorteActualizados', this.tiposCorteActualizadosListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('barberosActualizados', this.barberosActualizadosListener);
    window.removeEventListener('tiposCorteActualizados', this.tiposCorteActualizadosListener);
  }

  cargarServicios(): void {
    this.cargando = true;
    this.servicioService.getAll().subscribe({
      next: data => {
        this.servicios = data;
        this.cargando = false;
      },
      error: error => {
        console.error('Error al cargar servicios:', error);
        this.cargando = false;
      }
    });
  }

  cargarBarberos(): void {
    this.barberoService.getAll().subscribe({
      next: data => {
        this.barberos = data;
        if (data.length > 0) {
          this.nuevoServicio.barberoId = data[0].id;
        }
      },
      error: error => {
        console.error('Error al cargar barberos:', error);
        this.mostrarNotificacion('Error al cargar la lista de barberos. Por favor, recargue la pagina.', 'error');
      }
    });
  }

  cargarTiposCorte(): void {
    this.tipoCorteService.obtenerTodosActivos().subscribe({
      next: data => {
        this.tiposCorte = data;
      },
      error: error => {
        console.error('Error al cargar tipos de corte:', error);
        this.mostrarNotificacion('Error al cargar los tipos de corte. Por favor, recargue la pagina.', 'error');
      }
    });
  }

  guardarServicio(): void {
    this.normalizarDescuentoServicio();

    if (this.editando && this.servicioEditando && !this.esBarbero) {
      this.servicioService.update(this.servicioEditando.id, this.nuevoServicio).subscribe({
        next: () => {
          this.cargarServicios();
          this.mostrarFormulario = false;
          this.resetearFormulario();
        },
        error: error => {
          console.error('Error al actualizar servicio:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al actualizar el servicio', 'error');
        }
      });
    } else {
      const ahora = new Date();
      const anio = ahora.getFullYear();
      const mes = String(ahora.getMonth() + 1).padStart(2, '0');
      const dia = String(ahora.getDate()).padStart(2, '0');
      this.nuevoServicio.fecha = `${anio}-${mes}-${dia}`;
      this.nuevoServicio.hora = ahora.toTimeString().slice(0, 5);

      this.servicioService.create(this.nuevoServicio).subscribe({
        next: () => {
          if (!this.esBarbero && !this.esCesia) {
            this.cargarServicios();
            this.mostrarFormulario = false;
          }
          this.resetearFormulario();
          this.mostrarNotificacion('Servicio registrado exitosamente.', 'success');
        },
        error: error => {
          console.error('Error al guardar servicio:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al guardar el servicio', 'error');
        }
      });
    }
  }

  resetearFormulario(): void {
    this.nuevoServicio = {
      fecha: '',
      hora: '',
      barberoId: this.barberos.length > 0 ? this.barberos[0].id : 0,
      tipoCorte: '',
      metodoPago: 'Efectivo',
      precio: 0,
      descuentoPorcentaje: 0
    };
    this.tipoCorteIdSeleccionado = 0;
    this.tipoCorteSeleccionado = null;
    this.editando = false;
    this.servicioEditando = null;
  }

  editar(servicio: Servicio): void {
    this.servicioEditando = servicio;
    this.editando = true;
    this.nuevoServicio = {
      fecha: servicio.fecha,
      hora: servicio.hora,
      barberoId: servicio.barberoId,
      tipoCorte: servicio.tipoCorte,
      metodoPago: servicio.metodoPago,
      precio: servicio.precioOriginal ?? servicio.precio,
      descuentoPorcentaje: servicio.descuentoPorcentaje ?? 0
    };

    const tipoEncontrado = this.tiposCorte.find(t => t.nombre === servicio.tipoCorte);
    if (tipoEncontrado) {
      this.tipoCorteIdSeleccionado = tipoEncontrado.id;
      this.tipoCorteSeleccionado = tipoEncontrado;
    } else {
      this.cargarTiposCorte();
      this.tipoCorteIdSeleccionado = 0;
      this.tipoCorteSeleccionado = null;
    }
    this.mostrarFormulario = true;
  }

  eliminar(servicio: Servicio): void {
    this.mensajeConfirmacion =
      'Seguro que desea eliminar el servicio del ' + servicio.fecha + ' a las ' + servicio.hora + '?';
    this.accionConfirmacion = () => {
      this.servicioService.delete(servicio.id).subscribe({
        next: () => {
          this.cargarServicios();
          this.mostrarNotificacion('Servicio eliminado exitosamente', 'success');
        },
        error: error => {
          console.error('Error al eliminar servicio:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al eliminar el servicio', 'error');
        }
      });
    };
    this.mostrarModalConfirmacion = true;
  }

  onTipoCorteChange(): void {
    const tipoEncontrado = this.tiposCorte.find(t => t.id === this.tipoCorteIdSeleccionado);
    this.tipoCorteSeleccionado = tipoEncontrado || null;

    if (tipoEncontrado) {
      this.nuevoServicio.tipoCorte = tipoEncontrado.nombre;
      if (tipoEncontrado.precio > 0) {
        this.nuevoServicio.precio = tipoEncontrado.precio;
      }
    } else {
      this.nuevoServicio.tipoCorte = '';
    }
  }

  normalizarDescuentoServicio(): void {
    if (this.nuevoServicio.descuentoPorcentaje == null || isNaN(this.nuevoServicio.descuentoPorcentaje as any)) {
      this.nuevoServicio.descuentoPorcentaje = 0;
    }
    this.nuevoServicio.descuentoPorcentaje = Math.max(0, this.nuevoServicio.descuentoPorcentaje);
  }

  getPrecioFinalServicio(): number {
    const base = this.nuevoServicio.precio || 0;
    const descuento = this.nuevoServicio.descuentoPorcentaje || 0;
    return +Math.max(0, (base * (1 - descuento / 100))).toFixed(2);
  }

  convertirTiempoALegible(minutos: number): string {
    if (!minutos || minutos < 0) return '0min';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0 && mins > 0) return `${horas}h ${mins}min`;
    if (horas > 0) return `${horas}h`;
    return `${mins}min`;
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.mensajeNotificacion = mensaje;
    this.tipoNotificacion = tipo;
    this.mostrarModalNotificacion = true;
  }

  cerrarModalNotificacion(): void {
    this.mostrarModalNotificacion = false;
    setTimeout(() => {
      this.mensajeNotificacion = '';
    }, 300);
  }

  confirmarAccion(): void {
    if (this.accionConfirmacion) {
      this.accionConfirmacion();
    }
    this.cerrarModalConfirmacion();
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.mensajeConfirmacion = '';
    this.accionConfirmacion = null;
  }
}
