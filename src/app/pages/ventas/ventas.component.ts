import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaProductoService } from '../../services/venta-producto.service';
import { BarberoService } from '../../services/barbero.service';
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service';
import { ReporteService } from '../../services/reporte.service';
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
    fecha: '',
    hora: '',
    barberoId: 0,
    productoId: 0,
    cantidad: 1,
    metodoPago: 'Efectivo',
    descuentoPorcentaje: 0
  };
  mostrarFormulario = false;
  editando = false;
  ventaEditando: VentaProducto | null = null;
  cargando = true;
  esBarbero = false;
  esCesia = false;

  mostrarModalNotificacion = false;
  mensajeNotificacion = '';
  tipoNotificacion: 'success' | 'error' | 'info' | 'warning' = 'info';
  mostrarModalConfirmacion = false;
  mensajeConfirmacion = '';
  accionConfirmacion: (() => void) | null = null;

  /** Vacío = sin filtro por fecha; formato `yyyy-MM-dd` del input type="date". */
  filtroFecha = '';
  /** null = todos los barberos */
  filtroBarberoId: number | null = null;

  paginaActual = 1;
  tamanoPagina = 10;
  tamanoPaginaSelect = 10;
  tamanoPaginaCustom = 15;

  constructor(
    private ventaService: VentaProductoService,
    private barberoService: BarberoService,
    private productoService: ProductoService,
    private authService: AuthService,
    private reporteService: ReporteService
  ) {}

  toggleFormulario(): void {
    if (this.editando) {
      this.cancelarEdicion();
    } else {
      this.mostrarFormulario = !this.mostrarFormulario;
      if (this.mostrarFormulario) {
        this.cargarProductos();
      }
    }
  }

  ngOnInit(): void {
    this.esBarbero = this.authService.isBarbero();
    this.esCesia = this.authService.isCesia();

    if (this.esBarbero || this.esCesia) {
      this.mostrarFormulario = true;
    }

    if (!this.esBarbero && !this.esCesia) {
      this.cargarVentas();
    }

    this.cargarBarberos();
    this.cargarProductos();

    window.addEventListener('barberosActualizados', () => {
      this.cargarBarberos();
    });
  }

  cargarVentas(): void {
    this.cargando = true;
    this.ventaService.getAll().subscribe({
      next: data => {
        this.ventas = data;
        this.cargando = false;
        this.sincronizarPagina();
      },
      error: error => {
        console.error('Error al cargar ventas:', error);
        this.cargando = false;
      }
    });
  }

  cargarBarberos(): void {
    this.barberoService.getAll().subscribe({
      next: data => {
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
      next: data => {
        this.productos = data;
        if (data.length > 0 && (!productoIdActual || productoIdActual === 0)) {
          this.nuevaVenta.productoId = data[0].id;
        }
      }
    });
  }

  guardarVenta(): void {
    this.normalizarDescuentoVenta();

    if (this.editando && this.ventaEditando) {
      this.ventaService.update(this.ventaEditando.id, this.nuevaVenta).subscribe({
        next: () => {
          this.cargarVentas();
          this.cargarProductos();
          this.mostrarFormulario = false;
          this.resetearFormulario();
          this.mostrarNotificacion('Venta actualizada exitosamente.', 'success');
          this.reporteService.notificarCambioDatosReporte();
        },
        error: error => {
          console.error('Error al actualizar venta:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al actualizar la venta', 'error');
        }
      });
    } else {
      const ahora = new Date();
      const anio = ahora.getFullYear();
      const mes = String(ahora.getMonth() + 1).padStart(2, '0');
      const dia = String(ahora.getDate()).padStart(2, '0');
      this.nuevaVenta.fecha = `${anio}-${mes}-${dia}`;
      this.nuevaVenta.hora = ahora.toTimeString().slice(0, 5);

      this.ventaService.create(this.nuevaVenta).subscribe({
        next: () => {
          if (!this.esBarbero && !this.esCesia) {
            this.cargarVentas();
            this.mostrarFormulario = false;
          }
          this.cargarProductos();
          this.resetearFormulario();
          this.mostrarNotificacion('Venta registrada exitosamente.', 'success');
          this.reporteService.notificarCambioDatosReporte();
        },
        error: error => {
          console.error('Error al guardar venta:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al guardar la venta', 'error');
        }
      });
    }
  }

  resetearFormulario(): void {
    this.nuevaVenta = {
      fecha: '',
      hora: '',
      barberoId: this.barberos.length > 0 ? this.barberos[0].id : 0,
      productoId: this.productos.length > 0 ? this.productos[0].id : 0,
      cantidad: 1,
      metodoPago: 'Efectivo',
      descuentoPorcentaje: 0
    };
    this.editando = false;
    this.ventaEditando = null;
  }

  onProductoSeleccionado(event: any): void {
    const value = event?.target?.value;
    if (value) {
      this.nuevaVenta.productoId = parseInt(value, 10);
    }
  }

  normalizarDescuentoVenta(): void {
    if (this.nuevaVenta.descuentoPorcentaje == null || isNaN(this.nuevaVenta.descuentoPorcentaje as any)) {
      this.nuevaVenta.descuentoPorcentaje = 0;
    }
    this.nuevaVenta.descuentoPorcentaje = Math.max(0, this.nuevaVenta.descuentoPorcentaje);
  }

  getPrecioUnitarioSeleccionado(): number {
    const producto = this.productos.find(p => p.id === this.nuevaVenta.productoId);
    return producto?.precioVenta || 0;
  }

  getImporteOriginalVenta(): number {
    return +(this.getPrecioUnitarioSeleccionado() * (this.nuevaVenta.cantidad || 0)).toFixed(2);
  }

  getImporteFinalVenta(): number {
    const original = this.getImporteOriginalVenta();
    const descuento = this.nuevaVenta.descuentoPorcentaje || 0;
    return +Math.max(0, (original * (1 - descuento / 100))).toFixed(2);
  }

  getProductoStock(productoId: number | string | null | undefined): number {
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
      productoId: venta.productoId || 0,
      cantidad: venta.cantidad,
      metodoPago: venta.metodoPago,
      descuentoPorcentaje: venta.descuentoPorcentaje ?? 0
    };
    this.mostrarFormulario = true;
    this.cargarProductos();
  }

  eliminar(venta: VentaProducto): void {
    this.mensajeConfirmacion =
      'Seguro que desea eliminar la venta del producto "' + (venta.productoNombre || '') + '"?';
    this.accionConfirmacion = () => {
      this.ventaService.delete(venta.id).subscribe({
        next: () => {
          this.cargarVentas();
          this.cargarProductos();
          this.mostrarNotificacion('Venta eliminada exitosamente.', 'success');
          this.reporteService.notificarCambioDatosReporte();
        },
        error: error => {
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

  get ventasFiltradas(): VentaProducto[] {
    return this.ventas.filter(v => {
      if (this.filtroFecha) {
        const fechaVenta = (v.fecha || '').slice(0, 10);
        if (fechaVenta !== this.filtroFecha) return false;
      }
      if (this.filtroBarberoId != null && v.barberoId !== this.filtroBarberoId) return false;
      return true;
    });
  }

  get totalFiltrados(): number {
    return this.ventasFiltradas.length;
  }

  get totalPaginas(): number {
    const n = this.totalFiltrados;
    if (this.tamanoPagina === 0 || n === 0) return 1;
    return Math.max(1, Math.ceil(n / this.tamanoPagina));
  }

  get ventasPagina(): VentaProducto[] {
    const list = this.ventasFiltradas;
    if (this.tamanoPagina === 0) return list;
    const start = (this.paginaActual - 1) * this.tamanoPagina;
    return list.slice(start, start + this.tamanoPagina);
  }

  get inicioVisible(): number {
    if (this.totalFiltrados === 0) return 0;
    if (this.tamanoPagina === 0) return 1;
    return (this.paginaActual - 1) * this.tamanoPagina + 1;
  }

  get finVisible(): number {
    if (this.totalFiltrados === 0) return 0;
    if (this.tamanoPagina === 0) return this.totalFiltrados;
    return Math.min(this.paginaActual * this.tamanoPagina, this.totalFiltrados);
  }

  onFiltroListaChange(): void {
    this.paginaActual = 1;
  }

  onTamanoPaginaChange(): void {
    this.paginaActual = 1;
    this.sincronizarPagina();
  }

  onTamanoPaginaSelectChange(): void {
    if (this.tamanoPaginaSelect === -1) {
      let t = Math.floor(Number(this.tamanoPaginaCustom));
      if (!Number.isFinite(t) || t < 1) t = 15;
      if (t > 9999) t = 9999;
      this.tamanoPaginaCustom = t;
      this.tamanoPagina = t;
    } else {
      this.tamanoPagina = this.tamanoPaginaSelect;
    }
    this.onTamanoPaginaChange();
  }

  onTamanoPaginaCustomChange(): void {
    if (this.tamanoPaginaSelect !== -1) return;
    let t = Math.floor(Number(this.tamanoPaginaCustom));
    if (!Number.isFinite(t) || t < 1) t = 1;
    if (t > 9999) t = 9999;
    this.tamanoPaginaCustom = t;
    this.tamanoPagina = t;
    this.onTamanoPaginaChange();
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  private sincronizarPagina(): void {
    const tp = this.totalPaginas;
    if (this.paginaActual > tp) this.paginaActual = tp;
    if (this.paginaActual < 1) this.paginaActual = 1;
  }

  limpiarFiltrosLista(): void {
    this.filtroFecha = '';
    this.filtroBarberoId = null;
    this.paginaActual = 1;
  }
}
