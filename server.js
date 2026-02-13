const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8080;
// BACKEND_URL debe ser la URL completa del backend en Railway (ej: https://tu-backend.railway.app)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar proxy para peticiones API
// Redirige todas las peticiones /auth/* y /api/* al backend
app.use('/auth', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Error en proxy /auth:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al conectar con el backend' });
    }
  }
}));

app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Error en proxy /api:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al conectar con el backend' });
    }
  }
}));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'dist/papus-barbershop-frontend'), {
  // No servir index.html para rutas de API
  index: false
}));

// Redirigir todas las rutas GET al index.html (para Angular routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/papus-barbershop-frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Frontend corriendo en puerto ${PORT}`);
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  console.log(`⚠️  Asegúrate de configurar BACKEND_URL en Railway si el backend está en otro servicio`);
});

