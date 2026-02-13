const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// 1. Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Proxies PRIMERO
app.use('/auth', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying ${req.method} ${req.path} to ${BACKEND_URL}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Error en proxy /auth:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al conectar con el backend' });
    }
  }
}));

app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying ${req.method} ${req.path} to ${BACKEND_URL}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Error en proxy /api:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al conectar con el backend' });
    }
  }
}));

// 3. Archivos estáticos
app.use(express.static(path.join(__dirname, 'dist/papus-barbershop-frontend')));

// 4. Catch-all AL FINAL (para Angular routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/papus-barbershop-frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Frontend corriendo en puerto ${PORT}`);
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  console.log(`⚠️  Asegúrate de configurar BACKEND_URL en Railway si el backend está en otro servicio`);
});

