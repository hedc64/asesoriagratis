// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('numbers-grid');
  const selectionInfo = document.getElementById('selection-info');
  const selectedNumberElement = document.getElementById('selected-number');
  const confirmation = document.getElementById('confirmation');
  const successInfo = document.getElementById('success-info');
  const successNumber = document.getElementById('success-number');
  const successDate = document.getElementById('success-date');
  const confirmButton = document.getElementById('confirm-selection');
  const acceptTermsCheckbox = document.getElementById('accept-terms');
  const sorteoDateElement = document.getElementById('sorteo-date');
  const confirmationDateElement = document.getElementById('confirmation-date');

  let selectedNumber = null;
  let hasParticipated = false; // 🔑 Variable para controlar si ya ha participado
  
  // Generar o recuperar ID único del dispositivo
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }

  // 🔍 Verificar si el dispositivo ya participó
  async function checkParticipation() {
    try {
      const response = await fetch(`/api/participacion?deviceId=${deviceId}`);
      const data = await response.json();
      
      if (data.participated) {
        hasParticipated = true;
        // Mostrar estado de participación
        successNumber.textContent = data.number;
        successInfo.style.display = 'block';
        confirmation.style.display = 'none';
        acceptTermsCheckbox.checked = true;
        confirmButton.disabled = true;
        
        // 🔒 Deshabilitar todos los números
        disableAllNumbers();
      }
    } catch (err) {
      console.error('❌ Error al verificar participación:', err);
    }
  }

  // 🔒 Función para deshabilitar todos los números
  function disableAllNumbers() {
    const numbers = grid.querySelectorAll('.number');
    numbers.forEach(num => {
      num.classList.add('disabled');
      num.style.pointerEvents = 'none';
      num.title = 'Ya has participado en este sorteo';
    });
  }

  // 📅 Cargar fecha del sorteo
  function loadSorteoDate() {
    fetch('/api/sorteo-date')
      .then(res => res.json())
      .then(data => {
        const fallback = 'Próximamente';
        if (data.date) {
          const [year, month, day] = data.date.split('-');
          const date = new Date(year, month - 1, day);
          const formatted = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          sorteoDateElement.textContent = `Sorteo: ${formatted} (Últimas dos cifras del sorteo Astro Luna)`;
          confirmationDateElement.textContent = formatted;
          successDate.textContent = formatted;
        } else {
          sorteoDateElement.textContent = `Sorteo: ${fallback} (Últimas dos cifras del sorteo Astro Luna)`;
          confirmationDateElement.textContent = fallback;
          successDate.textContent = fallback;
        }
      })
      .catch(err => {
        console.error('Error al cargar fecha del sorteo:', err);
        sorteoDateElement.textContent = 'Sorteo: Próximamente (Últimas dos cifras del sorteo Astro Luna)';
        confirmationDateElement.textContent = 'Próximamente';
        successDate.textContent = 'Próximamente';
      });
  }

  // 🏆 Verificar si hay ganador
  function checkWinner() {
    fetch('/api/has-winner')
      .then(res => res.ok ? res.json() : Promise.reject('Error al verificar ganador'))
      .then(data => {
        if (data.hasWinner) {
          const winnerMessage = document.createElement('div');
          winnerMessage.className = 'winner-message';
          winnerMessage.innerHTML = '<h2>¡Sorteo Finalizado!</h2><p>Ya se ha declarado un ganador para este sorteo.</p>';

          grid.style.pointerEvents = 'none';
          grid.style.opacity = '0.7';
          grid.parentNode.insertBefore(winnerMessage, grid);
          selectionInfo.style.display = 'none';
        }
      })
      .catch(err => console.error(err));
  }

  // 🔢 Cargar números
function loadNumbers() {
  fetch('/api/numbers')
    .then(res => res.ok ? res.json() : Promise.reject('Error al obtener números'))
    .then(numbers => {
      grid.innerHTML = '';
      numbers.forEach(num => {
        const div = document.createElement('div');
        // Asegurarnos de que la clase CSS se aplique correctamente
        div.className = `number ${num.status}`;
        div.textContent = num.number;
        div.dataset.number = num.number;

        // Si el dispositivo ya ha participado, deshabilitar todos los números
        if (hasParticipated) {
          div.classList.add('disabled');
          div.style.pointerEvents = 'none';
          div.title = 'Ya has participado en este sorteo';
        } else if (num.status === 'disponible') {
          div.addEventListener('click', selectNumber);
        }

        grid.appendChild(div);
      });
    })
    .catch(err => console.error(err));
}
  
  // 🔁 Inicialización
  checkParticipation(); // 🔑 Verificar participación primero
  loadNumbers();
  loadSorteoDate();
  checkWinner();

  // 🖱️ Seleccionar número (solo uno permitido)
  function selectNumber(e) {
    // 🔒 Verificar si ya ha participado
    if (hasParticipated) {
      alert('Ya has participado en este sorteo');
      return;
    }
    
    const number = e.target.dataset.number;
    
    // Si ya hay un número seleccionado, no permitir seleccionar otro
    if (selectedNumber !== null) {
      alert('Solo puedes seleccionar un número para participar en el sorteo gratis');
      return;
    }
    
    // Seleccionar el número
    selectedNumber = number;
    e.target.classList.remove('disponible');
    e.target.classList.add('seleccionado');

    updateSelectionInfo();
  }

  // 📋 Actualizar panel de selección
  function updateSelectionInfo() {
    if (selectedNumber !== null) {
      selectionInfo.style.display = 'block';
      selectedNumberElement.textContent = selectedNumber;
      confirmation.style.display = 'block';
      successInfo.style.display = 'none';
    } else {
      selectionInfo.style.display = 'none';
    }
  }

  // ✅ Activar botón según términos
  acceptTermsCheckbox.addEventListener('change', () => {
    confirmButton.disabled = !acceptTermsCheckbox.checked;
  });

  // 📤 Confirmar selección
  // Reemplazar la función completa del botón de confirmación
confirmButton.addEventListener('click', async () => {
  if (!acceptTermsCheckbox.checked) {
    alert('Debes aceptar los términos y condiciones para continuar');
    return;
  }

  // 🔒 Verificar nuevamente si ya ha participado
  if (hasParticipated) {
    alert('Ya has participado en este sorteo');
    return;
  }

  const buyerName = prompt('Nombre completo:');
  const buyerPhone = prompt('Teléfono:');
  const buyerId = prompt('Cédula:');
  const buyerAddress = prompt('Direccion:');

  if (!buyerName || !buyerPhone || !buyerId || !buyerAddress) {
    alert('Debe ingresar todos los datos');
    return;
  }

  try {
    // Enviar selección con ID del dispositivo
    const response = await fetch('/api/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: selectedNumber,
        buyerName,
        buyerPhone,
        buyerId,
        buyerAddress,  
        deviceId
      })
    });

    const data = await response.json();

    if (data.success) {
      // 🔑 GUARDAR EL NÚMERO ANTES DE RESTABLECERLO
      const numeroConfirmado = selectedNumber;
      
      // Marcar que ha participado
      hasParticipated = true;
      
      // Mostrar mensaje de éxito
      successNumber.textContent = selectedNumber;
      confirmation.style.display = 'none';
      successInfo.style.display = 'block';
      
      // Limpiar selección
      selectedNumber = null;
      acceptTermsCheckbox.checked = false;
      confirmButton.disabled = true;
      
      // 🔒 Deshabilitar todos los números
      disableAllNumbers();
      
      // Recargar números para actualizar estados
      loadNumbers();

      // ✅ Enviar notificación por Telegram con el número guardado
      fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: `🎉 Confirmación recibida: ${buyerName} (${buyerPhone}) seleccionó el número ${numeroConfirmado}.`
        })
      })
      .then(res => {
        if (!res.ok) {
          console.error('Error al enviar notificación a Telegram:', res.status);
        } else {
          console.log('✅ Notificación enviada a Telegram correctamente');
        }
      })
      .catch(err => {
        console.error('Error de red al enviar a Telegram:', err);
      });
    } else {
      alert(data.error || 'Error al seleccionar número');
    }
  } catch (err) {
    console.error('Error al enviar selección:', err);
    alert('Error al seleccionar número. Por favor intenta nuevamente.');
  }
  });
});

