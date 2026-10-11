const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Solo se exponen las carpetas públicas del juego
// (así no se sirven server.js, package.json ni .git)
['css', 'js', 'img', 'modulos'].forEach((carpeta) => {
  app.use('/' + carpeta, express.static(path.join(__dirname, carpeta)));
});

// Páginas principales
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/casa.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'casa.html'));
});

// Ruta para que Render verifique que el servicio está vivo
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Cualquier otra ruta regresa al inicio
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Aprendo Dinero corriendo en el puerto ${PORT}`);
});