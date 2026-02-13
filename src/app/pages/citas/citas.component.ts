import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitaService } from '../../services/cita.service';
import { TipoCorteService } from '../../services/tipo-corte.service';
import { BarberoService } from '../../services/barbero.service';
import { Cita, CitaCreate, Disponibilidad } from '../../models/cita.model';
import { TipoCorteAPI } from '../../models/tipo-corte-api.model';
import { Barbero } from '../../models/barbero.model';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class CitasComponent implements OnInit {
  citas: Cita[] = [];
  tiposCorte: TipoCorteAPI[] = [];
  barberos: Barbero[] = [];
  disponibilidades: Disponibilidad[] = [];
  
  tipoCorteSeleccionado: TipoCorteAPI | null = null;
  fechaSeleccionada: string = '';
  barberoSeleccionado: number = 0;
  horaSeleccionada: string = '';
  horaSeleccionada12h: string = ''; // Hora en formato 12h para el selector
  
  // Horas disponibles en formato 12 horas (6am a 12am) con intervalos de 5 minutos
  horasDisponibles12h: string[] = [];
  
  // Horas disponibles para el barbero seleccionado (cache)
  horasDisponiblesBarbero: string[] = [];
  
  nuevaCita: CitaCreate = {
    fecha: '',
    hora: '',
    barberoId: 0,
    tipoCorteId: 0,
    nombreCliente: '',
    correoCliente: '',
    telefonoCliente: '',
    comentarios: '',
    correosConfirmacion: ['']
  };
  
  mostrarFormulario = false;
  cargando = false;
  editando = false;

  // Para cambiar hora
  mostrarModalCambiarHoraFlag = false;
  citaCambiarHora: Cita | null = null;
  nuevaHoraSeleccionada: string = '';
  horasDisponiblesCambiar: string[] = [];

  // Modal de detalles de cita
  mostrarModalDetallesCita = false;
  citaSeleccionada: Cita | null = null;
  editandoCita = false;
  
  // Modal de confirmación dinámico
  mostrarModalConfirmacion = false;
  confirmacionTitulo = '';
  confirmacionMensaje = '';
  confirmacionAccion: (() => void) | null = null;
  confirmacionTipo: 'success' | 'warning' | 'danger' | 'info' = 'warning';
  citaEditando: CitaCreate = {
    fecha: '',
    hora: '',
    barberoId: 0,
    tipoCorteId: 0,
    nombreCliente: '',
    correoCliente: '',
    telefonoCliente: '',
    comentarios: '',
    correosConfirmacion: ['']
  };

  // Modal de notificación
  mostrarModalNotificacion = false;
  mensajeNotificacion = '';
  tipoNotificacion: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Modal para ver todas las citas de un día/barbero
  mostrarModalCitasDia = false;
  citasModalDia: Cita[] = [];
  fechaModalDia: Date | null = null;
  barberoModalDia: Barbero | null = null;

  // Calendario
  fechaActual: Date = new Date();
  semanaActual: Date[] = [];
  fechaInicioSemana: Date = new Date();
  fechaSeleccionadaCalendario: Date = new Date();
  nombresDias: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  constructor(
    private citaService: CitaService,
    private tipoCorteService: TipoCorteService,
    private barberoService: BarberoService,
    private cdr: ChangeDetectorRef
  ) {
    this.generarHorasDisponibles12h();
  }

  ngOnInit(): void {
    this.cargarCitas();
    this.cargarTiposCorte();
    this.cargarBarberos();
    this.establecerFechaHoy();
    this.inicializarSemana();
    
    // Escuchar eventos de actualización de barberos
    window.addEventListener('barberosActualizados', () => {
      this.cargarBarberos();
    });
    
    // Escuchar eventos de actualización de tipos de corte
    window.addEventListener('tiposCorteActualizados', () => {
      this.cargarTiposCorte();
    });

    // Escuchar tecla ESC para cerrar modales
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (this.mostrarModalCitasDia) {
          this.cerrarModalCitasDia();
        } else if (this.mostrarModalConfirmacion) {
          this.cerrarModalConfirmacion();
        } else if (this.mostrarModalDetallesCita) {
          this.cerrarModalDetallesCita();
        } else if (this.mostrarModalCambiarHoraFlag) {
          this.cerrarModalCambiarHora();
        } else if (this.mostrarModalNotificacion) {
          this.cerrarModalNotificacion();
        }
      }
    });

    // Asegurar que el modal de citas del día esté cerrado al iniciar
    this.cerrarModalCitasDia();
  }

  inicializarSemana(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    this.fechaSeleccionadaCalendario = hoy;
    this.generarSemana();
  }

  generarSemana(): void {
    this.semanaActual = [];
    
    // Obtener el lunes de la semana que contiene la fecha seleccionada
    const lunes = new Date(this.fechaSeleccionadaCalendario);
    const dia = lunes.getDay();
    const diff = lunes.getDate() - dia + (dia === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    lunes.setDate(diff);
    lunes.setHours(0, 0, 0, 0);
    
    this.fechaInicioSemana = lunes;
    
    // Generar los 7 días de la semana
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(lunes);
      fecha.setDate(fecha.getDate() + i);
      fecha.setHours(0, 0, 0, 0);
      this.semanaActual.push(fecha);
    }
  }

  diaAnterior(): void {
    const nuevaFecha = new Date(this.fechaSeleccionadaCalendario);
    nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    nuevaFecha.setHours(0, 0, 0, 0);
    this.fechaSeleccionadaCalendario = nuevaFecha;
    this.generarSemana();
  }

  diaSiguiente(): void {
    const nuevaFecha = new Date(this.fechaSeleccionadaCalendario);
    nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    nuevaFecha.setHours(0, 0, 0, 0);
    this.fechaSeleccionadaCalendario = nuevaFecha;
    this.generarSemana();
  }

  irAHoy(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    this.fechaSeleccionadaCalendario = hoy;
    this.generarSemana();
  }

  getRangoSemana(): string {
    if (this.semanaActual.length === 0) return '';
    const primerDia = this.semanaActual[0];
    const ultimoDia = this.semanaActual[6];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    if (primerDia.getMonth() === ultimoDia.getMonth()) {
      return `${primerDia.getDate()} - ${ultimoDia.getDate()} de ${meses[primerDia.getMonth()]} ${primerDia.getFullYear()}`;
    } else {
      return `${primerDia.getDate()} de ${meses[primerDia.getMonth()]} - ${ultimoDia.getDate()} de ${meses[ultimoDia.getMonth()]} ${primerDia.getFullYear()}`;
    }
  }

  getDiaSemanaAbrev(fecha: Date): string {
    return this.nombresDias[fecha.getDay()];
  }

  getDiaNumero(fecha: Date): number {
    return fecha.getDate();
  }

  getMesNombre(fecha: Date): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[fecha.getMonth()];
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha.getTime() === hoy.getTime();
  }

  esFechaSeleccionada(fecha: Date): boolean {
    return fecha.getTime() === this.fechaSeleccionadaCalendario.getTime();
  }

  getCitasPorFechaYBarbero(fecha: Date, barberoId: number): Cita[] {
    const fechaStr = this.formatearFecha(fecha);
    return this.citas.filter(cita => {
      const citaFecha = cita.fecha.split('T')[0]; // Extraer solo la fecha (YYYY-MM-DD)
      return citaFecha === fechaStr && cita.barberoId === barberoId;
    });
  }

  // Obtiene las citas visibles (máximo 2) para mostrar en el calendario
  getCitasVisibles(fecha: Date, barberoId: number): Cita[] {
    const todasLasCitas = this.getCitasPorFechaYBarbero(fecha, barberoId);
    // Ordenar por hora para mostrar las más tempranas primero
    return todasLasCitas
      .sort((a, b) => a.hora.localeCompare(b.hora))
      .slice(0, 2); // Solo mostrar las primeras 2
  }

  // Obtiene el número de citas adicionales (más de 2)
  getCitasAdicionales(fecha: Date, barberoId: number): number {
    const todasLasCitas = this.getCitasPorFechaYBarbero(fecha, barberoId);
    return Math.max(0, todasLasCitas.length - 2);
  }

  // Abre el modal con todas las citas de un día/barbero
  abrirModalCitasDia(fecha: Date, barberoId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const barbero = this.barberos.find(b => b.id === barberoId);
    this.citasModalDia = this.getCitasPorFechaYBarbero(fecha, barberoId)
      .sort((a, b) => a.hora.localeCompare(b.hora)); // Ordenar por hora
    this.fechaModalDia = fecha;
    this.barberoModalDia = barbero || null;
    this.mostrarModalCitasDia = true;
    document.body.style.overflow = 'hidden';
  }

  // Cierra el modal de citas del día
  cerrarModalCitasDia(): void {
    this.mostrarModalCitasDia = false;
    this.citasModalDia = [];
    this.fechaModalDia = null;
    this.barberoModalDia = null;
    document.body.style.overflow = '';
  }

  formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  abrirFormularioConFecha(fecha: Date, barberoId?: number): void {
    const fechaStr = this.formatearFecha(fecha);
    this.fechaSeleccionada = fechaStr;
    this.nuevaCita.fecha = fechaStr;
    this.fechaSeleccionadaCalendario = fecha;
    this.generarSemana();
    
    // Si se hizo clic en una celda de barbero específico, preseleccionar ese barbero
    if (barberoId) {
      this.barberoSeleccionado = barberoId;
      this.nuevaCita.barberoId = barberoId;
    }
    
    this.cargarDisponibilidad();
    this.mostrarFormulario = true;
  }

  convertirHoraA12h(hora24: string): string {
    if (!hora24) return '';
    const [horas, minutos] = hora24.split(':');
    const h = parseInt(horas, 10);
    const m = minutos || '00';
    const periodo = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(h12).padStart(2, '0')}:${m} ${periodo}`;
  }

  establecerFechaHoy(): void {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const fechaStr = `${año}-${mes}-${dia}`;
    this.fechaSeleccionada = fechaStr;
    this.nuevaCita.fecha = fechaStr;
    this.cargarDisponibilidad();
  }

  cargarCitas(noCambiarCargando: boolean = false): void {
    if (!noCambiarCargando) {
      this.cargando = true;
    }
    this.citaService.obtenerTodas().subscribe({
      next: (data) => {
        // Crear nueva referencia del array para forzar detección de cambios
        this.citas = [...data];
        // Regenerar semana para actualizar las citas en el calendario visualmente
        this.generarSemana();
        // Forzar detección de cambios para actualizar la vista
        this.cdr.detectChanges();
        if (!noCambiarCargando) {
          this.cargando = false;
        }
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        if (!noCambiarCargando) {
          this.cargando = false;
        }
      }
    });
  }

  cargarTiposCorte(): void {
    this.tipoCorteService.obtenerTodosActivos().subscribe({
      next: (data) => {
        console.log('Tipos de corte cargados:', data);
        this.tiposCorte = data;
        if (data.length === 0) {
          console.warn('No hay tipos de corte activos en la base de datos');
        }
      },
      error: (error) => {
        console.error('Error al cargar tipos de corte:', error);
        console.error('Detalles del error:', error.error);
        this.mostrarNotificacion('Error al cargar los tipos de corte. Por favor, verifique la conexión con el servidor.', 'error');
      }
    });
  }

  cargarBarberos(): void {
    this.barberoService.getAll().subscribe({
      next: (data) => {
        this.barberos = data;
      },
      error: (error) => {
        console.error('Error al cargar barberos:', error);
      }
    });
  }

  cargarDisponibilidad(): void {
    if (!this.fechaSeleccionada) return;
    
    // Limpiar disponibilidades anteriores antes de cargar nuevas
    this.disponibilidades = [];
    
    this.citaService.obtenerDisponibilidad(this.fechaSeleccionada).subscribe({
      next: (data) => {
        console.log('Disponibilidades cargadas:', data);
        
        // Filtrar solo barberos con disponibilidad válida (que tengan horarios de hoy o futuros)
        const fechaHoy = new Date();
        fechaHoy.setHours(0, 0, 0, 0);
        const fechaSeleccionadaDate = new Date(this.fechaSeleccionada);
        fechaSeleccionadaDate.setHours(0, 0, 0, 0);
        
        // Solo incluir disponibilidades válidas
        this.disponibilidades = data.filter(d => {
          // Verificar que tenga horas disponibles
          const tieneHorasDisponibles = d.horasDisponibles && d.horasDisponibles.length > 0;
          if (!tieneHorasDisponibles) {
            console.log(`Excluyendo barbero ${d.barberoNombre} - no tiene horas disponibles`);
            return false;
          }
          return true;
        });
        
        console.log(`Barberos disponibles después del filtrado: ${this.disponibilidades.length}`);
        
        // Actualizar horas disponibles después de cargar disponibilidad
        this.actualizarHorasDisponibles();
        
        // Si el barbero seleccionado ya no está disponible, limpiarlo
        if (this.barberoSeleccionado > 0) {
          const barberoDisponible = this.disponibilidades.find(d => d.barberoId === this.barberoSeleccionado);
          if (!barberoDisponible) {
            console.log(`El barbero seleccionado (ID: ${this.barberoSeleccionado}) ya no está disponible, limpiando selección`);
            this.barberoSeleccionado = 0;
            this.nuevaCita.barberoId = 0;
            this.horaSeleccionada = '';
            this.horaSeleccionada12h = '';
          }
        }
        
        // Forzar detección de cambios para actualizar la vista
        this.cdr.detectChanges();
        
        // Debug: verificar disponibilidades
        this.disponibilidades.forEach(d => {
          console.log(`Barbero ${d.barberoNombre} (ID: ${d.barberoId}):`, {
            horaEntrada: d.horaEntrada,
            horaSalida: d.horaSalida,
            horasDisponibles: d.horasDisponibles?.length || 0,
            horasOcupadas: d.horasOcupadas?.length || 0
          });
        });
      },
      error: (error) => {
        console.error('Error al cargar disponibilidad:', error);
        console.error('Detalles del error:', error.error);
      }
    });
  }

  onTipoCorteSeleccionado(): void {
    // Convertir a número si es string
    const tipoCorteId = typeof this.nuevaCita.tipoCorteId === 'string' 
      ? parseInt(this.nuevaCita.tipoCorteId as any, 10) 
      : this.nuevaCita.tipoCorteId;
    
    if (tipoCorteId === 0 || tipoCorteId === null) {
      this.tipoCorteSeleccionado = null;
      this.barberoSeleccionado = 0;
      this.horaSeleccionada = '';
      this.horaSeleccionada12h = '';
      return;
    }
    
    const tipoCorte = this.tiposCorte.find(tc => tc.id === tipoCorteId);
    if (tipoCorte) {
      this.tipoCorteSeleccionado = tipoCorte;
      this.nuevaCita.tipoCorteId = tipoCorte.id; // Asegurar que sea número
      
      // Si el tipo de corte tiene un barbero asignado, preseleccionarlo automáticamente y deshabilitar el selector
      if (tipoCorte.barberoId && tipoCorte.barberoId > 0) {
        this.barberoSeleccionado = tipoCorte.barberoId;
        this.nuevaCita.barberoId = tipoCorte.barberoId;
        this.onBarberoSeleccionado();
      } else {
        // Si no tiene barbero asignado, permitir seleccionar uno
        this.barberoSeleccionado = 0;
        this.nuevaCita.barberoId = 0;
      }
      
      // Recargar citas y disponibilidad para actualizar horas según el tiempo del corte
      if (this.fechaSeleccionada) {
        this.cargarCitas();
        this.cargarDisponibilidad();
        this.actualizarHorasDisponibles();
      }
    } else {
      this.tipoCorteSeleccionado = null;
    }
  }

  tieneBarberoAsignado(): boolean {
    return !!(this.tipoCorteSeleccionado && this.tipoCorteSeleccionado.barberoId && this.tipoCorteSeleccionado.barberoId > 0);
  }

  getTiposCorteDisponibles(): TipoCorteAPI[] {
    // Si hay un tipo de corte seleccionado con barbero asignado, no filtrar por barbero
    // (porque el barbero ya está determinado por el tipo de corte)
    if (this.tieneBarberoAsignado()) {
      return this.tiposCorte;
    }
    
    // Si no hay barbero seleccionado, mostrar todos los tipos de corte
    if (!this.barberoSeleccionado || this.barberoSeleccionado === 0) {
      return this.tiposCorte;
    }
    
    // Si hay barbero seleccionado, mostrar solo tipos de corte que:
    // 1. No tengan barbero asignado (cualquier barbero puede hacerlo)
    // 2. Tengan este barbero específico asignado
    return this.tiposCorte.filter(tc => 
      !tc.barberoId || tc.barberoId === 0 || tc.barberoId === this.barberoSeleccionado
    );
  }

  onFechaCambiada(): void {
    // Limpiar selecciones cuando cambia la fecha
    this.barberoSeleccionado = 0;
    this.nuevaCita.barberoId = 0;
    this.horaSeleccionada = '';
    this.horaSeleccionada12h = '';
    this.horasDisponiblesBarbero = [];
    this.disponibilidades = []; // Limpiar disponibilidades anteriores
    
    // Actualizar la fecha en el objeto de nueva cita
    if (this.fechaSeleccionada) {
      this.nuevaCita.fecha = this.fechaSeleccionada;
      // Recargar citas y disponibilidad para la nueva fecha
      this.cargarCitas();
      this.cargarDisponibilidad();
    }
  }

  onBarberoSeleccionado(): void {
    // Si el tipo de corte tiene un barbero asignado, no permitir cambiar el barbero
    if (this.tieneBarberoAsignado()) {
      // Restaurar el barbero asignado al tipo de corte
      if (this.tipoCorteSeleccionado && this.tipoCorteSeleccionado.barberoId) {
        this.barberoSeleccionado = this.tipoCorteSeleccionado.barberoId;
        this.nuevaCita.barberoId = this.tipoCorteSeleccionado.barberoId;
      }
      return;
    }
    
    // Convertir a número si es string
    const barberoId = typeof this.barberoSeleccionado === 'string' 
      ? parseInt(this.barberoSeleccionado as any, 10) 
      : this.barberoSeleccionado;
    
    this.barberoSeleccionado = barberoId;
    this.nuevaCita.barberoId = barberoId;
    this.horaSeleccionada = '';
    this.horaSeleccionada12h = '';
    this.nuevaCita.hora = '';
    
    // Si hay un tipo de corte seleccionado que tiene un barbero asignado diferente,
    // y el barbero seleccionado no coincide, limpiar el tipo de corte
    if (this.tipoCorteSeleccionado && this.tipoCorteSeleccionado.barberoId && 
        this.tipoCorteSeleccionado.barberoId > 0 && 
        this.tipoCorteSeleccionado.barberoId !== barberoId) {
      this.nuevaCita.tipoCorteId = 0;
      this.tipoCorteSeleccionado = null;
    }
    
    // Agregar automáticamente el correo del barbero a los correos de confirmación
    const barbero = this.barberos.find(b => b.id === barberoId);
    if (barbero && barbero.correo && barbero.correo.trim() !== '') {
      // Limpiar correos vacíos y agregar el correo del barbero si no está ya presente
      this.nuevaCita.correosConfirmacion = this.nuevaCita.correosConfirmacion
        .filter(c => c && c.trim() !== '')
        .filter(c => c !== barbero.correo); // Remover si ya existe
      
      // Agregar el correo del barbero al inicio
      this.nuevaCita.correosConfirmacion.unshift(barbero.correo);
      
      // Si no hay más correos, agregar uno vacío para que el usuario pueda agregar más
      if (this.nuevaCita.correosConfirmacion.length === 1) {
        this.nuevaCita.correosConfirmacion.push('');
      }
    }
    
    // Recargar disponibilidad para el nuevo barbero
    if (this.fechaSeleccionada) {
      this.cargarDisponibilidad();
      // Actualizar horas disponibles cuando cambia el barbero
      this.actualizarHorasDisponibles();
    }
  }
  
  actualizarHorasDisponibles(): void {
    if (this.barberoSeleccionado > 0) {
      // Limpiar el array antes de actualizar para evitar duplicados
      this.horasDisponiblesBarbero = [];
      // Generar nuevas horas disponibles
      const horasNuevas = this.getHorasDisponibles(this.barberoSeleccionado);
      // Usar spread operator para crear un nuevo array y evitar referencias
      this.horasDisponiblesBarbero = [...horasNuevas];
      console.log('Horas disponibles actualizadas:', this.horasDisponiblesBarbero.length, 'horas');
      console.log('Primeras 5 horas:', this.horasDisponiblesBarbero.slice(0, 5));
      console.log('Últimas 5 horas:', this.horasDisponiblesBarbero.slice(-5));
    } else {
      this.horasDisponiblesBarbero = [];
    }
  }

  trackByHora(index: number, hora: string): string {
    return hora;
  }

  convertirTiempoALegible(minutos: number): string {
    if (!minutos || minutos < 0) return '0min';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0 && mins > 0) {
      return `${horas}h ${mins}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${mins}min`;
    }
  }

  getBarberosDisponibles(): Barbero[] {
    // Si no hay fecha seleccionada o no hay disponibilidades, retornar lista vacía
    if (!this.fechaSeleccionada || this.disponibilidades.length === 0) {
      return [];
    }
    
    // Obtener IDs de barberos que tienen disponibilidad válida para la fecha seleccionada
    // Solo incluir barberos que tengan horas disponibles
    const barberosDisponiblesIds = this.disponibilidades
      .filter(d => d.horasDisponibles && d.horasDisponibles.length > 0)
      .map(d => d.barberoId);
    
    // Filtrar barberos que estén en la lista de disponibilidades válidas
    const barberosFiltrados = this.barberos.filter(b => barberosDisponiblesIds.includes(b.id));
    
    console.log(`Barberos disponibles: ${barberosFiltrados.length} de ${this.barberos.length} totales`);
    
    return barberosFiltrados;
  }

  /**
   * Genera las horas disponibles desde 6am hasta 12am en formato 12 horas con intervalos de 5 minutos
   */
  generarHorasDisponibles12h(): void {
    this.horasDisponibles12h = [];
    const minutos = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
    
    // De 6am a 11am
    for (let hora = 6; hora <= 11; hora++) {
      for (const minuto of minutos) {
        this.horasDisponibles12h.push(`${hora.toString().padStart(2, '0')}:${minuto} AM`);
      }
    }
    
    // 12pm (mediodía) con minutos
    for (const minuto of minutos) {
      this.horasDisponibles12h.push(`12:${minuto} PM`);
    }
    
    // De 1pm a 11pm
    for (let hora = 1; hora <= 11; hora++) {
      for (const minuto of minutos) {
        this.horasDisponibles12h.push(`${hora.toString().padStart(2, '0')}:${minuto} PM`);
      }
    }
    
    // 12am (medianoche) con minutos
    for (const minuto of minutos) {
      this.horasDisponibles12h.push(`12:${minuto} AM`);
    }
  }

  /**
   * Convierte formato 12 horas a formato 24 horas (HH:mm)
   * Ejemplo: "09:00 AM" -> "09:00", "06:00 PM" -> "18:00", "12:00 AM" -> "00:00"
   */
  convertir12hA24h(hora12h: string): string {
    if (!hora12h) return '';
    
    const partes = hora12h.trim().split(' ');
    if (partes.length !== 2) return '';
    
    const [horaMin, periodo] = partes;
    const [hora, minuto] = horaMin.split(':');
    let hora24 = parseInt(hora, 10);
    
    if (periodo === 'AM') {
      if (hora24 === 12) {
        hora24 = 0; // 12:00 AM = 00:00
      }
    } else if (periodo === 'PM') {
      if (hora24 !== 12) {
        hora24 += 12; // 1PM-11PM = 13:00-23:00
      }
      // 12:00 PM = 12:00 (mediodía)
    }
    
    return `${hora24.toString().padStart(2, '0')}:${minuto || '00'}`;
  }

  /**
   * Convierte formato 24 horas a formato 12 horas
   * Ejemplo: "09:00" -> "09:00 AM", "18:00" -> "06:00 PM", "00:00" -> "12:00 AM"
   */
  convertir24hA12h(hora24h: string): string {
    if (!hora24h) return '';
    
    const [hora, minuto] = hora24h.split(':');
    let hora12 = parseInt(hora, 10);
    const min = minuto || '00';
    let periodo = 'AM';
    
    if (hora12 === 0) {
      hora12 = 12; // 00:00 = 12:00 AM
      periodo = 'AM';
    } else if (hora12 === 12) {
      periodo = 'PM'; // 12:00 = 12:00 PM
    } else if (hora12 > 12) {
      hora12 -= 12; // 13:00-23:00 = 1:00 PM-11:00 PM
      periodo = 'PM';
    } else {
      periodo = 'AM'; // 1:00-11:00 = 1:00 AM-11:00 AM
    }
    
    return `${hora12.toString().padStart(2, '0')}:${min} ${periodo}`;
  }

  onHoraSeleccionada(): void {
    // Convertir de formato 12h a 24h antes de guardar
    const hora24h = this.convertir12hA24h(this.horaSeleccionada12h);
    if (this.editandoCita && this.citaEditando) {
      this.citaEditando.hora = hora24h;
    } else {
      this.nuevaCita.hora = hora24h;
    }
    this.horaSeleccionada = hora24h;
  }

  getHorasDisponibles(barberoId: number): string[] {
    if (!barberoId || barberoId === 0) {
      return [];
    }
    
    const disponibilidad = this.disponibilidades.find(d => d.barberoId === barberoId);
    if (!disponibilidad || !disponibilidad.horaEntrada || !disponibilidad.horaSalida) {
      console.log('No se encontró disponibilidad para el barbero:', barberoId);
      return [];
    }
    
    // Obtener el rango del horario del barbero
    const [horaEntradaStr, minutoEntradaStr] = disponibilidad.horaEntrada.split(':');
    const [horaSalidaStr, minutoSalidaStr] = disponibilidad.horaSalida.split(':');
    const horaEntradaNum = parseInt(horaEntradaStr, 10);
    const minutoEntradaNum = parseInt(minutoEntradaStr, 10);
    const horaSalidaNum = parseInt(horaSalidaStr, 10);
    const minutoSalidaNum = parseInt(minutoSalidaStr, 10);
    
    // Convertir a minutos desde medianoche
    let inicioMinutos = horaEntradaNum * 60 + minutoEntradaNum;
    let finMinutos = horaSalidaNum * 60 + minutoSalidaNum;
    
    // Si la hora de salida es 00:00 (medianoche), significa que es hasta el final del día
    if (horaSalidaNum === 0 && minutoSalidaNum === 0) {
      finMinutos = 24 * 60; // 1440 minutos (fin del día)
    }
    
    // Obtener citas activas del barbero para la fecha seleccionada
    // Excluir la cita que se está editando (si existe)
    const citasActivas = this.citas.filter(c => 
      c.barberoId === barberoId && 
      c.fecha === this.fechaSeleccionada &&
      c.estado !== 'CANCELADA' && 
      c.estado !== 'COMPLETADA' &&
      (!this.citaSeleccionada || c.id !== this.citaSeleccionada.id) // Excluir la cita que se está editando
    );
    
    // Crear rangos de tiempo ocupados por las citas activas
    const rangosOcupados: Array<{ inicio: number, fin: number }> = [];
    for (const cita of citasActivas) {
      const [horaStr, minutoStr] = cita.hora.split(':');
      const horaInicio = parseInt(horaStr, 10);
      const minutoInicio = parseInt(minutoStr, 10);
      const inicioCitaMinutos = horaInicio * 60 + minutoInicio;
      const finCitaMinutos = inicioCitaMinutos + cita.tipoCorteTiempoMinutos;
      rangosOcupados.push({ inicio: inicioCitaMinutos, fin: finCitaMinutos });
    }
    
    // Usar las horas que vienen del backend (ya están generadas cada 5 minutos)
    // Solo filtrar las que están ocupadas por citas activas
    const horasDisponibles12h: string[] = [];
    const horasAgregadas = new Set<string>(); // Para evitar duplicados
    
    // Debug: verificar si el backend tiene horas disponibles
    console.log(`Barbero ${barberoId} - Tipo de horasDisponibles:`, typeof disponibilidad.horasDisponibles);
    console.log(`Barbero ${barberoId} - Horas disponibles del backend:`, disponibilidad.horasDisponibles?.length || 0);
    console.log(`Barbero ${barberoId} - Primeras 3 horas del backend:`, disponibilidad.horasDisponibles?.slice(0, 3));
    console.log(`Barbero ${barberoId} - Ejemplo de hora:`, disponibilidad.horasDisponibles?.[0]);
    
    // Si el backend tiene horas disponibles, usarlas directamente
    if (disponibilidad.horasDisponibles && disponibilidad.horasDisponibles.length > 0) {
      console.log(`✓ Usando ${disponibilidad.horasDisponibles.length} horas del backend`);
      for (const hora24h of disponibilidad.horasDisponibles) {
        // Parsear la hora del backend (viene como string "HH:mm:ss" desde LocalTime)
        let horaStr: string;
        if (typeof hora24h === 'string') {
          // Si es string, extraer HH:mm (puede venir como "HH:mm:ss" o "HH:mm")
          const partes = hora24h.split(':');
          horaStr = `${partes[0]}:${partes[1]}`;
        } else if (hora24h && typeof hora24h === 'object') {
          // Si es objeto (caso raro), intentar extraer hour y minute
          const hour = (hora24h as any).hour || (hora24h as any)[0] || 0;
          const minute = (hora24h as any).minute || (hora24h as any)[1] || 0;
          horaStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        } else {
          console.warn(`Formato de hora desconocido:`, hora24h);
          continue;
        }
        
        const [horaStr2, minutoStr] = horaStr.split(':');
        const horaNum = parseInt(horaStr2, 10);
        const minutoNum = parseInt(minutoStr, 10);
        
        if (isNaN(horaNum) || isNaN(minutoNum)) {
          console.warn(`No se pudo parsear la hora: ${horaStr}`);
          continue;
        }
        
        const horaMinutos = horaNum * 60 + minutoNum;
        
        // Verificar que no se solape con ninguna cita activa
        let haySolapamiento = false;
        for (const rango of rangosOcupados) {
          if (horaMinutos >= rango.inicio && horaMinutos < rango.fin) {
            haySolapamiento = true;
            break;
          }
        }
        
        if (!haySolapamiento) {
          const hora12h = this.convertir24hA12h(horaStr);
          if (!horasAgregadas.has(hora12h)) {
            horasDisponibles12h.push(hora12h);
            horasAgregadas.add(hora12h);
          }
        }
      }
      console.log(`✓ Horas procesadas del backend: ${horasDisponibles12h.length}`);
    } else {
      console.warn(`✗ Backend no tiene horas, usando fallback (generando desde ${inicioMinutos} hasta ${finMinutos})`);
      // Si el backend no tiene horas, generar desde el rango (fallback)
      let horaActualMinutos = inicioMinutos;
      while (horaActualMinutos < finMinutos) {
        let haySolapamiento = false;
        for (const rango of rangosOcupados) {
          if (horaActualMinutos >= rango.inicio && horaActualMinutos < rango.fin) {
            haySolapamiento = true;
            break;
          }
        }
        
        if (!haySolapamiento) {
          const horas = Math.floor(horaActualMinutos / 60);
          const minutos = horaActualMinutos % 60;
          const hora24h = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
          const hora12h = this.convertir24hA12h(hora24h);
          
          if (!horasAgregadas.has(hora12h)) {
            horasDisponibles12h.push(hora12h);
            horasAgregadas.add(hora12h);
          }
        }
        
        horaActualMinutos += 5;
      }
    }
    
    // Ordenar las horas para que aparezcan en orden cronológico
    horasDisponibles12h.sort((a, b) => {
      const horaA = this.convertir12hA24h(a);
      const horaB = this.convertir12hA24h(b);
      return horaA.localeCompare(horaB);
    });
    
    // Eliminar duplicados finales (por si acaso)
    const horasUnicas = Array.from(new Set(horasDisponibles12h));
    
    console.log(`Horas disponibles generadas: ${horasUnicas.length} (desde ${inicioMinutos} min hasta ${finMinutos} min, cada 5 min)`);
    console.log('Primeras 5 horas:', horasUnicas.slice(0, 5));
    console.log('Últimas 5 horas:', horasUnicas.slice(-5));
    
    return horasUnicas;
  }

  tieneHorario(barberoId: number): boolean {
    return this.disponibilidades.some(d => d.barberoId === barberoId);
  }

  agregarCorreo(): void {
    if (this.editandoCita && this.citaEditando) {
      this.citaEditando.correosConfirmacion.push('');
    } else {
      this.nuevaCita.correosConfirmacion.push('');
    }
  }

  eliminarCorreo(index: number): void {
    if (this.editandoCita && this.citaEditando) {
      if (this.citaEditando.correosConfirmacion.length > 1) {
        this.citaEditando.correosConfirmacion.splice(index, 1);
      }
    } else {
      if (this.nuevaCita.correosConfirmacion.length > 1) {
        this.nuevaCita.correosConfirmacion.splice(index, 1);
      }
    }
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (this.mostrarFormulario) {
      // Asegurar que los tipos de corte estén cargados cuando se muestra el formulario
      if (this.tiposCorte.length === 0) {
        this.cargarTiposCorte();
      }
    } else {
      this.resetearFormulario();
    }
  }

  resetearFormulario(): void {
    this.nuevaCita = {
      fecha: this.fechaSeleccionada,
      hora: '',
      barberoId: 0,
      tipoCorteId: 0,
      nombreCliente: '',
      correoCliente: '',
      telefonoCliente: '',
      comentarios: '',
      correosConfirmacion: ['']
    };
    this.tipoCorteSeleccionado = null;
    this.barberoSeleccionado = 0;
    this.horaSeleccionada = '';
    this.horaSeleccionada12h = '';
    this.editando = false;
  }

  guardarCita(): void {
    // Validar que todos los correos estén llenos
    const correosValidos = this.nuevaCita.correosConfirmacion.filter(c => c.trim() !== '');
    if (correosValidos.length === 0) {
      this.mostrarNotificacion('Debe proporcionar al menos un correo para la confirmación', 'warning');
      return;
    }

    // Agregar el correo del cliente si no está en la lista
    if (!correosValidos.includes(this.nuevaCita.correoCliente)) {
      correosValidos.push(this.nuevaCita.correoCliente);
    }

    // Validar que el corte completo quepa en el horario del barbero (solo al crear la cita)
    if (this.tipoCorteSeleccionado && this.barberoSeleccionado > 0 && this.nuevaCita.hora) {
      const disponibilidad = this.disponibilidades.find(d => d.barberoId === this.barberoSeleccionado);
      if (disponibilidad) {
        const [horaSalidaStr, minutoSalidaStr] = disponibilidad.horaSalida.split(':');
        const horaSalidaNum = parseInt(horaSalidaStr, 10);
        const minutoSalidaNum = parseInt(minutoSalidaStr, 10);
        let finMinutos = horaSalidaNum * 60 + minutoSalidaNum;
        
        if (horaSalidaNum === 0 && minutoSalidaNum === 0) {
          finMinutos = 24 * 60;
        }
        
        const [horaStr, minutoStr] = this.nuevaCita.hora.split(':');
        const horaInicio = parseInt(horaStr, 10);
        const minutoInicio = parseInt(minutoStr, 10);
        const inicioMinutos = horaInicio * 60 + minutoInicio;
        const finCorteMinutos = inicioMinutos + this.tipoCorteSeleccionado.tiempoMinutos;
        
        if (finCorteMinutos > finMinutos) {
          const horaSalida12h = this.convertir24hA12h(disponibilidad.horaSalida);
          const tiempoLegible = this.convertirTiempoALegible(this.tipoCorteSeleccionado.tiempoMinutos);
          this.mostrarNotificacion(`El corte seleccionado (${tiempoLegible}) no cabe en el horario del barbero. El horario termina a las ${horaSalida12h}.`, 'error');
          this.cargando = false;
          return;
        }
      }
    }

    const citaParaGuardar: CitaCreate = {
      ...this.nuevaCita,
      correosConfirmacion: correosValidos
    };

    this.cargando = true;
    this.citaService.crearCita(citaParaGuardar).subscribe({
      next: () => {
        this.mostrarNotificacion('Cita creada exitosamente. Se ha enviado un correo de confirmación.', 'success');
        // Recargar citas primero para tener información actualizada
        this.cargarCitas();
        // Recargar disponibilidad después de un pequeño delay para asegurar que las citas se hayan cargado
        setTimeout(() => {
          this.cargarDisponibilidad();
          // Resetear selecciones
          this.barberoSeleccionado = 0;
          this.horaSeleccionada = '';
          this.horaSeleccionada12h = '';
          this.toggleFormulario();
          this.cargando = false;
        }, 300);
      },
      error: (error) => {
        console.error('Error al crear cita:', error);
        let mensaje = 'Error al crear la cita';
        
        if (error.error?.message) {
          mensaje = error.error.message;
        } else if (error.status === 500 || error.status === 409) {
          // 409 = CONFLICT, 500 = INTERNAL_SERVER_ERROR
          if (error.error?.message && error.error.message.includes('duplicate') || 
              error.error?.message && error.error.message.includes('duplicada')) {
            mensaje = 'Ya existe una cita para este barbero en la fecha y hora seleccionada. Por favor, seleccione otra hora.';
          } else {
            mensaje = 'Ya existe una cita para este barbero en la fecha y hora seleccionada. Por favor, seleccione otra hora.';
          }
        }
        
        this.mostrarNotificacion(mensaje, 'error');
        // Recargar disponibilidad y citas para actualizar la información
        this.cargarCitas();
        this.cargarDisponibilidad();
        // Resetear selecciones
        this.barberoSeleccionado = 0;
        this.horaSeleccionada = '';
        this.horaSeleccionada12h = '';
        this.nuevaCita.hora = '';
        this.cargando = false;
      }
    });
  }

  cancelarCita(id: number): void {
    // Buscar la cita para mostrar información dinámica
    const cita = this.citas.find(c => c.id === id);
    const nombreCliente = cita?.nombreCliente || 'esta cita';
    const fecha = cita?.fecha || '';
    const hora = cita?.hora || '';
    
    this.mostrarConfirmacion(
      'Cancelar Cita',
      `¿Está seguro de cancelar la cita de <strong>${nombreCliente}</strong> programada para el <strong>${fecha}</strong> a las <strong>${hora}</strong>?`,
      'warning',
      () => {
        this.ejecutarCancelacionCita(id);
      }
    );
  }
  
  ejecutarCancelacionCita(id: number): void {
    this.cargando = true;
    
    // Cerrar modal si está abierto
    if (this.mostrarModalDetallesCita && this.citaSeleccionada?.id === id) {
      this.cerrarModalDetallesCita();
    }
    
    this.citaService.cancelarCita(id).subscribe({
        next: () => {
          console.log('Cita cancelada exitosamente');
          
          // Recargar las citas para actualizar el estado en la vista
          this.cargarCitas();
          
          // Regenerar la semana para actualizar el calendario visualmente
          this.generarSemana();
          
          // Recargar la disponibilidad y actualizar horas disponibles
          if (this.fechaSeleccionada) {
            // Esperar un momento para que el backend procese el cambio
            setTimeout(() => {
              console.log('Recargando disponibilidad después de cancelar cita...');
              this.cargarDisponibilidad();
              
              // Actualizar horas disponibles si hay un barbero seleccionado
              if (this.barberoSeleccionado > 0) {
                setTimeout(() => {
                  this.actualizarHorasDisponibles();
                  console.log('Horas disponibles actualizadas después de cancelar cita');
                }, 300);
              }
            }, 400);
          }
          
          this.cargando = false;
          this.mostrarNotificacion('Cita cancelada exitosamente. La hora ahora está disponible.', 'success');
        },
        error: (error) => {
          console.error('Error al cancelar cita:', error);
          const mensaje = error.error?.message || 'Error al cancelar la cita';
          this.mostrarNotificacion(mensaje, 'error');
          this.cargando = false;
        }
      });
  }

  completarCita(id: number): void {
    // Buscar la cita para mostrar información dinámica
    const cita = this.citas.find(c => c.id === id);
    const nombreCliente = cita?.nombreCliente || 'el cliente';
    const barberoNombre = cita?.barberoNombre || 'el barbero';
    const fecha = cita?.fecha || '';
    const hora = cita?.hora || '';
    
    this.mostrarConfirmacion(
      'Completar Cita',
      `¿Está seguro de marcar como completada la cita de <strong>${nombreCliente}</strong> con <strong>${barberoNombre}</strong> programada para el <strong>${fecha}</strong> a las <strong>${hora}</strong>?<br><br><small class="text-muted">El barbero habrá terminado el corte y la hora quedará disponible para nuevas citas.</small>`,
      'success',
      () => {
        this.ejecutarCompletarCita(id);
      }
    );
  }
  
  ejecutarCompletarCita(id: number): void {
    this.cargando = true;
    
    // Cerrar modal si está abierto antes de hacer la petición
    if (this.mostrarModalDetallesCita && this.citaSeleccionada?.id === id) {
      this.cerrarModalDetallesCita();
    }
    
    this.citaService.completarCita(id).subscribe({
        next: (citaActualizada) => {
          console.log('Cita completada exitosamente:', citaActualizada);
          
          // Recargar las citas primero (esto también regenera la semana)
          this.cargarCitas(true);
          
          // Recargar la disponibilidad y actualizar horas disponibles
          if (this.fechaSeleccionada) {
            // Esperar un momento para que el backend procese el cambio
            setTimeout(() => {
              console.log('Recargando disponibilidad después de completar cita...');
              this.cargarDisponibilidad();
              
              // Actualizar horas disponibles si hay un barbero seleccionado
              if (this.barberoSeleccionado > 0) {
                setTimeout(() => {
                  this.actualizarHorasDisponibles();
                  console.log('Horas disponibles actualizadas después de completar cita');
                }, 200);
              }
              
              // Finalizar el proceso de carga después de todas las actualizaciones
              setTimeout(() => {
                this.cargando = false;
                // Forzar detección de cambios para actualizar la vista
                this.cdr.detectChanges();
                this.mostrarNotificacion('Cita marcada como completada. Las horas ahora están disponibles.', 'success');
              }, 300);
            }, 400);
          } else {
            // Si no hay fecha seleccionada, finalizar inmediatamente
            this.cargando = false;
            this.mostrarNotificacion('Cita marcada como completada exitosamente.', 'success');
          }
        },
        error: (error) => {
          console.error('Error al completar cita:', error);
          const mensaje = error.error?.message || 'Error al completar la cita';
          this.mostrarNotificacion(mensaje, 'error');
          this.cargando = false;
        }
      });
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'CONFIRMADA':
        return 'bg-success';
      case 'PENDIENTE':
        return 'bg-warning';
      case 'CANCELADA':
        return 'bg-danger';
      case 'COMPLETADA':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  mostrarModalCambiarHora(cita: Cita): void {
    this.citaCambiarHora = cita;
    this.nuevaHoraSeleccionada = '';
    this.mostrarModalCambiarHoraFlag = true;
    
    // Cargar disponibilidad para la fecha y barbero de la cita
    this.cargarDisponibilidadParaCambiarHora(cita.fecha, cita.barberoId, cita.tipoCorteTiempoMinutos);
  }

  cargarDisponibilidadParaCambiarHora(fecha: string, barberoId: number, tiempoMinutos: number): void {
    this.citaService.obtenerDisponibilidad(fecha).subscribe({
      next: (disponibilidades) => {
        const disponibilidad = disponibilidades.find(d => d.barberoId === barberoId);
        if (disponibilidad) {
          // Obtener citas activas del barbero para la fecha (excluyendo la cita que se está cambiando)
          const citaIdActual = this.citaCambiarHora?.id;
          const citasActivas = this.citas.filter(c => 
            c.barberoId === barberoId && 
            c.fecha === fecha &&
            c.id !== citaIdActual &&
            c.estado !== 'CANCELADA' && 
            c.estado !== 'COMPLETADA'
          );
          
          // Crear rangos de tiempo ocupados por las citas activas
          const rangosOcupados: Array<{ inicio: number, fin: number }> = [];
          for (const cita of citasActivas) {
            const [horaStr, minutoStr] = cita.hora.split(':');
            const horaInicio = parseInt(horaStr, 10);
            const minutoInicio = parseInt(minutoStr, 10);
            const inicioMinutos = horaInicio * 60 + minutoInicio;
            
            // Calcular hora de fin considerando el tiempo del corte
            const finMinutos = inicioMinutos + cita.tipoCorteTiempoMinutos;
            
            rangosOcupados.push({ inicio: inicioMinutos, fin: finMinutos });
          }
          
          // Filtrar horas según el tiempo necesario del tipo de corte y citas activas
          this.horasDisponiblesCambiar = disponibilidad.horasDisponibles.filter(hora => {
            const [horaStr, minutoStr] = hora.split(':');
            const horaInicio = parseInt(horaStr, 10);
            const minutoInicio = parseInt(minutoStr, 10);
            const inicioMinutos = horaInicio * 60 + minutoInicio;
            
            // Calcular hora de fin del corte
            const finMinutos = inicioMinutos + tiempoMinutos;
            
            // Verificar que el corte termine antes del horario de salida del barbero
            const horaSalida = disponibilidad.horaSalida.split(':');
            const horaSalidaNum = parseInt(horaSalida[0], 10);
            const minutoSalidaNum = parseInt(horaSalida[1], 10);
            const totalMinutosSalida = horaSalidaNum * 60 + minutoSalidaNum;
            
            if (finMinutos > totalMinutosSalida) {
              return false; // El corte no cabe en el horario del barbero
            }
            
            // Verificar que no se solape con ninguna cita activa
            for (const rango of rangosOcupados) {
              // Verificar solapamiento
              if ((inicioMinutos >= rango.inicio && inicioMinutos < rango.fin) ||
                  (finMinutos > rango.inicio && finMinutos <= rango.fin) ||
                  (inicioMinutos <= rango.inicio && finMinutos >= rango.fin)) {
                return false; // Hay solapamiento
              }
            }
            
            return true;
          });
        } else {
          this.horasDisponiblesCambiar = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar disponibilidad:', error);
        this.horasDisponiblesCambiar = [];
      }
    });
  }

  cambiarHora(): void {
    if (!this.citaCambiarHora || !this.nuevaHoraSeleccionada) {
      this.mostrarNotificacion('Por favor, seleccione una hora', 'warning');
      return;
    }

    if (this.nuevaHoraSeleccionada === this.citaCambiarHora.hora) {
      this.mostrarNotificacion('La nueva hora debe ser diferente a la hora actual', 'warning');
      return;
    }

    this.cargando = true;
    this.citaService.actualizarHora(this.citaCambiarHora.id, this.nuevaHoraSeleccionada).subscribe({
      next: () => {
        this.cargarCitas();
        setTimeout(() => {
          if (this.fechaSeleccionada) {
            this.cargarDisponibilidad();
          }
          this.cargando = false;
          this.mostrarModalCambiarHoraFlag = false;
          this.citaCambiarHora = null;
          this.nuevaHoraSeleccionada = '';
          this.mostrarNotificacion('Hora de la cita actualizada exitosamente.', 'success');
        }, 500);
      },
      error: (error) => {
        console.error('Error al cambiar hora:', error);
        const mensaje = error.error?.message || 'Error al cambiar la hora de la cita';
        this.mostrarNotificacion(mensaje, 'error');
        this.cargando = false;
      }
    });
  }

  cerrarModalCambiarHora(): void {
    this.mostrarModalCambiarHoraFlag = false;
    this.citaCambiarHora = null;
    this.nuevaHoraSeleccionada = '';
    this.horasDisponiblesCambiar = [];
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.mensajeNotificacion = mensaje;
    this.tipoNotificacion = tipo;
    this.mostrarModalNotificacion = true;
  }

  cerrarModalNotificacion(): void {
    this.mostrarModalNotificacion = false;
    this.mensajeNotificacion = '';
  }

  abrirModalDetallesCita(cita: Cita): void {
    this.citaSeleccionada = cita;
    this.editandoCita = false;
    this.mostrarModalDetallesCita = true;
  }

  cerrarModalDetallesCita(): void {
    this.mostrarModalDetallesCita = false;
    this.citaSeleccionada = null;
    this.editandoCita = false;
    this.citaEditando = {
      fecha: '',
      hora: '',
      barberoId: 0,
      tipoCorteId: 0,
      nombreCliente: '',
      correoCliente: '',
      telefonoCliente: '',
      comentarios: '',
      correosConfirmacion: ['']
    };
  }

  iniciarEdicionCita(): void {
    if (!this.citaSeleccionada) return;
    
    this.editandoCita = true;
    this.citaEditando = {
      fecha: this.citaSeleccionada.fecha.split('T')[0], // Extraer solo la fecha
      hora: this.citaSeleccionada.hora,
      barberoId: this.citaSeleccionada.barberoId,
      tipoCorteId: this.citaSeleccionada.tipoCorteId,
      nombreCliente: this.citaSeleccionada.nombreCliente,
      correoCliente: this.citaSeleccionada.correoCliente,
      telefonoCliente: this.citaSeleccionada.telefonoCliente || '',
      comentarios: this.citaSeleccionada.comentarios || '',
      correosConfirmacion: [this.citaSeleccionada.correoCliente]
    };
    
    // Convertir hora a formato 12h para el selector
    this.horaSeleccionada12h = this.convertirHoraA12h(this.citaSeleccionada.hora);
    this.fechaSeleccionada = this.citaSeleccionada.fecha.split('T')[0];
    this.barberoSeleccionado = this.citaSeleccionada.barberoId;
    
    // Cargar disponibilidad para la fecha
    this.cargarDisponibilidad();
    
    // Seleccionar el tipo de corte
    const tipoCorte = this.tiposCorte.find(tc => tc.id === this.citaSeleccionada!.tipoCorteId);
    if (tipoCorte) {
      this.tipoCorteSeleccionado = tipoCorte;
    }
  }

  cancelarEdicionCita(): void {
    this.editandoCita = false;
    this.citaEditando = {
      fecha: '',
      hora: '',
      barberoId: 0,
      tipoCorteId: 0,
      nombreCliente: '',
      correoCliente: '',
      telefonoCliente: '',
      comentarios: '',
      correosConfirmacion: ['']
    };
  }

  guardarEdicionCita(): void {
    if (!this.citaSeleccionada) return;

    // Validar que todos los correos estén llenos
    const correosValidos = this.citaEditando.correosConfirmacion.filter(c => c.trim() !== '');
    if (correosValidos.length === 0) {
      this.mostrarNotificacion('Debe proporcionar al menos un correo para la confirmación', 'warning');
      return;
    }

    // Convertir hora de 12h a 24h
    if (this.horaSeleccionada12h) {
      this.citaEditando.hora = this.convertir12hA24h(this.horaSeleccionada12h);
    }

    this.cargando = true;
    this.citaService.update(this.citaSeleccionada.id, this.citaEditando).subscribe({
      next: () => {
        this.cargarCitas();
        this.mostrarNotificacion('Cita actualizada exitosamente', 'success');
        this.editandoCita = false;
        this.cargando = false;
        // Recargar la cita actualizada
        setTimeout(() => {
          this.cargarCitas();
          if (this.citaSeleccionada) {
            const citaActualizada = this.citas.find(c => c.id === this.citaSeleccionada!.id);
            if (citaActualizada) {
              this.citaSeleccionada = citaActualizada;
            }
          }
        }, 500);
      },
      error: (error) => {
        console.error('Error al actualizar cita:', error);
        this.mostrarNotificacion(error.error?.message || 'Error al actualizar la cita', 'error');
        this.cargando = false;
      }
    });
  }

  finalizarCitaDesdeModal(): void {
    if (!this.citaSeleccionada) return;
    // El modal se cerrará automáticamente dentro de completarCita
    this.completarCita(this.citaSeleccionada.id);
  }

  cancelarCitaDesdeModal(): void {
    if (!this.citaSeleccionada) return;
    // El modal se cerrará automáticamente dentro de cancelarCita
    this.cancelarCita(this.citaSeleccionada.id);
  }

  mostrarConfirmacion(titulo: string, mensaje: string, tipo: 'success' | 'warning' | 'danger' | 'info', accion: () => void): void {
    this.confirmacionTitulo = titulo;
    this.confirmacionMensaje = mensaje;
    this.confirmacionTipo = tipo;
    this.confirmacionAccion = accion;
    this.mostrarModalConfirmacion = true;
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  confirmarAccion(): void {
    if (this.confirmacionAccion) {
      this.confirmacionAccion();
    }
    this.cerrarModalConfirmacion();
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.confirmacionTitulo = '';
    this.confirmacionMensaje = '';
    this.confirmacionAccion = null;
    // Restaurar scroll del body
    document.body.style.overflow = '';
  }
}


