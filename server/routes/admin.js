//server/routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// 🔐 Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  db.get("SELECT * FROM admin WHERE username = ?", [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Credenciales inválidas' });

    const passwordIsValid = bcrypt.compareSync(password, row.password);
    if (!passwordIsValid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id: row.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  });
});

// 📊 Obtener todos los números
router.get('/numbers', authMiddleware, (req, res) => {
  db.all("SELECT * FROM numbers ORDER BY number", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 🔍 Ver datos (accesible por HTTP)
router.get('/view-data', authMiddleware, (req, res) => {
  db.all("SELECT * FROM numbers ORDER BY number", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 📅 Configurar fecha del sorteo
router.post('/configure-sorteo', authMiddleware, (req, res) => {
  const { sorteoDate } = req.body;

  if (!sorteoDate) {
    return res.status(400).json({ error: 'Debe proporcionar una fecha para el sorteo' });
  }

  const date = new Date(sorteoDate);
  if (isNaN(date)) {
    return res.status(400).json({ error: 'Fecha inválida' });
  }

  const formattedDate = date.toISOString().split('T')[0];

  db.run(
    "INSERT OR REPLACE INTO config (key, value) VALUES ('sorteo_date', ?)",
    [formattedDate],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: `Fecha del sorteo configurada: ${formattedDate}` });
    }
  );
});

// ✅ Validar participación individual (modificado para sorteo gratis)
router.post('/validate', authMiddleware, (req, res) => {
  const { number, buyer_name, buyer_phone, buyer_id, buyer_address} = req.body;

  if (!number || !buyer_name || !buyer_phone || !buyer_id || !buyer_address) {
    return res.status(400).json({ error: 'Faltan datos obligatorios del participante' });
  }

  db.run(
    `UPDATE numbers SET 
      status = 'comprado', 
      validated_at = ?, 
      buyer_name = ?, 
      buyer_phone = ?, 
      buyer_id = ?
      buyer_address = ?  
     WHERE number = ? AND status = 'seleccionado'`,
    [
      new Date().toISOString(),
      buyer_name,
      buyer_phone,
      buyer_id,
      buyer_address, // nuevo
      number
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(400).json({ error: 'Número no encontrado o no está en estado seleccionado' });
      }
      res.json({ message: `Participación ${number} validada correctamente` });
    }
  );
});

// ✅ Validar múltiples participaciones (mantenida para compatibilidad)
router.post('/validate-multiple', authMiddleware, (req, res) => {
  const { numbers, buyer_name, buyer_phone, buyer_id, buyer_address} = req.body;

  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: 'Debe seleccionar al menos un número' });
  }

  if (!buyer_name || !buyer_phone || !buyer_id || !buyer_address) {
    return res.status(400).json({ error: 'Faltan datos del participante para validación múltiple' });
  }

  const validatedAt = new Date().toISOString();
  const placeholders = numbers.map(() => '?').join(',');

  db.all(
    `SELECT number FROM numbers WHERE number IN (${placeholders}) AND status = 'seleccionado'`,
    numbers,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const availableNumbers = rows.map(row => row.number);
      const notAvailable = numbers.filter(num => !availableNumbers.includes(num));

      if (notAvailable.length > 0) {
        return res.status(400).json({ error: `Números no disponibles: ${notAvailable.join(', ')}` });
      }

      const stmt = db.prepare(
        `UPDATE numbers SET 
          status = 'comprado', 
          validated_at = ?, 
          buyer_name = ?, 
          buyer_phone = ?, 
          buyer_id = ?
          buyer_address = ? 
         WHERE number = ?`
      );

      let hasError = false;
      numbers.forEach(num => {
        stmt.run(validatedAt, buyer_name, buyer_phone, buyer_id, buyer_address, num, (err) => {
          if (err) {
            console.error(`❌ Error al validar número ${num}:`, err.message);
            hasError = true;
          }
        });
      });

      stmt.finalize((err) => {
        if (err || hasError) {
          return res.status(500).json({ error: 'Error al validar los números' });
        }
        res.json({ message: `${numbers.length} participaciones validadas correctamente` });
      });
    }
  );
});

// 🏆 Declarar ganador
router.post('/winner', authMiddleware, (req, res) => {
  const { number, winner_name, draw_date } = req.body;

  if (!number || !winner_name || !draw_date) {
    return res.status(400).json({ error: 'Faltan datos para declarar ganador' });
  }

  db.run(
    `UPDATE numbers SET 
      status = 'ganador', 
      winner_name = ?, 
      draw_date = ?
     WHERE number = ? AND status = 'comprado'`,
    [winner_name, draw_date, number],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(400).json({ error: 'Número no encontrado o no está validado' });
      }

      db.get("SELECT * FROM numbers WHERE number = ?", [number], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Ganador declarado correctamente', winner: row });
      });
    }
  );
});

// 🔄 Resetear rifa (actualizado para incluir device_id)
router.post('/reset', authMiddleware, (req, res) => {
  db.run(
    `UPDATE numbers SET 
      status = 'disponible',
      selected_at = NULL,
      buyer_name = NULL,
      buyer_phone = NULL,
      buyer_id = NULL,
      buyer_address = NULL,
      validated_at = NULL,
      winner_name = NULL,
      draw_date = NULL,
      device_id = NULL`,
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      db.run("DELETE FROM config WHERE key = 'sorteo_date'", (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Rifa reseteada correctamente para nuevo sorteo' });
      });
    }
  );
});

module.exports = router;