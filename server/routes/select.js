// server/routes/select.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { number, buyerName, buyerPhone, buyerId, buyerAddress, deviceId } = req.body;

  // Validar datos de entrada
  if (!number || !buyerName || !buyerPhone || !buyerId || !buyerAddress || !deviceId) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    // Verificar si el número existe y está disponible
    const checkQuery = `
      SELECT status 
      FROM numbers 
      WHERE number = $1
    `;
    const checkResult = await pool.query(checkQuery, [number]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'El número no existe' });
    }

    if (checkResult.rows[0].status !== 'disponible') {
      return res.status(400).json({ error: 'El número no está disponible' });
    }

    // Actualizar el número
    const updateQuery = `
      UPDATE numbers
      SET status = 'seleccionado',
          buyer_name = $1,
          buyer_phone = $2,
          buyer_id = $3,
          buyer_address = $4,
          selected_at = CURRENT_TIMESTAMP,
          device_id = $5
      WHERE number = $6
      RETURNING number
    `;
    const updateResult = await pool.query(updateQuery, [buyerName, buyerPhone, buyerId, buyerAddress, deviceId, number]);

    if (updateResult.rows.length === 0) {
      return res.status(400).json({ error: 'No se pudo actualizar el número' });
    }

    res.json({ 
      success: true, 
      number: updateResult.rows[0].number,
      message: 'Número seleccionado correctamente'
    });
  } catch (err) {
    console.error('❌ Error al seleccionar número:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;



/*
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
*/