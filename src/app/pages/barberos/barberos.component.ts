import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { BarberoService } from '../../services/barbero.service';
import { Barbero, BarberoUpdate } from '../../models/barbero.model';

@Component({
  selector: 'app-barberos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './barberos.component.html',
  styleUrls: ['./barberos.component.css']
})
export class BarberosComponent implements OnInit {
  barberos: Barbero[] = [];
  cargando = true;
  guardando = false;
  cargandoEdicion = false;
  mensajeError = '';
  mostrarModalAgregar = false;
  mostrarModalEditar = false;
  barberoEditandoId = 0;
  porcentajeOriginal = 0;

  nuevoBarbero: Barbero = {
    id: 0,
    nombre: '',
    porcentajeServicio: 0,
    correo: ''
  };

  formEditar: FormGroup;

  constructor(
    private barberoService: BarberoService,
    private fb: FormBuilder
  ) {
    this.formEditar = this.fb.group({
      nombre: ['', Validators.required],
      porcentajeServicio: [
        null as number | null,
        [Validators.required, Validators.min(0), Validators.max(100)]
      ],
      correo: ['']
    });
  }

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
    this.mostrarModalAgregar = true;
  }

  cerrarModalAgregar(): void {
    this.mostrarModalAgregar = false;
    this.mensajeError = '';
  }

  guardarBarbero(): void {
    this.mensajeError = '';

    if (!this.nuevoBarbero.nombre || this.nuevoBarbero.nombre.trim() === '') {
      this.mensajeError = 'El nombre es obligatorio';
      return;
    }

    const porcentaje = Number(this.nuevoBarbero.porcentajeServicio);
    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      this.mensajeError = 'El porcentaje debe estar entre 0 y 100';
      return;
    }

    const barberoParaGuardar: BarberoUpdate = {
      nombre: this.nuevoBarbero.nombre.trim(),
      porcentajeServicio: porcentaje,
      correo: this.nuevoBarbero.correo?.trim() || undefined
    };

    this.guardando = true;
    this.barberoService.create(barberoParaGuardar).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModalAgregar();
        this.cargarBarberos();
        alert('Guardado exitosamente.');
        this.notificarActualizacionBarberos();
      },
      error: (error) => {
        console.error('Error al guardar barbero:', error);
        this.mensajeError = error.error?.message || 'Error al guardar el barbero';
        this.guardando = false;
      }
    });
  }

  abrirModalEditar(barbero: Barbero, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    this.mensajeError = '';
    this.barberoEditandoId = barbero.id;
    this.cargandoEdicion = true;
    this.mostrarModalEditar = true;

    this.formEditar.reset();
    this.formEditar.enable({ emitEvent: false });

    this.barberoService.getById(barbero.id).subscribe({
      next: (data) => {
        this.aplicarDatosAlFormularioEditar(data);
        this.cargandoEdicion = false;
      },
      error: (error) => {
        console.error('Error al cargar barbero para edición:', error);
        this.aplicarDatosAlFormularioEditar(barbero);
        this.cargandoEdicion = false;
        this.mensajeError = 'No se pudieron cargar todos los datos. Revisa la conexión e intenta de nuevo.';
      }
    });
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.cargandoEdicion = false;
    this.mensajeError = '';
    this.barberoEditandoId = 0;
    this.formEditar.reset();
    this.formEditar.enable({ emitEvent: false });
  }

  actualizarBarbero(): void {
    this.mensajeError = '';
    this.formEditar.markAllAsTouched();

    if (this.formEditar.invalid) {
      this.mensajeError = this.obtenerMensajeErrorFormulario();
      return;
    }

    const { nombre, porcentajeServicio, correo } = this.formEditar.getRawValue();
    const porcentaje = Number(porcentajeServicio);

    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      this.mensajeError = 'El porcentaje debe estar entre 0 y 100';
      return;
    }

    const barberoParaActualizar: BarberoUpdate = {
      nombre: (nombre as string).trim(),
      porcentajeServicio: porcentaje,
      correo: (correo as string)?.trim() || undefined
    };

    this.guardando = true;
    this.barberoService.update(this.barberoEditandoId, barberoParaActualizar).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModalEditar();
        this.cargarBarberos();
        alert('Guardado exitosamente.');
        this.notificarActualizacionBarberos();

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

  eliminarBarbero(barbero: Barbero, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (confirm(`¿Está seguro de eliminar al barbero "${barbero.nombre}"?\nEsta acción no se puede deshacer.`)) {
      this.barberoService.delete(barbero.id).subscribe({
        next: () => {
          this.cargarBarberos();
          this.notificarActualizacionBarberos();
        },
        error: (error) => {
          console.error('Error al eliminar barbero:', error);
          alert('Error al eliminar el barbero: ' + (error.error?.message || 'Error desconocido'));
        }
      });
    }
  }

  campoInvalido(campo: string): boolean {
    const control = this.formEditar.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  private aplicarDatosAlFormularioEditar(barbero: Barbero): void {
    const porcentaje = this.normalizarPorcentaje(barbero.porcentajeServicio);
    this.porcentajeOriginal = porcentaje;

    this.formEditar.enable({ emitEvent: false });
    this.formEditar.patchValue({
      nombre: barbero.nombre ?? '',
      porcentajeServicio: porcentaje,
      correo: barbero.correo ?? ''
    });
    this.formEditar.get('porcentajeServicio')?.enable({ emitEvent: false });
    this.formEditar.get('nombre')?.enable({ emitEvent: false });
    this.formEditar.get('correo')?.enable({ emitEvent: false });
  }

  private obtenerMensajeErrorFormulario(): string {
    if (this.formEditar.get('nombre')?.hasError('required')) {
      return 'El nombre es obligatorio';
    }
    if (this.formEditar.get('porcentajeServicio')?.hasError('required')) {
      return 'El porcentaje es obligatorio';
    }
    if (
      this.formEditar.get('porcentajeServicio')?.hasError('min') ||
      this.formEditar.get('porcentajeServicio')?.hasError('max')
    ) {
      return 'El porcentaje debe estar entre 0 y 100';
    }
    return 'Revisa los campos del formulario';
  }

  private normalizarPorcentaje(valor: number | string | null | undefined): number {
    const numero = Number(valor);
    return isNaN(numero) ? 0 : numero;
  }

  private notificarActualizacionBarberos(): void {
    window.dispatchEvent(new CustomEvent('barberosActualizados'));
  }
}
