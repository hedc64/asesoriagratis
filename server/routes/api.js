// server/routes/api.js
const express = require('express'); // <-- FALTABA ESTA LÍNEA
const router = express.Router();     // <-- FALTABA ESTA LÍNEA
const db = require('../db');

// Obtener fecha del sorteo
router.get('/sorteo-date', (req, res) => {
  db.get("SELECT value FROM config WHERE key = 'sorteo_date'", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ date: row ? row.value : null });
  });
});

// Verificar si hay ganador
router.get('/has-winner', (req, res) => {
  db.get("SELECT * FROM numbers WHERE status = 'ganador'", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ hasWinner: !!row });
  });
});

// Obtener todos los números
router.get('/numbers', (req, res) => {
  db.all("SELECT * FROM numbers ORDER BY number", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Seleccionar un número (participación gratuita)
router.post('/select', (req, res) => {
  const { number, buyerName, buyerPhone, buyerId, deviceId } = req.body;

  if (!number || !buyerName || !buyerPhone || !buyerId || !deviceId) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  // Verificar si el dispositivo ya participó
  db.get("SELECT * FROM numbers WHERE device_id = ?", [deviceId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      return res.status(400).json({ error: 'Este dispositivo ya ha participado en el sorteo' });
    }

    // Verificar si el número está disponible
    db.get("SELECT * FROM numbers WHERE number = ? AND status = 'disponible'", [number], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) {
        return res.status(400).json({ error: 'Número no disponible' });
      }

      // Registrar la participación
      db.run(
        `UPDATE numbers SET 
          status = 'seleccionado', 
          selected_at = ?, 
          buyer_name = ?, 
          buyer_phone = ?, 
          buyer_id = ?,
          device_id = ?
         WHERE number = ?`,
        [
          new Date().toISOString(),
          buyerName,
          buyerPhone,
          buyerId,
          deviceId,
          number
        ],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Participación registrada correctamente' });
        }
      );
    });
  });
});

module.exports = router; // <-- ASEGÚRATE DE EXPORTAR EL ROUTER