// src/components/TournamentList.jsx
import React, { useState, useEffect } from 'react';
import.meta.env.VITE_API_URL

function TournamentList() {
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/tournaments`)
      .then(response => response.json())
      .then(data => setTournaments(data))
      .catch(error => console.error('Error al obtener los torneos:', error));
  }, []);

  return (
    <div>
      <h2>Lista de Torneos</h2>
      {tournaments.length > 0 ? (
        <ul>
          {tournaments.map(t => (
            <li key={t.id}>{t.name}</li>
          ))}
        </ul>
      ) : (
        <p>No hay torneos para mostrar.</p>
      )}
    </div>
  );
}

export default TournamentList;
