//server/routes/sorteoDate.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT value FROM config WHERE key = 'sorteo_date'`);
    let date = result.rows[0]?.value || null;
    
    // Validar formato de fecha si existe
    if (date) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.warn('⚠️ Fecha del sorteo inválida:', date);
        date = null;
      }
    }
    
    res.json({ date });
  } catch (err) {
    console.error('❌ Error al obtener fecha del sorteo:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;


