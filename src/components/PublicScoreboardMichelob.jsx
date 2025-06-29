import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, Trophy, Server } from 'lucide-react'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

// --- Estilos Globales para la Página (Tema Claro Michelob) ---
const pageStyles = {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: '#FFFFFF', // Fondo blanco
    color: '#051638', // Azul oscuro de Michelob para el texto principal
    minHeight: '100vh',
    padding: '1rem',
};

// --- Componente de Anuncio Rediseñado (Tema Claro) ---
const Announcement = ({ announcement, onExpire }) => {
    useEffect(() => {
        const timer = setTimeout(onExpire, 6000); // Duración extendida para mejor lectura
        return () => clearTimeout(timer);
    }, [onExpire]);

    const baseStyle = {
        width: '100%',
        maxWidth: '500px',
        padding: '1rem',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        marginBottom: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    };

    if (announcement.type === 'game') {
        return (
            <div style={{...baseStyle, backgroundColor: '#051638', color: '#FFFFFF', border: `2px solid #E51937`}}>
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                    <Megaphone style={{ color: '#FFFFFF' }} size={24} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginLeft: '0.75rem' }}>{announcement.courtName}</h3>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{announcement.team1Name} vs {announcement.team2Name}</p>
                    <p style={{ fontSize: '0.875rem', color: '#DDDDDD', marginTop: '-0.25rem' }}>{announcement.category}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem', textAlign: 'left' }}>
                        <div>
                            <p style={{ fontWeight: '600' }}>{announcement.team1Name}:</p>
                            <p style={{ color: '#CCCCCC' }}>{(announcement.team1Players || []).join(' / ')}</p>
                        </div>
                        <div>
                            <p style={{ fontWeight: '600' }}>{announcement.team2Name}:</p>
                            <p style={{ color: '#CCCCCC' }}>{(announcement.team2Players || []).join(' / ')}</p>
                        </div>
                    </div>
                </div>
                 <p style={{ textAlign: 'center', fontSize: '0.875rem', fontStyle: 'italic', marginTop: '1rem', color: '#FFFFFF' }}>
                    Favor de presentarse a la cancha.
                </p>
            </div>
        );
    }

    return (
        <div style={{...baseStyle, backgroundColor: '#E51937', color: 'white', fontWeight: 'bold', textAlign: 'center'}}>
            {announcement.text}
        </div>
    );
};

// --- Componente ServiceDots (Re-integrado) ---
const ServiceDots = ({ isServing }) => {
    const dotStyle = {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
    };
    const activeDotStyle = {
        backgroundColor: '#E51937', // Rojo Michelob
        boxShadow: '0 0 8px #E51937',
    };
    const inactiveDotStyle = {
        backgroundColor: 'rgba(255,255,255,0.3)', 
    };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{...dotStyle, ...(isServing ? activeDotStyle : inactiveDotStyle)}}></div>
            <div style={{...dotStyle, ...(isServing ? activeDotStyle : inactiveDotStyle)}}></div>
        </div>
    );
};

function PublicScoreboardMichelob() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [announcements, setAnnouncements] = useState([]);

    const fetchData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/matches/scoreboard`);
            if (!response.ok) throw new Error('No se pudieron cargar los partidos.');
            const data = await response.json();
            setMatches(data);
            setError(null);
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

    if (loading) return <div style={pageStyles}>Cargando...</div>;
    if (error) return <div style={pageStyles}>Error: {error}</div>;

    return (
        <div style={pageStyles}>
            <header style={{ textAlign: 'center', padding: '1rem 0 2rem 0' }}>
                <img src="https://www.michelobultra.com/content/dam/brand_michelobultra/logos/michelob-ultra-logo.svg" alt="Michelob Ultra" style={{ height: '30px', margin: '0 auto' }} />
            </header>
            
            <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {announcements.map(ann => (
                    <Announcement key={ann.id} announcement={ann} onExpire={() => removeAnnouncement(ann.id)} />
                ))}
            </div>

            <main>
                <h1 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: '#051638', marginBottom: '2rem' }}>MARCADOR EN VIVO</h1>
                {matches.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
                        {matches.map(match => {
                            const isTeam1Serving = match.server_team_id === match.team1_id;
                            const isTeam2Serving = match.server_team_id === match.team2_id;
                            
                            return (
                                <div key={match.id} style={{ backgroundColor: '#051638', color: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 20px 40px -15px rgba(5, 22, 56, 0.4)' }}>
                                    <div style={{ backgroundColor: '#E51937', color: 'white', padding: '0.5rem', textAlign: 'center' }}>
                                        <h2 style={{ fontWeight: 'bold' }}>{match.court_name || `CANCHA #${match.court_id}`}</h2>
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                <p style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{match.team1_name}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{match.team1_player1_name} / {match.team1_player2_name}</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                <ServiceDots isServing={isTeam1Serving} />
                                                <span style={{ fontSize: '4rem', fontWeight: 'bold', color: '#FFFFFF' }}>{match.team1_score}</span>
                                            </div>
                                        </div>
                                        <hr style={{ border: 'none', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '1rem 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                <p style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{match.team2_name}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{match.team2_player1_name} / {match.team2_player2_name}</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                <ServiceDots isServing={isTeam2Serving} />
                                                <span style={{ fontSize: '4rem', fontWeight: 'bold', color: '#FFFFFF' }}>{match.team2_score}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', padding: '0.5rem 1.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
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

            <footer style={{ textAlign: 'center', padding: '3rem 0 1rem 0', color: 'rgba(5, 22, 56, 0.5)', fontSize: '0.8rem' }}>
                Presentado por Michelob Ultra
            </footer>
        </div>
    );
}

export default PublicScoreboardMichelob;
