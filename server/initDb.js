// server/initDb.js
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando base de datos...');

    // Crear tabla numbers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS numbers (
        id SERIAL PRIMARY KEY,
        number VARCHAR(10) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'disponible',
        selected_at TIMESTAMP,
        buyer_name VARCHAR(100),
        buyer_phone VARCHAR(20),
        buyer_id VARCHAR(20),
        buyer_address TEXT,
        validated_at TIMESTAMP,
        winner_name VARCHAR(100),
        draw_date DATE,
        device_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla "numbers" verificada/creada');

    // Crear tabla config
    await pool.query(`
      CREATE TABLE IF NOT EXISTS config (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT
      )
    `);
    console.log('✅ Tabla "config" verificada/creada');

    // Crear tabla admin
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL
      )
    `);
    console.log('✅ Tabla "admin" verificada/creada');

    // Insertar valor inicial en config
    const configResult = await pool.query(`
      INSERT INTO config (key, value)
      VALUES ('sorteo_date', '2025-09-01')
      ON CONFLICT (key) DO NOTHING
      RETURNING *
    `);
    if (configResult.rows.length > 0) {
      console.log('✅ Valor "sorteo_date" insertado en config');
    } else {
      console.log('ℹ️ Valor "sorteo_date" ya existía en config');
    }

    // Insertar usuario admin por defecto
    const hashedPassword = bcrypt.hashSync('admin123', 8);
    const adminResult = await pool.query(`
      INSERT INTO admin (username, password)
      VALUES ('admin', $1)
      ON CONFLICT (username) DO NOTHING
      RETURNING *
    `, [hashedPassword]);
    if (adminResult.rows.length > 0) {
      console.log('✅ Usuario admin creado: admin / admin123');
    } else {
      console.log('ℹ️ Usuario admin ya existía');
    }

    // Insertar números del 00 al 99
    const numbers = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));
    for (const number of numbers) {
      await pool.query(`
        INSERT INTO numbers (number)
        VALUES ($1)
        ON CONFLICT (number) DO NOTHING
      `, [number]);
    }
    console.log('✅ Números del 00 al 99 insertados');

    console.log('🎉 Base de datos inicializada correctamente');
  } catch (err) {
    console.error('❌ Error al inicializar base de datos:', err.message);
    throw err;
  }
}

module.exports = initializeDatabase;