import React, { useState, useEffect } from 'react';
import { Megaphone } from 'lucide-react'; // Asegúrate de que lucide-react esté disponible

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

// --- Estilos para el tablero y los nuevos avisos ---
const styles = {
    // ... (tus estilos existentes para el tablero) ...
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
    announcementBarGeneral: {
        width: '100%',
        backgroundColor: '#0d6efd', // Un azul vibrante
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '1em',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    },
    announcementBarGame: {
        backgroundColor: '#282c34', // Un gris oscuro como el matchCard
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        border: '2px solid #0d6efd', // Borde azul para destacar
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '450px',
    },
    announcementHeader: {
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #444',
        paddingBottom: '8px',
        marginBottom: '12px',
    },
    announcementTitle: {
        fontSize: '1.3em',
        fontWeight: 'bold',
        marginLeft: '10px',
        color: '#61DAFB'
    },
    announcementBody: {
        textAlign: 'center',
    },
    announcementTeams: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        margin: '6px 0',
    },
    announcementCategory: {
        fontSize: '0.9em',
        fontStyle: 'italic',
        color: '#ccc',
    },
    announcementPlayers: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginTop: '12px',
        fontSize: '0.95em',
        textAlign: 'left',
    },
    announcementPlayersTeam: {
        fontWeight: 'bold',
        color: '#FF8A80' // Color para nombres de equipo
    },
    announcementPlayersList: {
        color: '#eee' // Color para nombres de jugadores
    },
    announcementFooter: {
        fontSize: '1em',
        fontStyle: 'italic',
        marginTop: '12px',
        color: '#80CBC4' // Color para el mensaje final
    }
};

const ServiceDots = ({ isServingTeam, serverNum, isFirstServeOfGame }) => {
    // Doble punto: se activan según el número de servidor y si ya hubo side out
    const firstDotActive = isServingTeam || isServingTeam && serverNum === 1;
    const secondDotActive = isServingTeam && isFirstServeOfGame || isServingTeam && serverNum === 2;

    return (
        <div style={styles.serviceDotsContainer}>
            <div style={{ 
                ...styles.serviceDot,
                ...(firstDotActive ? styles.serviceDotActive : {}) 
            }}></div>
            <div style={{ 
                ...styles.serviceDot,
                ...(secondDotActive ? styles.serviceDotActive : {}) 
            }}></div>
        </div>
    );
};

const Announcement = ({ announcement, onExpire }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onExpire();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onExpire]);

    // Renderizado para un aviso de partido
    if (announcement.type === 'game') {
        return (
            <div style={styles.announcementBarGame}>
                <div style={styles.announcementHeader}>
                    {/* Usamos el componente Megaphone directamente */}
                    <Megaphone color="#61DAFB" size={28}/>
                    <h3 style={styles.announcementTitle}>{announcement.courtName}</h3>
                </div>
                <div style={styles.announcementBody}>
                    <p style={styles.announcementTeams}>{announcement.team1Name} vs {announcement.team2Name}</p>
                    <p style={styles.announcementCategory}>{announcement.category}</p>
                    <div style={styles.announcementPlayers}>
                        <div>
                            <p style={styles.announcementPlayersTeam}>{announcement.team1Name}:</p>
                            <p style={styles.announcementPlayersList}>{(announcement.team1Players || []).join(' / ')}</p>
                        </div>
                        <div>
                            <p style={styles.announcementPlayersTeam}>{announcement.team2Name}:</p>
                            <p style={styles.announcementPlayersList}>{(announcement.team2Players || []).join(' / ')}</p>
                        </div>
                    </div>
                </div>
                 <p style={styles.announcementFooter}>
                    ⚠️ Favor de aproximarse a la cancha.
                </p>
            </div>
        );
    }

    // Renderizado para un aviso general
    return (
        <div style={styles.announcementBarGeneral}>
            {announcement.text}
        </div>
    );
};

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
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const socket = new WebSocket(import.meta.env.VITE_API_URL.replace(/^http/, 'ws'));
        socket.onopen = () => console.log("Tablero público conectado al WebSocket.");
        socket.onmessage = (event) => {
            const updatedData = JSON.parse(event.data);
            if (updatedData.type === 'SCORE_UPDATE') {
                setMatches(prevMatches =>
                    prevMatches.map(m => m.id === parseInt(updatedData.matchId, 10) ? { ...m, ...updatedData.payload } : m)
                );
            }
        };
        return () => socket.close();
    }, []);


    const removeAnnouncement = (id) => {
        setAnnouncements(prev => prev.filter(ann => ann.id !== id));
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
                        announcement={ann} 
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
