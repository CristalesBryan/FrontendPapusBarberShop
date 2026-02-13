import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaProductoService } from '../../services/venta-producto.service';
import { BarberoService } from '../../services/barbero.service';
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service';
import { VentaProducto, VentaProductoCreate } from '../../models/venta-producto.model';
import { Barbero } from '../../models/barbero.model';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent implements OnInit {
  ventas: VentaProducto[] = [];
  barberos: Barbero[] = [];
  productos: Producto[] = [];
  nuevaVenta: VentaProductoCreate = {
    fecha: '', // Se establecerá automáticamente al guardar
    hora: '', // Se establecerá automáticamente al guardar
    barberoId: 0,
    productoId: 0,
    cantidad: 1,
    metodoPago: 'Efectivo'
  };
  mostrarFormulario = false;
  editando = false;
  ventaEditando: VentaProducto | null = null;
  cargando = true;
  esBarbero = false;
  
  // Modales dinámicos
  mostrarModalNotificacion = false;
  mensajeNotificacion = '';
  tipoNotificacion: 'success' | 'error' | 'info' | 'warning' = 'info';
  mostrarModalConfirmacion = false;
  mensajeConfirmacion = '';
  accionConfirmacion: (() => void) | null = null;

  constructor(
    private ventaService: VentaProductoService,
    private barberoService: BarberoService,
    private productoService: ProductoService,
    private authService: AuthService
  ) {}

  toggleFormulario(): void {
    if (this.editando) {
      this.cancelarEdicion();
    } else {
      this.mostrarFormulario = !this.mostrarFormulario;
      // Recargar productos cuando se muestra el formulario para tener datos actualizados
      if (this.mostrarFormulario) {
        this.cargarProductos();
      }
    }
  }

  ngOnInit(): void {
    this.esBarbero = this.authService.isBarbero();
    
    // Si es barbero, mostrar el formulario automáticamente y no cargar la lista
    if (this.esBarbero) {
      this.mostrarFormulario = true;
    } else {
      this.cargarVentas();
    }
    
    this.cargarBarberos();
    this.cargarProductos();
    
    // Escuchar eventos de actualización de barberos
    window.addEventListener('barberosActualizados', () => {
      this.cargarBarberos();
    });
  }

  cargarVentas(): void {
    this.cargando = true;
    this.ventaService.getAll().subscribe({
      next: (data) => {
        this.ventas = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar ventas:', error);
        this.cargando = false;
      }
    });
  }

  cargarBarberos(): void {
    this.barberoService.getAll().subscribe({
      next: (data) => {
        this.barberos = data;
        if (data.length > 0) {
          this.nuevaVenta.barberoId = data[0].id;
        }
      }
    });
  }

  cargarProductos(): void {
    const productoIdActual = this.nuevaVenta.productoId;
    this.productoService.getAll().subscribe({
      next: (data) => {
        this.productos = data;
        // Solo establecer el primer producto si no hay uno seleccionado
        if (data.length > 0 && (!productoIdActual || productoIdActual === 0)) {
          this.nuevaVenta.productoId = data[0].id;
        }
      }
    });
  }

  guardarVenta(): void {
    if (this.editando && this.ventaEditando) {
      // Actualizar venta existente
      this.ventaService.update(this.ventaEditando.id, this.nuevaVenta).subscribe({
        next: () => {
          this.cargarVentas();
          this.cargarProductos(); // Recargar para actualizar stock
          this.mostrarFormulario = false;
          this.resetearFormulario();
          this.mostrarNotificacion('Venta actualizada exitosamente.', 'success');
        },
        error: (error) => {
          console.error('Error al actualizar venta:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al actualizar la venta', 'error');
        }
      });
    } else {
      // Crear nueva venta
      // Establecer fecha y hora automáticamente antes de guardar
      const ahora = new Date();
      const año = ahora.getFullYear();
      const mes = String(ahora.getMonth() + 1).padStart(2, '0');
      const dia = String(ahora.getDate()).padStart(2, '0');
      this.nuevaVenta.fecha = `${año}-${mes}-${dia}`;
      this.nuevaVenta.hora = ahora.toTimeString().slice(0, 5);
      
      this.ventaService.create(this.nuevaVenta).subscribe({
        next: () => {
          // Si es barbero, no recargar la lista, solo recargar productos para actualizar stock
          if (!this.esBarbero) {
            this.cargarVentas();
          }
          this.cargarProductos(); // Recargar para actualizar stock
          // Si es barbero, mantener el formulario visible
          if (!this.esBarbero) {
            this.mostrarFormulario = false;
          }
          this.resetearFormulario();
          this.mostrarNotificacion('Venta registrada exitosamente.', 'success');
        },
        error: (error) => {
          console.error('Error al guardar venta:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al guardar la venta', 'error');
        }
      });
    }
  }

  resetearFormulario(): void {
    this.nuevaVenta = {
      fecha: '', // Se establecerá automáticamente al guardar
      hora: '', // Se establecerá automáticamente al guardar
      barberoId: this.barberos.length > 0 ? this.barberos[0].id : 0,
      productoId: this.productos.length > 0 ? this.productos[0].id : 0,
      cantidad: 1,
      metodoPago: 'Efectivo'
    };
    this.editando = false;
    this.ventaEditando = null;
  }

  onProductoSeleccionado(event: any): void {
    // Convertir productoId a número si viene como string del select
    const value = event?.target?.value;
    if (value) {
      this.nuevaVenta.productoId = parseInt(value, 10);
    }
  }

  getProductoStock(productoId: number | string | null | undefined): number {
    // Convertir a número si es string o null/undefined
    if (!productoId || productoId === '' || productoId === 0) {
      return 0;
    }
    const id = typeof productoId === 'string' ? parseInt(productoId, 10) : productoId;
    if (isNaN(id) || id === 0) {
      return 0;
    }
    const producto = this.productos.find(p => p.id === id);
    return producto ? producto.stock : 0;
  }

  editar(venta: VentaProducto): void {
    this.ventaEditando = venta;
    this.editando = true;
    this.nuevaVenta = {
      fecha: venta.fecha,
      hora: venta.hora,
      barberoId: venta.barberoId,
      productoId: venta.productoId,
      cantidad: venta.cantidad,
      metodoPago: venta.metodoPago
    };
    this.mostrarFormulario = true;
    // Asegurar que los productos estén cargados
    this.cargarProductos();
  }

  eliminar(venta: VentaProducto): void {
    this.mensajeConfirmacion = `¿Está seguro de que desea eliminar la venta del producto "${venta.productoNombre}"?`;
    this.accionConfirmacion = () => {
      this.ventaService.delete(venta.id).subscribe({
        next: () => {
          this.cargarVentas();
          this.cargarProductos(); // Recargar para actualizar stock
          this.mostrarNotificacion('Venta eliminada exitosamente.', 'success');
        },
        error: (error) => {
          console.error('Error al eliminar venta:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al eliminar la venta', 'error');
        }
      });
    };
    this.mostrarModalConfirmacion = true;
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.ventaEditando = null;
    this.resetearFormulario();
    this.mostrarFormulario = false;
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
