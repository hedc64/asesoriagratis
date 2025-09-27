// server/routes/admin.js
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