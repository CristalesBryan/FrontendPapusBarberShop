import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto, ProductoCreate } from '../../models/producto.model';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  nuevoProducto: ProductoCreate = { nombre: '', stock: 0, precioCosto: 0, precioVenta: 0, comision: 1, comisionHabilitada: true };
  productoEditando: Producto | null = null;
  mostrarFormulario = false;
  cargando = true;

  // Modales dinámicos
  mostrarModalConfirmacion = false;
  mensajeConfirmacion = '';
  accionConfirmacion: (() => void) | null = null;
  mostrarModalNotificacion = false;
  mensajeNotificacion = '';
  tipoNotificacion: 'success' | 'error' | 'info' | 'warning' = 'info';
  private readonly ORDEN_LOCAL_STORAGE_KEY = 'ordenManualProductos';
  productoArrastradoId: number | null = null;
  
  // Listener para eventos de actualización de productos
  private productoActualizadoListener = () => {
    this.cargarProductos();
  };

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.cargarProductos();
    // Escuchar eventos de actualización de productos desde otras vistas
    window.addEventListener('productoActualizado', this.productoActualizadoListener);
  }

  ngOnDestroy(): void {
    // Remover el listener al destruir el componente
    window.removeEventListener('productoActualizado', this.productoActualizadoListener);
  }

  cargarProductos(): void {
    this.cargando = true;
    this.productoService.getAll().subscribe({
      next: (data) => {
        this.productos = data;
        this.aplicarOrdenManual();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.cargando = false;
      }
    });
  }

  guardarProducto(): void {
    if (this.productoEditando) {
      this.productoService.update(this.productoEditando.id, this.nuevoProducto).subscribe({
        next: () => {
          this.cargarProductos();
          this.cancelar();
          this.mostrarNotificacion('Guardado exitosamente.', 'success');
          // Disparar evento para actualizar otras vistas
          window.dispatchEvent(new Event('productoActualizado'));
        },
        error: (error) => {
          console.error('Error al actualizar producto:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al guardar el producto', 'error');
        }
      });
    } else {
      this.productoService.create(this.nuevoProducto).subscribe({
        next: () => {
          this.cargarProductos();
          this.cancelar();
          this.mostrarNotificacion('Guardado exitosamente.', 'success');
          // Disparar evento para actualizar otras vistas
          window.dispatchEvent(new Event('productoActualizado'));
        },
        error: (error) => {
          console.error('Error al crear producto:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al guardar el producto', 'error');
        }
      });
    }
  }

  editar(producto: Producto): void {
    this.productoEditando = producto;
    // Solo campos del DTO (sin id ni imagenUrl): en prod fail-on-unknown-properties=true rechaza JSON extra.
    this.nuevoProducto = {
      nombre: producto.nombre,
      stock: producto.stock,
      precioCosto: producto.precioCosto,
      precioVenta: producto.precioVenta,
      comision: producto.comision ?? 1,
      comisionHabilitada: producto.comision != null,
      descripcion: producto.descripcion
    };
    this.mostrarFormulario = true;
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.productoEditando = null;
    this.nuevoProducto = { nombre: '', stock: 0, precioCosto: 0, precioVenta: 0, comision: 1, comisionHabilitada: true };
  }

  onComisionHabilitadaChange(): void {
    if (!this.nuevoProducto.comisionHabilitada) {
      this.nuevoProducto.comision = null;
      return;
    }
    if (this.nuevoProducto.comision == null || this.nuevoProducto.comision < 1) {
      this.nuevoProducto.comision = 1;
    }
  }

  eliminar(producto: Producto): void {
    this.mensajeConfirmacion = `¿Está seguro de que desea eliminar el producto "${producto.nombre}"?`;
    this.accionConfirmacion = () => {
      this.productoService.delete(producto.id).subscribe({
        next: () => {
          this.cargarProductos();
          this.mostrarNotificacion('Producto eliminado exitosamente', 'success');
          window.dispatchEvent(new Event('productoActualizado'));
        },
        error: (error) => {
          console.error('Error al eliminar producto:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al eliminar el producto', 'error');
        }
      });
    };
    this.mostrarModalConfirmacion = true;
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.mensajeNotificacion = mensaje;
    this.tipoNotificacion = tipo;
    this.mostrarModalNotificacion = true;
  }

  onDragStart(productoId: number): void {
    this.productoArrastradoId = productoId;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(productoDestinoId: number): void {
    if (this.productoArrastradoId == null || this.productoArrastradoId === productoDestinoId) return;

    const indexOrigen = this.productos.findIndex(p => p.id === this.productoArrastradoId);
    const indexDestino = this.productos.findIndex(p => p.id === productoDestinoId);
    if (indexOrigen < 0 || indexDestino < 0) return;

    const [movido] = this.productos.splice(indexOrigen, 1);
    this.productos.splice(indexDestino, 0, movido);
    this.guardarOrdenManual();
    this.productoArrastradoId = null;
  }

  onDragEnd(): void {
    this.productoArrastradoId = null;
  }

  cerrarModalNotificacion(): void {
    this.mostrarModalNotificacion = false;
    setTimeout(() => { this.mensajeNotificacion = ''; }, 300);
  }

  confirmarAccion(): void {
    if (this.accionConfirmacion) this.accionConfirmacion();
    this.cerrarModalConfirmacion();
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.mensajeConfirmacion = '';
    this.accionConfirmacion = null;
  }

  private aplicarOrdenManual(): void {
    const ordenRaw = localStorage.getItem(this.ORDEN_LOCAL_STORAGE_KEY);
    if (!ordenRaw) return;

    try {
      const ordenIds = JSON.parse(ordenRaw) as number[];
      if (!Array.isArray(ordenIds) || ordenIds.length === 0) return;

      const posicion = new Map<number, number>();
      ordenIds.forEach((id, index) => posicion.set(id, index));
      this.productos.sort((a, b) => {
        const posA = posicion.has(a.id) ? (posicion.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
        const posB = posicion.has(b.id) ? (posicion.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
    } catch {
      localStorage.removeItem(this.ORDEN_LOCAL_STORAGE_KEY);
    }
  }

  private guardarOrdenManual(): void {
    const ordenIds = this.productos.map(p => p.id);
    localStorage.setItem(this.ORDEN_LOCAL_STORAGE_KEY, JSON.stringify(ordenIds));
  }
}

