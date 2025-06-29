import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, Server } from 'lucide-react'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

// --- Componente de Anuncio Rediseñado (Tema Claro) ---
const Announcement = ({ announcement, onExpire, styles }) => {
    useEffect(() => {
        const timer = setTimeout(onExpire, 6000); 
        return () => clearTimeout(timer);
    }, [onExpire]);

    // ... (El JSX de este componente se mantiene igual)
};

// --- Componente ServiceDots (Re-integrado y con nuevo estilo) ---
const ServiceDots = ({ isServing, styles }) => {
    return (
        <div style={styles.serviceDotsContainer}>
            <div style={{...styles.serviceDot, ...(isServing ? styles.serviceDotActive : styles.inactiveDotStyle)}}></div>
            <div style={{...styles.serviceDot, ...(isServing ? styles.serviceDotActive : styles.inactiveDotStyle)}}></div>
        </div>
    );
};

function PublicScoreboardMichelob() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [announcements, setAnnouncements] = useState([]);

    // --- Estilos Globales y de Componentes ---
    const styles = {
        page: {
            fontFamily: "'Inter', sans-serif, sans-serif",
            backgroundColor: '#FFFFFF',
            color: '#051638',
            minHeight: '100vh',
            padding: '1rem',
            border: '8px solid #051638'
        },
        header: {
            textAlign: 'center',
            padding: '1rem 0',
        },
        logo: {
            height: '30px',
            margin: '0 auto',
        },
        announcementsContainer: {
            position: 'fixed',
            top: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        },
        mainContent: {
            padding: '1rem 0',
        },
        title: {
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: '900',
            color: '#051638',
            marginBottom: '2rem',
            textTransform: 'uppercase',
            letterSpacing: '1px'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1.5rem',
        },
        matchCard: {
            backgroundColor: '#FFFFFF',
            color: '#051638',
            borderRadius: '1rem',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            boxShadow: '0 10px 30px -15px rgba(5, 22, 56, 0.3)',
        },
        cardHeader: {
            backgroundColor: '#051638',
            color: 'white',
            padding: '0.5rem',
            textAlign: 'center',
        },
        cardHeaderTitle: {
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.9rem',
        },
        cardBody: {
            padding: '1rem 1.5rem',
        },
        teamRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
        },
        teamDetails: {
            textAlign: 'left',
        },
        playersName: {
            fontWeight: '600',
            fontSize: '1em',
            color: '#051638',
        },
        teamName: {
            color: '#667',
            fontSize: '0.75em',
            fontWeight: 'normal',
            textTransform: 'uppercase',
        },
        rightSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        },
        score: {
            fontSize: '3.5rem',
            fontWeight: '900',
            color: '#E51937',
            minWidth: '50px',
            textAlign: 'right',
        },
        cardFooter: {
            backgroundColor: 'rgba(5, 22, 56, 0.05)',
            color: '#666',
            padding: '0.5rem 1.5rem',
            textAlign: 'center',
            fontSize: '0.8rem',
        },
        serviceDotsContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            justifyContent: 'center',
            alignItems: 'center',
        },
        serviceDot: {
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
        },
        serviceDotActive: {
            backgroundColor: '#FFB81C', // Amarillo/Dorado
            boxShadow: '0 0 8px #FFB81C',
        },
        inactiveDotStyle: {
            backgroundColor: '#d1d5db',
        },
        divider: {
            height: '1px',
            backgroundColor: '#e0e0e0',
            border: 'none',
            margin: '0.75rem 0',
        },
        verticalDivider: {
            width: '1px',
            height: '35px',
            backgroundColor: '#e0e0e0',
        },
        footer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            padding: '2rem 0 1rem 0',
            color: 'rgba(5, 22, 56, 0.6)',
            fontSize: '0.9rem',
        },
        footerLogo: {
            height: '24px'
        }
    };

    const fetchData = useCallback(async (isInitialLoad = false) => {
        // ... (lógica sin cambios)
    }, []);

    useEffect(() => {
        fetchData(true);
        const socket = new WebSocket(WS_URL);
        socket.onopen = () => console.log("Tablero Michelob conectado al WebSocket.");
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'SCORE_UPDATE' || data.type === 'MATCH_UPDATE') {
                fetchData(false);
            }
            if (data.type === 'ANNOUNCEMENT_NEW') {
                setAnnouncements(prev => [data.payload, ...prev]);
            }
        };
        return () => socket.close();
    }, [fetchData]);

    const removeAnnouncement = (id) => {
        setAnnouncements(prev => prev.filter(ann => ann.id !== id));
    };

    if (loading) return <div style={styles.container}>Cargando...</div>;
    if (error) return <div style={styles.container}>Error: {error}</div>;

    return (
        <div style={styles.pageWrapper}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <img src="/logoblanco.png" alt="Michelob Ultra" style={styles.logo} />
                    <div style={styles.hamburgerIcon}>
                        <div style={styles.hamburgerLine}></div>
                        <div style={styles.hamburgerLine}></div>
                        <div style={styles.hamburgerLine}></div>
                    </div>
                </header>
                
                <div style={styles.announcementsContainer}>
                    {announcements.map(ann => (
                        <Announcement key={ann.id} announcement={ann} onExpire={() => removeAnnouncement(ann.id)} styles={styles} />
                    ))}
                </div>

                <main style={styles.mainContent}>
                    <h1 style={styles.title}>MARCADOR EN VIVO</h1>
                    {matches.length > 0 ? (
                        <div style={styles.grid}>
                            {matches.map(match => {
                                const isTeam1Serving = match.server_team_id === match.team1_id;
                                const isTeam2Serving = match.server_team_id === match.team2_id;
                                
                                return (
                                    <div key={match.id} style={styles.matchCard}>
                                        <div style={styles.cardHeader}>
                                            <h2 style={styles.cardHeaderTitle}>{match.court_name || `CANCHA #${match.court_id}`}</h2>
                                        </div>
                                        <div style={styles.cardBody}>
                                            <div style={styles.teamRow}>
                                                <div style={styles.teamDetails}>
                                                    <p style={styles.playersName}>{match.team1_player1_name || 'Jugador 1'} / {match.team1_player2_name || 'Jugador 2'}</p>
                                                    <p style={styles.teamName}>{match.team1_name}</p>
                                                </div>
                                                <div style={styles.rightSection}>
                                                    <ServiceDots isServing={isTeam1Serving} styles={styles} />
                                                    <div style={styles.verticalDivider}></div>
                                                    <span style={styles.score}>{match.team1_score}</span>
                                                </div>
                                            </div>
                                            <hr style={styles.divider} />
                                            <div style={styles.teamRow}>
                                                <div style={styles.teamDetails}>
                                                    <p style={styles.playersName}>{match.team2_player1_name || 'Jugador 1'} / {match.team2_player2_name}</p>
                                                    <p style={styles.teamName}>{match.team2_name}</p>
                                                </div>
                                                <div style={styles.rightSection}>
                                                    <ServiceDots isServing={isTeam2Serving} styles={styles} />
                                                    <div style={styles.verticalDivider}></div>
                                                    <span style={styles.score}>{match.team2_score}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={styles.cardFooter}>
                                            GRUPO {match.group_id ? String.fromCharCode(64 + match.group_id) : 'N/A'} - {match.category}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#051638', fontStyle: 'italic' }}>No hay partidos en vivo en este momento.</p>
                    )}
                </main>

                <footer style={styles.footer}>
                    Presentado por <img src="/logo.png" alt="Michelob Ultra" style={styles.footerLogo} />
                </footer>
            </div>
        </div>
    );
}

export default PublicScoreboardMichelob;
