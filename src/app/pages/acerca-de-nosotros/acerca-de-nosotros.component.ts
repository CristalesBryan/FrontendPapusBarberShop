import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-acerca-de-nosotros',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './acerca-de-nosotros.component.html',
  styleUrls: ['./acerca-de-nosotros.component.css']
})
export class AcercaDeNosotrosComponent {
  // Número de WhatsApp de la barbería (formato: código de país + número sin espacios ni guiones)
  // Ejemplo para Guatemala: 50212345678 (502 es el código de país de Guatemala)
  whatsappNumber = '50247979922'; // Cambia este número por el número real de la barbería
  
  // Mensaje predeterminado que se enviará al abrir WhatsApp
  // Este mensaje será editable por el usuario antes de enviarlo
  // Nota: Los emojis en URLs de WhatsApp pueden causar problemas de codificación
  // El usuario puede agregar emojis manualmente en WhatsApp antes de enviar
  whatsappMessage = '¡Hola! Me gustaría obtener más información sobre sus servicios y productos que tienen en venta.';
  
  // URL completa de WhatsApp con mensaje predeterminado
  get whatsappUrl(): string {
    // Codificar el mensaje para la URL
    // encodeURIComponent debería manejar correctamente los emojis Unicode
    const mensajeCodificado = encodeURIComponent(this.whatsappMessage);
    return `https://wa.me/${this.whatsappNumber}?text=${mensajeCodificado}`;
  }
}

