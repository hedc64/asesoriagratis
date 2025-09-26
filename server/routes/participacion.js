//server/routes/participacion.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const deviceId = req.query.deviceId;

  if (!deviceId) {
    return res.status(400).json({ error: 'Falta deviceId en la consulta' });
  }

  try {
    const { rows } = await pool.query(`
      SELECT number, buyer_name, buyer_phone, selected_at
      FROM numbers
      WHERE device_id = $1
    `, [deviceId]);

    if (rows.length > 0) {
      res.json({
        participated: true,
        number: rows[0].number,
        buyerName: rows[0].buyer_name,
        buyerPhone: rows[0].buyer_phone,
        selectedAt: rows[0].selected_at
      });
    } else {
      res.json({ participated: false });
    }
  } catch (err) {
    console.error('❌ Error en /api/participacion:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;