// src/components/MatchList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import.meta.env.VITE_API_URL

function MatchList() {
  const [matches, setMatches] = useState([]);
  const [courts, setCourts] = useState([]);
  // Nuevo estado para guardar la cancha seleccionada para cada partido pendiente
  const [selectedCourts, setSelectedCourts] = useState({}); // ej: { matchId1: courtId, matchId2: courtId }

  const fetchMatches = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/matches`)
      .then(res => res.json())
      .then(data => setMatches(data))
      .catch(err => console.error("Error al obtener partidos:", err));
  };

  const fetchCourts = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/courts`)
      .then(res => res.json())
      .then(data => setCourts(data))
      .catch(err => console.error("Error al obtener canchas:", err));
  };

  useEffect(() => {
    fetchMatches();
    fetchCourts();
  }, []);

  const handleCourtSelect = (matchId, courtId) => {
    setSelectedCourts(prev => ({
      ...prev,
      [matchId]: courtId
    }));
  };

  const handleStartMatch = async (matchId) => {
    const courtId = selectedCourts[matchId];
    if (!courtId) {
      alert("Por favor, selecciona una cancha primero.");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          court_id: courtId,
          status: 'en_vivo'
        })
      });

      if (!response.ok) {
        throw new Error('No se pudo iniciar el partido.');
      }

      alert(`¡Partido ${matchId} iniciado en la cancha ${courtId}!`);
      fetchMatches(); // Refrescamos la lista para ver el cambio de estado

    } catch (error) {
      console.error("Error al iniciar partido:", error);
      alert("Error al iniciar el partido.");
    }
  };

  return (
    <div>
      <h2 style={{marginTop: '40px'}}>Lista de Partidos</h2>
      <table border="1" style={{ width: '100%', marginTop: '20px' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Equipo 1</th>
            <th>Equipo 2</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(match => (
            <tr key={match.id}>
              <td>{match.id}</td>
              <td>Equipo {match.team1_id}</td>
              <td>Equipo {match.team2_id}</td>
              <td>{match.category}</td>
              <td>{match.status}</td>
              <td>
                {match.status === 'pendiente' && courts.length > 0 && (
                  <div>
                    <select onChange={(e) => handleCourtSelect(match.id, e.target.value)} defaultValue="">
                      <option value="" disabled>Selecciona una cancha</option>
                      {courts.map(court => (
                        <option key={court.id} value={court.id}>{court.name}</option>
                      ))}
                    </select>
                    <button onClick={() => handleStartMatch(match.id)} style={{marginLeft: '10px'}}>
                      Iniciar Partido
                    </button>
                  </div>
                )}
                 {match.status === 'en_vivo' && (
                    <Link to={`/match/${match.id}`} style={{color: 'cyan'}}>
                      Ir al Marcador (Cancha {match.court_id})
                    </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MatchList;
