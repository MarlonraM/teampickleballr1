import React, { useState, useEffect } from 'react';

const styles = {
  announcementsContainer: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    width: '90%',
    maxWidth: '800px',
  },
  announcementBar: {
    width: '100%',
    backgroundColor: '#0d6efd',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '1em',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
};

const Announcement = ({ message, onExpire }) => {
  useEffect(() => {
    const timer = setTimeout(() => onExpire(), 5000);
    return () => clearTimeout(timer);
  }, [onExpire]);

  return (
    <div style={styles.announcementBar}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.3em', fontWeight: 'bold' }}>🏟️ {message.court}</div>
        <div style={{ fontSize: '1.1em', margin: '6px 0' }}>
          {message.team1} vs {message.team2}
        </div>
        <div style={{ fontSize: '0.9em', fontStyle: 'italic', color: '#d1e9ff' }}>
          {message.category}
        </div>
        <div style={{ fontSize: '0.95em', marginTop: '6px' }}>
          👥 {message.player1_1} / {message.player1_2}<br />
          👥 {message.player2_1} / {message.player2_2}
        </div>
        <div style={{ fontSize: '1em', fontStyle: 'italic', marginTop: '10px' }}>
          ⚠️ Favor presentarse en {message.court}
        </div>
      </div>
    </div>
  );
};

const MyScoreboard = () => {
  const [announcements, setAnnouncements] = useState([]);

  const addAnnouncement = (match) => {
    const message = {
      id: match.id,
      category: match.category,
      team1: match.team1_name,
      team2: match.team2_name,
      player1_1: match.team1_player1_name,
      player1_2: match.team1_player2_name,
      player2_1: match.team2_player1_name,
      player2_2: match.team2_player2_name,
      court: match.court_name || `Cancha #${match.court_id}`,
    };

    setAnnouncements((prev) => [...prev, message]);
  };

  const removeAnnouncement = (id) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // Ejemplo para probar manualmente:
  const lanzarAvisoDePrueba = () => {
    addAnnouncement({
      id: 1,
      category: 'Mixta A',
      team1_name: 'Titanes',
      team2_name: 'Furias',
      team1_player1_name: 'Ana',
      team1_player2_name: 'Luis',
      team2_player1_name: 'Carlos',
      team2_player2_name: 'Marta',
      court_name: 'Cancha #2',
    });
  };

  return (
    <div>
      <div style={styles.announcementsContainer}>
        {announcements.map((a) => (
          <Announcement key={a.id} message={a} onExpire={() => removeAnnouncement(a.id)} />
        ))}
      </div>

      {/* Botón para lanzar aviso de prueba */}
      <button onClick={lanzarAvisoDePrueba} style={{ marginTop: '120px' }}>
        Lanzar aviso de prueba
      </button>
    </div>
  );
};

export default MyScoreboard;
