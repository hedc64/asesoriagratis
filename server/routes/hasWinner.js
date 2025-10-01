// server/routes/hasWinner.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    // Primero verificamos si hay un ganador
    const winnerCheck = await pool.query(
      `SELECT COUNT(*) as count 
       FROM numbers 
       WHERE status = 'ganador'`
    );
    
    const hasWinner = parseInt(winnerCheck.rows[0].count) > 0;
    
    if (hasWinner) {
      // Si hay ganador, obtenemos sus datos
      const winnerData = await pool.query(
        `SELECT number, winner_name, buyer_name, buyer_phone 
         FROM numbers 
         WHERE status = 'ganador'
         LIMIT 1`
      );
      
      const winner = winnerData.rows[0];
      
      res.json({ 
        hasWinner: true,
        winner: {
          number: winner.number,
          winner_name: winner.winner_name,
          buyer_name: winner.buyer_name,
          buyer_phone: winner.buyer_phone
        }
      });
    } else {
      res.json({ hasWinner: false });
    }
  } catch (err) {
    console.error('❌ Error al verificar ganador:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;



/*
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
*/