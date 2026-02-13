import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MobiliarioEquipoService } from '../../services/mobiliario-equipo.service';
import { MobiliarioEquipo, MobiliarioEquipoCreate } from '../../models/mobiliario-equipo.model';

@Component({
  selector: 'app-mobiliario-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mobiliario-equipo.component.html',
  styleUrls: ['./mobiliario-equipo.component.css']
})
export class MobiliarioEquipoComponent implements OnInit {
  mobiliarioEquipo: MobiliarioEquipo[] = [];
  nuevoElemento: MobiliarioEquipoCreate = {
    nombre: '',
    descripcion: '',
    categoria: 'Mobiliario',
    estado: 'Bueno',
    fechaAdquisicion: '',
    valor: 0,
    cantidad: 1,
    ubicacion: '',
    numeroSerie: ''
  };
  elementoEditando: MobiliarioEquipo | null = null;
  mostrarFormulario = false;
  cargando = true;

  categorias = ['Mobiliario', 'Equipo', 'Herramienta', 'Otro'];
  estados = ['Bueno', 'Regular', 'Necesita Reparación', 'Fuera de Servicio'];

  constructor(private mobiliarioEquipoService: MobiliarioEquipoService) {}

  ngOnInit(): void {
    this.cargarMobiliarioEquipo();
  }

  cargarMobiliarioEquipo(): void {
    this.cargando = true;
    this.mobiliarioEquipoService.getAll().subscribe({
      next: (data) => {
        this.mobiliarioEquipo = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar mobiliario y equipo:', error);
        this.cargando = false;
      }
    });
  }

  guardarElemento(): void {
    if (this.elementoEditando) {
      this.mobiliarioEquipoService.update(this.elementoEditando.id, this.nuevoElemento).subscribe({
        next: () => {
          this.cargarMobiliarioEquipo();
          this.cancelar();
        },
        error: (error) => {
          console.error('Error al actualizar elemento:', error);
          alert(error.error?.message || 'Error al actualizar el elemento');
        }
      });
    } else {
      this.mobiliarioEquipoService.create(this.nuevoElemento).subscribe({
        next: () => {
          this.cargarMobiliarioEquipo();
          this.cancelar();
        },
        error: (error) => {
          console.error('Error al crear elemento:', error);
          alert(error.error?.message || 'Error al crear el elemento');
        }
      });
    }
  }

  editar(elemento: MobiliarioEquipo): void {
    this.elementoEditando = elemento;
    this.nuevoElemento = {
      nombre: elemento.nombre,
      descripcion: elemento.descripcion || '',
      categoria: elemento.categoria,
      estado: elemento.estado,
      fechaAdquisicion: elemento.fechaAdquisicion || '',
      valor: elemento.valor,
      cantidad: elemento.cantidad,
      ubicacion: elemento.ubicacion || '',
      numeroSerie: elemento.numeroSerie || ''
    };
    this.mostrarFormulario = true;
  }

  eliminar(elemento: MobiliarioEquipo): void {
    if (confirm(`¿Está seguro de que desea eliminar "${elemento.nombre}"?`)) {
      this.mobiliarioEquipoService.delete(elemento.id).subscribe({
        next: () => {
          this.cargarMobiliarioEquipo();
          alert('Elemento eliminado exitosamente');
        },
        error: (error) => {
          console.error('Error al eliminar elemento:', error);
          alert(error.error?.message || 'Error al eliminar el elemento');
        }
      });
    }
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.elementoEditando = null;
    this.nuevoElemento = {
      nombre: '',
      descripcion: '',
      categoria: 'Mobiliario',
      estado: 'Bueno',
      fechaAdquisicion: '',
      valor: 0,
      cantidad: 1,
      ubicacion: '',
      numeroSerie: ''
    };
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'Bueno':
        return 'bg-success';
      case 'Regular':
        return 'bg-warning';
      case 'Necesita Reparación':
        return 'bg-danger';
      case 'Fuera de Servicio':
        return 'bg-secondary';
      default:
        return 'bg-info';
    }
  }
}

