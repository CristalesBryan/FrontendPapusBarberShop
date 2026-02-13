import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorarioService } from '../../services/horario.service';
import { BarberoService } from '../../services/barbero.service';
import { Horario, HorarioCreate } from '../../models/horario.model';
import { Barbero } from '../../models/barbero.model';

interface DiaCalendario {
  fecha: Date;
  esMesActual: boolean;
  horarios: Horario[];
  esHoy: boolean;
}

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.component.html',
  styleUrls: ['./horarios.component.css']
})
export class HorariosComponent implements OnInit {
  horarios: Horario[] = [];
  barberos: Barbero[] = [];
  cargando = false;
  mostrarFormulario = false;
  editando = false;
  horarioSeleccionado: Horario | null = null;

  nuevoHorario: HorarioCreate = {
    barberoId: 0,
    horaEntrada: '09:00',
    horaSalida: '18:00',
    activo: true,
    fecha: undefined
  };

  fechaHorarioSeleccionada: string = '';

  // Modal de confirmación
  mostrarModalConfirmacion = false;
  mensajeConfirmacion = '';
  tituloConfirmacion = 'Confirmar';
  accionConfirmar: (() => void) | null = null;

  // Modal de detalles de horario
  mostrarModalDetallesHorario = false;

  barberoFiltro: number | null = null;

  // Calendario
  fechaActual: Date = new Date();
  mesActual: number = this.fechaActual.getMonth();
  anioActual: number = this.fechaActual.getFullYear();
  diasCalendario: DiaCalendario[] = [];
  nombresMeses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  nombresDias: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  nombresDiasCompletos: string[] = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  
  // Vista semanal
  semanaActual: Date[] = [];
  fechaInicioSemana: Date = new Date();
  fechaSeleccionada: Date = new Date();
  
  // Horas disponibles en formato 12 horas (6am a 12am)
  horasDisponibles: string[] = [];
  horaEntradaSeleccionada: string = '06:00 AM';
  horaSalidaSeleccionada: string = '12:00 AM';

  constructor(
    private horarioService: HorarioService,
    private barberoService: BarberoService
  ) {
    this.generarHorasDisponibles();
  }

  ngOnInit(): void {
    this.cargarBarberos();
    this.cargarHorarios();
    this.inicializarSemana();
    
    // Escuchar eventos de actualización de barberos
    window.addEventListener('barberosActualizados', () => {
      this.cargarBarberos();
    });
  }

  cargarBarberos(): void {
    this.barberoService.getAll().subscribe({
      next: (data) => {
        this.barberos = data;
        if (this.barberos.length > 0 && this.nuevoHorario.barberoId === 0) {
          this.nuevoHorario.barberoId = this.barberos[0].id;
        }
      },
      error: (error) => {
        console.error('Error al cargar barberos:', error);
      }
    });
  }

  cargarHorarios(): void {
    this.cargando = true;
    this.horarioService.getAll().subscribe({
      next: (data) => {
        this.horarios = data;
        this.generarSemana();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar horarios:', error);
        this.cargando = false;
      }
    });
  }

  inicializarSemana(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    this.fechaSeleccionada = hoy;
    this.generarSemana();
  }

  generarSemana(): void {
    this.semanaActual = [];
    this.diasCalendario = [];
    
    // Obtener el lunes de la semana que contiene la fecha seleccionada
    const lunes = new Date(this.fechaSeleccionada);
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
      this.diasCalendario.push({
        fecha: fecha,
        esMesActual: true,
        horarios: this.getHorariosPorFecha(fecha),
        esHoy: this.esHoy(fecha)
      });
    }
    
    // Actualizar mes y año actuales basados en la fecha seleccionada
    this.mesActual = this.fechaSeleccionada.getMonth();
    this.anioActual = this.fechaSeleccionada.getFullYear();
  }

  generarCalendario(): void {
    // Mantener para compatibilidad, pero usar generarSemana
    this.generarSemana();
  }

  getHorariosPorFecha(fecha: Date): Horario[] {
    const fechaStr = this.formatearFecha(fecha);
    
    // Filtrar horarios por la fecha de creación
    let horariosFiltrados = this.horarios.filter(h => {
      if (!h.fecha) return false;
      // Normalizar la fecha del horario (puede venir como "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss")
      let fechaHorario = h.fecha;
      if (fechaHorario.includes('T')) {
        fechaHorario = fechaHorario.split('T')[0];
      }
      // Asegurar que tenga el formato correcto (YYYY-MM-DD)
      if (fechaHorario.length > 10) {
        fechaHorario = fechaHorario.substring(0, 10);
      }
      return fechaHorario === fechaStr;
    });
    
    // Aplicar filtro de barbero si está activo
    if (this.barberoFiltro !== null && this.barberoFiltro !== undefined) {
      const filtroId = typeof this.barberoFiltro === 'string' 
        ? parseInt(this.barberoFiltro, 10) 
        : this.barberoFiltro;
      horariosFiltrados = horariosFiltrados.filter(h => h.barberoId === filtroId);
    }
    
    return horariosFiltrados;
  }

  getHorariosPorFechaYBarbero(fecha: Date, barberoId: number): Horario[] {
    const fechaStr = this.formatearFecha(fecha);
    
    // Filtrar horarios por la fecha y barbero
    let horariosFiltrados = this.horarios.filter(h => {
      if (!h.fecha || h.barberoId !== barberoId) return false;
      // Normalizar la fecha del horario
      let fechaHorario = h.fecha;
      if (fechaHorario.includes('T')) {
        fechaHorario = fechaHorario.split('T')[0];
      }
      if (fechaHorario.length > 10) {
        fechaHorario = fechaHorario.substring(0, 10);
      }
      return fechaHorario === fechaStr;
    });
    
    return horariosFiltrados;
  }

  formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  }

  diaAnterior(): void {
    const nuevaFecha = new Date(this.fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    nuevaFecha.setHours(0, 0, 0, 0);
    this.fechaSeleccionada = nuevaFecha;
    this.generarSemana();
  }

  diaSiguiente(): void {
    const nuevaFecha = new Date(this.fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    nuevaFecha.setHours(0, 0, 0, 0);
    this.fechaSeleccionada = nuevaFecha;
    this.generarSemana();
  }

  semanaAnterior(): void {
    this.diaAnterior();
  }

  semanaSiguiente(): void {
    this.diaSiguiente();
  }

  irAHoy(): void {
    this.inicializarSemana();
  }

  mesAnterior(): void {
    this.semanaAnterior();
  }

  mesSiguiente(): void {
    this.semanaSiguiente();
  }

  getNombreMes(): string {
    return this.nombresMeses[this.mesActual];
  }

  getHorariosFiltrados(): Horario[] {
    if (this.barberoFiltro === null || this.barberoFiltro === undefined) {
      return this.horarios;
    }
    const filtroId = typeof this.barberoFiltro === 'string' 
      ? parseInt(this.barberoFiltro, 10) 
      : this.barberoFiltro;
    return this.horarios.filter(h => h.barberoId === filtroId);
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.resetearFormulario();
    }
  }

  cerrarModal(): void {
    this.mostrarFormulario = false;
    this.resetearFormulario();
  }

  abrirFormularioConFecha(fecha: Date, barberoId?: number): void {
    this.fechaHorarioSeleccionada = this.formatearFecha(fecha);
    this.nuevoHorario.fecha = this.fechaHorarioSeleccionada;
    this.editando = false;
    this.horarioSeleccionado = null;
    
    // Si se proporciona un barberoId específico, usarlo
    if (barberoId && barberoId > 0) {
      this.nuevoHorario.barberoId = barberoId;
    } else {
      // Buscar si hay horarios para esta fecha y preseleccionar el barbero más común
      const horariosFecha = this.getHorariosPorFecha(fecha);
      if (horariosFecha.length > 0) {
        // Contar cuántos horarios tiene cada barbero en esta fecha
        const barberoCounts: { [key: number]: number } = {};
        horariosFecha.forEach(h => {
          barberoCounts[h.barberoId] = (barberoCounts[h.barberoId] || 0) + 1;
        });
        
        // Obtener el barbero con más horarios
        let barberoMasComun = 0;
        let maxCount = 0;
        for (const [barberoId, count] of Object.entries(barberoCounts)) {
          if (count > maxCount) {
            maxCount = count;
            barberoMasComun = parseInt(barberoId, 10);
          }
        }
        
        if (barberoMasComun > 0) {
          this.nuevoHorario.barberoId = barberoMasComun;
        } else if (this.barberos.length > 0) {
          // Si no hay horarios, seleccionar el primer barbero
          this.nuevoHorario.barberoId = this.barberos[0].id;
        }
      } else {
        // Si no hay horarios para esta fecha, seleccionar el primer barbero disponible
        if (this.barberos.length > 0) {
          this.nuevoHorario.barberoId = this.barberos[0].id;
        }
      }
    }
    
    // Establecer horas por defecto
    this.horaEntradaSeleccionada = '06:00 AM';
    this.horaSalidaSeleccionada = '12:00 AM';
    this.nuevoHorario.horaEntrada = this.convertir12hA24h('06:00 AM');
    this.nuevoHorario.horaSalida = this.convertir12hA24h('12:00 AM');
    
    this.mostrarFormulario = true;
  }

  abrirFormularioNuevo(): void {
    this.resetearFormulario();
    // Establecer fecha actual si no hay fecha seleccionada
    if (!this.fechaHorarioSeleccionada) {
      const hoy = new Date();
      this.fechaHorarioSeleccionada = this.formatearFecha(hoy);
      this.nuevoHorario.fecha = this.fechaHorarioSeleccionada;
    }
    // Asegurar que las horas estén en los valores por defecto
    this.horaEntradaSeleccionada = '06:00 AM';
    this.horaSalidaSeleccionada = '12:00 AM';
    this.nuevoHorario.horaEntrada = this.convertir12hA24h('06:00 AM');
    this.nuevoHorario.horaSalida = this.convertir12hA24h('12:00 AM');
    this.mostrarFormulario = true;
  }

  editarHorario(horario: Horario): void {
    this.horarioSeleccionado = horario;
    this.nuevoHorario = {
      barberoId: horario.barberoId,
      horaEntrada: horario.horaEntrada,
      horaSalida: horario.horaSalida,
      activo: horario.activo,
      fecha: horario.fecha
    };
    // Convertir a formato 12 horas para los selects
    this.horaEntradaSeleccionada = this.convertir24hA12h(horario.horaEntrada);
    this.horaSalidaSeleccionada = this.convertir24hA12h(horario.horaSalida);
    this.fechaHorarioSeleccionada = horario.fecha || '';
    this.editando = true;
    this.mostrarFormulario = true;
  }

  guardarHorario(): void {
    // Convertir las horas seleccionadas a formato 24 horas antes de guardar
    this.nuevoHorario.horaEntrada = this.convertir12hA24h(this.horaEntradaSeleccionada);
    this.nuevoHorario.horaSalida = this.convertir12hA24h(this.horaSalidaSeleccionada);
    
    if (this.editando && this.horarioSeleccionado) {
      this.cargando = true;
      this.horarioService.update(this.horarioSeleccionado.id, this.nuevoHorario).subscribe({
        next: () => {
          this.cargarHorarios();
          this.cerrarModal();
          this.cargando = false;
          this.mostrarNotificacion('Horario actualizado exitosamente.', 'success');
        },
        error: (error) => {
          console.error('Error al actualizar horario:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al actualizar el horario', 'error');
          this.cargando = false;
        }
      });
    } else {
      this.cargando = true;
      this.horarioService.create(this.nuevoHorario).subscribe({
        next: () => {
          this.cargarHorarios();
          this.cerrarModal();
          this.cargando = false;
          this.mostrarNotificacion('Horario creado exitosamente.', 'success');
        },
        error: (error) => {
          console.error('Error al crear horario:', error);
          this.mostrarNotificacion(error.error?.message || 'Error al crear el horario', 'error');
          this.cargando = false;
        }
      });
    }
  }

  eliminarHorario(id: number): void {
    this.mostrarConfirmacion(
      'Eliminar Horario',
      '¿Está seguro de que desea eliminar este horario?',
      () => {
        this.horarioService.delete(id).subscribe({
          next: () => {
            this.cargarHorarios();
            this.mostrarNotificacion('Horario eliminado exitosamente.', 'success');
          },
          error: (error) => {
            console.error('Error al eliminar horario:', error);
            this.mostrarNotificacion(error.error?.message || 'Error al eliminar el horario', 'error');
          }
        });
      }
    );
  }

  mostrarConfirmacion(titulo: string, mensaje: string, accion: () => void): void {
    this.tituloConfirmacion = titulo;
    this.mensajeConfirmacion = mensaje;
    this.accionConfirmar = accion;
    this.mostrarModalConfirmacion = true;
  }

  confirmarAccion(): void {
    if (this.accionConfirmar) {
      this.accionConfirmar();
    }
    this.cerrarModalConfirmacion();
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.mensajeConfirmacion = '';
    this.tituloConfirmacion = 'Confirmar';
    this.accionConfirmar = null;
  }

  // Modal de notificación
  mostrarModalNotificacion = false;
  mensajeNotificacion = '';
  tipoNotificacion: 'success' | 'error' | 'info' | 'warning' = 'info';

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.mensajeNotificacion = mensaje;
    this.tipoNotificacion = tipo;
    this.mostrarModalNotificacion = true;
  }

  cerrarModalNotificacion(): void {
    this.mostrarModalNotificacion = false;
    this.mensajeNotificacion = '';
  }

  resetearFormulario(): void {
    this.nuevoHorario = {
      barberoId: this.barberos.length > 0 ? this.barberos[0].id : 0,
      horaEntrada: '06:00',
      horaSalida: '00:00',
      activo: true,
      fecha: undefined
    };
    this.horaEntradaSeleccionada = '06:00 AM';
    this.horaSalidaSeleccionada = '12:00 AM';
    this.fechaHorarioSeleccionada = '';
    this.editando = false;
    this.horarioSeleccionado = null;
  }

  getBarberoNombre(barberoId: number): string {
    const barbero = this.barberos.find(b => b.id === barberoId);
    return barbero ? barbero.nombre : 'N/A';
  }

  onFiltroCambiado(): void {
    this.generarSemana();
  }

  getDiaSemanaNombre(fecha: Date): string {
    return this.nombresDiasCompletos[fecha.getDay()];
  }

  getDiaSemanaAbrev(fecha: Date): string {
    return this.nombresDias[fecha.getDay()];
  }

  getDiaNumero(fecha: Date): number {
    return fecha.getDate();
  }

  esFechaSeleccionada(fecha: Date): boolean {
    return fecha.getTime() === this.fechaSeleccionada.getTime();
  }

  getRangoSemana(): string {
    if (this.semanaActual.length === 0) return '';
    const inicio = this.semanaActual[0];
    const fin = this.semanaActual[6];
    
    const diaInicio = inicio.getDate();
    const mesInicio = this.nombresMeses[inicio.getMonth()];
    const anioInicio = inicio.getFullYear();
    
    const diaFin = fin.getDate();
    const mesFin = this.nombresMeses[fin.getMonth()];
    const anioFin = fin.getFullYear();
    
    if (inicio.getMonth() === fin.getMonth() && inicio.getFullYear() === fin.getFullYear()) {
      // Mismo mes
      return `${diaInicio} - ${diaFin} de ${mesInicio} ${anioInicio}`;
    } else {
      // Diferente mes
      return `${diaInicio} de ${mesInicio} - ${diaFin} de ${mesFin} ${anioFin}`;
    }
  }

  /**
   * Genera las horas disponibles desde 6am hasta 12am en formato 12 horas con intervalos de 5 minutos
   */
  generarHorasDisponibles(): void {
    this.horasDisponibles = [];
    const minutos = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
    
    // De 6am a 11am
    for (let hora = 6; hora <= 11; hora++) {
      for (const minuto of minutos) {
        this.horasDisponibles.push(`${hora.toString().padStart(2, '0')}:${minuto} AM`);
      }
    }
    
    // 12pm (mediodía) con minutos
    for (const minuto of minutos) {
      this.horasDisponibles.push(`12:${minuto} PM`);
    }
    
    // De 1pm a 11pm
    for (let hora = 1; hora <= 11; hora++) {
      for (const minuto of minutos) {
        this.horasDisponibles.push(`${hora.toString().padStart(2, '0')}:${minuto} PM`);
      }
    }
    
    // 12am (medianoche) con minutos
    for (const minuto of minutos) {
      this.horasDisponibles.push(`12:${minuto} AM`);
    }
  }

  /**
   * Convierte formato 12 horas a formato 24 horas (HH:mm)
   * Ejemplo: "09:00 AM" -> "09:00", "06:00 PM" -> "18:00", "12:00 AM" -> "00:00"
   */
  convertir12hA24h(hora12h: string): string {
    if (!hora12h) return '09:00';
    
    const partes = hora12h.trim().split(' ');
    if (partes.length !== 2) return '09:00';
    
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
    if (!hora24h) return '09:00 AM';
    
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

  onHoraEntradaChange(): void {
    this.nuevoHorario.horaEntrada = this.convertir12hA24h(this.horaEntradaSeleccionada);
  }

  onHoraSalidaChange(): void {
    this.nuevoHorario.horaSalida = this.convertir12hA24h(this.horaSalidaSeleccionada);
  }

  abrirModalDetallesHorario(horario: Horario): void {
    this.horarioSeleccionado = horario;
    this.mostrarModalDetallesHorario = true;
  }

  cerrarModalDetallesHorario(): void {
    this.mostrarModalDetallesHorario = false;
    // No limpiar horarioSeleccionado aquí porque se usa en editarHorario
  }

  editarHorarioDesdeModal(): void {
    if (this.horarioSeleccionado) {
      const horario = this.horarioSeleccionado;
      this.cerrarModalDetallesHorario();
      this.editarHorario(horario);
    }
  }

  eliminarHorarioDesdeModal(): void {
    if (this.horarioSeleccionado) {
      const id = this.horarioSeleccionado.id;
      this.cerrarModalDetallesHorario();
      this.eliminarHorario(id);
    }
  }

  calcularDuracion(horaEntrada: string, horaSalida: string): string {
    const [horaInicio, minutoInicio] = horaEntrada.split(':').map(Number);
    const [horaFin, minutoFin] = horaSalida.split(':').map(Number);
    
    let inicioMinutos = horaInicio * 60 + minutoInicio;
    let finMinutos = horaFin * 60 + minutoFin;
    
    // Si la hora de salida es 00:00 (medianoche), significa que es hasta el final del día
    if (horaFin === 0 && minutoFin === 0) {
      finMinutos = 24 * 60; // 1440 minutos (fin del día)
    }
    
    const duracionMinutos = finMinutos - inicioMinutos;
    const horas = Math.floor(duracionMinutos / 60);
    const minutos = duracionMinutos % 60;
    
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${minutos}min`;
    }
  }
}
