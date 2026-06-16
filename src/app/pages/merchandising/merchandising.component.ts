import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, switchMap } from 'rxjs';
import { MerchandisingService } from '../../services/merchandising.service';
import { S3Service } from '../../services/s3.service';
import {
  CATEGORIAS_MERCH,
  ProductoMerch,
  ProductoMerchCreate,
  VarianteMerch,
  normalizarTallaMerch,
  tallasParaCategoria
} from '../../models/merchandising.model';

interface TallaFormState {
  talla: string;
  seleccionada: boolean;
  precio?: number | null;
  stock: number;
  id?: number;
}

interface ImagenEnModal {
  id?: number;
  s3Key?: string;
  url: string;
  orden: number;
  file?: File;
  esNueva: boolean;
}

@Component({
  selector: 'app-merchandising',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './merchandising.component.html',
  styleUrls: ['./merchandising.component.css']
})
export class MerchandisingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('merchModal') merchModalRef?: ElementRef<HTMLElement>;
  @ViewChild('merchBackdrop') merchBackdropRef?: ElementRef<HTMLElement>;

  productos: ProductoMerch[] = [];
  cargando = true;
  guardando = false;
  cargandoEdicion = false;
  subiendoImagenes = false;
  mensajeError = '';

  mostrarModal = false;
  modoEdicion = false;
  productoEditandoId = 0;

  readonly categorias = [...CATEGORIAS_MERCH];

  formulario: ProductoMerchCreate = this.crearFormularioVacio();
  tallasForm: TallaFormState[] = [];
  imagenesEnModal: ImagenEnModal[] = [];

  constructor(
    private merchandisingService: MerchandisingService,
    private s3Service: S3Service,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngAfterViewInit(): void {
    this.portalizarModalAlBody();
  }

  ngOnDestroy(): void {
    this.bloquearScrollDocumento(false);
  }

  cargarProductos(): void {
    this.cargando = true;
    this.merchandisingService.getAll().subscribe({
      next: (data) => {
        this.productos = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar merchandising:', error);
        this.cargando = false;
      }
    });
  }

  abrirModalAgregar(): void {
    this.modoEdicion = false;
    this.productoEditandoId = 0;
    this.formulario = this.crearFormularioVacio();
    this.inicializarTallasForm([], this.formulario.categoria);
    this.imagenesEnModal = [];
    this.mensajeError = '';
    this.mostrarModal = true;
    this.portalizarModalAlBody();
    this.bloquearScrollDocumento(true);
  }

  abrirModalEditar(producto: ProductoMerch, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    this.modoEdicion = true;
    this.productoEditandoId = producto.id;
    this.mensajeError = '';
    this.cargandoEdicion = true;
    this.mostrarModal = true;
    this.portalizarModalAlBody();
    this.bloquearScrollDocumento(true);

    this.aplicarProductoAlFormulario(producto);
    this.inicializarTallasForm(producto.variantes ?? [], producto.categoria);

    this.merchandisingService.getById(producto.id).subscribe({
      next: (data) => {
        this.aplicarProductoAlFormulario(data);
        this.cargandoEdicion = false;
      },
      error: (error) => {
        console.error('Error al cargar producto:', error);
        this.cargandoEdicion = false;
        this.mensajeError = 'No se pudieron cargar todos los datos. Revisa la conexión e intenta de nuevo.';
      }
    });
  }

  cerrarModal(): void {
    this.revocarPreviewsLocales();
    this.mostrarModal = false;
    this.cargandoEdicion = false;
    this.mensajeError = '';
    this.productoEditandoId = 0;
    this.imagenesEnModal = [];
    this.bloquearScrollDocumento(false);
  }

  guardarProducto(): void {
    this.mensajeError = '';

    if (!this.formulario.nombre?.trim()) {
      this.mensajeError = 'El nombre es obligatorio';
      return;
    }
    if (!this.formulario.categoria) {
      this.mensajeError = 'La categoría es obligatoria';
      return;
    }
    const precioBase = Number(this.formulario.precioBase);
    if (isNaN(precioBase) || precioBase < 0) {
      this.mensajeError = 'El precio base debe ser un número válido';
      return;
    }

    const variantes = this.construirVariantes();
    if (variantes.length === 0) {
      this.mensajeError = 'Selecciona al menos una talla con stock';
      return;
    }

    const payload: ProductoMerchCreate = {
      nombre: this.formulario.nombre.trim(),
      categoria: this.formulario.categoria,
      descripcion: this.formulario.descripcion?.trim() || undefined,
      precioBase,
      activo: this.formulario.activo,
      permitePersonalizacion: this.formulario.permitePersonalizacion,
      esNuevo: this.formulario.esNuevo,
      badge: this.formulario.badge?.trim() || undefined,
      variantes
    };

    this.guardando = true;

    const guardar$ = this.modoEdicion
      ? this.merchandisingService.update(this.productoEditandoId, payload)
      : this.merchandisingService.create(payload);

    guardar$.pipe(
      switchMap((producto) => this.procesarImagenes(producto))
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        this.cargarProductos();
        alert('Guardado exitosamente.');
      },
      error: (error) => {
        console.error('Error al guardar producto:', error);
        this.mensajeError = error.error?.message || 'Error al guardar el producto';
        this.guardando = false;
        this.subiendoImagenes = false;
      }
    });
  }

  eliminarProducto(producto: ProductoMerch, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!confirm(`¿Está seguro de eliminar "${producto.nombre}"?\nEsta acción no se puede deshacer.`)) {
      return;
    }

    this.merchandisingService.delete(producto.id).subscribe({
      next: () => this.cargarProductos(),
      error: (error) => {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar: ' + (error.error?.message || 'Error desconocido'));
      }
    });
  }

  onTallaChange(talla: TallaFormState): void {
    if (!talla.seleccionada) {
      talla.precio = null;
      talla.stock = 0;
      talla.id = undefined;
    } else if (talla.stock <= 0) {
      talla.stock = 0;
    }
  }

  onCategoriaChange(categoria: string): void {
    this.formulario.categoria = this.normalizarCategoria(categoria);
    this.inicializarTallasForm(this.construirVariantes(), this.formulario.categoria);
    this.cdr.markForCheck();
  }

  usaTallasDeRopa(): boolean {
    return tallasParaCategoria(this.formulario.categoria).length > 1;
  }

  onArchivosSeleccionados(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;

    Array.from(files).forEach((file) => {
      if (!this.s3Service.isValidImage(file)) {
        this.mensajeError = `Formato no válido: ${file.name}`;
        return;
      }
      if (!this.s3Service.isValidFileSize(file)) {
        this.mensajeError = `El archivo ${file.name} supera el límite de 5MB`;
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      this.imagenesEnModal.push({
        url: previewUrl,
        orden: this.imagenesEnModal.length,
        file,
        esNueva: true
      });
    });

    input.value = '';
  }

  eliminarImagen(index: number): void {
    const imagen = this.imagenesEnModal[index];
    if (!imagen) return;

    if (imagen.esNueva) {
      if (imagen.url.startsWith('blob:')) {
        URL.revokeObjectURL(imagen.url);
      }
      this.imagenesEnModal.splice(index, 1);
      this.reasignarOrdenImagenes();
      return;
    }

    if (!imagen.id || !this.productoEditandoId) return;

    this.merchandisingService.deleteImagen(this.productoEditandoId, imagen.id).subscribe({
      next: () => {
        this.imagenesEnModal.splice(index, 1);
        this.reasignarOrdenImagenes();
      },
      error: (error) => {
        console.error('Error al eliminar imagen:', error);
        alert('Error al eliminar la imagen');
      }
    });
  }

  moverImagenArriba(index: number): void {
    if (index <= 0) return;
    this.intercambiarImagenes(index, index - 1);
    this.persistirOrdenImagenes();
  }

  moverImagenAbajo(index: number): void {
    if (index >= this.imagenesEnModal.length - 1) return;
    this.intercambiarImagenes(index, index + 1);
    this.persistirOrdenImagenes();
  }

  obtenerThumbnail(producto: ProductoMerch): string | null {
    if (!producto.imagenes?.length) return null;
    const ordenadas = [...producto.imagenes].sort((a, b) => a.orden - b.orden);
    return ordenadas[0].url;
  }

  obtenerPrecioDisplay(producto: ProductoMerch): string {
    if (producto.precioMin != null && producto.precioMax != null && producto.precioMin !== producto.precioMax) {
      return `Q${producto.precioMin} - Q${producto.precioMax}`;
    }
    return `Q${producto.precioBase}`;
  }

  stockBajo(stock: number | undefined): boolean {
    return (stock ?? 0) < 5;
  }

  trackTalla(_index: number, talla: TallaFormState): string {
    return talla.talla;
  }

  private crearFormularioVacio(): ProductoMerchCreate {
    return {
      nombre: '',
      categoria: 'Camisas',
      descripcion: '',
      precioBase: 0,
      activo: true,
      permitePersonalizacion: false,
      esNuevo: false,
      badge: '',
      variantes: []
    };
  }

  private inicializarTallasForm(variantes: VarianteMerch[], categoria = this.formulario.categoria): void {
    const categoriaNormalizada = this.normalizarCategoria(categoria);
    const tallasBase = [...tallasParaCategoria(categoriaNormalizada)];
    const tallasExtras = variantes
      .map((v) => normalizarTallaMerch(v.talla))
      .filter((talla) => talla && !tallasBase.includes(talla));
    const tallasVisibles = [...tallasBase, ...tallasExtras];

    this.tallasForm = tallasVisibles.map((talla) => {
      const existente = variantes.find((v) => normalizarTallaMerch(v.talla) === talla);
      return {
        talla,
        seleccionada: !!existente,
        precio: existente?.precio ?? null,
        stock: existente?.stock ?? 0,
        id: existente?.id
      };
    });
    this.cdr.markForCheck();
  }

  private normalizarCategoria(categoria: string | undefined | null): string {
    const valor = (categoria ?? '').trim();
    return (CATEGORIAS_MERCH as readonly string[]).includes(valor) ? valor : 'Camisas';
  }

  private aplicarProductoAlFormulario(producto: ProductoMerch): void {
    const categoria = this.normalizarCategoria(producto.categoria);
    this.formulario = {
      nombre: producto.nombre,
      categoria,
      descripcion: producto.descripcion ?? '',
      precioBase: producto.precioBase,
      activo: producto.activo,
      permitePersonalizacion: producto.permitePersonalizacion,
      esNuevo: producto.esNuevo,
      badge: producto.badge ?? '',
      variantes: producto.variantes ?? []
    };
    this.inicializarTallasForm(producto.variantes ?? [], categoria);
    this.imagenesEnModal = [...(producto.imagenes ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map((img, index) => ({
        id: img.id,
        s3Key: img.s3Key,
        url: img.url,
        orden: index,
        esNueva: false
      }));
  }

  private construirVariantes(): VarianteMerch[] {
    return this.tallasForm
      .filter((t) => t.seleccionada)
      .map((t) => ({
        id: t.id,
        talla: t.talla,
        precio: t.precio != null && t.precio > 0 ? Number(t.precio) : undefined,
        stock: Math.max(0, Number(t.stock) || 0)
      }));
  }

  private procesarImagenes(producto: ProductoMerch) {
    const nuevas = this.imagenesEnModal.filter((img) => img.esNueva && img.file);
    const existentesConId = this.imagenesEnModal.filter((img) => !img.esNueva && img.id);

    if (nuevas.length === 0) {
      if (this.modoEdicion && existentesConId.length > 0) {
        const ids = existentesConId.map((img) => img.id as number);
        return this.merchandisingService.reorderImagenes(producto.id, ids);
      }
      return of(producto);
    }

    this.subiendoImagenes = true;
    let ordenBase = existentesConId.length;

    const uploads = nuevas.map((img, index) =>
      this.s3Service.uploadFile(img.file!, 'merchandising').pipe(
        switchMap((upload) =>
          this.merchandisingService.addImagen(producto.id, {
            s3Key: upload.key,
            url: upload.url,
            orden: ordenBase + index
          })
        )
      )
    );

    return forkJoin(uploads).pipe(
      switchMap(() => {
        if (this.modoEdicion && existentesConId.length > 0) {
          const idsOrdenados = this.imagenesEnModal
            .filter((img) => img.id)
            .map((img) => img.id as number);
          if (idsOrdenados.length > 0) {
            return this.merchandisingService.reorderImagenes(producto.id, idsOrdenados);
          }
        }
        return of(producto);
      })
    );
  }

  private intercambiarImagenes(i: number, j: number): void {
    const temp = this.imagenesEnModal[i];
    this.imagenesEnModal[i] = this.imagenesEnModal[j];
    this.imagenesEnModal[j] = temp;
    this.reasignarOrdenImagenes();
  }

  private reasignarOrdenImagenes(): void {
    this.imagenesEnModal.forEach((img, index) => {
      img.orden = index;
    });
  }

  private persistirOrdenImagenes(): void {
    if (!this.modoEdicion || !this.productoEditandoId) return;

    const ids = this.imagenesEnModal
      .filter((img) => img.id)
      .map((img) => img.id as number);

    if (ids.length < 2) return;

    this.merchandisingService.reorderImagenes(this.productoEditandoId, ids).subscribe({
      error: (error) => console.error('Error al reordenar imágenes:', error)
    });
  }

  private revocarPreviewsLocales(): void {
    this.imagenesEnModal.forEach((img) => {
      if (img.esNueva && img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
    });
  }

  /** Evita que el modal quede recortado por el transform de .route-enter (GSAP). */
  private portalizarModalAlBody(): void {
    const modal = this.merchModalRef?.nativeElement;
    const backdrop = this.merchBackdropRef?.nativeElement;

    if (modal && modal.parentElement !== document.body) {
      this.renderer.appendChild(document.body, modal);
    }
    if (backdrop && backdrop.parentElement !== document.body) {
      this.renderer.appendChild(document.body, backdrop);
    }
  }

  private bloquearScrollDocumento(bloquear: boolean): void {
    document.body.style.overflow = bloquear ? 'hidden' : '';
  }
}
