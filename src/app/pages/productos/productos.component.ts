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
  nuevoProducto: ProductoCreate = { nombre: '', stock: 0, precioCosto: 0, precioVenta: 0, comision: 1 };
  productoEditando: Producto | null = null;
  mostrarFormulario = false;
  cargando = true;
  
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
          // Disparar evento para actualizar otras vistas
          window.dispatchEvent(new Event('productoActualizado'));
        }
      });
    } else {
      this.productoService.create(this.nuevoProducto).subscribe({
        next: () => {
          this.cargarProductos();
          this.cancelar();
          // Disparar evento para actualizar otras vistas
          window.dispatchEvent(new Event('productoActualizado'));
        }
      });
    }
  }

  editar(producto: Producto): void {
    this.productoEditando = producto;
    this.nuevoProducto = { ...producto };
    this.mostrarFormulario = true;
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.productoEditando = null;
    this.nuevoProducto = { nombre: '', stock: 0, precioCosto: 0, precioVenta: 0, comision: 1 };
  }

  eliminar(producto: Producto): void {
    if (confirm(`¿Está seguro de que desea eliminar el producto "${producto.nombre}"?`)) {
      this.productoService.delete(producto.id).subscribe({
        next: () => {
          this.cargarProductos();
          alert('Producto eliminado exitosamente');
          // Disparar evento para actualizar otras vistas
          window.dispatchEvent(new Event('productoActualizado'));
        },
        error: (error) => {
          console.error('Error al eliminar producto:', error);
          alert(error.error?.message || 'Error al eliminar el producto');
        }
      });
    }
  }
}

