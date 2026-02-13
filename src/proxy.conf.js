const PROXY_CONFIG = {
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  },
  "/auth": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  },
  "/barberos": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "bypass": function(req) {
      // No redirigir si es una petición de navegación del navegador (sin headers de aplicación)
      if (req.headers.accept && req.headers.accept.indexOf('html') !== -1) {
        return '/index.html';
      }
    }
  },
  "/servicios": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "bypass": function(req) {
      if (req.headers.accept && req.headers.accept.indexOf('html') !== -1) {
        return '/index.html';
      }
    }
  },
  "/productos": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "bypass": function(req) {
      if (req.headers.accept && req.headers.accept.indexOf('html') !== -1) {
        return '/index.html';
      }
    }
  },
  "/ventas-productos": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  },
  "/reportes": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "bypass": function(req) {
      // Si la petición es para cargar HTML (navegación del navegador), servir index.html
      if (req.headers.accept && req.headers.accept.indexOf('html') !== -1) {
        return '/index.html';
      }
    }
  },
  "/horarios": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "bypass": function(req) {
      if (req.headers.accept && req.headers.accept.indexOf('html') !== -1) {
        return '/index.html';
      }
    }
  },
  "/citas": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "bypass": function(req) {
      if (req.headers.accept && req.headers.accept.indexOf('html') !== -1) {
        return '/index.html';
      }
    }
  },
  "/mobiliario-equipo": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "bypass": function(req) {
      if (req.headers.accept && req.headers.accept.indexOf('html') !== -1) {
        return '/index.html';
      }
    }
  }
};

module.exports = PROXY_CONFIG;

