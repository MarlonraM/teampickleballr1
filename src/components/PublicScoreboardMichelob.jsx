import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Megaphone, Server, Trophy, Shield, Flame } from 'lucide-react'; 
const isMobile = window.innerWidth < 768;
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
            <div style={{...styles.announcementBar, ...styles.announcementBarGame}}>
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
        <div style={{...styles.announcementBar, ...styles.announcementBarGeneral}}>
            {announcement.text}
        </div>
    );
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

// --- Nuevo Componente para la vista de Standing ---
const StandingView = ({ styles }) => {
    const [tournaments, setTournaments] = useState([]);
    const [activeTournamentId, setActiveTournamentId] = useState(null);
    const [data, setData] = useState({ teams: [], matches: [] });
    const [loading, setLoading] = useState(true);

    const calculateStats = (teamMatches, teamId) => {
        return teamMatches.reduce((acc, match) => {
            if (match.status !== 'finalizado' || match.is_tiebreaker) return acc;
            const isTeam1 = match.team1_id === teamId;
            if (isTeam1) {
                acc.GF += match.team1_score || 0;
                acc.GC += match.team2_score || 0;
                acc.TournamentPoints += match.team1_tournament_points || 0;
            } else {
                acc.GF += match.team2_score || 0;
                acc.GC += match.team1_score || 0;
                acc.TournamentPoints += match.team2_tournament_points || 0;
            }
            if (match.winner_id === teamId) acc.G += 1; else acc.P += 1;
            return acc;
        }, { G: 0, P: 0, GF: 0, GC: 0, TournamentPoints: 0 });
    };

    const standingsByGroup = useMemo(() => {
        if (!teams || !matches) return [];
        const getGroupLetter = (id) => id ? String.fromCharCode(64 + id) : null;
        const groups = {};
        const teamsWithData = teams.map(team => {
            const teamMatches = matches.filter(m => !m.is_tiebreaker && (m.team1_id === team.id || m.team2_id === team.id));
            const stats = calculateStats(teamMatches, team.id);
            return { ...team, stats, diff: stats.GF - stats.GC, tournament_points: stats.TournamentPoints };
        });

        teamsWithData.forEach(team => {
            const groupKey = team.groupId;
            if (groupKey) {
                if (!groups[groupKey]) {
                    groups[groupKey] = { name: `Grupo ${getGroupLetter(groupKey)}`, teams: [] };
                }
                groups[groupKey].teams.push(team);
            }
        });

        for(const groupKey in groups) {
            groups[groupKey].teams.sort((a, b) => {
                if (b.tournament_points !== a.tournament_points) return b.tournament_points - a.tournament_points;
                if (b.diff !== a.diff) return b.diff - a.diff;
                return b.stats.GF - a.stats.GF;
            });
        }
        return Object.values(groups);
    }, [data.teams, data.matches]);
    
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/tournaments`)
            .then(res => res.json())
            .then(data => {
                setTournaments(data);
                if (data.length > 0) setActiveTournamentId(data[0].id);
                else setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!activeTournamentId) return;
        const fetchDataForTournament = async () => {
            setLoading(true);
            try {
                const [teamsRes, matchesRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/teams/${activeTournamentId}`),
                    fetch(`${API_BASE_URL}/api/matches/scoreboard/${activeTournamentId}`)
                ]);
                const teamsData = await teamsRes.json();
                const matchesData = await matchesRes.json();
                setData({ teams: teamsData, matches: matchesData });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDataForTournament();
    }, [activeTournamentId]);

    return (
        <div style={styles.mainContent}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <h1 style={{...styles.title, margin: 0}}>Tabla de Posiciones</h1>
                <select value={activeTournamentId || ''} onChange={(e) => setActiveTournamentId(e.target.value)} style={{backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '8px', padding: '8px'}}>
                    {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            {loading ? <div style={{textAlign: 'center'}}>Cargando...</div> :
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {standingsByGroup.map((group, groupIndex) => (
                    <div key={groupIndex} style={{...styles.matchCard, boxShadow: '0 10px 25px -5px rgba(5, 22, 56, 0.1)'}}>
                        <div style={{...styles.cardHeader, backgroundColor: '#E51937'}}>
                            <h2 style={styles.cardHeaderTitle}>{group.name}</h2>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #051638' }}>
                                    <th style={{...styles.tableHeader, width: '50px', textAlign: 'center'}}>#</th>
                                    <th style={styles.tableHeader}>Equipo</th>
                                    <th style={{...styles.tableHeader, textAlign: 'center'}}>G/P</th>
                                    <th style={{...styles.tableHeader, textAlign: 'center'}}>Dif.</th>
                                    <th style={{...styles.tableHeader, textAlign: 'center'}}>Pts.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {group.teams.map((team, index) => (
                                    <tr key={team.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{...styles.tableCell, textAlign: 'center', fontWeight: 'bold'}}>{index + 1}</td>
                                        <td style={styles.tableCell}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                {index === 0 && <img src="/icon1.png" alt="Líder" style={{height: '20px'}} />}
                                                {team.name}
                                            </div>
                                        </td>
                                        <td style={{...styles.tableCell, textAlign: 'center', fontFamily: 'monospace'}}>{team.stats.G}/{team.stats.P}</td>
                                        <td style={{...styles.tableCell, textAlign: 'center', fontWeight: 'bold'}}>{team.diff}</td>
                                        <td style={{...styles.tableCell, textAlign: 'center', fontWeight: 'bold', color: '#E51937'}}>{team.tournament_points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>}
        </div>
    );
};
function PublicScoreboardMichelob() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [view, setView] = useState('scoreboard'); // 'scoreboard' o 'standing'
    const [tournaments, setTournaments] = useState([]);
    const [activeTournamentId, setActiveTournamentId] = useState(null);
    const [allData, setAllData] = useState({ matches: [], teams: [] });

    const styles = {
        pageWrapper: { backgroundColor: '#051638', padding: '8px', minHeight: '100vh' },
        container: { fontFamily: "'Inter', sans-serif, sans-serif", backgroundColor: '#FFFFFF', color: '#051638', minHeight: 'calc(100vh - 16px)', borderRadius: '8px', position: 'relative', paddingTop: '80px' },
        header: { position: 'fixed', top: '0px', left: '0px', right: '0px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: '#051638', color: 'white', zIndex: 100},
        logo: { height: '24px' },
        hamburgerIcon: { width: '24px', height: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' },
        hamburgerLine: { width: '100%', height: '3px', backgroundColor: '#E51937', borderRadius: '2px' },
        announcementsContainer: { position: 'absolute', top: '90px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        mainContent: {
    padding: isMobile ? '0.5rem' : '1rem 2rem',
    fontSize: isMobile ? '0.85rem' : '1rem'
},
        title: {
    textAlign: 'center',
    fontSize: isMobile ? '1.25rem' : '1.75rem',
    fontWeight: '700',
    color: '#051638',
    marginBottom: '0.1rem',
    textTransform: 'uppercase',
    letterSpacing: '1px'
},
        grid: {
    display: 'grid',
    gridTemplateColumns: isMobile
        ? 'repeat(auto-fit, minmax(300px, 1fr))'
        : 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '1.5rem'
},
        
        matchCard: { backgroundColor: '#FFFFFF', color: '#051638', borderRadius: '1rem', border: '1px solid #e0e0e0', overflow: 'hidden', boxShadow: '0 10px 30px -15px rgba(5, 22, 56, 0.3)' },
        
        cardHeader: { backgroundColor: '#051638', color: 'white', padding: '0.5rem', textAlign: 'center' },
        
    cardHeaderTitle: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: isMobile ? '0.75rem' : '0.9rem',
},
        
        cardBody: {
    padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem'
},
        
        teamRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
        
        teamDetails: { textAlign: 'left' },
        
        playersName: {
    fontWeight: '600',
    fontSize: isMobile ? '0.9em' : '1em',
    color: '#051638'
        },
        teamName: { color: '#667', fontSize: '0.75em', fontWeight: 'normal', textTransform: 'uppercase' },
       
        rightSection: { display: 'flex', alignItems: 'center', gap: '1rem' },
        
       score: {
    fontFamily: "'Teko', sans-serif",
    fontSize: isMobile ? '4em' : '8em',  // ajustado para que no desborde en móviles
    fontWeight: 700,
    lineHeight: 1,
    color: '#E51937',
    minWidth: '50px',
    textAlign: 'right'
},

        cardFooter: { backgroundColor: 'rgba(5, 22, 56, 0.05)', color: '#666', padding: '0.5rem 1.5rem', textAlign: 'center', fontSize: '0.6rem' },
        
        serviceDotsContainer: { display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center' },
        serviceDot: { width: '10px', height: '10px', borderRadius: '50%', transition: 'all 0.3s ease' },
        serviceDotActive: { backgroundColor: '#FFB81C', boxShadow: '0 0 8px #FFB81C' },
        inactiveDotStyle: { backgroundColor: '#d1d5db' },
        divider: { height: '1px', backgroundColor: '#e0e0e0', border: 'none', margin: '0.75rem 0' },
        verticalDivider: { width: '1px', height: '35px', backgroundColor: '#e0e0e0' },
        footer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '2rem 0 1rem 0', color: 'rgba(5, 22, 56, 0.6)', fontSize: '0.9rem' },
        footerLogo: { height: '24px' },
        announcementBar: { width: '100%', maxWidth: '500px', padding: '1rem', borderRadius: '0.75rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', marginBottom: '1rem', border: '1px solid rgba(0, 0, 0, 0.05)'},
        announcementBarGeneral: { backgroundColor: '#E51937', color: 'white', fontWeight: 'bold', textAlign: 'center' },
        announcementBarGame: { backgroundColor: '#FFFFFF', color: '#051638', border: `2px solid #E51937` },
    };

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

    if (loading) return <div style={styles.container}>Cargando...</div>;
    if (error) return <div style={styles.container}>Error: {error}</div>;
   
    return (
        <div style={styles.pageWrapper}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <img src="/logoblanco.png" alt="Michelob Ultra" style={styles.logo} />
                    <div style={styles.navIcons}>
                         <select value={activeTournamentId || ''} onChange={(e) => setActiveTournamentId(e.target.value)} style={{backgroundColor: 'transparent', border: 'none', color: 'white', fontWeight: 'bold'}}>
                            {tournaments.map(t => <option key={t.id} value={t.id} style={{color: 'black'}}>{t.name}</option>)}
                        </select>
                         <Trophy size={24} style={{...styles.navIcon, color: view === 'standing' ? '#E51937' : 'white'}} onClick={() => setView('standing')} />
                         <Shield size={24} style={{...styles.navIcon, color: view === 'scoreboard' ? '#E51937' : 'white'}} onClick={() => setView('scoreboard')} />
                    </div>
                </header>
                
                <div style={styles.announcementsContainer}>
                    {announcements.map(ann => (
                        <Announcement key={ann.id} announcement={ann} onExpire={() => removeAnnouncement(ann.id)} styles={styles} />
                    ))}
                </div>
  {view === 'scoreboard' ? (
  <main style={{ ...styles.mainContent, paddingTop: 4 }}>
  <h1 style={{ ...styles.title, marginBottom: 1 }}>MARCADOR EN VIVO</h1>

  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 14,
    color: '#666',
    marginBottom: 1,
    marginTop: 0
  }}>
    Presentado por:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <img src="/emblem.png" alt="Michelob Ultra" style={{ height: 30, transform: 'scale(2.0)' }} />
  </div>

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
                  <p style={styles.playersName}>{match.team1_player1_name} / {match.team1_player2_name}</p>
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
                  <p style={styles.playersName}>{match.team2_player1_name} / {match.team2_player2_name}</p>
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
    <p style={{
      textAlign: 'center',
      color: '#051638',
      fontStyle: 'italic'
    }}>
      No hay partidos en vivo en este momento.
    </p>
  )}
</main>
) : (
                    <StandingView allData={allData} styles={styles} />
                )}

                <footer style={styles.footer}>
                    El consumo excesivo de alcohol es perjudicial para la salud ley 42-01.
                </footer>
            </div>
        </div>
    );
}

export default PublicScoreboardMichelob;
