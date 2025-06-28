import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

// --- Estilos para el tablero y los nuevos avisos ---
const styles = {
    // Estilos del tablero (sin cambios)
    container: { padding: '20px', backgroundColor: '#1a1a1a', color: 'white', fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif", minHeight: '100vh', position: 'relative' },
    title: { textAlign: 'center', color: '#61DAFB', marginBottom: '40px', fontWeight: '300', fontSize: '2.5em' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '30px' },
    noMatches: { textAlign: 'center', color: '#888', fontSize: '1.2em', marginTop: '50px' },
    matchCard: { backgroundColor: '#282c34', border: '1px solid #444', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
    cardHeader: { backgroundColor: '#333', color: 'white', fontWeight: 'bold', padding: '10px', textAlign: 'center', fontSize: '1em' },
    cardBody: { padding: '15px 20px', flexGrow: 1, display: 'flex', flexDirection: 'column' },
    teamRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' },
    teamDetails: { textAlign: 'left' },
    playersName: { fontWeight: 'bold', fontSize: '1em', color: '#FF8A80', minHeight: '22px' },
    teamName: { color: '#A1887F', fontSize: '0.8em', fontWeight: 'bold', textTransform: 'uppercase' },
    rightSection: { display: 'flex', alignItems: 'center', gap: '15px' },
    score: { fontSize: '2em', fontWeight: 'bold', color: '#81C784', minWidth: '40px', textAlign: 'right' },
    cardFooter: { marginTop: '15px', paddingTop: '10px', color: '#80CBC4', fontSize: '0.85em', fontWeight: 'bold', textAlign: 'left', borderTop: '1px solid #444' },
    serviceDotsContainer: { display: 'flex', gap: '5px' },
    serviceDot: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#555', transition: 'all 0.3s ease' },
    serviceDotActive: { backgroundColor: 'yellow', boxShadow: '0 0 8px yellow' },
    divider: { height: '1px', backgroundColor: '#444', border: 'none', margin: '12px 0' },
    verticalDivider: { width: '2px', height: '35px', backgroundColor: '#444' },
    
    // --- NUEVOS ESTILOS PARA LA BARRA DE AVISOS ---
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
        backgroundColor: '#0d6efd', // Un azul vibrante
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '1em',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        opacity: 1,
        transition: 'opacity 0.5s ease-out',
    },
};
const Announcement = ({ message, onExpire }) => {
  useEffect(() => {
    const timer = setTimeout(onExpire, 5000);
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

  const removeAnnouncement = (id) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };
// --- Componente de Puntos de Servicio (sin cambios) ---
const ServiceDots = ({ isServingTeam, serverNum, isFirstServeOfGame }) => { /* ... */ };

function PublicScoreboard() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/matches/scoreboard`);
        if (!response.ok) throw new Error('No se pudieron cargar los partidos.');
        const data = await response.json();
        setMatches(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const socket = new WebSocket(WS_URL);
    socket.onopen = () => console.log("WebSocket conectado.");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'SCORE_UPDATE') {
        setMatches(prev =>
          prev.map(m => m.id === parseInt(data.matchId, 10)
            ? { ...m, ...data.payload }
            : m
          )
        );
      }

      if (data.type === 'ANNOUNCEMENT_NEW') {
        const match = data.payload;
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

        setAnnouncements(prev => [...prev, message]);
      }
    };

    return () => socket.close();
  }, []);

  const removeAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const liveMatches = matches.filter(m => m && m.status === 'en_vivo');

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.announcementsContainer}>
        {announcements.map(ann => (
          <Announcement
            key={ann.id}
            message={ann}
            onExpire={() => removeAnnouncement(ann.id)}
          />
        ))}
      </div>

      <h1 style={styles.title}>Tablero de Puntuaciones en Vivo</h1>
      {liveMatches.length > 0 ? (
        <div style={styles.grid}>
          {liveMatches.map((match) => {
            const isFirstServeOfGame = !match.first_side_out_done;
            const isTeam1Serving = match.server_team_id === match.team1_id;
            const isTeam2Serving = match.server_team_id === match.team2_id;

            return (
              <div key={match.id} style={styles.matchCard}>
                <div style={styles.cardHeader}>CANCHA {match.court_id || 'N/A'}</div>
                <div style={styles.cardBody}>
                  <div style={styles.teamRow}>
                    <div style={styles.teamDetails}>
                      <div style={styles.playersName}>{match.team1_player1_name} / {match.team1_player2_name}</div>
                      <div style={styles.teamName}>{match.team1_name}</div>
                    </div>
                    <div style={styles.rightSection}>
                      <ServiceDots isServingTeam={isTeam1Serving} serverNum={match.server_number} isFirstServeOfGame={isFirstServeOfGame} />
                      <div style={styles.verticalDivider}></div>
                      <div style={styles.score}>{match.team1_score}</div>
                    </div>
                  </div>
                  <hr style={styles.divider} />
                  <div style={styles.teamRow}>
                    <div style={styles.teamDetails}>
                      <div style={styles.playersName}>{match.team2_player1_name} / {match.team2_player2_name}</div>
                      <div style={styles.teamName}>{match.team2_name}</div>
                    </div>
                    <div style={styles.rightSection}>
                      <ServiceDots isServingTeam={isTeam2Serving} serverNum={match.server_number} isFirstServeOfGame={isFirstServeOfGame} />
                      <div style={styles.verticalDivider}></div>
                      <div style={styles.score}>{match.team2_score}</div>
                    </div>
                  </div>
                  <div style={styles.cardFooter}>
                    GRUPO {match.group || 'N/A'} - {match.category}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={styles.noMatches}>No hay partidos en vivo en este momento.</p>
      )}
    </div>
  );
}

export default PublicScoreboard;
