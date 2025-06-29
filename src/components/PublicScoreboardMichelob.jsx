import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, Trophy, Server } from 'lucide-react'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

// --- Componente de Anuncio Rediseñado (Tema Claro) ---
const Announcement = ({ announcement, onExpire, styles }) => {
    useEffect(() => {
        const timer = setTimeout(onExpire, 6000); 
        return () => clearTimeout(timer);
    }, [onExpire]);

    if (announcement.type === 'game') {
        return (
            <div style={styles.announcementBarGame}>
                <div style={styles.announcementHeader}>
                    <Megaphone style={{ color: '#051638' }} size={24} />
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
                    Favor de presentarse a la cancha.
                </p>
            </div>
        );
    }

    return (
        <div style={{...styles.announcementBarGeneral, ...styles.announcementBar}}>
            {announcement.text}
        </div>
    );
};

// --- Componente ServiceDots (Re-integrado) ---
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

    // --- CORRECCIÓN: Todos los estilos ahora viven dentro del componente ---
    const styles = {
        pageWrapper: {
            backgroundColor: '#051638',
            padding: '8px',
            minHeight: '100vh'
        },
        container: {
            fontFamily: "'Inter', sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            backgroundColor: '#FFFFFF',
            color: '#051638',
            minHeight: 'calc(100vh - 16px)',
            borderRadius: '8px',
            position: 'relative',
            paddingTop: '80px',
        },
        header: {
            position: 'fixed',
            top: '8px',
            left: '8px',
            right: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            backgroundColor: '#051638',
            color: 'white',
            zIndex: 100,
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
        },
        logo: { height: '24px' },
        hamburgerIcon: { width: '24px', height: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' },
        hamburgerLine: { width: '100%', height: '3px', backgroundColor: '#E51937', borderRadius: '2px' },
        announcementsContainer: { position: 'absolute', top: '90px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        mainContent: { padding: '1rem 2rem 4rem 2rem' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' },
        matchCard: { backgroundColor: '#FFFFFF', color: '#051638', borderRadius: '1rem', border: '1px solid #051638', overflow: 'hidden', boxShadow: '0 20px 40px -15px rgba(5, 22, 56, 0.2)' },
        cardHeader: { backgroundColor: '#051638', color: 'white', padding: '0.5rem', textAlign: 'center' },
        cardHeaderTitle: { fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' },
        cardBody: { padding: '1.5rem' },
        teamRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
        teamDetails: { textAlign: 'left' },
        playersName: { fontWeight: '600', fontSize: '1.1em', color: '#051638' },
        teamName: { color: '#666', fontSize: '0.8em', fontWeight: 'normal', textTransform: 'uppercase' },
        rightSection: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
        score: { fontSize: '4rem', fontWeight: '900', color: '#E51937', minWidth: '60px', textAlign: 'right' },
        cardFooter: { backgroundColor: 'rgba(5, 22, 56, 0.05)', color: '#666', padding: '0.5rem 1.5rem', textAlign: 'center', fontSize: '0.8rem' },
        serviceDotsContainer: { display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center' },
        serviceDot: { width: '10px', height: '10px', borderRadius: '50%', transition: 'all 0.3s ease' },
        serviceDotActive: { backgroundColor: '#FFB81C', boxShadow: '0 0 8px #FFB81C' },
        inactiveDotStyle: { backgroundColor: '#d1d5db' },
        divider: { height: '1px', backgroundColor: '#e0e0e0', border: 'none', margin: '1rem 0' },
        verticalDivider: { width: '1px', height: '35px', backgroundColor: '#e0e0e0' },
        footer: { textAlign: 'center', padding: '3rem 0 1rem 0', color: 'rgba(5, 22, 56, 0.5)', fontSize: '0.8rem' },
        announcementBarGame: { backgroundColor: '#FFFFFF', color: '#051638', border: `2px solid #E51937` },
        announcementBarGeneral: { backgroundColor: '#E51937', color: 'white', fontWeight: 'bold', textAlign: 'center' },
        announcementBar: { width: '100%', maxWidth: '500px', padding: '1rem', borderRadius: '0.75rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', marginBottom: '1rem', border: '1px solid rgba(0, 0, 0, 0.05)'},
    };

    const fetchData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/matches/scoreboard`);
            if (!response.ok) throw new Error('No se pudieron cargar los partidos.');
            const data = await response.json();
            setMatches(data);
        } catch (err) {
            setError(err.message);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
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
                    <h1 style={{ ...styles.title, color: '#051638' }}>MARCADOR EN VIVO</h1>
                    {matches.length > 0 ? (
                        <div style={styles.grid}>
                            {matches.map(match => (
                                <div key={match.id} style={styles.matchCard}>
                                    <div style={styles.cardHeader}>
                                        <h2 style={styles.cardHeaderTitle}>{match.court_name || `CANCHA #${match.court_id}`}</h2>
                                    </div>
                                    <div style={styles.cardBody}>
                                        <div style={styles.teamRow}>
                                            <div style={styles.teamDetails}>
                                                <p style={styles.playersName}>{match.team1_player1_name} / {match.team1_player2_name}</p>
                                                <p style={styles.teamName}>{match.team1_name}</p>
                                            </div>
                                            <div style={styles.rightSection}>
                                                <ServiceDots isServing={match.server_team_id === match.team1_id} styles={styles} />
                                                <div style={styles.verticalDivider}></div>
                                                <span style={styles.score}>{match.team1_score}</span>
                                            </div>
                                        </div>
                                        <hr style={styles.divider} />
                                        <div style={styles.teamRow}>
                                            <div style={styles.teamDetails}>
                                                <p style={styles.playersName}>{match.team2_player1_name} / {match.team2_player2_name}</p>
                                                <p style={styles.teamName}>{match.team2_name}</p>
                                            </div>
                                            <div style={styles.rightSection}>
                                                <ServiceDots isServing={match.server_team_id === match.team2_id} styles={styles} />
                                                <div style={styles.verticalDivider}></div>
                                                <span style={styles.score}>{match.team2_score}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={styles.cardFooter}>
                                        GRUPO {match.group_id ? String.fromCharCode(64 + match.group_id) : 'N/A'} - {match.category}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#051638', fontStyle: 'italic' }}>No hay partidos en vivo en este momento.</p>
                    )}
                </main>

                <footer style={styles.footer}>
                    Presentado por Michelob Ultra
                </footer>
            </div>
        </div>
    );
}

export default PublicScoreboardMichelob;
