export const environment = {
  production: true,
  // Usar el mismo dominio en producción (el backend sirve los frontends)
  apiUrl: 'https://backendpapusbarbershop-production.up.railway.app',
  appName: 'Papus BarberShop',
  version: '1.0.0',
  defaultPageSize: 10,

  config: {
    maxProductos: 500,
    maxBarberos: 50,
    maxServicios: 1000,
    maxVentas: 1000
  },

  // Configuración de Amazon S3
  s3: {
    region: 'us-east-2', // Región de AWS donde está el bucket
    bucketName: 'papusbarbershop', // Nombre del bucket público
    // Las credenciales se obtendrán desde el backend por seguridad
    // No exponer Access Key ID y Secret Access Key en el frontend
  },

  messages: {
    errorGeneral: 'Ha ocurrido un error. Por favor, intente nuevamente.',
    errorConexion: 'Error de conexión con el servidor.',
    errorAutorizacion: 'No tiene autorización para realizar esta acción.',
    exitoGuardado: 'Datos guardados exitosamente.',
    exitoEliminado: 'Registro eliminado exitosamente.',
    confirmarEliminacion: '¿Está seguro de eliminar este registro?'
  }
};

