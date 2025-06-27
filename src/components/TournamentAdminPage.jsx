import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, ShieldPlus, Users, Save, AlertTriangle, Loader2, ChevronsUpDown, Gamepad2, Settings, BarChart2, X, ArrowRight, Trophy, Swords, MonitorPlay, ListOrdered } from 'lucide-react';
import { Link } from 'react-router-dom';
import.meta.env.VITE_API_URL;

// --- Componentes de UI Reutilizables ---
const Card = ({ children, title, icon: Icon, titleClassName = 'text-cyan-400', extraHeaderContent }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className={`text-lg font-semibold flex items-center ${titleClassName}`}>
                {Icon && <Icon className="mr-3 h-5 w-5" />}
                {title}
            </h3>
            {extraHeaderContent}
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const TabButton = ({ tabName, label, icon: Icon, activeTab, setActiveTab }) => (
    <button onClick={() => setActiveTab(tabName)} className={`flex items-center px-5 py-3 text-sm font-medium transition-colors ${activeTab === tabName ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white border-b-2 border-transparent'}`}>
        <Icon className="mr-2 h-5 w-5" />{label}
    </button>
);

// --- MODAL PARA GESTIONAR PARTIDO ---
const MatchManagementModal = ({ matchData, courts, onClose, onSave, isSaving }) => {
    const [courtId, setCourtId] = useState(matchData.court_id || '');
    const isLinkActive = matchData.status !== 'pendiente';

    if (!matchData) return null;

    const handleSaveAndActivate = () => {
        if (!courtId) { alert("Por favor, selecciona una cancha."); return; }
        onSave(matchData.id, { 
            court_id: parseInt(courtId, 10),
            status: matchData.status === 'pendiente' ? 'asignado' : matchData.status
        });
    };

    if (matchData.status === 'finalizado') {
        return (
             <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-md relative">
                    <button onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-white"><X size={20} /></button>
                    <h2 className="text-xl font-bold text-cyan-400 mb-4">Resumen del Partido #{matchData.id}</h2>
                    <div className="bg-slate-900/50 p-4 rounded-lg space-y-3">
                        <div className="text-center"><span className="font-bold text-lg">{matchData.team1_name}</span><span className="font-bold text-2xl mx-2">{matchData.team1_score}</span><span className="text-slate-400">vs</span><span className="font-bold text-2xl mx-2">{matchData.team2_score}</span><span className="font-bold text-lg">{matchData.team2_name}</span></div>
                        <div className="text-center">
                            {matchData.winner_id === matchData.team1_id && <span className="text-amber-400 font-bold">🏆 Ganador: {matchData.team1_name}</span>}
                            {matchData.winner_id === matchData.team2_id && <span className="text-amber-400 font-bold">🏆 Ganador: {matchData.team2_name}</span>}
                        </div>
                        <p className="text-sm text-slate-300"><strong>Categoría:</strong> {matchData.category}</p><p className="text-sm text-slate-300"><strong>Cancha:</strong> {courts.find(c => c.id === matchData.court_id)?.name || 'N/A'}</p><p className="text-sm text-slate-300"><strong>Inicio:</strong> {matchData.start_time ? new Date(matchData.start_time).toLocaleTimeString() : 'N/A'}</p><p className="text-sm text-slate-300"><strong>Fin:</strong> {matchData.end_time ? new Date(matchData.end_time).toLocaleTimeString() : 'N/A'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-white"><X size={20}/></button>
                <h2 className="text-xl font-bold text-cyan-400 mb-4">Gestionar Partido #{matchData.id}</h2>
                <div className="space-y-4">
                    <p><span className="font-semibold">{matchData.team1_name}</span> vs <span className="font-semibold">{matchData.team2_name}</span></p>
                    <p className="text-sm text-slate-400">Categoría: {matchData.category}</p>
                    <div><label htmlFor="court-id" className="block text-sm font-medium text-slate-300">Asignar Cancha</label><select id="court-id" value={courtId} onChange={e => setCourtId(e.target.value)} className="mt-1 w-full bg-slate-700 p-2 rounded-md border border-slate-600"><option value="">-- Selecciona una Cancha --</option>{courts.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
                    <p className="text-sm">Estado: <span className="font-semibold px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded-full">{matchData.status}</span></p>
                    {isLinkActive ? (<Link to={`/match/${matchData.id}`} target="_blank" className="block w-full text-center bg-blue-600 hover:bg-blue-700 p-3 rounded-md font-semibold transition-colors">Ir al Scorekeeper</Link>) : (<button disabled className="block w-full text-center bg-slate-600 p-3 rounded-md font-semibold cursor-not-allowed">Asigne una cancha para activar</button>)}
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-md text-sm" disabled={isSaving}>Cerrar</button>
                    <button onClick={handleSaveAndActivate} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-semibold flex items-center" disabled={isSaving}>
                        {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        {isSaving ? 'Guardando...' : 'Guardar y Activar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- PESTAÑA 2: GESTIÓN DE TORNEO ---
const GestionTorneoTab = () => {
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRows, setExpandedRows] = useState({});
    const [modalData, setModalData] = useState(null);
    const [eliminationCount, setEliminationCount] = useState({});
    const [showTiebreakers, setShowTiebreakers] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    // Función para cargar todos los datos
    const fetchData = async () => {
        try {
            setLoading(true);
            const [matchesRes, courtsRes, teamsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/matches/scoreboard`),
                fetch(`${import.meta.env.VITE_API_URL}/api/courts`),
                fetch(`${import.meta.env.VITE_API_URL}/api/teams`)
            ]);
            if (!matchesRes.ok || !courtsRes.ok || !teamsRes.ok) throw new Error('No se pudieron cargar los datos.');
            
            const matchesData = await matchesRes.json();
            const courtsData = await courtsRes.json();
            const teamsData = await teamsRes.json();

            setMatches(matchesData);
            setCourts(courtsData);
            setTeams(teamsData);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Carga inicial de datos y configuración de WebSocket
    useEffect(() => {
        fetchData();

        const socket = new WebSocket($import.meta.env.VITE_API_URL.replace(/^http/, 'ws'));
        socket.onopen = () => console.log("Tablero de Gestión conectado al WebSocket.");
        
        socket.onmessage = (event) => {
            try {
                const updatedData = JSON.parse(event.data);
                if (updatedData.type === 'SCORE_UPDATE') {
                    let wasFinalized = false;
                    
                    setMatches(prevMatches => {
                        return prevMatches.map(m => {
                            if (m.id === parseInt(updatedData.matchId, 10)) {
                                if (updatedData.payload.status === 'finalizado' && m.status !== 'finalizado') {
                                    wasFinalized = true;
                                }
                                return { ...m, ...updatedData.payload };
                            }
                            return m;
                        });
                    });

                    // Si un partido se finalizó, recarga los datos de los equipos
                    if (wasFinalized) {
                        fetch(`${import.meta.env.VITE_API_URL}/api/teams`)
                            .then(res => res.json())
                            .then(setTeams)
                            .catch(err => console.error("Error al recargar equipos:", err));
                    }
                }
            } catch (error) {
                console.error('Error al procesar mensaje del WebSocket:', error);
            }
        };

        socket.onclose = () => console.log("Tablero de Gestión desconectado.");
        return () => socket.close();
    }, []);
    
        const handleSaveMatch = async (matchId, updateData) => {
        setIsSaving(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/${matchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.msg || "Error al guardar el partido");
            }
            const updatedMatchFromServer = await response.json();
            setMatches(prevMatches =>
                prevMatches.map(m => m.id === matchId ? { ...m, ...updatedMatchFromServer } : m)
            );
            setModalData(prevModalData => ({ ...prevModalData, ...updatedMatchFromServer }));
        } catch (err) {
            console.error("Error al guardar el partido:", err);
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateTiebreakers = async (tiedTeams, category) => {
        const team_ids = tiedTeams.map(t => t.id);
        setIsSaving(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/generate-tiebreakers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_ids, category, tournament_id: 1 }) // Asumimos un tournament_id por ahora
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Error al generar juegos de desempate.');
            }
            alert('Juegos de desempate generados. La tabla se actualizará.');
            await fetchData(); // Recarga todos los datos para incluir los nuevos partidos
        } catch(err) {
            alert(err.message);
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const matchesByGroup = useMemo(() => matches.reduce((acc, match) => { const group = match.group_id; if (group && !match.is_tiebreaker) { if (!acc[group]) acc[group] = []; acc[group].push(match); } return acc; }, {}), [matches]);
    
    const calculateStats = (matches, teamId) => {
        return matches.reduce((acc, match) => {
            if (match.status !== 'finalizado') return acc;
            const isTeam1 = match.team1_id === teamId;
            const myScore = isTeam1 ? match.team1_score : match.team2_score;
            const opponentScore = isTeam1 ? match.team2_score : match.team1_score;
            if (myScore > opponentScore) { acc.G += 1; } else { acc.P += 1; }
            acc.GF += myScore; acc.GC += opponentScore;
            return acc;
        }, { G: 0, P: 0, GF: 0, GC: 0 });
    };

    const tiebreakerInfo = useMemo(() => {
        const tiebreakers = {};
        const teamsWithPoints = teams.map(team => ({...team, tournament_points: team.tournament_points || 0}));
        const teamsByGroup = teamsWithPoints.reduce((acc, team) => {
            const group = team.groupId;
            if (group) { if (!acc[group]) acc[group] = []; acc[group].push(team); }
            return acc;
        }, {});
        for (const groupId in teamsByGroup) {
            const groupTeams = teamsByGroup[groupId];
            const pointsMap = groupTeams.reduce((acc, team) => {
                const points = team.tournament_points;
                if (!acc[points]) acc[points] = [];
                acc[points].push(team);
                return acc;
            }, {});
            tiebreakers[groupId] = Object.values(pointsMap).filter(teams => teams.length > 1 && teams[0].tournament_points > 0);
        }
        return tiebreakers;
    }, [teams]);

    const toggleRow = (teamId) => setExpandedRows(prev => ({ ...prev, [teamId]: !prev[teamId] }));
    
    if (loading) return <div className="flex justify-center items-center p-10 text-slate-400"><Loader2 className="animate-spin h-8 w-8" /> <span className="ml-3">Cargando partidos...</span></div>;
    if (error) return <div className="text-red-400 text-center p-10 bg-red-900/20 rounded-lg">{error}</div>;

    return (
        <div className="space-y-8">
            {modalData && <MatchManagementModal matchData={modalData} courts={courts} onClose={() => setModalData(null)} onSave={handleSaveMatch} />}
            {Object.keys(matchesByGroup).length > 0 ? Object.entries(matchesByGroup).map(([groupId, groupMatches]) => {
                 const groupTeams = [...new Map(groupMatches.flatMap(m => [[m.team1_id, {id: m.team1_id, name: m.team1_name}], [m.team2_id, {id: m.team2_id, name: m.team2_name}]])).values()].sort((a,b) => a.id - b.id);
                 
                 const groupStandings = groupTeams
                    .map(team => {
                        const teamData = teams.find(t => t.id === team.id) || {};
                        const teamStats = calculateStats(groupMatches, team.id);
                        return { ...team, stats: teamStats, tournament_points: teamData.tournament_points || 0 };
                    })
                    .sort((a,b) => b.tournament_points - a.tournament_points || (b.stats.GF - b.stats.GC) - (a.stats.GF - a.stats.GC));

                const numToEliminate = eliminationCount[groupId] || 0;
                const eliminatedTeamIds = (numToEliminate > 0) ? groupStandings.slice(-numToEliminate).map(t => t.id) : [];
                const groupLetter = String.fromCharCode(64 + parseInt(groupId));

                return (
                    <Card key={groupId} title={`Round Robin - Grupo ${groupLetter}`} icon={BarChart2}
                        extraHeaderContent={<div className="flex items-center gap-2 text-sm"><label htmlFor={`elim-${groupId}`} className="text-slate-400">Eliminar últimos:</label><input id={`elim-${groupId}`} type="number" min="0" max={groupTeams.length -1} value={eliminationCount[groupId] || 0} onChange={(e) => setEliminationCount({...eliminationCount, [groupId]: parseInt(e.target.value, 10) || 0})} className="w-16 bg-slate-700 p-1 rounded text-center border border-slate-600"/></div>}
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm table-fixed">
                                <thead className="bg-slate-700/50">
                                    <tr className="border-b border-slate-600">
                                        <th className="p-3 font-semibold text-slate-300 w-[220px]">Equipo</th>
                                        {groupTeams.map(team => <th key={team.id} className="p-3 font-semibold text-slate-300 text-center" title={team.name}>vs {team.name.substring(0,3).toUpperCase()}</th>)}
                                        <th className="p-3 font-semibold text-slate-300 text-center w-16">G/P</th>
                                        <th className="p-3 font-semibold text-slate-300 text-center w-24">Pts (F/C)</th>
                                        <th className="p-3 font-semibold text-slate-300 text-center w-20">Dif.</th>
                                        <th className="p-3 font-semibold text-slate-300 text-center w-28">Puntos Torneo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupTeams.map(team => {
                                        const teamStats = calculateStats(groupMatches, team.id);
                                        const teamData = teams.find(t => t.id === team.id) || {};
                                        const isEliminated = eliminatedTeamIds.includes(team.id);

                                        return(
                                        <React.Fragment key={team.id}>
                                            <tr className={`border-b border-slate-700 transition-colors ${isEliminated ? 'bg-red-900/40' : 'hover:bg-slate-800/50'}`}>
                                                <td className="p-3 font-semibold cursor-pointer" onClick={() => toggleRow(team.id)}>
                                                    <div className="text-base">{team.name}</div>
                                                    <div className="text-xs text-slate-400 font-normal flex items-center">Desplegar Partidos <ChevronsUpDown size={14} className={`inline-block ml-1 transition-transform ${expandedRows[team.id] ? 'rotate-180' : ''}`} /></div>
                                                </td>
                                                {groupTeams.map(opponent => {
                                                    if (opponent.id === team.id) return <td key={opponent.id} className="p-1 bg-slate-700/30 text-center align-middle">-</td>;
                                                    const relevantMatches = groupMatches.filter(m => m.status === 'finalizado' && ((m.team1_id === team.id && m.team2_id === opponent.id) || (m.team1_id === opponent.id && m.team2_id === team.id)));
                                                    const gamesWon = relevantMatches.filter(m => m.winner_id === team.id).length;
                                                    return <td key={opponent.id} className="p-1 text-center font-mono text-base align-middle">{relevantMatches.length > 0 ? `${gamesWon}/${relevantMatches.length}`: '-'}</td>;
                                                })}
                                                <td className="p-3 text-center font-mono align-middle">{teamStats.G}/{teamStats.P}</td>
                                                <td className="p-3 text-center font-mono align-middle">{teamStats.GF}/{teamStats.GC}</td>
                                                <td className="p-3 text-center font-semibold text-lg align-middle">{teamStats.GF - teamStats.GC}</td>
                                                <td className="p-3 text-center font-semibold text-lg text-cyan-400 align-middle">{teamData.tournament_points || 0}</td>
                                            </tr>
                                            {expandedRows[team.id] && (
                                                <tr className="bg-slate-900/70"><td colSpan={groupTeams.length + 5} className="p-0">
                                                    <table className="w-full text-xs"><tbody>
                                                        {['Avanzado', 'Intermedio Fuerte', 'Intermedio'].map(category => {
                                                            const categoryMatches = groupMatches.filter(m => m.category === category && (m.team1_id === team.id || m.team2_id === team.id));
                                                            return (
                                                                <tr key={category} className="border-t border-slate-800">
                                                                    <td className="p-2 font-bold text-left text-slate-400 w-[220px]">{category}</td>
                                                                    {groupTeams.map(opponent => {
                                                                        if (opponent.id === team.id) return <td key={opponent.id} className="p-2 text-center">-</td>;
                                                                        const match = categoryMatches.find(m => (m.team1_id === team.id && m.team2_id === opponent.id) || (m.team1_id === opponent.id && m.team2_id === team.id));
                                                                        const score1 = match ? (match.team1_id === team.id ? match.team1_score : match.team2_score) : '-';
                                                                        const score2 = match ? (match.team1_id === team.id ? match.team2_score : match.team1_score) : '-';
                                                                        return ( <td key={opponent.id} className="p-1 text-center">{match ? (<div onClick={() => setModalData(match)} className="bg-slate-800 hover:bg-slate-700 rounded-md p-2 cursor-pointer relative font-mono text-base">{`${score1 ?? '-'}/${score2 ?? '-'}`}<span className="absolute bottom-0 right-1 text-[8px] text-slate-500">ID:{match.id}</span></div>) : '-'}</td> )
                                                                    })}
                                                                    <td colSpan="4" className="w-[248px]"></td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody></table>
                                                </td></tr>
                                            )}
                                        </React.Fragment>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )
            }) : ( <Card title="Gestión de Torneo" icon={Gamepad2}><div className="text-center text-slate-400 py-8"><p>No se encontraron partidos.</p></div></Card> )}
            
             <Card title="Juegos de Desempate (Tie-Breaks)" icon={Swords} titleClassName="text-amber-400">
                <button onClick={() => setShowTiebreakers(!showTiebreakers)} className="text-sm text-slate-300 flex items-center">{showTiebreakers ? 'Ocultar Desempates' : 'Mostrar Desempates'} <ChevronsUpDown size={16} className="ml-2" /></button>
                {showTiebreakers && (
                    <div className="mt-4 space-y-4">
                        {Object.entries(tiebreakerInfo).map(([groupId, ties]) => (
                            ties.length > 0 && (
                                <div key={groupId}>
                                    <h4 className="font-bold mb-2">Grupo {String.fromCharCode(64 + parseInt(groupId))}</h4>
                                    {ties.map((tiedTeams, index) => (
                                        <div key={index} className="bg-slate-900/50 p-3 rounded-lg mb-2">
                                            <p className="text-sm font-semibold">Empate en {tiedTeams[0].tournament_points} puntos entre: <span className="text-amber-400">{tiedTeams.map(t => t.name).join(', ')}</span></p>
                                            <div className="mt-2 text-xs space-y-1">
                                                <p className="font-bold">Generar partidos de desempate por categoría:</p>
                                                <div className="flex gap-2">
                                                    {['Avanzado', 'Intermedio Fuerte', 'Intermedio'].map(category => (
                                                        <button key={category} onClick={() => handleGenerateTiebreakers(tiedTeams, category)} className="bg-rose-600 hover:bg-rose-700 px-3 py-1 rounded-md text-xs">{category}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ))}
                         {Object.values(tiebreakerInfo).every(v => v.length === 0) && <p className="text-sm text-slate-500">No hay empates que requieran desempate en este momento.</p>}
                    </div>
                )}
             </Card>
        </div>
    );
};


// --- PESTAÑA 1: CONFIGURACIÓN DE TORNEO ---
const ConfiguracionTab = ({ onGenerationComplete }) => {
    // ... Código de la pestaña de configuración (se omite por brevedad) ...
    const [players, setPlayers] = useState([]); const [teams, setTeams] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(null); const [newPlayer, setNewPlayer] = useState({ fullName: '', email: '', category: 'Intermedio' }); const [newTeamName, setNewTeamName] = useState(''); const [numberOfGroups, setNumberOfGroups] = useState(2);
    useEffect(() => { const fetchData = async () => { try { setLoading(true); const [playersResponse, teamsResponse] = await Promise.all([fetch(`${import.meta.env.VITE_API_URL}/api/players`), fetch(`${import.meta.env.VITE_API_URL}/api/teams`)]); if (!playersResponse.ok || !teamsResponse.ok) throw new Error('Error al cargar datos.'); const playersData = await playersResponse.json(); const teamsData = await teamsResponse.json(); setPlayers(playersData); setTeams(teamsData); setError(null); } catch (err) { setError(err.message); console.error(err); } finally { setLoading(false); } }; fetchData(); }, []);
    const handleAddPlayer = async (e) => { e.preventDefault(); if (!newPlayer.fullName || !newPlayer.email) return; try { const response = await fetch(`${import.meta.env.VITE_API_URL}/api/players`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: newPlayer.fullName, email: newPlayer.email, category: newPlayer.category, }), }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.msg || 'Error al registrar jugador.'); } const addedPlayer = await response.json(); setPlayers([...players, addedPlayer]); setNewPlayer({ fullName: '', email: '', category: 'Intermedio' }); } catch (err) { console.error(err); alert(err.message); } };
    const handleAddTeam = async (e) => { e.preventDefault(); if (!newTeamName) return; try { const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTeamName, tournament_id: 1 }), }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.msg || 'Error al registrar equipo.'); } const addedTeam = await response.json(); setTeams([...teams, addedTeam]); setNewTeamName(''); } catch (err) { console.error(err); alert(err.message); } };
    const handleSaveGroups = async () => { const groupAssignments = teams.map(team => ({ id: team.id, group_id: team.groupId })); try { const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teams/assign-groups`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(groupAssignments) }); if (!response.ok) throw new Error('Error al guardar los grupos.'); alert('Grupos guardados exitosamente!'); } catch (err) { console.error(err); alert(err.message); } };
    const handleAssignTeamToPlayer = (playerId, teamId) => { setPlayers(players.map(p => p.id === playerId ? { ...p, teamId: teamId ? parseInt(teamId, 10) : null } : p)); };
    const handleAssignGroupToTeam = (teamId, groupId) => { setTeams(teams.map(t => t.id === teamId ? { ...t, groupId: groupId ? parseInt(groupId, 10) : null } : t)); };
    const getGroupLetter = (id) => id ? String.fromCharCode(64 + id) : null;
    const groupOptions = useMemo(() => Array.from({ length: numberOfGroups }, (_, i) => i + 1), [numberOfGroups]);
    const idealTeamsPerGroup = useMemo(() => numberOfGroups > 0 ? Math.ceil(teams.length / numberOfGroups) : 0, [teams.length, numberOfGroups]);
    const groupSummary = useMemo(() => { const summary = {}; groupOptions.forEach(groupNum => { const groupLetter = getGroupLetter(groupNum); if (groupLetter) { summary[groupLetter] = teams.filter(t => t.groupId === groupNum).map(t => t.name); }}); return summary; }, [teams, groupOptions]);
    const teamsPerGroup = useMemo(() => { const counts = {}; groupOptions.forEach(groupNum => { counts[groupNum] = teams.filter(t => t.groupId === groupNum).length; }); return counts; }, [teams, groupOptions]);
    const categoryValidation = useMemo(() => { const validation = {}; teams.forEach(team => { const teamPlayers = players.filter(p => p.teamId === team.id); const categoryCount = teamPlayers.reduce((acc, player) => { acc[player.category] = (acc[player.category] || 0) + 1; return acc; }, {}); validation[team.id] = { isValid: Object.values(categoryCount).every(count => count <= 2), counts: categoryCount }; }); return validation; }, [players, teams]);
    const handleSaveAndGenerateMatches = async () => { try { setLoading(true); await handleSaveGroups(); const playerAssignments = players.map(player => ({ player_id: player.id, team_id: player.teamId })); await fetch(`${import.meta.env.VITE_API_URL}/api/players/assign-teams`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(playerAssignments) }); const generateResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/generate-round-robin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tournament_id: 1 }) }); if (!generateResponse.ok) throw new Error('Error en el servidor al generar los partidos.'); alert('¡Asignaciones guardadas y partidos generados exitosamente!'); onGenerationComplete(); } catch (err) { console.error(err); alert(err.message); } finally { setLoading(false); } };
    if (loading) return <div className="flex justify-center items-center p-10 text-slate-400"><Loader2 className="animate-spin h-8 w-8" /> <span className="ml-3">Cargando datos...</span></div>;
    if (error) return <div className="text-red-400 text-center p-10 bg-red-900/20 rounded-lg">{error}</div>;
    return ( <div className="space-y-8"><div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><Card title="Registrar Jugador" icon={UserPlus}><form onSubmit={handleAddPlayer} className="space-y-4"><input required type="text" placeholder="Nombre Completo" value={newPlayer.fullName} onChange={(e) => setNewPlayer({...newPlayer, fullName: e.target.value})} className="w-full bg-slate-700 p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none" /><input required type="email" placeholder="Email del Jugador" value={newPlayer.email} onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})} className="w-full bg-slate-700 p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none" /><select value={newPlayer.category} onChange={(e) => setNewPlayer({...newPlayer, category: e.target.value})} className="w-full bg-slate-700 p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"><option>Intermedio</option><option>Intermedio Fuerte</option><option>Avanzado</option></select><button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-md flex items-center justify-center font-semibold transition-colors">Registrar</button></form></Card><Card title="Registrar Equipo" icon={ShieldPlus}><form onSubmit={handleAddTeam} className="space-y-4"><input required type="text" placeholder="Nombre del Equipo" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="w-full bg-slate-700 p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none" /><button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-md flex items-center justify-center font-semibold transition-colors">Registrar</button></form></Card></div><Card title="Asignación de Grupos (Round Robin)" icon={Users}><div className="bg-slate-900/50 p-4 rounded-md mb-4 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-300"><p><strong>{teams.length}</strong> equipos registrados.</p><div className="flex items-center gap-2"><label>Crear</label><input type="number" min="1" max="10" value={numberOfGroups} onChange={(e) => setNumberOfGroups(parseInt(e.target.value))} className="w-16 bg-slate-700 p-2 rounded text-center border border-slate-600"/><label>grupos.</label></div><p>Equipos por grupo (ideal): <strong>{idealTeamsPerGroup > 0 ? `~${idealTeamsPerGroup.toFixed(1)}` : 'N/A'}</strong></p></div><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-700/50"><tr className="border-b border-slate-600"><th className="p-3 text-sm font-semibold text-slate-300">Equipo</th><th className="p-3 text-sm font-semibold text-slate-300">Grupo Asignado</th><th className="p-3 text-sm font-semibold text-slate-300">Estado</th></tr></thead><tbody>{teams.map(team => (<tr key={team.id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors"><td className="p-3">{team.name}</td><td className="p-3"><select value={team.groupId || ''} onChange={(e) => handleAssignGroupToTeam(team.id, e.target.value)} className="bg-slate-700 p-2 rounded border border-slate-600"><option value="">Sin Grupo</option>{groupOptions.map(gNum => <option key={gNum} value={gNum}>Grupo {getGroupLetter(gNum)}</option>)}</select></td><td className="p-3">{team.groupId && teamsPerGroup[team.groupId] > idealTeamsPerGroup && (<span className="text-yellow-400 flex items-center text-xs"><AlertTriangle size={14} className="mr-1" /> Sobrecargado</span>)}</td></tr>))}</tbody></table></div><div className="mt-6 flex justify-end"><button onClick={handleSaveGroups} className="bg-green-600 hover:bg-green-700 p-3 px-6 rounded-md flex items-center font-semibold transition-colors"><Save className="mr-2 h-5 w-5" /> Guardar Grupos</button></div></Card><Card title="Asignación de Jugadores a Equipos" icon={UserPlus}><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-700/50"><tr className="border-b border-slate-600"><th className="p-3 text-sm font-semibold text-slate-300">Jugador</th><th className="p-3 text-sm font-semibold text-slate-300">Categoría</th><th className="p-3 text-sm font-semibold text-slate-300">Email</th><th className="p-3 text-sm font-semibold text-slate-300">Asignar Equipo</th><th className="p-3 text-sm font-semibold text-slate-300">Grupo</th><th className="p-3 text-sm font-semibold text-slate-300">Validación</th></tr></thead><tbody>{players.map(player => { const assignedTeam = teams.find(t => t.id === player.teamId); const validationInfo = assignedTeam ? categoryValidation[assignedTeam.id] : null; const isInvalid = validationInfo && !validationInfo.isValid; return (<tr key={player.id} className={`border-b border-slate-700 hover:bg-slate-800 transition-colors ${isInvalid ? 'bg-red-900/20' : ''}`}><td className="p-3">{player.fullName}</td><td className="p-3">{player.category}</td><td className="p-3">{player.email}</td><td className="p-3"><select value={player.teamId || ''} onChange={(e) => handleAssignTeamToPlayer(player.id, e.target.value)} className="bg-slate-700 p-2 rounded border border-slate-600"><option value="">Sin Equipo</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></td><td className="p-3 font-mono">{assignedTeam?.groupId ? `Grupo ${getGroupLetter(assignedTeam.groupId)}` : '—'}</td><td className="p-3">{isInvalid && (<span className="text-red-400 flex items-center text-xs"><AlertTriangle size={14} className="mr-1" /> Límite excedido</span>)}</td></tr>)})}</tbody></table></div><div className="mt-6 flex justify-end"><button onClick={handleSaveAndGenerateMatches} className="bg-green-600 hover:bg-green-700 p-3 px-6 rounded-md flex items-center font-semibold transition-colors"><Save className="mr-2 h-5 w-5" /> Guardar Asignaciones y Generar Partidos</button></div></Card>
        </div>);
};

// --- PESTAÑA 4: STANDING ---
const StandingTab = ({ teams, matches, eliminationCount }) => {
    const calculateStats = (teamMatches, teamId) => {
        return teamMatches.reduce((acc, match) => {
            if (match.status !== 'finalizado') return acc;
            const isTeam1 = match.team1_id === teamId;
            const myScore = isTeam1 ? match.team1_score : match.team2_score;
            const opponentScore = isTeam1 ? match.team2_score : match.team1_score;
            if (myScore > opponentScore) acc.G += 1; else acc.P += 1;
            acc.GF += myScore; acc.GC += opponentScore;
            return acc;
        }, { G: 0, P: 0, GF: 0, GC: 0 });
    };

    const standingsByGroup = useMemo(() => {
        const getGroupLetter = (id) => id ? String.fromCharCode(64 + id) : null;
        const groups = {};
        const teamsWithData = teams.map(team => {
            const teamMatches = matches.filter(m => !m.is_tiebreaker && (m.team1_id === team.id || m.team2_id === team.id));
            const stats = calculateStats(teamMatches, team.id);
            return { ...team, stats, tournament_points: team.tournament_points || 0, diff: stats.GF - stats.GC };
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
    }, [teams, matches]);

    return (
        <div className="space-y-8">
            {standingsByGroup.map(group => {
                const numToEliminate = eliminationCount[group.teams[0].groupId] || 0;
                return (
                    <Card key={group.name} title={`Clasificación - ${group.name}`} icon={ListOrdered}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-700/50">
                                    <tr className="border-b border-slate-600">
                                        <th className="p-3 font-semibold text-slate-300 w-10 text-center">#</th>
                                        <th className="p-3 font-semibold text-slate-300">Equipo</th>
                                        <th className="p-3 font-semibold text-slate-300 text-center">G/P</th>
                                        <th className="p-3 font-semibold text-slate-300 text-center">Pts (F/C)</th>
                                        <th className="p-3 font-semibold text-slate-300 text-center">Dif.</th>
                                        <th className="p-3 font-semibold text-slate-300 text-center">Puntos Torneo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.teams.map((team, index) => {
                                        const isEliminated = numToEliminate > 0 && index >= group.teams.length - numToEliminate;
                                        return (
                                            <tr key={team.id} className={`border-b border-slate-700 transition-colors ${isEliminated ? 'bg-red-900/40 text-red-300' : ''}`}>
                                                <td className="p-3 text-center font-bold">{index + 1}</td>
                                                <td className="p-3 font-semibold text-base">{team.name}</td>
                                                <td className="p-3 text-center font-mono">{team.stats.G}/{team.stats.P}</td>
                                                <td className="p-3 text-center font-mono">{team.stats.GF}/{team.stats.GC}</td>
                                                <td className="p-3 text-center font-semibold text-lg">{team.diff}</td>
                                                <td className="p-3 text-center font-semibold text-lg text-cyan-400">{team.tournament_points}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )
            })}
        </div>
    );
};

// --- PESTAÑA 3: JUEGOS EN CURSO (DISEÑO ACTUALIZADO) ---
const JuegosEnCursoTab = () => {
    const [matches, setMatches] = useState([]);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [matchesResponse, courtsResponse] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/matches/scoreboard`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/courts`)
                ]);
                if (!matchesResponse.ok || !courtsResponse.ok) throw new Error('No se pudieron cargar los datos.');
                
                const matchesData = await matchesResponse.json();
                const courtsData = await courtsResponse.json();
                setMatches(matchesData);
                setCourts(courtsData);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const socket = new WebSocket(`${import.meta.env.VITE_API_URL.replace(/^http/, 'ws')}`);
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

    const matchesByCourt = useMemo(() => {
        const data = {};
        courts.forEach(court => {
            const courtMatches = matches.filter(m => m.court_id === court.id);
            data[court.id] = {
                name: court.name,
                live: courtMatches.filter(m => m.status === 'en_vivo'),
                upcoming: courtMatches.filter(m => m.status === 'asignado'),
                played: courtMatches.filter(m => m.status === 'finalizado').sort((a,b) => new Date(b.end_time) - new Date(a.end_time)).slice(0, 4)
            };
        });
        return data;
    }, [matches, courts]);
    
    if (loading) return <div className="flex justify-center items-center p-10 text-slate-400"><Loader2 className="animate-spin h-8 w-8" /> <span className="ml-3">Cargando estado de las canchas...</span></div>;
    if (error) return <div className="text-red-400 text-center p-10 bg-red-900/20 rounded-lg">{error}</div>;

    const ServiceDots = ({ isServingTeam, serverNum, isFirstServeOfGame }) => {
        const firstDotActive = isServingTeam;
        const secondDotActive = isServingTeam && !isFirstServeOfGame && serverNum === 1;
        return (
            <div className="flex gap-1.5">
                <div className={`w-3 h-3 rounded-full transition-all ${isServingTeam ? 'bg-yellow-400 shadow-[0_0_6px_yellow]' : 'bg-slate-600'}`}></div>
                <div className={`w-3 h-3 rounded-full transition-all ${secondDotActive ? 'bg-yellow-400 shadow-[0_0_6px_yellow]' : 'bg-slate-600'}`}></div>
            </div>
        );
    };

    const MatchCard = ({ match }) => {
        const winner = match.winner_id ? (match.winner_id === match.team1_id ? 'team1' : 'team2') : null;
        const isFirstServeOfGame = !match.first_side_out_done;
        return (
            <div className={`bg-slate-800 p-3 rounded-lg border border-slate-700`}>
                <div className="text-center text-xs font-bold text-cyan-400 mb-2">{match.category}</div>
                <div className="space-y-2">
                    {/* Team 1 Row */}
                    <div className={`flex items-center p-1 rounded-md ${winner === 'team1' ? 'bg-green-800/30' : ''}`}>
                        <div className="flex-grow">
                            <div className={`text-sm font-semibold ${winner === 'team1' ? 'text-amber-400' : ''}`}>
                                {winner === 'team1' && '🏆 '}{match.team1_name}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                                {match.team1_player1_name} / {match.team1_player2_name}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <ServiceDots isServingTeam={match.server_team_id === match.team1_id} serverNum={match.server_number} isFirstServeOfGame={isFirstServeOfGame} />
                           <div className="w-px h-8 bg-slate-600"></div>
                           <span className="font-mono font-bold text-xl w-8 text-right">{match.team1_score ?? '-'}</span>
                        </div>
                    </div>
                    {/* Team 2 Row */}
                    <div className={`flex items-center p-1 rounded-md ${winner === 'team2' ? 'bg-green-800/30' : ''}`}>
                        <div className="flex-grow">
                           <div className={`text-sm font-semibold ${winner === 'team2' ? 'text-amber-400' : ''}`}>
                               {winner === 'team2' && '� '}{match.team2_name}
                           </div>
                           <div className="text-xs text-slate-400 truncate">
                               {match.team2_player1_name} / {match.team2_player2_name}
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <ServiceDots isServingTeam={match.server_team_id === match.team2_id} serverNum={match.server_number} isFirstServeOfGame={isFirstServeOfGame} />
                           <div className="w-px h-8 bg-slate-600"></div>
                           <span className="font-mono font-bold text-xl w-8 text-right">{match.team2_score ?? '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const Section = ({ title, children }) => (
        <div>
            <h4 className="font-bold text-slate-400 text-sm mb-2 uppercase tracking-wider">{title}</h4>
            <div className="space-y-2">{children}</div>
        </div>
    );

    return (
        <div className="flex overflow-x-auto space-x-6 pb-4">
            {courts.map(court => {
                const data = matchesByCourt[court.id] || { live: [], upcoming: [], played: [] };
                return (
                    <div key={court.id} className="w-80 flex-shrink-0 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-lg text-center mb-4">{court.name}</h3>
                        <div className="space-y-6">
                            <Section title="En Vivo">
                                {data.live.length > 0 ? data.live.map(m => <MatchCard key={m.id} match={m} />) : <div className="bg-slate-800 h-24 flex items-center justify-center rounded-lg text-slate-500">VACIA</div>}
                            </Section>
                            <Section title="Próximos">
                                {data.upcoming.length > 0 ? data.upcoming.map(m => <MatchCard key={m.id} match={m} />) : <p className="text-xs text-slate-500 text-center">No hay juegos próximos.</p>}
                            </Section>
                            <Section title="Jugados Recientemente">
                               {data.played.length > 0 ? data.played.map(m => <MatchCard key={m.id} match={m} />) : <p className="text-xs text-slate-500 text-center">No hay juegos recientes.</p>}
                            </Section>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function TournamentAdminPage() {
    const [activeTab, setActiveTab] = useState('configuracion');
    const [eliminationCount, setEliminationCount] = useState({});
    const [allData, setAllData] = useState({ matches: [], teams: [], courts: [] });
    const [loading, setLoading] = useState(true);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const [matchesRes, courtsRes, teamsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/matches/scoreboard`),
                fetch(`${import.meta.env.VITE_API_URL}/api/courts`),
                fetch(`${import.meta.env.VITE_API_URL}/api/teams`)
            ]);
            if (!matchesRes.ok || !courtsRes.ok || !teamsRes.ok) throw new Error('No se pudieron cargar los datos.');
            
            const matchesData = await matchesRes.json();
            const courtsData = await courtsRes.json();
            const teamsData = await teamsRes.json();

            setAllData({ matches: matchesData, teams: teamsData, courts: courtsData });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleGenerationComplete = () => {
        fetchData(); // Recarga todos los datos después de generar partidos
        setActiveTab('gestion');
    };
    
    return (
        <div className="bg-slate-900 text-white min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-cyan-400">Panel de Control del Torneo</h1>
                <div className="flex border-b border-slate-700">
                    <TabButton tabName="configuracion" label="Configuración" icon={Settings} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabName="gestion" label="Gestión de Torneo" icon={Gamepad2} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabName="standing" label="Standing" icon={ListOrdered} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabName="juegos" label="Juegos en Curso" icon={MonitorPlay} activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
                <div className="pt-8">
                    {activeTab === 'configuracion' && <ConfiguracionTab onGenerationComplete={handleGenerationComplete} />}
                    {activeTab === 'gestion' && <GestionTorneoTab allData={allData} onEliminationCountChange={setEliminationCount} eliminationCount={eliminationCount} refreshData={fetchData} />}
                    {activeTab === 'standing' && <StandingTab teams={allData.teams} matches={allData.matches} eliminationCount={eliminationCount} />}
                    {activeTab === 'juegos' && <JuegosEnCursoTab />}
                </div>
            </div>
        </div>
    );
}
