import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoCorteService } from '../../services/tipo-corte.service';
import { TipoCorteAPI } from '../../models/tipo-corte-api.model';
import { BarberoService } from '../../services/barbero.service';
import { Barbero } from '../../models/barbero.model';

declare var bootstrap: any;

@Component({
  selector: 'app-tipos-corte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipos-corte.component.html',
  styleUrls: ['./tipos-corte.component.css']
})
export class TiposCorteComponent implements OnInit {
  tiposCorte: TipoCorteAPI[] = [];
  barberos: Barbero[] = [];
  barberosSeleccionados: number[] = []; // Array de IDs de barberos seleccionados
  nuevoTipoCorte: TipoCorteAPI = {
    id: 0,
    nombre: '',
    descripcion: '',
    tiempoMinutos: 30,
    precio: 0,
    activo: true,
    barberoId: undefined
  };
  tiempoFormatoLegible: string = '30min'; // Formato legible para el input
  tipoCorteEditando: TipoCorteAPI | null = null;
  mostrarFormulario = false;
  cargando = false;
  guardando = false;
  mensajeError = '';
  private modalTipoCorte: any;

  constructor(
    private tipoCorteService: TipoCorteService,
    private barberoService: BarberoService
  ) {}

  ngOnInit(): void {
    this.cargarTiposCorte();
    this.cargarBarberos();
    
    // Escuchar eventos de actualización de barberos
    window.addEventListener('barberosActualizados', () => {
      this.cargarBarberos();
    });
  }

  cargarBarberos(): void {
    this.barberoService.getAll().subscribe({
      next: (data) => {
        this.barberos = data;
      },
      error: (error) => {
        console.error('Error al cargar barberos:', error);
      }
    });
  }

  cargarTiposCorte(): void {
    this.cargando = true;
    this.tipoCorteService.obtenerTodos().subscribe({
      next: (data) => {
        this.tiposCorte = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar tipos de corte:', error);
        this.cargando = false;
      }
    });
  }

  abrirFormularioAgregar(): void {
    this.tipoCorteEditando = null;
    this.nuevoTipoCorte = {
      id: 0,
      nombre: '',
      descripcion: '',
      tiempoMinutos: 30,
      precio: 0,
      activo: true,
      barberoId: undefined
    };
    this.barberosSeleccionados = [];
    this.tiempoFormatoLegible = '30min';
    this.mensajeError = '';
    this.mostrarFormulario = true;
  }

  editar(tipoCorte: TipoCorteAPI): void {
    this.tipoCorteEditando = tipoCorte;
    this.nuevoTipoCorte = {
      id: tipoCorte.id,
      nombre: tipoCorte.nombre,
      descripcion: tipoCorte.descripcion || '',
      tiempoMinutos: tipoCorte.tiempoMinutos,
      precio: tipoCorte.precio,
      activo: tipoCorte.activo,
      barberoId: tipoCorte.barberoId,
      barberoNombre: tipoCorte.barberoNombre
    };
    // Si hay un barbero asignado, agregarlo a la lista de seleccionados
    this.barberosSeleccionados = tipoCorte.barberoId ? [tipoCorte.barberoId] : [];
    this.tiempoFormatoLegible = this.convertirTiempoALegible(tipoCorte.tiempoMinutos);
    this.mensajeError = '';
    this.mostrarFormulario = true;
  }

  guardarTipoCorte(): void {
    this.mensajeError = '';

    // Validaciones
    if (!this.nuevoTipoCorte.nombre || this.nuevoTipoCorte.nombre.trim() === '') {
      this.mensajeError = 'El nombre es obligatorio';
      return;
    }

    // Convertir tiempo legible a minutos
    const minutos = this.convertirTiempoAMinutos(this.tiempoFormatoLegible);
    if (minutos === null || minutos < 1) {
      this.mensajeError = 'El tiempo debe ser válido y al menos 1 minuto. Ejemplo: "1h 25min" o "30min"';
      return;
    }
    this.nuevoTipoCorte.tiempoMinutos = minutos;

    if (this.nuevoTipoCorte.precio < 0) {
      this.mensajeError = 'El precio no puede ser negativo';
      return;
    }

    // Asignar el primer barbero seleccionado (o undefined si no hay ninguno)
    // Nota: El backend actualmente solo soporta un barbero, pero el frontend permite seleccionar múltiples
    this.nuevoTipoCorte.barberoId = this.barberosSeleccionados.length > 0 
      ? this.barberosSeleccionados[0] 
      : undefined;

    this.guardando = true;

    if (this.tipoCorteEditando) {
      // Actualizar
      this.tipoCorteService.actualizar(this.tipoCorteEditando.id, this.nuevoTipoCorte).subscribe({
        next: () => {
          this.guardando = false;
          this.cargarTiposCorte();
          this.cancelar();
          this.notificarActualizacion();
        },
        error: (error) => {
          console.error('Error al actualizar tipo de corte:', error);
          this.mensajeError = error.error?.message || 'Error al actualizar el tipo de corte';
          this.guardando = false;
        }
      });
    } else {
      // Crear
      this.tipoCorteService.crear(this.nuevoTipoCorte).subscribe({
        next: () => {
          this.guardando = false;
          this.cargarTiposCorte();
          this.cancelar();
          this.notificarActualizacion();
        },
        error: (error) => {
          console.error('Error al crear tipo de corte:', error);
          this.mensajeError = error.error?.message || 'Error al crear el tipo de corte';
          this.guardando = false;
        }
      });
    }
  }

  eliminar(tipoCorte: TipoCorteAPI): void {
    if (confirm(`¿Está seguro de eliminar el tipo de corte "${tipoCorte.nombre}"?\nEsta acción no se puede deshacer.`)) {
      this.tipoCorteService.eliminar(tipoCorte.id).subscribe({
        next: () => {
          this.cargarTiposCorte();
          this.notificarActualizacion();
        },
        error: (error) => {
          console.error('Error al eliminar tipo de corte:', error);
          alert('Error al eliminar el tipo de corte: ' + (error.error?.message || 'Error desconocido'));
        }
      });
    }
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.tipoCorteEditando = null;
    this.nuevoTipoCorte = {
      id: 0,
      nombre: '',
      descripcion: '',
      tiempoMinutos: 30,
      precio: 0,
      activo: true,
      barberoId: undefined
    };
    this.barberosSeleccionados = [];
    this.tiempoFormatoLegible = '30min';
    this.mensajeError = '';
  }

  /**
   * Verifica si un barbero está seleccionado
   */
  estaBarberoSeleccionado(barberoId: number): boolean {
    return this.barberosSeleccionados.includes(barberoId);
  }

  /**
   * Alterna la selección de un barbero
   */
  toggleBarbero(barberoId: number): void {
    const index = this.barberosSeleccionados.indexOf(barberoId);
    if (index > -1) {
      // Si el barbero ya está seleccionado, deseleccionarlo
      this.barberosSeleccionados.splice(index, 1);
    } else {
      // Si el barbero no está seleccionado, agregarlo
      this.barberosSeleccionados.push(barberoId);
    }
  }

  /**
   * Alterna la opción "Cualquier barbero"
   */
  toggleCualquierBarbero(): void {
    // Si se está seleccionando "Cualquier barbero", limpiar todas las selecciones
    if (this.barberosSeleccionados.length > 0) {
      this.barberosSeleccionados = [];
    }
    // Si ya está en "Cualquier barbero" (array vacío), no hacer nada
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

  /**
   * Convierte formato legible a minutos (ej: "1h 25min" -> 85)
   * Acepta formatos como: "1h 25min", "1h", "25min", "85min", "1h25min"
   */
  convertirTiempoAMinutos(tiempoTexto: string): number | null {
    if (!tiempoTexto || !tiempoTexto.trim()) return null;
    
    const texto = tiempoTexto.trim().toLowerCase();
    let totalMinutos = 0;
    
    // Buscar horas (h o h.)
    const horasMatch = texto.match(/(\d+)\s*h\.?/);
    if (horasMatch) {
      totalMinutos += parseInt(horasMatch[1]) * 60;
    }
    
    // Buscar minutos (min, mins, m, minuto, minutos)
    const minutosMatch = texto.match(/(\d+)\s*(?:min|mins|m|minuto|minutos)\.?/);
    if (minutosMatch) {
      totalMinutos += parseInt(minutosMatch[1]);
    }
    
    // Si no encontró nada, intentar como número puro (asumir minutos)
    if (totalMinutos === 0) {
      const numeroPuro = parseInt(texto);
      if (!isNaN(numeroPuro) && numeroPuro > 0) {
        return numeroPuro;
      }
      return null;
    }
    
    return totalMinutos > 0 ? totalMinutos : null;
  }

  private notificarActualizacion(): void {
    // Disparar un evento personalizado para que otros componentes recarguen los tipos de corte
    window.dispatchEvent(new CustomEvent('tiposCorteActualizados'));
  }
}

