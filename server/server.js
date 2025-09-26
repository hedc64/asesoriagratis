//server/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/numbers', require('./routes/numbers'));
app.use('/api/select', require('./routes/select'));
app.use('/api/participacion', require('./routes/participacion'));
app.use('/send-telegram', require('./routes/sendTelegram'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});




/*
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch'); 
const db = require('./db');
const ensureSchema = require('./ensureSchema');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para redirigir HTTP a HTTPS (excepto para /admin/view-data)
app.use((req, res, next) => {
  if (req.path === '/admin/view-data') return next();

  const isSecure = req.headers['x-forwarded-proto'] === 'https';
  if (!isSecure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// ✅ Nueva ruta para enviar notificación por Telegram
app.post('/send-telegram', async (req, res) => {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const mensaje = req.body.mensaje || '✅ Participación confirmada desde la app web.';

  if (!token || !chatId) {
    return res.status(500).send('Credenciales de Telegram no configuradas.');
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: mensaje })
    });
    res.sendStatus(200);
  } catch (error) {
    console.error('Error al enviar mensaje a Telegram:', error);
    res.sendStatus(500);
  }
});

// Inicializar esquema de base de datos
ensureSchema(db);

// Crear directorio para copias de seguridad si no existe
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('Directorio de copias de seguridad creado:', backupDir);
}

// Función para crear copia de seguridad
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sourcePath = path.resolve(__dirname, '../rifa.db');
  const backupPath = path.join(backupDir, `rifa-backup-${timestamp}.db`);

  fs.copyFile(sourcePath, backupPath, (err) => {
    if (err) {
      console.error('Error al crear copia de seguridad:', err);
    } else {
      console.log(`Copia de seguridad creada: ${backupPath}`);

      // Eliminar backups antiguos (mantener solo los 7 más recientes)
      fs.readdir(backupDir, (err, files) => {
        if (err) return console.error('Error al leer backups:', err);

        const backupFiles = files
          .filter(file => file.startsWith('rifa-backup-') && file.endsWith('.db'))
          .sort();

        if (backupFiles.length > 7) {
          const filesToDelete = backupFiles.slice(0, backupFiles.length - 7);
          filesToDelete.forEach(file => {
            const filePath = path.join(backupDir, file);
            fs.unlink(filePath, err => {
              if (err) console.error(`Error al eliminar backup ${file}:`, err);
              else console.log(`Backup antiguo eliminado: ${file}`);
            });
          });
        }
      });
    }
  });
}

// Ejecutar tareas después de inicializar esquema
db.serialize(() => {
  createBackup();
  setInterval(createBackup, 24 * 60 * 60 * 1000);
  // Eliminación de liberación automática de números seleccionados
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
  console.log(`Base de datos en: ${path.resolve(__dirname, '../rifa.db')}`);
  console.log(`Copias de seguridad en: ${backupDir}`);
  console.log('Sorteo de Asesoría Visa iniciado correctamente');
});



/*
//server/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const ensureSchema = require('./ensureSchema');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para redirigir HTTP a HTTPS (excepto para /admin/view-data)
app.use((req, res, next) => {
  if (req.path === '/admin/view-data') return next();

  const isSecure = req.headers['x-forwarded-proto'] === 'https';
  if (!isSecure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Inicializar esquema de base de datos
ensureSchema(db);

// Crear directorio para copias de seguridad si no existe
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('Directorio de copias de seguridad creado:', backupDir);
}

// Función para crear copia de seguridad
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sourcePath = path.resolve(__dirname, '../rifa.db');
  const backupPath = path.join(backupDir, `rifa-backup-${timestamp}.db`);

  fs.copyFile(sourcePath, backupPath, (err) => {
    if (err) {
      console.error('Error al crear copia de seguridad:', err);
    } else {
      console.log(`Copia de seguridad creada: ${backupPath}`);

      // Eliminar backups antiguos (mantener solo los 7 más recientes)
      fs.readdir(backupDir, (err, files) => {
        if (err) return console.error('Error al leer backups:', err);

        const backupFiles = files
          .filter(file => file.startsWith('rifa-backup-') && file.endsWith('.db'))
          .sort();

        if (backupFiles.length > 7) {
          const filesToDelete = backupFiles.slice(0, backupFiles.length - 7);
          filesToDelete.forEach(file => {
            const filePath = path.join(backupDir, file);
            fs.unlink(filePath, err => {
              if (err) console.error(`Error al eliminar backup ${file}:`, err);
              else console.log(`Backup antiguo eliminado: ${file}`);
            });
          });
        }
      });
    }
  });
}

// Ejecutar tareas después de inicializar esquema
db.serialize(() => {
  // Crear la primera copia de seguridad
  createBackup();

  // Programar copias de seguridad diarias
  setInterval(createBackup, 24 * 60 * 60 * 1000);

  // Eliminar la liberación automática de números seleccionados
  // Ya no es necesario porque el sorteo es gratis y los dispositivos están registrados
  // El código anterior se ha eliminado intencionalmente
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
  console.log(`Base de datos en: ${path.resolve(__dirname, '../rifa.db')}`);
  console.log(`Copias de seguridad en: ${backupDir}`);
  console.log('Sorteo de Asesoría Visa iniciado correctamente');
});
*/