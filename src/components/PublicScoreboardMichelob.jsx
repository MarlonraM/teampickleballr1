import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, Trophy, Server } from 'lucide-react'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

// --- Estilos Globales para la Página ---
const pageStyles = {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: '#051638', // Azul oscuro de Michelob
    color: '#FFFFFF',
    minHeight: '100vh',
    padding: '1rem',
};

// --- Componente de Anuncio Rediseñado ---
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
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        marginBottom: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    };

    if (announcement.type === 'game') {
        return (
            <div style={{...baseStyle, backgroundColor: '#FFFFFF', color: '#051638'}}>
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                    <Megaphone style={{ color: '#E51937' }} size={24} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginLeft: '0.75rem' }}>{announcement.courtName}</h3>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{announcement.team1Name} vs {announcement.team2Name}</p>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '-0.25rem' }}>{announcement.category}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem', textAlign: 'left' }}>
                        <div>
                            <p style={{ fontWeight: '600' }}>{announcement.team1Name}:</p>
                            <p style={{ color: '#333' }}>{(announcement.team1Players || []).join(' / ')}</p>
                        </div>
                        <div>
                            <p style={{ fontWeight: '600' }}>{announcement.team2Name}:</p>
                            <p style={{ color: '#333' }}>{(announcement.team2Players || []).join(' / ')}</p>
                        </div>
                    </div>
                </div>
                 <p style={{ textAlign: 'center', fontSize: '0.875rem', fontStyle: 'italic', marginTop: '1rem', color: '#051638' }}>
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
            {/* Header con el Logo */}
            <header style={{ textAlign: 'center', padding: '1rem 0' }}>
                <img src="https://www.michelobultra.com/content/dam/brand_michelobultra/logos/michelob-ultra-logo.svg" alt="Michelob Ultra" style={{ height: '40px', margin: '0 auto' }} />
            </header>
            
            {/* Contenedor de Anuncios */}
            <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {announcements.map(ann => (
                    <Announcement key={ann.id} announcement={ann} onExpire={() => removeAnnouncement(ann.id)} />
                ))}
            </div>

            {/* Contenido Principal */}
            <main style={{ paddingTop: '2rem' }}>
                <h1 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '2rem' }}>MARCADOR EN VIVO</h1>
                {matches.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                        {matches.map(match => (
                            <div key={match.id} style={{ backgroundColor: '#FFFFFF', color: '#051638', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                                <div style={{ backgroundColor: '#051638', color: 'white', padding: '0.75rem', textAlign: 'center' }}>
                                    <h2 style={{ fontWeight: 'bold' }}>{match.court_name || `CANCHA #${match.court_id}`}</h2>
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                        {/* Equipo 1 */}
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <p style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{match.team1_name}</p>
                                            <p style={{ fontSize: '0.8rem', color: '#666' }}>{match.team1_player1_name} / {match.team1_player2_name}</p>
                                        </div>
                                        {/* Marcador */}
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <span style={{ fontSize: '4rem', fontWeight: 'bold', color: '#E51937' }}>{match.team1_score}</span>
                                            <span style={{ fontSize: '2rem', margin: '0 1rem' }}>-</span>
                                            <span style={{ fontSize: '4rem', fontWeight: 'bold', color: '#E51937' }}>{match.team2_score}</span>
                                        </div>
                                        {/* Equipo 2 */}
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <p style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{match.team2_name}</p>
                                            <p style={{ fontSize: '0.8rem', color: '#666' }}>{match.team2_player1_name} / {match.team2_player2_name}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px solid #e0e0e0', paddingTop: '0.5rem' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#051638' }}>
                                            <Server size={16} />
                                            Sirve: {match.server_team_id === match.team1_id ? match.team1_name : match.team2_name} ({match.server_number})
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: '#FFFFFF', fontStyle: 'italic' }}>No hay partidos en vivo en este momento.</p>
                )}
            </main>

            {/* Footer */}
            <footer style={{ textAlign: 'center', padding: '2rem 0', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>
                Presentado por Michelob Ultra
            </footer>
        </div>
    );
}

export default PublicScoreboardMichelob;
