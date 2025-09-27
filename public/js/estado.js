document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('numbers-grid');

  // Cargar números
  function loadNumbers() {
    fetch('/api/numbers')
      .then(res => res.ok ? res.json() : Promise.reject('Error al obtener números'))
      .then(numbers => {
        grid.innerHTML = '';
        numbers.forEach(num => {
          const div = document.createElement('div');
          // Asegurarnos de que la clase CSS se aplique correctamente
          div.className = `estado-number ${num.status}`;
          div.textContent = num.number;
          div.title = `Número: ${num.number}\nEstado: ${num.status}`;
          grid.appendChild(div);
        });
      })
      .catch(err => console.error(err));
  }

  loadNumbers();
});