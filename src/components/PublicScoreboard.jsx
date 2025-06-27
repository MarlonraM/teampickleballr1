import React, { useState, useEffect } from 'react';
import.meta.env.VITE_API_URL

// --- Estilos para el nuevo diseño del tablero (como en la imagen de referencia) ---
const styles = {
    container: {
        padding: '20px',
        backgroundColor: '#1a1a1a',
        color: 'white',
        fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
        minHeight: '100vh',
    },
    title: {
        textAlign: 'center',
        color: '#61DAFB',
        marginBottom: '40px',
        fontWeight: '300',
        fontSize: '2.5em',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '30px',
    },
    noMatches: {
        textAlign: 'center',
        color: '#888',
        fontSize: '1.2em',
        marginTop: '50px',
    },
    matchCard: {
        backgroundColor: '#282c34',
        border: '1px solid #444',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    },
    cardHeader: {
        backgroundColor: '#333',
        color: 'white',
        fontWeight: 'bold',
        padding: '10px',
        textAlign: 'center',
        fontSize: '1em',
    },
    cardBody: {
        padding: '15px 20px',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    teamRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '15px',
    },
    teamDetails: {
        textAlign: 'left',
    },
    playersName: {
        fontWeight: 'bold',
        fontSize: '1em',
        color: '#FF8A80',
        minHeight: '22px', 
    },
    teamName: {
        color: '#A1887F',
        fontSize: '0.8em',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    // Contenedor para la sección derecha: dots, línea y score
    rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    score: {
        fontSize: '2em',
        fontWeight: 'bold',
        color: '#81C784',
        minWidth: '40px',
        textAlign: 'right',
    },
    cardFooter: {
        marginTop: '15px',
        paddingTop: '10px',
        color: '#80CBC4',
        fontSize: '0.85em',
        fontWeight: 'bold',
        textAlign: 'left',
        borderTop: '1px solid #444'
    },
    serviceDotsContainer: {
        display: 'flex',
        gap: '5px',
    },
    serviceDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: '#555', // Un gris más visible que #444
        transition: 'all 0.3s ease',
        
    },
    serviceDotVisible: {
        opacity: 1,
    },
    serviceDotActive: {
        backgroundColor: 'yellow',
        boxShadow: '0 0 8px yellow',
    },
    divider: {
        height: '1px',
        backgroundColor: '#444',
        border: 'none',
        margin: '12px 0',
    },
    // Estilo para la nueva línea vertical
    verticalDivider: {
        width: '2px',
        height: '35px',
        backgroundColor: '#444',
    },
};

// --- Componente de Puntos de Servicio (Lógica sin cambios, pero revisada) ---
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

function PublicScoreboard() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
        useEffect(() => {
        const fetchData = async () => {
            try {
                // Ya no se necesita setLoading(true) aquí porque el estado inicial es true
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/scoreboard`);
                if (!response.ok) throw new Error('No se pudieron cargar los partidos.');
                const data = await response.json();
                setMatches(data);
                setError(null); // Limpia cualquier error anterior
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false); // Termina la carga, ya sea con éxito o con error
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


    const liveMatches = matches.filter(m => m && m.status === 'en_vivo');

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={styles.container}>
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
                                    {/* Equipo 1 */}
                                    <div style={styles.teamRow}>
                                        <div style={styles.teamDetails}>
                                            <div style={styles.playersName}>
                                                {match.team1_player1_name || 'Jugador 1'} / {match.team1_player2_name || 'Jugador 2'}
                                            </div>
                                            <div style={styles.teamName}>{match.team1_name || 'Equipo 1'}</div>
                                        </div>
                                        <div style={styles.rightSection}>
                                            <ServiceDots isServingTeam={isTeam1Serving} serverNum={match.server_number} isFirstServeOfGame={isFirstServeOfGame} />
                                            <div style={styles.verticalDivider}></div>
                                            <div style={styles.score}>{match.team1_score}</div>
                                        </div>
                                    </div>

                                    <hr style={styles.divider} />
                                    
                                    {/* Equipo 2 */}
                                    <div style={styles.teamRow}>
                                        <div style={styles.teamDetails}>
                                            <div style={styles.playersName}>
                                                {match.team2_player1_name || 'Jugador 1'} / {match.team2_player2_name || 'Jugador 2'}
                                            </div>
                                            <div style={styles.teamName}>{match.team2_name || 'Equipo 2'}</div>
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
