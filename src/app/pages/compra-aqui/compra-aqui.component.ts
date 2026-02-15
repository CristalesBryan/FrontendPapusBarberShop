import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { environment } from '../../../environments/environment';

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-compra-aqui',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compra-aqui.component.html',
  styleUrls: ['./compra-aqui.component.css']
})
export class CompraAquiComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  cargando = true;
  productosFiltrados: Producto[] = [];
  terminoBusqueda: string = '';
  
  // Variables para el modal de imagen
  mostrarModalImagen = false;
  imagenModalUrl = '';
  productoModal: Producto | null = null;
  
  // Variables para el carrito
  carrito: ItemCarrito[] = [];
  mostrarCarrito = false;
  
  // Variables para el modal de confirmación
  mostrarModalConfirmacion = false;
  confirmacionTitulo = '';
  confirmacionMensaje = '';
  confirmacionAccion: (() => void) | null = null;
  confirmacionTipo: 'success' | 'warning' | 'danger' | 'info' = 'warning';
  
  // Array para generar partículas
  particulas = Array.from({ length: 20 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random(),
    duration: 0.5 + Math.random() * 0.5
  }));

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Asegurar que el modal esté cerrado al iniciar
    this.mostrarModalImagen = false;
    this.productoModal = null;
    this.imagenModalUrl = '';
    
    this.cargarProductos();
    
    // Escuchar eventos de actualización de productos (solo para recargar, sin polling)
    window.addEventListener('productoActualizado', () => {
      this.cargarProductos();
    });
    
    // Escuchar tecla ESC para cerrar el modal y el carrito
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (this.mostrarModalImagen) {
          this.cerrarModalImagen();
        } else if (this.mostrarModalConfirmacion) {
          this.cerrarModalConfirmacion();
        } else if (this.mostrarCarrito) {
          this.cerrarCarrito();
        }
      }
    });
    
    // Cerrar el carrito al hacer clic fuera de él
    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (this.mostrarCarrito && 
          !target.closest('.carrito-dropdown-container') && 
          !target.closest('.carrito-dropdown')) {
        this.cerrarCarrito();
      }
    });
  }

  cargarProductos(): void {
    this.cargando = true;
    this.productoService.getAll().subscribe({
      next: (data) => {
        // Mostrar todos los productos (sin filtrar por stock)
        // La descripción ahora viene del backend, no de localStorage
        // Las URLs presignadas ya vienen en imagenUrl desde el backend
        this.productos = data.map(p => ({
          ...p,
          descripcion: p.descripcion || this.obtenerDescripcion(p.id) // Fallback a localStorage por compatibilidad
        }));
        this.productosFiltrados = this.productos;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.cargando = false;
      }
    });
  }


  obtenerDescripcion(productoId: number): string {
    // Obtener descripción desde localStorage (igual que en gestion-catalogo)
    const descripciones = JSON.parse(localStorage.getItem('productoDescripciones') || '{}');
    return descripciones[productoId] || '';
  }


  buscarProductos(): void {
    if (!this.terminoBusqueda.trim()) {
      this.productosFiltrados = this.productos;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.productosFiltrados = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(termino)
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.productosFiltrados = this.productos;
  }

  private cacheImagenes: Map<number, string> = new Map(); // Cache simple para placeholders

  /**
   * Obtiene la URL pública directa de la imagen del producto desde S3.
   * El bucket es público, por lo que usamos URLs directas en lugar de presignadas.
   * 
   * @param producto Producto del cual obtener la imagen
   * @returns URL pública directa de S3 o placeholder si no hay imagen
   */
  getProductoImagen(producto: Producto): string {
    // Si hay imagenUrl, extraer el s3Key y construir URL pública directa
    if (producto.imagenUrl) {
      // Extraer s3Key de la URL (puede ser presignada o pública)
      const s3Key = this.extractS3KeyFromUrl(producto.imagenUrl);
      
      if (s3Key) {
        // Construir URL pública directa del bucket público
        const bucketName = environment.s3.bucketName || 'papusbarbershop';
        const region = environment.s3.region || 'us-east-2';
        const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
        
        // Cachear la URL pública
        if (!this.cacheImagenes.has(producto.id)) {
          this.cacheImagenes.set(producto.id, publicUrl);
        }
        
        return publicUrl;
      }
    }
    
    // Si no hay imagenUrl o no se pudo extraer el s3Key, usar placeholder
    const placeholderUrl = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaW4gaW1hZ2VuPC90ZXh0Pjwvc3ZnPg==`;
    
    // Cachear el placeholder para evitar recrearlo
    if (!this.cacheImagenes.has(producto.id)) {
      this.cacheImagenes.set(producto.id, placeholderUrl);
    }
    
    return this.cacheImagenes.get(producto.id) || placeholderUrl;
  }

  /**
   * Extrae el s3Key de una URL de S3 (presignada o pública).
   * 
   * Las URLs presignadas tienen el formato:
   * https://bucket.s3.region.amazonaws.com/key?X-Amz-Algorithm=...
   * 
   * Las URLs públicas tienen el formato:
   * https://bucket.s3.region.amazonaws.com/key
   * 
   * @param url URL de S3 (presignada o pública)
   * @returns s3Key o null si no se puede extraer
   */
  private extractS3KeyFromUrl(url: string): string | null {
    if (!url) return null;
    
    try {
      // Si la URL ya es un s3Key (sin dominio), retornarla tal cual
      if (!url.includes('http') && !url.includes('://') && !url.includes('?')) {
        return url;
      }
      
      // Parsear la URL
      const urlObj = new URL(url);
      
      // El s3Key está en el pathname, después del primer /
      // Ejemplo: /productos/imagen.jpg -> productos/imagen.jpg
      let s3Key = urlObj.pathname;
      
      // Remover el primer / si existe
      if (s3Key.startsWith('/')) {
        s3Key = s3Key.substring(1);
      }
      
      // Decodificar caracteres especiales
      s3Key = decodeURIComponent(s3Key);
      
      // Si el s3Key está vacío, intentar extraerlo de otra forma
      if (!s3Key || s3Key.trim() === '') {
        // Intentar con regex para URLs de S3
        const match = url.match(/s3[.-][^/]+\.amazonaws\.com\/(.+?)(?:\?|$)/);
        if (match && match[1]) {
          s3Key = decodeURIComponent(match[1]);
        }
      }
      
      return s3Key && s3Key.trim() !== '' ? s3Key : null;
    } catch (error) {
      console.error('Error al extraer s3Key de URL:', url, error);
      return null;
    }
  }

  onImageError(event: Event, producto: Producto): void {
    const img = event.target as HTMLImageElement;
    if (!img) return;

    // Si la imagen falla, mostrar placeholder
    img.onerror = null; // Evitar loop infinito
    img.style.display = 'none';
    if (img.parentElement) {
      img.parentElement.innerHTML = '<div class="producto-imagen-placeholder"><i class="fas fa-image fa-3x"></i><p>Sin imagen</p></div>';
    }
    
    // Limpiar cache cuando hay error
    this.cacheImagenes.delete(producto.id);
  }

  abrirModalImagen(producto: Producto): void {
    // Solo abrir si hay un producto válido
    if (!producto) return;
    
    this.productoModal = producto;
    this.imagenModalUrl = this.getProductoImagen(producto);
    this.mostrarModalImagen = true;
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  cerrarModalImagen(): void {
    // Cerrar el modal inmediatamente
    this.mostrarModalImagen = false;
    this.productoModal = null;
    this.imagenModalUrl = '';
    // Restaurar scroll del body
    document.body.style.overflow = '';
  }

  // Métodos del carrito
  agregarAlCarrito(producto: Producto): void {
    if (producto.stock === 0) {
      alert('Este producto no tiene stock disponible');
      return;
    }
    
    const itemExistente = this.carrito.find(item => item.producto.id === producto.id);
    
    if (itemExistente) {
      // Si el producto ya está en el carrito, aumentar la cantidad
      if (itemExistente.cantidad < producto.stock) {
        itemExistente.cantidad++;
      } else {
        alert(`No hay suficiente stock. Stock disponible: ${producto.stock}`);
      }
    } else {
      // Si es un producto nuevo, agregarlo al carrito
      this.carrito.push({
        producto: producto,
        cantidad: 1
      });
    }
    
    // Mostrar el carrito automáticamente cuando se agrega un producto
    this.mostrarCarrito = true;
  }

  eliminarDelCarrito(productoId: number): void {
    this.carrito = this.carrito.filter(item => item.producto.id !== productoId);
  }

  actualizarCantidad(productoId: number, nuevaCantidad: number): void {
    const item = this.carrito.find(item => item.producto.id === productoId);
    if (item) {
      if (nuevaCantidad <= 0) {
        this.eliminarDelCarrito(productoId);
      } else if (nuevaCantidad <= item.producto.stock) {
        item.cantidad = nuevaCantidad;
      } else {
        alert(`No hay suficiente stock. Stock disponible: ${item.producto.stock}`);
        item.cantidad = item.producto.stock;
      }
    }
  }

  getTotalCarrito(): number {
    return this.carrito.reduce((total, item) => {
      return total + (item.producto.precioVenta * item.cantidad);
    }, 0);
  }

  getCantidadTotalItems(): number {
    return this.carrito.reduce((total, item) => total + item.cantidad, 0);
  }

  vaciarCarrito(): void {
    this.mostrarConfirmacion(
      'Vaciar Carrito',
      '¿Está seguro de que desea vaciar el carrito? Se eliminarán todos los productos seleccionados.',
      'warning',
      () => {
        this.carrito = [];
        this.cerrarModalConfirmacion();
      }
    );
  }

  mostrarConfirmacion(titulo: string, mensaje: string, tipo: 'success' | 'warning' | 'danger' | 'info', accion: () => void): void {
    this.confirmacionTitulo = titulo;
    this.confirmacionMensaje = mensaje;
    this.confirmacionTipo = tipo;
    this.confirmacionAccion = accion;
    this.mostrarModalConfirmacion = true;
    document.body.style.overflow = 'hidden';
  }

  confirmarAccion(): void {
    if (this.confirmacionAccion) {
      this.confirmacionAccion();
    }
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.confirmacionTitulo = '';
    this.confirmacionMensaje = '';
    this.confirmacionAccion = null;
    document.body.style.overflow = '';
  }

  toggleCarrito(): void {
    this.mostrarCarrito = !this.mostrarCarrito;
  }

  cerrarCarrito(): void {
    this.mostrarCarrito = false;
  }

  finalizarCompra(): void {
    if (this.carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    // Número de WhatsApp de la barbería
    const whatsappNumber = '50247979922';
    
    // Construir el mensaje
    let mensaje = 'Quisiera Pedir estos productos:\n\n';
    
    // Agregar cada producto con su cantidad y precio
    this.carrito.forEach((item, index) => {
      mensaje += `${index + 1}. ${item.producto.nombre}\n`;
      mensaje += `   Cantidad: ${item.cantidad}\n`;
      mensaje += `   Precio unitario: Q${item.producto.precioVenta.toFixed(2)}\n`;
      mensaje += `   Subtotal: Q${(item.producto.precioVenta * item.cantidad).toFixed(2)}\n\n`;
    });
    
    // Agregar el total
    mensaje += `━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `TOTAL: Q${this.getTotalCarrito().toFixed(2)}\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━`;
    
    // Codificar el mensaje para la URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    // Crear la URL de WhatsApp
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${mensajeCodificado}`;
    
    // Abrir WhatsApp en una nueva ventana
    window.open(whatsappUrl, '_blank');
    
    // Opcional: vaciar el carrito después de enviar
    // this.carrito = [];
    // this.cerrarCarrito();
  }

  ngOnDestroy(): void {
    // Asegurar que el modal esté cerrado al destruir el componente
    this.cerrarModalImagen();
  }

  onImageErrorModal(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    
    // Si hay un producto modal, intentar cargar la imagen con el método normal
    if (this.productoModal) {
      // Intentar diferentes extensiones
      const extensiones = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const nombre = this.productoModal.nombre.toLowerCase();
      const nombreSinEspacios = nombre.replace(/\s+/g, '');
      
      // Intentar con diferentes extensiones
      const intentos = extensiones.map(ext => `/assets/images/Productos/${nombreSinEspacios}${ext}?t=${new Date().getTime()}`);
      
      let intentoActual = 0;
      const intentarSiguiente = () => {
        if (intentoActual < intentos.length) {
          img.src = intentos[intentoActual];
          intentoActual++;
        } else {
          // Si todas fallan, mostrar placeholder
          img.onerror = null;
          img.style.display = 'none';
          if (img.parentElement) {
            img.parentElement.innerHTML = '<div class="modal-imagen-placeholder"><i class="fas fa-image fa-5x"></i><p>Imagen no disponible</p></div>';
          }
        }
      };
      
      img.onerror = intentarSiguiente;
      intentarSiguiente();
    } else {
      // Si no hay producto, mostrar placeholder
      img.onerror = null;
      img.style.display = 'none';
      if (img.parentElement) {
        img.parentElement.innerHTML = '<div class="modal-imagen-placeholder"><i class="fas fa-image fa-5x"></i><p>Imagen no disponible</p></div>';
      }
    }
  }
}
