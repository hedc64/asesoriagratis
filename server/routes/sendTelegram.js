const express = require('express');
const router = express.Router();
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Token y chat ID desde tu .env
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
const chatId = process.env.TELEGRAM_CHAT_ID;

router.post('/', async (req, res) => {
  const { mensaje } = req.body;

  if (!mensaje) {
    return res.status(400).json({ error: 'Mensaje vacío' });
  }

  try {
    await bot.sendMessage(chatId, mensaje);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al enviar a Telegram:', err.message);
    res.status(500).json({ error: 'Error al enviar a Telegram' });
  }
});

module.exports = router;