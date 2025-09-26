//server/routes/numbers.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT number, status FROM numbers ORDER BY number ASC');
  res.json(rows);
});

module.exports = router;