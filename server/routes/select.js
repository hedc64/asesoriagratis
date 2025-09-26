//server/routes/select.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { number, buyerName, buyerPhone, buyerId, buyerAddress, deviceId } = req.body;

  await pool.query(`
    UPDATE numbers
    SET status = 'ocupado',
        buyer_name = $1,
        buyer_phone = $2,
        buyer_id = $3,
        buyer_address = $4,
        selected_at = CURRENT_TIMESTAMP,
        device_id = $5
    WHERE number = $6
  `, [buyerName, buyerPhone, buyerId, buyerAddress, deviceId, number]);

  res.json({ success: true });
});

module.exports = router;