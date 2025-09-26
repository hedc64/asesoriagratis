//server/routes/hasWinner.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM numbers WHERE status = 'ganador'`);
    const hasWinner = parseInt(result.rows[0].count) > 0;
    res.json({ hasWinner });
  } catch (err) {
    console.error('❌ Error al verificar ganador:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;