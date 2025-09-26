//server/routes/sorteoDate.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT value FROM config WHERE key = 'sorteo_date'`);
    res.json({ date: result.rows[0]?.value || null });
  } catch (err) {
    console.error('❌ Error al obtener fecha del sorteo:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;