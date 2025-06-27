// src/components/PlayerList.jsx
import React, { useState, useEffect } from 'react';
import AddPlayerForm from './AddPlayerForm';
import.meta.env.VITE_API_URL

function PlayerList() {
  const [players, setPlayers] = useState([]);

  const fetchPlayers = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/players`)
      .then(response => response.json())
      .then(data => setPlayers(data))
      .catch(error => console.error('Error al obtener los jugadores:', error));
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handlePlayerAdded = () => {
    fetchPlayers();
  };

  // --- NUEVA FUNCIÓN PARA MANEJAR EL BORRADO ---
  const handleDelete = async (playerId, playerName) => {
    // 1. Mostrar la ventana de confirmación
    const isConfirmed = window.confirm(`¿Estás seguro de que quieres eliminar a "${playerName}"? Esta acción no se puede deshacer.`);

    // 2. Si el usuario no confirma, no hacemos nada
    if (!isConfirmed) {
      return;
    }

    // 3. Si el usuario confirma, llamamos a la API de borrado
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/players/${playerId}`, {
        method: 'DELETE', // Usamos el método DELETE
      });

      if (!response.ok) {
        alert('Error al eliminar el jugador.');
        return;
      }

      alert(`Jugador "${playerName}" eliminado exitosamente.`);

      // 4. Refrescamos la lista de jugadores para que el borrado se refleje en la pantalla
      fetchPlayers(); 

    } catch (error) {
      console.error('Error de red al eliminar el jugador:', error);
      alert('Error de red al eliminar.');
    }
  };

  return (
    <div>
      <AddPlayerForm onPlayerAdded={handlePlayerAdded} />

      <h2 style={{marginTop: '40px'}}>Lista de Jugadores</h2>
      {players.length > 0 ? (
        <table border="1" style={{ width: '100%', marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Categoría</th>
              <th>Acciones</th> {/* <-- NUEVA COLUMNA */}
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id}>
                <td>{p.full_name}</td>
                <td>{p.email}</td>
                <td>{p.category}</td>
                <td>
                  {/* --- NUEVO BOTÓN DE BORRAR --- */}
                  {/* Llama a nuestra función handleDelete pasando el ID y nombre del jugador */}
                  <button onClick={() => handleDelete(p.id, p.full_name)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay jugadores para mostrar.</p>
      )}
    </div>
  );
}

export default PlayerList;
