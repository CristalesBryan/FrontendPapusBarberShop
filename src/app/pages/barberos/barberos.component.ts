import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BarberoService } from '../../services/barbero.service';
import { Barbero } from '../../models/barbero.model';

declare var bootstrap: any;

@Component({
  selector: 'app-barberos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barberos.component.html',
  styleUrls: ['./barberos.component.css']
})
export class BarberosComponent implements OnInit {
  barberos: Barbero[] = [];
  cargando = true;
  guardando = false;
  mensajeError = '';
  nuevoBarbero: Barbero = {
    id: 0,
    nombre: '',
    porcentajeServicio: 0,
    correo: ''
  };
  barberoEditando: Barbero = {
    id: 0,
    nombre: '',
    porcentajeServicio: 0,
    correo: ''
  };
  porcentajeOriginal: number = 0;
  private modalAgregar: any;
  private modalEditar: any;

  constructor(private barberoService: BarberoService) {}

  ngOnInit(): void {
    this.cargarBarberos();
  }

  cargarBarberos(): void {
    this.cargando = true;
    this.barberoService.getAll().subscribe({
      next: (data) => {
        this.barberos = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar barberos:', error);
        this.cargando = false;
      }
    });
  }

  abrirModalAgregar(): void {
    this.nuevoBarbero = {
      id: 0,
      nombre: '',
      porcentajeServicio: 0,
      correo: ''
    };
    this.mensajeError = '';
    const modalElement = document.getElementById('modalAgregarBarbero');
    if (modalElement) {
      this.modalAgregar = new bootstrap.Modal(modalElement);
      this.modalAgregar.show();
    }
  }

  guardarBarbero(): void {
    this.mensajeError = '';
    
    // Validaciones
    if (!this.nuevoBarbero.nombre || this.nuevoBarbero.nombre.trim() === '') {
      this.mensajeError = 'El nombre es obligatorio';
      return;
    }

    const porcentaje = Number(this.nuevoBarbero.porcentajeServicio);
    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      this.mensajeError = 'El porcentaje debe estar entre 0 y 100';
      return;
    }

    // Preparar datos para enviar
    const barberoParaGuardar: Barbero = {
      id: 0,
      nombre: this.nuevoBarbero.nombre.trim(),
      porcentajeServicio: porcentaje,
      correo: this.nuevoBarbero.correo?.trim() || undefined
    };

    this.guardando = true;
    this.barberoService.create(barberoParaGuardar).subscribe({
      next: () => {
        this.guardando = false;
        if (this.modalAgregar) {
          this.modalAgregar.hide();
        }
        this.cargarBarberos();
        // Notificar a otros componentes que recarguen los barberos
        this.notificarActualizacionBarberos();
      },
      error: (error) => {
        console.error('Error al guardar barbero:', error);
        this.mensajeError = error.error?.message || 'Error al guardar el barbero';
        this.guardando = false;
      }
    });
  }

  abrirModalEditar(barbero: Barbero): void {
    // Crear una copia del barbero para editar
    this.barberoEditando = {
      id: barbero.id,
      nombre: barbero.nombre,
      porcentajeServicio: barbero.porcentajeServicio,
      correo: barbero.correo || ''
    };
    this.porcentajeOriginal = barbero.porcentajeServicio;
    this.mensajeError = '';
    const modalElement = document.getElementById('modalEditarBarbero');
    if (modalElement) {
      this.modalEditar = new bootstrap.Modal(modalElement);
      this.modalEditar.show();
    }
  }

  actualizarBarbero(): void {
    this.mensajeError = '';
    
    // Validaciones
    if (!this.barberoEditando.nombre || this.barberoEditando.nombre.trim() === '') {
      this.mensajeError = 'El nombre es obligatorio';
      return;
    }

    const porcentaje = Number(this.barberoEditando.porcentajeServicio);
    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      this.mensajeError = 'El porcentaje debe estar entre 0 y 100';
      return;
    }

    // Preparar datos para enviar
    const barberoParaActualizar: Barbero = {
      id: this.barberoEditando.id,
      nombre: this.barberoEditando.nombre.trim(),
      porcentajeServicio: porcentaje,
      correo: this.barberoEditando.correo?.trim() || undefined
    };

    this.guardando = true;
    this.barberoService.update(this.barberoEditando.id, barberoParaActualizar).subscribe({
      next: () => {
        this.guardando = false;
        if (this.modalEditar) {
          this.modalEditar.hide();
        }
        this.cargarBarberos();
        // Notificar a otros componentes que recarguen los barberos
        this.notificarActualizacionBarberos();
        
        // Si cambió el porcentaje, mostrar mensaje informativo
        if (this.porcentajeOriginal !== porcentaje) {
          alert(`El porcentaje del barbero "${barberoParaActualizar.nombre}" ha sido actualizado.\n` +
                `Los cálculos de pagos en los reportes se actualizarán automáticamente con el nuevo porcentaje.`);
        }
      },
      error: (error) => {
        console.error('Error al actualizar barbero:', error);
        this.mensajeError = error.error?.message || 'Error al actualizar el barbero';
        this.guardando = false;
      }
    });
  }

  eliminarBarbero(barbero: Barbero): void {
    if (confirm(`¿Está seguro de eliminar al barbero "${barbero.nombre}"?\nEsta acción no se puede deshacer.`)) {
      this.barberoService.delete(barbero.id).subscribe({
        next: () => {
          this.cargarBarberos();
          // Notificar a otros componentes que recarguen los barberos
          this.notificarActualizacionBarberos();
        },
        error: (error) => {
          console.error('Error al eliminar barbero:', error);
          alert('Error al eliminar el barbero: ' + (error.error?.message || 'Error desconocido'));
        }
      });
    }
  }

  private notificarActualizacionBarberos(): void {
    // Disparar un evento personalizado para que otros componentes recarguen los barberos
    window.dispatchEvent(new CustomEvent('barberosActualizados'));
  }
}

