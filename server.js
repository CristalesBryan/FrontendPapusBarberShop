const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'dist/papus-barbershop-frontend')));

// Redirigir todas las rutas al index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/papus-barbershop-frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Frontend corriendo en puerto ${PORT}`);
});

