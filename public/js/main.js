// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('numbers-grid');
  const selectionInfo = document.getElementById('selection-info');
  const selectedNumberElement = document.getElementById('selected-number'); // Cambiado
  const confirmation = document.getElementById('confirmation');
  const successInfo = document.getElementById('success-info'); // Nuevo
  const successNumber = document.getElementById('success-number'); // Nuevo
  const successDate = document.getElementById('success-date'); // Nuevo
  const confirmButton = document.getElementById('confirm-selection');
  const acceptTermsCheckbox = document.getElementById('accept-terms');
  const sorteoDateElement = document.getElementById('sorteo-date');
  const confirmationDateElement = document.getElementById('confirmation-date');

  let selectedNumber = null;
  
  // Generar o recuperar ID único del dispositivo
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
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
          successDate.textContent = formatted; // Actualizar fecha en éxito
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
          div.className = `number ${num.status}`;
          div.textContent = num.number;
          div.dataset.number = num.number;

          if (num.status === 'disponible') {
            div.addEventListener('click', selectNumber);
          }

          grid.appendChild(div);
        });
      })
      .catch(err => console.error(err));
  }

  // 🔁 Inicialización
  loadNumbers();
  loadSorteoDate();
  checkWinner();

  // 🖱️ Seleccionar número (solo uno permitido)
  function selectNumber(e) {
    const number = e.target.dataset.number;
    
    // Si ya hay un número seleccionado, no permitir seleccionar otro
    if (selectedNumber !== null) {
      alert('Solo puedes seleccionar un número para participar en el sorteo gratis');
      return;
    }
    
    // Si el número ya está seleccionado, deseleccionarlo
    if (selectedNumber === number) {
      selectedNumber = null;
      e.target.classList.remove('seleccionado');
      e.target.classList.add('disponible');
    } else {
      // Seleccionar el número
      selectedNumber = number;
      e.target.classList.remove('disponible');
      e.target.classList.add('seleccionado');
    }

    updateSelectionInfo();
  }

  // 📋 Actualizar panel de selección
  function updateSelectionInfo() {
    if (selectedNumber !== null) {
      selectionInfo.style.display = 'block';
      selectedNumberElement.textContent = selectedNumber; // Cambiado
      confirmation.style.display = 'block';
      successInfo.style.display = 'none'; // Ocultar éxito si se selecciona otro
    } else {
      selectionInfo.style.display = 'none';
    }
  }

  // ✅ Activar botón según términos
  acceptTermsCheckbox.addEventListener('change', () => {
    confirmButton.disabled = !acceptTermsCheckbox.checked;
  });

  // 📤 Confirmar selección
  confirmButton.addEventListener('click', () => {
    if (!acceptTermsCheckbox.checked) {
      alert('Debes aceptar los términos y condiciones para continuar');
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

    // Enviar selección con ID del dispositivo
    fetch('/api/select', {
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
    })
      .then(res => res.ok ? res.json() : Promise.reject('Error al seleccionar número'))
      .then(data => {
        if (data.message) {
          // Mostrar mensaje de éxito
          successNumber.textContent = selectedNumber;
          confirmation.style.display = 'none';
          successInfo.style.display = 'block';
          
          // Limpiar selección
          selectedNumber = null;
          acceptTermsCheckbox.checked = false;
          confirmButton.disabled = true;
          loadNumbers();


           // ✅ Enviar notificación por Telegram
          fetch('/send-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          mensaje: `🎉 Confirmación recibida: ${buyerName} (${buyerPhone}) seleccionó el número ${data.number || selectedNumber}.`
            })
          })
          .then(res => {
          if (!res.ok) {
            console.error('Error al enviar notificación a Telegram:', res.status);
            }
          })
          .catch(err => {
            console.error('Error de red al enviar a Telegram:', err);
          });
  
  
        } else {
          alert(data.error || 'Error al seleccionar número');
        }
      })
      .catch(err => {
        console.error('Error al enviar selección:', err);
        alert('Error seleccionar solo un número');
      });
  });
});