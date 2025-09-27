//server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const initializeDatabase = require('./initDb');

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, '../public')));

// Ruta raíz para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Rutas API
app.use('/api/admin', require('./routes/admin'));
app.use('/api/numbers', require('./routes/numbers'));
app.use('/api/select', require('./routes/select'));
app.use('/api/participacion', require('./routes/participacion'));
app.use('/api/send-telegram', require('./routes/sendTelegram'));
app.use('/api/sorteo-date', require('./routes/sorteoDate'));
app.use('/api/has-winner', require('./routes/hasWinner'));


const PORT = process.env.PORT || 3000;

// Inicializar la base de datos antes de iniciar el servidor
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en puerto ${PORT}`);
  });
}).catch(err => {
  console.error('❌ No se pudo iniciar el servidor:', err.message);
  process.exit(1);
});


