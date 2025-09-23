// server/routes/api.js
// 🛒 Seleccionar número (modificado para un solo número y deviceId)
router.post('/select', (req, res) => {
  console.log('📥 Petición de selección recibida:', req.body);
  const { number, buyerName, buyerPhone, buyerId, deviceId } = req.body;

  // Validar datos de entrada
  if (!number || !buyerName || !buyerPhone || !buyerId || !deviceId) {
    return res.status(400).json({ error: 'Datos incompletos para la selección' });
  }

  // Verificar si el dispositivo ya participó
  db.get(
    "SELECT buyer_id FROM numbers WHERE device_id = ? AND status = 'seleccionado' LIMIT 1",
    [deviceId],
    (err, row) => {
      if (err) {
        console.error('❌ Error al verificar dispositivo:', err.message);
        return res.status(500).json({ error: err.message });
      }

      if (row) {
        return res.status(400).json({
          error: 'Este dispositivo ya ha participado en el sorteo'
        });
      }

      // Verificar si el número está disponible
      db.get(
        "SELECT number FROM numbers WHERE number = ? AND status = 'disponible' LIMIT 1",
        [number],
        (err, row) => {
          if (err) {
            console.error('❌ Error al verificar disponibilidad:', err.message);
            return res.status(500).json({ error: err.message });
          }

          if (!row) {
            return res.status(400).json({
              error: `El número ${number} no está disponible`
            });
          }

          // Actualizar el número como seleccionado
          const selectedAt = new Date().toISOString();
          db.run(
            `UPDATE numbers SET 
              status = 'seleccionado', 
              selected_at = ?, 
              buyer_name = ?, 
              buyer_phone = ?, 
              buyer_id = ?,
              device_id = ?
             WHERE number = ?`,
            [selectedAt, buyerName, buyerPhone, buyerId, deviceId, number],
            function(err) {
              if (err) {
                console.error(`❌ Error al actualizar número ${number}:`, err.message);
                return res.status(500).json({ error: 'Error al seleccionar el número' });
              }

              if (this.changes === 0) {
                return res.status(400).json({
                  error: `No se pudo seleccionar el número ${number}`
                });
              }

              console.log(`✅ Número ${number} seleccionado correctamente`);
              res.json({
                message: 'Participación registrada correctamente',
                selected: number
              });
            }
          );
        }
      );
    }
  );
});