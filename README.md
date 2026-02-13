# Papus BarberShop - Frontend

Frontend desarrollado con Angular 17 para el sistema de gestión de la barbería "Papus BarberShop".

## 🚀 Tecnologías

- **Angular 17**
- **TypeScript**
- **Bootstrap 5**
- **Font Awesome**
- **RxJS**

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Angular CLI 17+

## 🔧 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Ejecutar en desarrollo:**
```bash
npm start
```

La aplicación estará disponible en: `http://localhost:4200`

## 📚 Estructura del Proyecto

```
src/app/
├── components/        # Componentes reutilizables (Navbar, Sidebar)
├── guards/            # Guards de autenticación y roles
├── interceptors/      # Interceptores HTTP
├── models/            # Interfaces y modelos TypeScript
├── pages/             # Páginas principales
│   ├── login/
│   ├── dashboard/
│   ├── barberos/
│   ├── servicios/
│   ├── productos/
│   ├── ventas/
│   └── reportes/
└── services/           # Servicios para comunicación con API
```

## 🔐 Autenticación

El sistema utiliza JWT para autenticación. El token se almacena en localStorage y se incluye automáticamente en todas las peticiones HTTP mediante un interceptor.

## 📡 Servicios

- **AuthService**: Manejo de autenticación y usuarios
- **BarberoService**: Gestión de barberos
- **ServicioService**: Gestión de servicios (cortes)
- **ProductoService**: Gestión de productos
- **VentaProductoService**: Gestión de ventas
- **ReporteService**: Generación de reportes

## 🎨 Características

- Diseño responsive con Bootstrap 5
- Autenticación con JWT
- Protección de rutas por roles
- Interceptor HTTP para tokens
- Formularios reactivos
- Validación de datos
- Manejo de errores

## 🏗️ Build

```bash
# Build para producción
npm run build

# Build para desarrollo
npm run watch
```

## 📝 Notas

- Asegúrate de que el backend esté corriendo en `http://localhost:8080`
- El proxy está configurado para desarrollo en `proxy.conf.json`
- Los estilos globales están en `src/styles.css`

---

**Desarrollado para Papus BarberShop**

