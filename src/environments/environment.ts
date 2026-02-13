export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  appName: 'Papus BarberShop',
  version: '1.0.0',
  defaultPageSize: 10,

  // Configuración de la aplicación
  config: {
    maxProductos: 500,
    maxBarberos: 50,
    maxServicios: 1000,
    maxVentas: 1000
  },

  // Configuración de Amazon S3
  s3: {
    region: 'us-east-1', // Cambiar según tu región de AWS
    bucketName: 'papus-barbershop-images', // Cambiar por el nombre de tu bucket
    // Las credenciales se obtendrán desde el backend por seguridad
    // No exponer Access Key ID y Secret Access Key en el frontend
  },

  // Mensajes de error comunes
  messages: {
    errorGeneral: 'Ha ocurrido un error. Por favor, intente nuevamente.',
    errorConexion: 'Error de conexión con el servidor.',
    errorAutorizacion: 'No tiene autorización para realizar esta acción.',
    exitoGuardado: 'Datos guardados exitosamente.',
    exitoEliminado: 'Registro eliminado exitosamente.',
    confirmarEliminacion: '¿Está seguro de eliminar este registro?'
  }
};

