// server/routes/admin.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const db = require('../db');

// 🔐 Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign(
      { id: 'admin', username },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Credenciales inválidas' });
});

// ✅ Obtener números
router.get('/numbers', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM numbers ORDER BY number');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener números:', err);
    res.status(500).json({ error: 'Error al obtener números' });
  }
});

// 📅 Configurar fecha del sorteo
router.post('/configure-sorteo', verifyToken, async (req, res) => {
  const { sorteoDate } = req.body;
  
  try {
    // Guardar fecha del sorteo en la tabla de configuración
    await db.query(
      'INSERT INTO config (key, value) VALUES (\'sorteo_date\', $1) ON CONFLICT (key) DO UPDATE SET value = $1',
      [sorteoDate]
    );
    
    res.json({ message: 'Fecha del sorteo configurada correctamente' });
  } catch (err) {
    console.error('Error al configurar fecha del sorteo:', err);
    res.status(500).json({ error: 'Error al configurar fecha del sorteo' });
  }
});

// ✅ Validar participante individual
router.post('/validate', verifyToken, async (req, res) => {
  const { number, buyer_name, buyer_phone, buyer_id, buyer_address } = req.body;
  
  try {
    // Actualizar estado del número a 'validado'
    await db.query(
      'UPDATE numbers SET status = \'validado\', buyer_name = $1, buyer_phone = $2, buyer_id = $3, buyer_address = $4, validated_at = NOW() WHERE number = $5',
      [buyer_name, buyer_phone, buyer_id, buyer_address, number]
    );
    
    res.json({ message: 'Participante validado correctamente' });
  } catch (err) {
    console.error('Error al validar participante:', err);
    res.status(500).json({ error: 'Error al validar participante' });
  }
});

// ✅ Validar múltiples participantes
router.post('/validate-multiple', verifyToken, async (req, res) => {
  const { numbers, buyer_name, buyer_phone, buyer_id, buyer_address } = req.body;
  
  try {
    // Actualizar estado de múltiples números a 'validado'
    const placeholders = numbers.map((_, i) => `$${i + 5}`).join(',');
    await db.query(
      `UPDATE numbers SET status = 'validado', buyer_name = $1, buyer_phone = $2, buyer_id = $3, buyer_address = $4, validated_at = NOW() WHERE number IN (${placeholders})`,
      [buyer_name, buyer_phone, buyer_id, buyer_address, ...numbers]
    );
    
    res.json({ message: 'Participantes validados correctamente' });
  } catch (err) {
    console.error('Error al validar participantes:', err);
    res.status(500).json({ error: 'Error al validar participantes' });
  }
});

// 🏆 Declarar ganador
router.post('/winner', verifyToken, async (req, res) => {
  const { number, winner_name, draw_date } = req.body;
  
  try {
    // Obtener datos del comprador
    const buyerResult = await db.query('SELECT * FROM numbers WHERE number = $1', [number]);
    const buyer = buyerResult.rows[0];
    
    if (!buyer) {
      return res.status(404).json({ error: 'Número no encontrado' });
    }
    
    // Actualizar estado del número a 'ganador'
    await db.query(
      'UPDATE numbers SET status = \'ganador\', winner_name = $1, draw_date = $2 WHERE number = $3',
      [winner_name, draw_date, number]
    );
    
    res.json({ 
      message: 'Ganador declarado correctamente',
      winner: {
        number,
        winner_name,
        draw_date,
        buyer_name: buyer.buyer_name,
        buyer_phone: buyer.buyer_phone
      }
    });
  } catch (err) {
    console.error('Error al declarar ganador:', err);
    res.status(500).json({ error: 'Error al declarar ganador' });
  }
});

// 🔄 Resetear sorteo
router.post('/reset', verifyToken, async (req, res) => {
  try {
    // Eliminar todos los números y reiniciar el sorteo
    await db.query('DELETE FROM numbers');
    await db.query('DELETE FROM config WHERE key = \'sorteo_date\'');
    
    // Volver a insertar números del 00 al 99
    const numbers = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));
    const insertPromises = numbers.map(num => 
      db.query('INSERT INTO numbers (number) VALUES ($1)', [num])
    );
    await Promise.all(insertPromises);
    
    res.json({ message: 'Sorteo reseteado correctamente' });
  } catch (err) {
    console.error('Error al resetear sorteo:', err);
    res.status(500).json({ error: 'Error al resetear sorteo' });
  }
});

// 📊 Ver datos
router.get('/view-data', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM numbers ORDER BY number');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener datos:', err);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

module.exports = router;




// server/routes/admin.js
/*
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// 🔐 Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign(
      { id: 'admin', username },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Credenciales inválidas' });
});

// ✅ Rutas protegidas
router.get('/numbers', verifyToken, (req, res) => {
  // lógica para mostrar números
});

router.post('/configure-sorteo', verifyToken, (req, res) => {
  // lógica para configurar fecha
});

router.post('/validate', verifyToken, (req, res) => {
  // lógica para validar individual
});

router.post('/validate-multiple', verifyToken, (req, res) => {
  // lógica para validar múltiples
});

router.post('/winner', verifyToken, (req, res) => {
  // lógica para declarar ganador
});

router.post('/reset', verifyToken, (req, res) => {
  // lógica para resetear sorteo
});

router.get('/view-data', verifyToken, (req, res) => {
  // lógica para mostrar base de datos
});

module.exports = router;
*/