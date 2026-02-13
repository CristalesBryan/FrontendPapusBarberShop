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
    fecha: '', // Se establecerá automáticamente al guardar
    hora: '', // Se establecerá automáticamente al guardar
    barberoId: 0,
    tipoCorte: '',
    metodoPago: 'Efectivo',
    precio: 0
  };
  tipoCorteIdSeleccionado: number = 0;
  mostrarFormulario = false;
  editando = false;
  servicioEditando: Servicio | null = null;
  cargando = true;
  esBarbero = false;
  
  // Modales dinámicos
  mostrarModalNotificacion = false;
  mensajeNotificacion = '';
  tipoNotificacion: 'success' | 'error' | 'info' | 'warning' = 'info';
  mostrarModalConfirmacion = false;
  mensajeConfirmacion = '';
  accionConfirmacion: (() => void) | null = null;
  
  // Referencias a los listeners para poder eliminarlos
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
    
    // Si es barbero, mostrar el formulario automáticamente y no cargar la lista
    if (this.esBarbero) {
      this.mostrarFormulario = true;
    } else {
      this.cargarServicios();
    }
    
    this.cargarBarberos();
    this.cargarTiposCorte();
    
    // Escuchar eventos de actualización de barberos
    window.addEventListener('barberosActualizados', this.barberosActualizadosListener);
    
    // Escuchar eventos de actualización de tipos de corte
    window.addEventListener('tiposCorteActualizados', this.tiposCorteActualizadosListener);
  }

  ngOnDestroy(): void {
    // Limpiar listeners al destruir el componente
    window.removeEventListener('barberosActualizados', this.barberosActualizadosListener);
    window.removeEventListener('tiposCorteActualizados', this.tiposCorteActualizadosListener);
  }

  cargarServicios(): void {
    this.cargando = true;
    this.servicioService.getAll().subscribe({
      next: (data) => {
        this.servicios = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        this.cargando = false;
      }
    });
  }

  cargarBarberos(): void {
    this.barberoService.getAll().subscribe({
      next: (data) => {
        this.barberos = data;
        if (data.length > 0) {
          this.nuevoServicio.barberoId = data[0].id;
        } else {
          console.warn('No hay barberos disponibles');
        }
      },
      error: (error) => {
        console.error('Error al cargar barberos:', error);
        this.mostrarNotificacion('Error al cargar la lista de barberos. Por favor, recargue la página.', 'error');
      }
    });
  }

  cargarTiposCorte(): void {
    this.tipoCorteService.obtenerTodosActivos().subscribe({
      next: (data) => {
        this.tiposCorte = data;
        if (data.length === 0) {
          console.warn('No hay tipos de corte activos disponibles');
        }
      },
      error: (error) => {
        console.error('Error al cargar tipos de corte:', error);
        this.mostrarNotificacion('Error al cargar los tipos de corte. Por favor, recargue la página.', 'error');
      }
    });
  }

  guardarServicio(): void {
    // Los barberos no pueden editar servicios
    if (this.editando && this.servicioEditando && !this.esBarbero) {
      // Actualizar servicio existente
      this.servicioService.update(this.servicioEditando.id, this.nuevoServicio).subscribe({
        next: () => {
          this.cargarServicios();
          this.mostrarFormulario = false;
          this.resetearFormulario();
        },
        error: (error) => {
          console.error('Error al actualizar servicio:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al actualizar el servicio', 'error');
        }
      });
    } else {
      // Crear nuevo servicio - Establecer fecha y hora automáticamente antes de guardar
      const ahora = new Date();
      const año = ahora.getFullYear();
      const mes = String(ahora.getMonth() + 1).padStart(2, '0');
      const dia = String(ahora.getDate()).padStart(2, '0');
      this.nuevoServicio.fecha = `${año}-${mes}-${dia}`;
      this.nuevoServicio.hora = ahora.toTimeString().slice(0, 5);
      
      this.servicioService.create(this.nuevoServicio).subscribe({
        next: () => {
          // Si es barbero, no recargar la lista, solo resetear el formulario
          if (!this.esBarbero) {
            this.cargarServicios();
          }
          // Si es barbero, mantener el formulario visible
          if (!this.esBarbero) {
            this.mostrarFormulario = false;
          }
          this.resetearFormulario();
          this.mostrarNotificacion('Servicio registrado exitosamente.', 'success');
        },
        error: (error) => {
          console.error('Error al guardar servicio:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al guardar el servicio', 'error');
        }
      });
    }
  }

  resetearFormulario(): void {
    this.nuevoServicio = {
      fecha: '', // Se establecerá automáticamente al guardar
      hora: '', // Se establecerá automáticamente al guardar
      barberoId: this.barberos.length > 0 ? this.barberos[0].id : 0,
      tipoCorte: '',
      metodoPago: 'Efectivo',
      precio: 0
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
      precio: servicio.precio
    };
    // Buscar el tipo de corte seleccionado por nombre
    const tipoEncontrado = this.tiposCorte.find(t => t.nombre === servicio.tipoCorte);
    if (tipoEncontrado) {
      this.tipoCorteIdSeleccionado = tipoEncontrado.id;
      this.tipoCorteSeleccionado = tipoEncontrado;
    } else {
      // Si no se encuentra, intentar recargar tipos de corte y buscar de nuevo
      this.cargarTiposCorte();
      this.tipoCorteIdSeleccionado = 0;
      this.tipoCorteSeleccionado = null;
    }
    this.mostrarFormulario = true;
  }

  eliminar(servicio: Servicio): void {
    this.mensajeConfirmacion = `¿Está seguro de que desea eliminar el servicio del ${servicio.fecha} a las ${servicio.hora}?`;
    this.accionConfirmacion = () => {
      this.servicioService.delete(servicio.id).subscribe({
        next: () => {
          this.cargarServicios();
          this.mostrarNotificacion('Servicio eliminado exitosamente', 'success');
        },
        error: (error) => {
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
      // Establecer el precio automáticamente si está disponible
      if (tipoEncontrado.precio > 0) {
        this.nuevoServicio.precio = tipoEncontrado.precio;
      }
    } else {
      this.nuevoServicio.tipoCorte = '';
    }
  }

  /**
   * Convierte minutos a formato legible (ej: 85 minutos -> "1h 25min")
   */
  convertirTiempoALegible(minutos: number): string {
    if (!minutos || minutos < 0) return '0min';
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas > 0 && mins > 0) {
      return `${horas}h ${mins}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${mins}min`;
    }
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

