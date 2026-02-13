import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { S3Service } from '../../services/s3.service';
import { Producto, ProductoCreate } from '../../models/producto.model';

interface ProductoCatalogo extends Producto {
  descripcion?: string;
  imagenUrl?: string;
}

@Component({
  selector: 'app-gestion-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-catalogo.component.html',
  styleUrls: ['./gestion-catalogo.component.css']
})
export class GestionCatalogoComponent implements OnInit {
  productos: ProductoCatalogo[] = [];
  productoEditando: ProductoCatalogo | null = null;
  mostrarFormulario = false;
  cargando = true;
  imagenSeleccionada: File | null = null;
  nombreImagenSeleccionada: string | null = null;
  vistaPreviaImagen: string | null = null;
  
  // Variables para el modal de imagen
  mostrarModalImagen = false;
  imagenModalUrl = '';
  productoModal: ProductoCatalogo | null = null;

  productoForm: ProductoCatalogo = {
    id: 0,
    nombre: '',
    stock: 0,
    precioCosto: 0,
    precioVenta: 0,
    comision: 1,
    descripcion: '',
    imagenUrl: ''
  };

  private cacheImagenes: Map<number, string> = new Map(); // Cache de URLs estables por producto
  private cachePresignedUrls: Map<number, { url: string; expiresAt: number }> = new Map(); // Cache de URLs presignadas con expiración
  private solicitudesEnCurso: Set<number> = new Set(); // Rastrear productos con solicitudes de URL presignada en curso

  constructor(
    private productoService: ProductoService,
    private s3Service: S3Service,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    // Sincronizar referencias existentes de localStorage al backend
    this.sincronizarReferenciasExistentesAlBackend();
    // Escuchar eventos de actualización de productos
    window.addEventListener('productoActualizado', () => {
      this.cargarProductos();
      setTimeout(() => {
        this.actualizarImagenes();
      }, 100);
    });
  }

  cargarProductos(): void {
    this.cargando = true;
    this.productoService.getAll().subscribe({
      next: (data) => {
        this.productos = data.map(p => ({
          ...p,
          // La descripción ahora viene del backend, no de localStorage
          descripcion: p.descripcion || this.obtenerDescripcion(p.id), // Fallback a localStorage por compatibilidad
          imagenUrl: this.obtenerImagenUrl(p)
        }));
        this.cargando = false;
        
        // Pre-cargar URLs presignadas para productos con imágenes en S3
        this.preCargarUrlsPresignadas();
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.cargando = false;
      }
    });
  }

  private preCargarUrlsPresignadas(): void {
    const imagenesProductos = JSON.parse(localStorage.getItem('productoImagenes') || '{}');
    
    // Obtener URLs presignadas para todos los productos que tienen s3Key
    this.productos.forEach(producto => {
      if (imagenesProductos[producto.id]?.s3Key) {
        const s3Key = imagenesProductos[producto.id].s3Key;
        // Verificar si ya tenemos una URL presignada válida
        const cachedPresigned = this.cachePresignedUrls.get(producto.id);
        // Solo solicitar si no hay cache válido Y no hay una solicitud en curso
        if ((!cachedPresigned || cachedPresigned.expiresAt <= Date.now()) && !this.solicitudesEnCurso.has(producto.id)) {
          // Obtener nueva URL presignada
          this.obtenerPresignedUrl(producto.id, s3Key);
        }
      }
    });
  }

  obtenerImagenUrl(producto: Producto): string {
    // Verificar si hay una imagen guardada en localStorage
    const imagenesProductos = JSON.parse(localStorage.getItem('productoImagenes') || '{}');
    
    // Si hay una imagen en S3 guardada, obtener URL presignada
    if (imagenesProductos[producto.id]?.s3Key) {
      const s3Key = imagenesProductos[producto.id].s3Key;
      
      // Verificar si tenemos una URL presignada válida en cache
      const cachedPresigned = this.cachePresignedUrls.get(producto.id);
      if (cachedPresigned && cachedPresigned.expiresAt > Date.now()) {
        // La URL presignada aún es válida
        this.cacheImagenes.set(producto.id, cachedPresigned.url);
        return cachedPresigned.url;
      }
      
      // Verificar si ya tenemos una URL en cache (puede ser la presignada que se obtuvo recientemente)
      if (this.cacheImagenes.has(producto.id)) {
        const cachedUrl = this.cacheImagenes.get(producto.id)!;
        // Si la URL cacheada no es la temporal, usarla (probablemente es la presignada)
        if (!cachedUrl.startsWith('data:image/svg+xml')) {
          return cachedUrl;
        }
      }
      
      // Si no hay URL presignada válida y no hay una solicitud en curso, obtener una nueva de forma asíncrona
      if (!this.solicitudesEnCurso.has(producto.id)) {
        this.obtenerPresignedUrl(producto.id, s3Key);
      }
      
      // Usar una URL temporal mientras se obtiene la presignada
      const tempUrl = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYXJnYW5kby4uLjwvdGV4dD48L3N2Zz4=`;
      // Solo actualizar el cache si no hay una URL presignada válida ya guardada
      if (!this.cacheImagenes.has(producto.id) || this.cacheImagenes.get(producto.id) === tempUrl) {
        this.cacheImagenes.set(producto.id, tempUrl);
      }
      return this.cacheImagenes.get(producto.id) || tempUrl;
    }
    
    // Si ya tenemos una URL en cache para este producto y no hay S3, usarla
    if (this.cacheImagenes.has(producto.id)) {
      return this.cacheImagenes.get(producto.id)!;
    }
    
    // Solo lectura: Verificar si hay un nombre de archivo local guardado (compatibilidad con imágenes antiguas existentes)
    // En producción, no se permiten nuevas imágenes locales, solo se muestran las existentes
    if (imagenesProductos[producto.id]?.nombreArchivo) {
      const nombreArchivo = imagenesProductos[producto.id].nombreArchivo;
      // Usar URL sin timestamp dinámico para evitar cambios constantes
      const url = `/assets/images/Productos/${nombreArchivo}`;
      this.cacheImagenes.set(producto.id, url);
      return url;
    }
    
    // Si no hay imagen guardada, usar la misma lógica que en compra-aqui para consistencia
    const nombre = producto.nombre.toLowerCase();
    
    // Generar diferentes variaciones del nombre (igual que en compra-aqui)
    const palabras = nombre.split(' ').filter(p => p.length > 0 && p !== 'para');
    const camelCaseSinPara = palabras.length > 0 
      ? palabras[0] + palabras.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
      : nombre.replace(/\s*para\s*/g, '');
    
    // Intentar primero con camelCase sin "para" (más común: ceraBarba)
    const nombreSinEspacios = camelCaseSinPara || nombre.replace(/\s+/g, '');
    
    // URL sin timestamp dinámico para evitar cambios constantes
    const url = `/assets/images/Productos/${nombreSinEspacios}.jpg`;
    this.cacheImagenes.set(producto.id, url);
    return url;
  }

  private obtenerPresignedUrl(productoId: number, s3Key: string): void {
    // Verificar nuevamente antes de hacer la solicitud (por si acaso se llamó desde múltiples lugares)
    if (this.solicitudesEnCurso.has(productoId)) {
      console.log(`[Gestion Catalogo] Ya hay una solicitud en curso para producto ${productoId}, omitiendo...`);
      return;
    }
    
    // Marcar que hay una solicitud en curso para este producto (ANTES de hacer la solicitud HTTP)
    this.solicitudesEnCurso.add(productoId);
    console.log(`[Gestion Catalogo] Iniciando solicitud de URL presignada para producto ${productoId}`);
    
    // Obtener URL presignada del backend (expira en 1 hora = 3600 segundos)
    this.s3Service.getPresignedDownloadUrl(s3Key, 3600).subscribe({
      next: (presignedUrl: string) => {
        console.log(`[Gestion Catalogo] URL presignada obtenida para producto ${productoId}:`, presignedUrl.substring(0, 50) + '...');
        // Cachear la URL presignada con su tiempo de expiración (1 hora = 3600000 ms)
        const expiresAt = Date.now() + (3600 * 1000);
        this.cachePresignedUrls.set(productoId, { url: presignedUrl, expiresAt });
        
        // Actualizar el cache de imágenes con la URL presignada
        this.cacheImagenes.set(productoId, presignedUrl);
        
        // Actualizar el imagenUrl del producto en el array para que se refleje en el template
        const producto = this.productos.find(p => p.id === productoId);
        if (producto) {
          producto.imagenUrl = presignedUrl;
        }
        
        // Si estamos editando este producto, actualizar también la vista previa
        if (this.productoEditando && this.productoEditando.id === productoId) {
          this.vistaPreviaImagen = presignedUrl;
        }
        
        // Remover de solicitudes en curso
        this.solicitudesEnCurso.delete(productoId);
        
        // Forzar detección de cambios para actualizar la imagen inmediatamente
        this.cdr.detectChanges();
        
        // También forzar actualización de la vista para este producto
        if (producto) {
          // Disparar detección de cambios adicional para asegurar actualización
          setTimeout(() => {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          }, 50);
        }
      },
      error: (error) => {
        console.error(`[Gestion Catalogo] Error al obtener URL presignada para producto ${productoId}:`, error);
        // Remover de solicitudes en curso incluso si falla
        this.solicitudesEnCurso.delete(productoId);
        // Si falla, intentar usar la URL directa como fallback (aunque probablemente no funcione)
        const fallbackUrl = this.s3Service.getPublicUrl(s3Key);
        this.cacheImagenes.set(productoId, fallbackUrl);
        this.cdr.detectChanges();
      }
    });
  }

  obtenerDescripcion(productoId: number): string {
    // Obtener descripción desde localStorage o un servicio
    const descripciones = JSON.parse(localStorage.getItem('productoDescripciones') || '{}');
    return descripciones[productoId] || '';
  }

  guardarDescripcion(productoId: number, descripcion: string): void {
    const descripciones = JSON.parse(localStorage.getItem('productoDescripciones') || '{}');
    descripciones[productoId] = descripcion;
    localStorage.setItem('productoDescripciones', JSON.stringify(descripciones));
  }

  editar(producto: ProductoCatalogo): void {
    this.productoEditando = producto;
    this.productoForm = {
      ...producto,
      descripcion: producto.descripcion || '',
      imagenUrl: producto.imagenUrl || ''
    };
    
    // Cargar imagen guardada si existe (solo lectura para imágenes locales antiguas)
    const imagenesProductos = JSON.parse(localStorage.getItem('productoImagenes') || '{}');
    if (imagenesProductos[producto.id]?.s3Key) {
      // Si hay imagen en S3, usar URL presignada
      const s3Key = imagenesProductos[producto.id].s3Key;
      // Verificar si tenemos una URL presignada válida en cache
      const cachedPresigned = this.cachePresignedUrls.get(producto.id);
      if (cachedPresigned && cachedPresigned.expiresAt > Date.now()) {
        this.vistaPreviaImagen = cachedPresigned.url;
      } else {
        // Obtener URL presignada para la vista previa
        if (!this.solicitudesEnCurso.has(producto.id)) {
          this.obtenerPresignedUrl(producto.id, s3Key);
        }
        // Usar URL temporal mientras se obtiene la presignada
        this.vistaPreviaImagen = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYXJnYW5kby4uLjwvdGV4dD48L3N2Zz4=`;
      }
      this.nombreImagenSeleccionada = null;
      this.imagenSeleccionada = null;
    } else if (imagenesProductos[producto.id]?.nombreArchivo) {
      // Solo lectura: Si hay archivo local antiguo (compatibilidad, no se puede editar)
      const nombreArchivo = imagenesProductos[producto.id].nombreArchivo;
      this.vistaPreviaImagen = `/assets/images/Productos/${nombreArchivo}`;
      // Limpiar selección para forzar que se suba nueva imagen a S3 si se edita
      this.nombreImagenSeleccionada = null;
      this.imagenSeleccionada = null;
    } else {
      this.vistaPreviaImagen = producto.imagenUrl || null;
      this.nombreImagenSeleccionada = null;
      this.imagenSeleccionada = null;
    }
    
    this.mostrarFormulario = true;
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.productoEditando = null;
    this.imagenSeleccionada = null;
    this.nombreImagenSeleccionada = null;
    this.vistaPreviaImagen = null;
    this.productoForm = {
      id: 0,
      nombre: '',
      stock: 0,
      precioCosto: 0,
      precioVenta: 0,
      comision: 1,
      descripcion: '',
      imagenUrl: ''
    };
  }

  guardar(): void {
    // Validar que haya una imagen seleccionada para productos nuevos
    if (!this.productoEditando && !this.imagenSeleccionada) {
      alert('Por favor, selecciona una imagen para el producto. Las imágenes deben subirse a S3.');
      return;
    }

    // Si está editando y tiene imagen local antigua, requerir nueva imagen
    if (this.productoEditando) {
      const imagenesProductos = JSON.parse(localStorage.getItem('productoImagenes') || '{}');
      const tieneImagenLocal = imagenesProductos[this.productoEditando.id]?.nombreArchivo;
      const tieneImagenS3 = imagenesProductos[this.productoEditando.id]?.s3Key;
      
      // Si tiene imagen local pero no S3, y no hay nueva imagen seleccionada, requerir subir a S3
      if (tieneImagenLocal && !tieneImagenS3 && !this.imagenSeleccionada) {
        alert('Este producto tiene una imagen local. Por favor, selecciona una nueva imagen para subirla a S3.');
        return;
      }
    }

    const productoUpdate: ProductoCreate = {
      nombre: this.productoForm.nombre,
      stock: this.productoForm.stock,
      precioCosto: this.productoForm.precioCosto,
      precioVenta: this.productoForm.precioVenta,
      comision: this.productoForm.comision,
      descripcion: this.productoForm.descripcion || undefined
    };

    // Función auxiliar para guardar después de subir imagen (si existe)
    const guardarProducto = (productoId: number) => {
      // Forzar recarga de productos y actualización de imágenes
      setTimeout(() => {
        this.cargarProductos();
        setTimeout(() => {
          this.actualizarImagenes();
          // Disparar evento personalizado para actualizar otras vistas
          window.dispatchEvent(new Event('productoActualizado'));
          // Guardar timestamp en localStorage para sincronización con Vista Para Clientes
          localStorage.setItem('productosUltimaActualizacion', new Date().getTime().toString());
        }, 100);
      }, 100);
      this.cancelar();
    };

    // Si hay una imagen seleccionada, subirla a S3 primero (OBLIGATORIO)
    if (this.imagenSeleccionada) {
      this.s3Service.uploadFile(this.imagenSeleccionada, 'productos').subscribe({
        next: (uploadResponse) => {
          if (uploadResponse.success) {
            const s3Key = uploadResponse.key;
            
            if (this.productoEditando) {
              // Actualizar producto existente y guardar referencia de imagen S3
              this.productoService.update(this.productoEditando.id, productoUpdate).subscribe({
                next: (productoActualizado) => {
                  this.guardarReferenciaImagenS3(productoActualizado.id, s3Key);
                  guardarProducto(productoActualizado.id);
                },
                error: (error) => {
                  console.error('Error al actualizar producto:', error);
                  alert('Error al actualizar el producto');
                }
              });
            } else {
              // Crear nuevo producto y guardar referencia de imagen S3
              this.productoService.create(productoUpdate).subscribe({
                next: (nuevoProducto) => {
                  this.guardarReferenciaImagenS3(nuevoProducto.id, s3Key);
                  guardarProducto(nuevoProducto.id);
                },
                error: (error) => {
                  console.error('Error al crear producto:', error);
                  alert('Error al crear el producto');
                }
              });
            }
          }
        },
        error: (error) => {
          console.error('Error al subir imagen a S3:', error);
          alert('Error al subir la imagen a S3. Por favor, intente nuevamente.');
        }
      });
    } else if (this.productoEditando) {
      // Solo actualizar producto si ya tiene imagen en S3 (no permitir actualizar sin imagen S3)
      const imagenesProductos = JSON.parse(localStorage.getItem('productoImagenes') || '{}');
      if (imagenesProductos[this.productoEditando.id]?.s3Key) {
        // Tiene imagen S3, solo actualizar datos del producto
        this.productoService.update(this.productoEditando.id, productoUpdate).subscribe({
          next: (productoActualizado) => {
            guardarProducto(productoActualizado.id);
          },
          error: (error) => {
            console.error('Error al actualizar producto:', error);
            alert('Error al actualizar el producto');
          }
        });
      } else {
        // No tiene imagen S3, requerir subir una
        alert('Por favor, selecciona una imagen para subir a S3.');
      }
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!this.s3Service.isValidImage(file)) {
        alert('Por favor, selecciona un archivo de imagen válido (JPG, JPEG, PNG, GIF, WEBP)');
        return;
      }

      // Validar tamaño del archivo (máximo 5MB)
      if (!this.s3Service.isValidFileSize(file, 5)) {
        alert('El archivo es demasiado grande. El tamaño máximo es 5MB.');
        return;
      }

      this.imagenSeleccionada = file;
      // Normalizar el nombre del archivo: decodificar si está codificado y asegurar que no tenga caracteres problemáticos
      let nombreArchivo = file.name;
      try {
        // Si el nombre está codificado en URL, decodificarlo
        if (nombreArchivo.includes('%')) {
          nombreArchivo = decodeURIComponent(nombreArchivo);
        }
      } catch (e) {
        // Si falla la decodificación, usar el nombre original
        console.warn('No se pudo decodificar el nombre del archivo:', file.name);
      }
      this.nombreImagenSeleccionada = nombreArchivo;
      
      // Mostrar vista previa
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.vistaPreviaImagen = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  guardarReferenciaImagenS3(productoId: number, s3Key: string): void {
    // Guardar la referencia de la imagen en S3 en localStorage
    const imagenesProductos = JSON.parse(localStorage.getItem('productoImagenes') || '{}');
    imagenesProductos[productoId] = {
      s3Key: s3Key,
      timestamp: new Date().getTime()
    };
    localStorage.setItem('productoImagenes', JSON.stringify(imagenesProductos));
    // También actualizar el timestamp de productos para sincronización con Vista Para Clientes
    localStorage.setItem('productosUltimaActualizacion', new Date().getTime().toString());
    console.log(`✅ Imagen S3 guardada para producto ${productoId}: ${s3Key}`);
    console.log(`📦 localStorage actualizado. productoImagenes[${productoId}]:`, imagenesProductos[productoId]);
    
    // También guardar en el backend para que Vista Para Clientes pueda acceder
    this.s3Service.guardarReferenciaImagenBackend(productoId, s3Key).subscribe({
      next: () => {
        console.log(`✅ Referencia de imagen guardada en backend para producto ${productoId}`);
      },
      error: (error) => {
        console.error(`❌ Error al guardar referencia en backend para producto ${productoId}:`, error);
      }
    });
  }

  /**
   * Sincroniza todas las referencias de imágenes existentes en localStorage al backend
   * Esto permite que Vista Para Clientes pueda acceder a las imágenes ya subidas
   */
  private sincronizarReferenciasExistentesAlBackend(): void {
    const imagenesProductos = JSON.parse(localStorage.getItem('productoImagenes') || '{}');
    const productosConS3 = Object.keys(imagenesProductos)
      .filter(key => imagenesProductos[key]?.s3Key)
      .map(key => ({
        productoId: parseInt(key),
        s3Key: imagenesProductos[key].s3Key,
        timestamp: imagenesProductos[key].timestamp || Date.now()
      }));

    if (productosConS3.length === 0) {
      console.log('[Gestion Catalogo] No hay referencias de imágenes S3 para sincronizar');
      return;
    }

    console.log(`[Gestion Catalogo] 🔄 Sincronizando ${productosConS3.length} referencias de imágenes al backend...`);

    // Convertir a formato que espera el backend
    const referenciasParaBackend: any = {};
    productosConS3.forEach(item => {
      referenciasParaBackend[item.productoId] = {
        s3Key: item.s3Key,
        timestamp: item.timestamp
      };
    });

    // Sincronizar todas las referencias de una vez
    this.s3Service.sincronizarReferenciasBackend(referenciasParaBackend).subscribe({
      next: (response) => {
        console.log(`[Gestion Catalogo] ✅ ${response.count || productosConS3.length} referencias sincronizadas exitosamente al backend`);
      },
      error: (error) => {
        console.error('[Gestion Catalogo] ❌ Error al sincronizar referencias al backend:', error);
        // Si falla la sincronización masiva, intentar una por una
        console.log('[Gestion Catalogo] 🔄 Intentando sincronizar una por una...');
        productosConS3.forEach(item => {
          this.s3Service.guardarReferenciaImagenBackend(item.productoId, item.s3Key).subscribe({
            next: () => {
              console.log(`[Gestion Catalogo] ✅ Referencia sincronizada para producto ${item.productoId}`);
            },
            error: (err) => {
              console.error(`[Gestion Catalogo] ❌ Error al sincronizar producto ${item.productoId}:`, err);
            }
          });
        });
      }
    });
  }


  eliminar(producto: ProductoCatalogo): void {
    if (confirm(`¿Está seguro de que desea eliminar el producto "${producto.nombre}"?`)) {
      this.productoService.delete(producto.id).subscribe({
        next: () => {
          // Eliminar descripción del localStorage
          const descripciones = JSON.parse(localStorage.getItem('productoDescripciones') || '{}');
          delete descripciones[producto.id];
          localStorage.setItem('productoDescripciones', JSON.stringify(descripciones));
          
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

  onImageError(event: Event, producto?: ProductoCatalogo): void {
    const img = event.target as HTMLImageElement;
    if (!img) return;

    // Si tenemos información del producto, intentar diferentes variaciones
    if (producto) {
      const nombre = producto.nombre.toLowerCase();
      // Incluir más extensiones: jpg, jpeg, png, gif, webp
      const extensiones = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      // Generar diferentes variaciones del nombre
      const palabras = nombre.split(' ').filter(p => p.length > 0 && p !== 'para');
      const camelCaseSinPara = palabras.length > 0 
        ? palabras[0] + palabras.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
        : nombre.replace(/\s*para\s*/g, '');
      
      const variaciones = [
        camelCaseSinPara,
        nombre.replace(/\s+/g, '').replace('para', ''),
        nombre.replace(/\s+/g, ''),
      ];

      // Intentar diferentes combinaciones
      const intento = parseInt(img.getAttribute('data-intento') || '0');
      const totalCombinaciones = variaciones.length * extensiones.length;
      
      if (intento < totalCombinaciones) {
        const indiceVariacion = Math.floor(intento / extensiones.length);
        const indiceExtension = intento % extensiones.length;
        const variacion = variaciones[indiceVariacion];
        const extension = extensiones[indiceExtension];
        const nuevaRuta = `/assets/images/Productos/${variacion}${extension}?t=${new Date().getTime()}`;
        
        img.setAttribute('data-intento', (intento + 1).toString());
        img.src = nuevaRuta;
        return;
      }
    }
    
    // Si ninguna funciona, intentar placeholder con diferentes extensiones
    const intentoPlaceholder = parseInt(img.getAttribute('data-placeholder-intento') || '0');
    const extensionesPlaceholder = ['.png', '.jpg', '.jpeg', '.gif'];
    
    if (intentoPlaceholder < extensionesPlaceholder.length) {
      img.setAttribute('data-placeholder-intento', (intentoPlaceholder + 1).toString());
      img.src = `/assets/images/Productos/default${extensionesPlaceholder[intentoPlaceholder]}?t=${new Date().getTime()}`;
      return;
    }
    
    // Si ninguna funciona, ocultar imagen
    img.onerror = null; // Evitar loop infinito
    img.style.display = 'none';
  }

  actualizarImagenes(): void {
    // Forzar recarga de todas las imágenes actualizando las URLs con nuevo timestamp
    this.productos = this.productos.map(p => ({
      ...p,
      imagenUrl: this.obtenerImagenUrl(p)
    }));
  }

  abrirModalImagen(producto: ProductoCatalogo): void {
    this.productoModal = producto;
    this.imagenModalUrl = producto.imagenUrl || this.obtenerImagenUrl(producto);
    this.mostrarModalImagen = true;
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  cerrarModalImagen(): void {
    this.mostrarModalImagen = false;
    this.productoModal = null;
    this.imagenModalUrl = '';
    // Restaurar scroll del body
    document.body.style.overflow = '';
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

