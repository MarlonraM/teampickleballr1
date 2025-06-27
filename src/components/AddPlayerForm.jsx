// src/components/AddPlayerForm.jsx
import React, { useState } from 'react';
import.meta.env.VITE_API_URL

// Recibimos una función 'onPlayerAdded' para notificar al componente padre que se añadió un jugador
function AddPlayerForm({ onPlayerAdded }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Intermedio'); // Valor por defecto

  const handleSubmit = async (event) => {
    event.preventDefault(); // Evita que la página se recargue al enviar el formulario

    const newPlayer = {
      full_name: fullName,
      email: email,
      category: category,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPlayer),
      });

      if (!response.ok) {
        // Si el servidor responde con un error, lo mostramos
        const errorData = await response.json();
        alert(`Error al crear el jugador: ${errorData.msg || 'Error desconocido'}`);
        return;
      }

      const createdPlayer = await response.json();
      alert(`¡Jugador "${createdPlayer.full_name}" creado exitosamente!`);

      // Limpiamos el formulario
      setFullName('');
      setEmail('');
      setCategory('Intermedio');

      // Llamamos a la función del padre para que se actualice la lista de jugadores
      onPlayerAdded(); 

    } catch (error) {
      console.error('Error de red al crear el jugador:', error);
      alert('Error de red. ¿Está el servidor backend corriendo?');
    }
  };

  return (
    <div style={{ border: '1px solid white', padding: '20px', marginTop: '20px' }}>
      <h3>Añadir Nuevo Jugador</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre Completo: </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Categoría: </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Avanzado">Avanzado</option>
            <option value="Intermedio Fuerte">Intermedio Fuerte</option>
            <option value="Intermedio">Intermedio</option>
          </select>
        </div>
        <button type="submit" style={{ marginTop: '15px' }}>Crear Jugador</button>
      </form>
    </div>
  );
}

export default AddPlayerForm;
