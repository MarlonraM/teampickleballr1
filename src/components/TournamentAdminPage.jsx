import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { UserPlus, ShieldPlus, Users, Save, AlertTriangle, Loader2, ChevronsUpDown, Gamepad2, Settings, BarChart2, X, Trophy, Swords, MonitorPlay, ListOrdered, Clock, ExternalLink, Pencil, Megaphone, Send, Bell, Check, PlusCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import.meta.env.VITE_API_URL;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');
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

// --- Modales ---
const CreatePhaseModal = ({ isOpen, onClose, allTeams, tournaments, onCreate, isSaving }) => {
    const [step, setStep] = useState(1);
    const [creationType, setCreationType] = useState(null);
    const [tournamentName, setTournamentName] = useState("");
    const [phaseName, setPhaseName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [parentTournamentId, setParentTournamentId] = useState("");
    const [carryPoints, setCarryPoints] = useState(false);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [scoringFormat, setScoringFormat] = useState('traditional');
    const [gamesFormat, setGamesFormat] = useState('single_game');
    const [pointsToWin, setPointsToWin] = useState(11);

    const parentTournamentTeams = useMemo(() => {
        if (!parentTournamentId) return [];
        return allTeams.filter(t => t.tournament_id === parseInt(parentTournamentId));
    }, [parentTournamentId, allTeams]);

    useEffect(() => {
        setPointsToWin(scoringFormat === 'rally' ? 15 : 11);
    }, [scoringFormat]);
    
    const handleTeamToggle = (teamId) => {
        setSelectedTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
    };

    const handleCreate = () => {
        const finalPhaseName = creationType === 'new' ? `${tournamentName} - Round Robin` : phaseName;
        if (!finalPhaseName || !startDate || (creationType === 'phase' && selectedTeams.length === 0)) {
            alert("Por favor, completa todos los campos requeridos.");
            return;
        }
        onCreate({
            name: finalPhaseName,
            start_date: new Date(startDate).toISOString(),
            teams: creationType === 'new' ? allTeams : selectedTeams.map(id => allTeams.find(t => t.id === id)),
            carry_points: carryPoints,
            scoring_format: scoringFormat,
            games_format: gamesFormat,
            points_to_win: pointsToWin,
            parent_tournament_id: parentTournamentId || null,
        });
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-xl font-bold text-cyan-400 mb-4">Crear Torneo o Fase</h2>
                
                {step === 1 && (
                    <div className="flex gap-4">
                        <button onClick={() => { setCreationType('new'); setStep(2); }} className="flex-1 p-4 bg-slate-700 rounded-lg text-center hover:bg-slate-600">Crear Torneo Nuevo</button>
                        <button onClick={() => { setCreationType('phase'); setStep(2); }} className="flex-1 p-4 bg-slate-700 rounded-lg text-center hover:bg-slate-600">Crear Nueva Fase</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        {creationType === 'new' && (
                            <input type="text" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} placeholder="Nombre del Torneo" className="w-full bg-slate-700 p-2 rounded-md" />
                        )}
                        {creationType === 'phase' && (
                            <>
                                <select value={parentTournamentId} onChange={(e) => setParentTournamentId(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md">
                                    <option value="">Selecciona un Torneo Existente</option>
                                    {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <input type="text" value={phaseName} onChange={(e) => setPhaseName(e.target.value)} placeholder="Nombre de la nueva fase (ej. Semifinal)" className="w-full bg-slate-700 p-2 rounded-md" />
                                <div className="flex items-center"><input type="checkbox" id="carry-points" checked={carryPoints} onChange={(e) => setCarryPoints(e.target.checked)} className="mr-2" /><label htmlFor="carry-points">Arrastrar puntos de la fase anterior</label></div>
                                <div className="max-h-40 overflow-y-auto border border-slate-600 p-2 rounded-md">
                                    <p className="font-semibold mb-2">Seleccionar Equipos que Avanzan:</p>
                                    {parentTournamentTeams.map(team => (
                                        <div key={team.id} className="flex items-center">
                                            <input type="checkbox" id={`team-${team.id}`} checked={selectedTeams.includes(team.id)} onChange={() => handleTeamToggle(team.id)} className="mr-2" />
                                            <label htmlFor={`team-${team.id}`}>{team.name} ({team.tournament_points || 0} pts)</label>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <div><label className="block text-sm font-medium text-slate-300 mb-1">Fecha de Inicio de la Fase</label><input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" /></div>
                        
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                            <div><label className="text-sm">Formato</label><select value={scoringFormat} onChange={e => setScoringFormat(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md mt-1 text-sm"><option value="traditional">Tradicional</option><option value="rally">Rally Scoring</option></select></div>
                            <div><label className="text-sm">Juegos</label><select value={gamesFormat} onChange={e => setGamesFormat(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md mt-1 text-sm"><option value="single_game">1 Juego</option><option value="best_of_3">Mejor de 3</option></select></div>
                            <div><label className="text-sm">Puntos a Ganar</label><input type="number" value={pointsToWin} onChange={(e) => setPointsToWin(parseInt(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md mt-1 text-sm" /></div>
                        </div>

                        <div className="mt-6 flex justify-between">
                            <button onClick={() => setStep(1)} className="px-4 py-2 bg-slate-600 rounded-md">Atrás</button>
                            <button onClick={handleCreate} className="px-4 py-2 bg-green-600 rounded-md" disabled={isSaving}>Crear</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MODAL PARA EDITAR PUNTUACIÓN Y ESTADO ---
const EditScoreModal = ({ match, onClose, onSave, isSaving }) => {
    const [scores, setScores] = useState({
        team1: match.team1_score || 0,
        team2: match.team2_score || 0
    });
    // Nuevo estado para controlar si se está en modo de edición
    const [isEditing, setIsEditing] = useState(match.status !== 'finalizado');

    // Sincroniza el estado si el partido cambia
    useEffect(() => {
        setScores({
            team1: match.team1_score || 0,
            team2: match.team2_score || 0
        });
        setIsEditing(match.status !== 'finalizado');
    }, [match]);

    if (!match) return null;


    const handleScoreChange = (team, value) => {
        setScores(prev => ({ ...prev, [team]: parseInt(value, 10) || 0 }));
    };

    // --- FUNCIÓN handleSave MEJORADA ---
    const handleSave = () => {
        const score1 = scores.team1;
        const score2 = scores.team2;
        const maxScore = Math.max(score1, score2);
        const diff = Math.abs(score1 - score2);

        let updatePayload = {
            team1_score: score1,
            team2_score: score2,
        };

        // Si el partido estaba finalizado y la nueva puntuación ya no es válida para ganar,
        // se revierte el estado del partido a 'en_vivo' Y se eliminan los puntos.
        if (match.status === 'finalizado' && (maxScore < 11 || (maxScore >= 11 && diff < 2))) {
            alert("El marcador ya no es válido para un partido finalizado. El estado del partido ha sido revertido a 'Pendiente' y los puntos de torneo han sido anulados.");
            updatePayload.status = 'pendiente';
            updatePayload.winner_id = null;
            updatePayload.end_time = null;
            updatePayload.court_id = null;
            // --- CORRECCIÓN CLAVE ---
            // Se reinician los puntos de torneo para este partido.
            updatePayload.team1_tournament_points = 0;
            updatePayload.team2_tournament_points = 0;
        }
        
        onSave(match.id, updatePayload);
    };

    const handleFinalize = () => {
        const score1 = scores.team1;
        const score2 = scores.team2;
        const maxScore = Math.max(score1, score2);
        const diff = Math.abs(score1 - score2);

        if (maxScore < 11 || (maxScore >= 11 && diff < 2)) {
            alert('Puntuación inválida para finalizar. El ganador debe tener al menos 11 puntos y una ventaja de 2.');
            return;
        }
        
        if (window.confirm("¿Deseas marcar este partido como Finalizado? Esta acción es definitiva.")) {
            onSave(match.id, {
                team1_score: scores.team1,
                team2_score: scores.team2,
                status: 'finalizado'
            });
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white"><X size={20}/></button>
                <h2 className="text-xl font-bold text-cyan-400 mb-4">Editar Partido #{match.id}</h2>
                
                <div className="bg-slate-900/50 p-4 rounded-lg space-y-3">
                    <p className="text-center font-semibold">{match.team1_name} vs {match.team2_name}</p>
                    <div className="flex items-center justify-center gap-4">
                        <input type="number" value={scores.team1} onChange={(e) => handleScoreChange('team1', e.target.value)} className="w-24 p-2 text-center text-4xl font-bold bg-slate-700 rounded-md border-slate-600 border disabled:opacity-50" disabled={!isEditing} />
                        <span className="text-3xl font-bold text-slate-500">-</span>
                        <input type="number" value={scores.team2} onChange={(e) => handleScoreChange('team2', e.target.value)} className="w-24 p-2 text-center text-4xl font-bold bg-slate-700 rounded-md border-slate-600 border disabled:opacity-50" disabled={!isEditing} />
                    </div>
                     <p className="text-center text-sm">Estado Actual: <span className="font-bold">{match.status}</span></p>
                </div>

                {match.status === 'finalizado' && !isEditing ? (
                    <div className="mt-6 flex flex-col items-center gap-4">
                        <div className="text-center text-amber-400 font-bold text-lg">
                            🏆 Ganador: {match.winner_id === match.team1_id ? match.team1_name : match.team2_name}
                        </div>
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md font-semibold">Corregir Puntuación</button>
                    </div>
                ) : (
                    <div className="mt-6 flex justify-end gap-4">
                        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-semibold" disabled={isSaving}>Guardar Cambios</button>
                        <button onClick={handleFinalize} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-semibold" disabled={isSaving}>Marcar como Finalizado</button>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- MODAL PARA EDITAR PARTIDO/HORARIO ---
const ScheduleMatchModal = ({ match, courts, onClose, onSave, isSaving }) => {
    const [courtId, setCourtId] = useState(match.court_id || '');
    const [scheduledTime, setScheduledTime] = useState(
        match.scheduled_start_time ? new Date(match.scheduled_start_time).toISOString().substring(0, 16) : ''
    );

    const handleSave = () => {
        const updateData = {
            court_id: courtId ? parseInt(courtId, 10) : null,
            scheduled_start_time: scheduledTime ? new Date(scheduledTime).toISOString() : null,
        };
        onSave(match.id, updateData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white"><X size={20}/></button>
                <h2 className="text-xl font-bold text-cyan-400 mb-4">Programar Partido #{match.id}</h2>
                <div className="space-y-4">
                    <p><span className="font-semibold">{match.team1_name}</span> vs <span className="font-semibold">{match.team2_name}</span></p>
                    <p className="text-sm text-slate-400">Categoría: {match.category}</p>
                    <div><label htmlFor="court-select" className="block text-sm font-medium text-slate-300">Asignar Cancha</label><select id="court-select" value={courtId} onChange={e => setCourtId(e.target.value)} className="mt-1 w-full bg-slate-700 p-2 rounded-md border border-slate-600"><option value="">Pendiente</option>{courts.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
                    <div><label htmlFor="time-select" className="block text-sm font-medium text-slate-300">Asignar Hora</label><input type="datetime-local" id="time-select" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="mt-1 w-full bg-slate-700 p-2 rounded-md border border-slate-600" /></div>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-md text-sm" disabled={isSaving}>Cancelar</button>
                    <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-semibold" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Horario'}</button>
                </div>
            </div>
        </div>
    );
};




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

// --- PESTAÑA 1: PARTIDOS (NUEVA PESTAÑA PRINCIPAL) ---
const PartidosTab = ({ matches: initialMatches, courts, refreshData, setEditingMatch, openScheduleModal }) => {    
    const [matches, setMatches] = useState(initialMatches);
    const [filters, setFilters] = useState({ id: '', teams: '', players: '', category: '', status: '', court: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'ascending' });
    const [editingScore, setEditingScore] = useState(null);

    useEffect(() => {
        setMatches(initialMatches);
    }, [initialMatches]);

   const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredMatches = useMemo(() => {
        let sortableItems = [...initialMatches];

        // Filtrado
        sortableItems = sortableItems.filter(match => {
            const playerFilter = filters.players.toLowerCase();
            const playersString = [match.team1_player1_name, match.team1_player2_name, match.team2_player1_name, match.team2_player2_name]
                .filter(Boolean).join(' ').toLowerCase();

            return (
                match.id.toString().includes(filters.id) &&
                ((match.team1_name || '').toLowerCase().includes(filters.teams.toLowerCase()) || (match.team2_name || '').toLowerCase().includes(filters.teams.toLowerCase())) &&
                (playersString.includes(playerFilter)) &&
                ((match.category || '').toLowerCase().includes(filters.category.toLowerCase())) &&
                ((match.status || '').toLowerCase().includes(filters.status.toLowerCase())) &&
                (filters.court === '' || match.court_id === parseInt(filters.court))
            );
        });

        // Ordenación
        if (sortConfig.key !== null) {
            const statusOrder = { 'en_vivo': 1, 'asignado': 2, 'pendiente': 3, 'finalizado': 4 };
            
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                
                if (sortConfig.key === 'status') {
                    aValue = statusOrder[a.status] || 99;
                    bValue = statusOrder[b.status] || 99;
                } else if (sortConfig.key === 'scheduled_start_time') {
                    aValue = a.scheduled_start_time ? new Date(a.scheduled_start_time).getTime() : 0;
                    bValue = b.scheduled_start_time ? new Date(b.scheduled_start_time).getTime() : 0;
                }
                
                if (aValue < bValue) { return sortConfig.direction === 'ascending' ? -1 : 1; }
                if (aValue > bValue) { return sortConfig.direction === 'ascending' ? 1 : -1; }
                return 0;
            });
        }
        return sortableItems;
    }, [initialMatches, filters, sortConfig]);


    const SortableHeader = ({ sortKey, children, className = '' }) => {
        const isSorted = sortConfig.key === sortKey;
        const icon = isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕';
        return (
            <th className={`p-3 cursor-pointer select-none ${className}`} onClick={() => requestSort(sortKey)}>
                <div className="flex items-center gap-2">
                    {children} <span className="text-cyan-400">{icon}</span>
                </div>
            </th>
        );
    };

    const getStatusTag = (status) => {
        const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
        switch (status) {
            case 'finalizado': return <span className={`${baseClasses} bg-green-500/20 text-green-300`}>Finalizado</span>;
            case 'en_vivo': return <span className={`${baseClasses} bg-red-500/20 text-red-300`}>En Vivo</span>;
            case 'asignado': return <span className={`${baseClasses} bg-blue-500/20 text-blue-300`}>Asignado</span>;
            default: return <span className={`${baseClasses} bg-slate-600/50 text-slate-300`}>Pendiente</span>;
        }
    };
    
    const formatScheduledTime = (time) => {
        if (!time) return '-';
        return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleCourtChange = async (matchId, courtId) => {
        try {
            await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ court_id: courtId ? parseInt(courtId, 10) : null })
            });
            refreshData();
        } catch (error) {
            console.error("Error al asignar cancha:", error);
        }
    };

    return (
        <Card title="Lista Completa de Partidos" icon={ListOrdered}>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-700/50">
                        <tr>
                            <SortableHeader sortKey="id" className="w-16">ID</SortableHeader>
                            <th className="p-3 w-1/6">Equipos</th>
                            <th className="p-3 w-1/6">Jugadores</th>
                            <th className="p-3 w-28">Categoría</th>
                            <SortableHeader sortKey="status" className="w-28">Estado</SortableHeader>
                            <th className="p-3 w-32">Cancha</th>
                            <SortableHeader sortKey="scheduled_start_time" className="w-32">Hr. Prog.</SortableHeader>
                            <th className="p-3 w-28">Marcador</th>
                            <th className="p-3 w-32">Scorekeeper</th>
                        </tr>
                        <tr>
                            <th className="p-2"><input name="id" value={filters.id} onChange={handleFilterChange} placeholder="Filtrar..." className="w-full bg-slate-800 p-1 rounded-md border border-slate-600 text-xs"/></th>
                            <th className="p-2"><input name="teams" value={filters.teams} onChange={handleFilterChange} placeholder="Filtrar..." className="w-full bg-slate-800 p-1 rounded-md border border-slate-600 text-xs"/></th>
                            <th className="p-2"><input name="players" value={filters.players} onChange={handleFilterChange} placeholder="Filtrar..." className="w-full bg-slate-800 p-1 rounded-md border border-slate-600 text-xs"/></th>
                            <th className="p-2"><input name="category" value={filters.category} onChange={handleFilterChange} placeholder="Filtrar..." className="w-full bg-slate-800 p-1 rounded-md border border-slate-600 text-xs"/></th>
                            <th className="p-2"><input name="status" value={filters.status} onChange={handleFilterChange} placeholder="Filtrar..." className="w-full bg-slate-800 p-1 rounded-md border border-slate-600 text-xs"/></th>
                            <th className="p-2">
                                <select name="court" value={filters.court} onChange={handleFilterChange} className="w-full bg-slate-800 p-1 rounded-md border border-slate-600 text-xs">
                                    <option value="">Todas</option>
                                    {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </th>
                            <th colSpan="3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredMatches.map(match => (
                            <tr key={match.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                                <td className="p-3 font-mono">{match.id}</td>
                                <td className="p-3 font-semibold">{match.team1_name} vs {match.team2_name}</td>
                                <td className="p-3 text-slate-400 text-xs">
                                    <div>{match.team1_player1_name || 'N/A'} / {match.team1_player2_name || 'N/A'}</div>
                                    <div>{match.team2_player1_name || 'N/A'} / {match.team2_player2_name || 'N/A'}</div>
                                </td>
                                <td className="p-3">{match.category}</td>
                                <td className="p-3">{getStatusTag(match.status)}</td>
                                <td className="p-3">
                                    <select value={match.court_id || ''} onChange={(e) => handleCourtChange(match.id, e.target.value)} className="w-full bg-slate-700 p-1 rounded-md border border-slate-600 text-xs">
                                        <option value="">Sin Asignar</option>
                                        {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </td>
                                <td className="p-3">
                                    <div onClick={() => openScheduleModal(match)} className="bg-slate-700/50 hover:bg-slate-700 p-2 rounded-md cursor-pointer flex items-center justify-center gap-2 font-mono">
                                        <Clock size={14} />
                                        <span>{formatScheduledTime(match.scheduled_start_time)}</span>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2 font-mono">
                                        <span>{match.team1_score ?? '-'} / {match.team2_score ?? '-'}</span>
                                        <button onClick={() => setEditingMatch(match)} className="text-slate-400 hover:text-white">
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <Link to={`/match/${match.id}`} target="_blank">
                                        <button className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 rounded-md flex items-center gap-1"><ExternalLink size={14}/> Scorekeeper</button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};


// --- PESTAÑA 1: CONFIGURACIÓN DE TORNEO ---
const ConfiguracionPanel = ({ activeTournamentId, initialData, onGenerationComplete, refreshData, onClose }) => {
    const [players, setPlayers] = useState(initialData.players || []);
    const [teams, setTeams] = useState(initialData.teams || []);
    const [isSaving, setIsSaving] = useState(false);
    const [newPlayer, setNewPlayer] = useState({ fullName: '', email: '', category: 'Intermedio' });
    const [newTeamName, setNewTeamName] = useState('');
    const [numberOfGroups, setNumberOfGroups] = useState(2);
    const [schedulingMatch, setSchedulingMatch] = useState(null); // <-- Estado para el nuevo modal
     
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 
    
    useEffect(() => {
        console.log("✅ ConfiguracionPanel montado");
        console.log("📦 Datos iniciales:", initialData);
        console.log("🏆 ID del torneo activo:", activeTournamentId);
    }, []);

 
    // CORRECCIÓN: Se sincroniza el estado interno con los props que vienen del padre
  
useEffect(() => {
        setPlayers(initialData.players || []);
        setTeams(initialData.teams || []);
    }, [initialData]);

    useEffect(() => {
  if (initialData.players || initialData.teams) {
    setLoading(false);
  }
}, [initialData]);


        //useEffect(() => { 
        //    const fetchData = async () => { 
        //        try { setLoading(true); const [playersResponse, teamsResponse] = await Promise.all([fetch(`${import.meta.env.VITE_API_URL}/api/players`), fetch(`${import.meta.env.VITE_API_URL}/api/teams`)]); if (!playersResponse.ok || !teamsResponse.ok) throw new Error('Error al cargar datos.'); const playersData = await playersResponse.json(); const teamsData = await teamsResponse.json(); setPlayers(playersData); setTeams(teamsData); setError(null); } catch (err) { setError(err.message); console.error(err); } finally { setLoading(false); } }; fetchData(); }, []);
    const handleAddPlayer = async (e) => { e.preventDefault(); if (!newPlayer.fullName || !newPlayer.email) return; try { const response = await fetch(`${import.meta.env.VITE_API_URL}/api/players`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: newPlayer.fullName, email: newPlayer.email, category: newPlayer.category, }), }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.msg || 'Error al registrar jugador.'); } const addedPlayer = await response.json(); setPlayers([...players, addedPlayer]); setNewPlayer({ fullName: '', email: '', category: 'Intermedio' }); } catch (err) { console.error(err); alert(err.message); } };
    
    const handleAddTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName || !activeTournamentId) {
            alert("No hay un torneo activo seleccionado.");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTeamName, tournament_id: activeTournamentId }),
            });
            if (!response.ok) throw new Error('Error al registrar equipo.');
            onGenerationComplete(); // Llama a la función del padre para refrescar los datos
            setNewTeamName('');
        } catch (err) {
            alert(err.message);
        }
    };
    const handleSaveGroups = async () => { 
        const groupAssignments = teams.map(team => ({ id: team.id, group_id: team.groupId })); 
        try { 
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teams/assign-groups`, { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(groupAssignments) 
            }); 
            if (!response.ok) throw new Error('Error al guardar los grupos.'); 
            alert('Grupos guardados exitosamente!'); 
        } catch (err) { 
            console.error(err); 
            alert(err.message);
        } 
    };
         
    const handleSaveAndGenerateMatches = async () => {
        if (!activeTournamentId) {
            alert("Por favor, selecciona un torneo válido primero.");
            return;
        }
        try {
            setIsSaving(true);
            await handleSaveGroups();
            
            const generateResponse = await fetch(`${API_BASE_URL}/api/matches/generate-round-robin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournament_id: activeTournamentId })
            });

            if (!generateResponse.ok) throw new Error('Error en el servidor al generar los partidos.');
            alert('¡Partidos generados exitosamente!');
            onGenerationComplete();
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    
    const handleAssignGroupToTeam = (teamId, groupId) => { setTeams(teams.map(t => t.id === teamId ? { ...t, groupId: groupId ? parseInt(groupId, 10) : null } : t)); };
    const getGroupLetter = (id) => id ? String.fromCharCode(64 + id) : null;
    const groupOptions = useMemo(() => Array.from({ length: numberOfGroups }, (_, i) => i + 1), [numberOfGroups]);
    const idealTeamsPerGroup = useMemo(() => numberOfGroups > 0 ? Math.ceil(teams.length / numberOfGroups) : 0, [teams.length, numberOfGroups]);
    const groupSummary = useMemo(() => { const summary = {}; groupOptions.forEach(groupNum => { const groupLetter = getGroupLetter(groupNum); if (groupLetter) { summary[groupLetter] = teams.filter(t => t.groupId === groupNum).map(t => t.name); }}); return summary; }, [teams, groupOptions]);
    const teamsPerGroup = useMemo(() => { const counts = {}; groupOptions.forEach(groupNum => { counts[groupNum] = teams.filter(t => t.groupId === groupNum).length; }); return counts; }, [teams, groupOptions]);
    const categoryValidation = useMemo(() => { const validation = {}; teams.forEach(team => { const teamPlayers = players.filter(p => p.teamId === team.id); const categoryCount = teamPlayers.reduce((acc, player) => { acc[player.category] = (acc[player.category] || 0) + 1; return acc; }, {}); validation[team.id] = { isValid: Object.values(categoryCount).every(count => count <= 2), counts: categoryCount }; }); return validation; }, [players, teams]);
    const handleSaveAndGenerateMatches = async () => {
        if (!activeTournamentId) {
            alert("Por favor, selecciona un torneo válido primero.");
            return;
        }
        try {
            setIsSaving(true);
            const generateResponse = await fetch(`${API_BASE_URL}/api/matches/generate-round-robin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournament_id: activeTournamentId })
            });
            if (!generateResponse.ok) throw new Error('Error en el servidor al generar los partidos.');
            alert('¡Partidos generados exitosamente!');
            onGenerationComplete();
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };
  
    
    if (loading) return <div className="flex justify-center items-center p-10 text-slate-400"><Loader2 className="animate-spin h-8 w-8" /> <span className="ml-3">Cargando datos...</span></div>;
    if (error) return <div className="text-red-400 text-center p-10 bg-red-900/20 rounded-lg">{error}</div>;
    
    
    return ( 
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Registrar Jugador" icon={UserPlus}>
                    <form onSubmit={handleAddPlayer} className="space-y-4">
                        <input required type="text" placeholder="Nombre Completo" value={newPlayer.fullName} onChange={(e) => setNewPlayer({...newPlayer, fullName: e.target.value})} className="w-full bg-slate-700 p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none" />
                        <input required type="email" placeholder="Email del Jugador" value={newPlayer.email} onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})} className="w-full bg-slate-700 p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none" />
                        <select value={newPlayer.category} onChange={(e) => setNewPlayer({...newPlayer, category: e.target.value})} className="w-full bg-slate-700 p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"><option>Intermedio</option><option>Intermedio Fuerte</option><option>Avanzado</option></select><button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-md flex items-center justify-center font-semibold transition-colors">Registrar</button></form></Card><Card title="Registrar Equipo" icon={ShieldPlus}><form onSubmit={handleAddTeam} className="space-y-4"><input required type="text" placeholder="Nombre del Equipo" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="w-full bg-slate-700 p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none" /><button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-md flex items-center justify-center font-semibold transition-colors">Registrar</button></form></Card></div><Card title="Asignación de Grupos (Round Robin)" icon={Users}><div className="bg-slate-900/50 p-4 rounded-md mb-4 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-300"><p><strong>{teams.length}</strong> equipos registrados.</p><div className="flex items-center gap-2"><label>Crear</label><input type="number" min="1" max="10" value={numberOfGroups} onChange={(e) => setNumberOfGroups(parseInt(e.target.value))} className="w-16 bg-slate-700 p-2 rounded text-center border border-slate-600"/><label>grupos.</label></div><p>Equipos por grupo (ideal): <strong>{idealTeamsPerGroup > 0 ? `~${idealTeamsPerGroup.toFixed(1)}` : 'N/A'}</strong></p></div><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-700/50"><tr className="border-b border-slate-600"><th className="p-3 text-sm font-semibold text-slate-300">Equipo</th><th className="p-3 text-sm font-semibold text-slate-300">Grupo Asignado</th><th className="p-3 text-sm font-semibold text-slate-300">Estado</th></tr></thead><tbody>{teams.map(team => (<tr key={team.id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors"><td className="p-3">{team.name}</td><td className="p-3"><select value={team.groupId || ''} onChange={(e) => handleAssignGroupToTeam(team.id, e.target.value)} className="bg-slate-700 p-2 rounded border border-slate-600"><option value="">Sin Grupo</option>{groupOptions.map(gNum => <option key={gNum} value={gNum}>Grupo {getGroupLetter(gNum)}</option>)}</select></td><td className="p-3">{team.groupId && teamsPerGroup[team.groupId] > idealTeamsPerGroup && (<span className="text-yellow-400 flex items-center text-xs"><AlertTriangle size={14} className="mr-1" /> Sobrecargado</span>)}</td></tr>))}</tbody></table></div><div className="mt-6 flex justify-end"><button onClick={handleSaveGroups} className="bg-green-600 hover:bg-green-700 p-3 px-6 rounded-md flex items-center font-semibold transition-colors"><Save className="mr-2 h-5 w-5" /> Guardar Grupos</button></div></Card><Card title="Asignación de Jugadores a Equipos" icon={UserPlus}><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-700/50"><tr className="border-b border-slate-600"><th className="p-3 text-sm font-semibold text-slate-300">Jugador</th><th className="p-3 text-sm font-semibold text-slate-300">Categoría</th><th className="p-3 text-sm font-semibold text-slate-300">Email</th><th className="p-3 text-sm font-semibold text-slate-300">Asignar Equipo</th><th className="p-3 text-sm font-semibold text-slate-300">Grupo</th><th className="p-3 text-sm font-semibold text-slate-300">Validación</th></tr></thead><tbody>{players.map(player => { const assignedTeam = teams.find(t => t.id === player.teamId); const validationInfo = assignedTeam ? categoryValidation[assignedTeam.id] : null; const isInvalid = validationInfo && !validationInfo.isValid; return (<tr key={player.id} className={`border-b border-slate-700 hover:bg-slate-800 transition-colors ${isInvalid ? 'bg-red-900/20' : ''}`}><td className="p-3">{player.fullName}</td><td className="p-3">{player.category}</td><td className="p-3">{player.email}</td><td className="p-3"><select value={player.teamId || ''} onChange={(e) => handleAssignTeamToPlayer(player.id, e.target.value)} className="bg-slate-700 p-2 rounded border border-slate-600"><option value="">Sin Equipo</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></td><td className="p-3 font-mono">{assignedTeam?.groupId ? `Grupo ${getGroupLetter(assignedTeam.groupId)}` : '—'}</td><td className="p-3">{isInvalid && (<span className="text-red-400 flex items-center text-xs"><AlertTriangle size={14} className="mr-1" /> Límite excedido</span>)}</td></tr>)})}</tbody></table></div><div className="mt-6 flex justify-end"><button onClick={handleSaveAndGenerateMatches} className="bg-green-600 hover:bg-green-700 p-3 px-6 rounded-md flex items-center font-semibold transition-colors"><Save className="mr-2 h-5 w-5" /> Guardar Asignaciones y Generar Partidos</button></div></Card>
        </div>);
};

    
// --- PESTAÑA 2: GESTIÓN DE TORNEO ---
const GestionTorneoTab = ({ allData, onEliminationCountChange, eliminationCount, setModalData, refreshData }) => {
    const { teams, matches } = allData;
    const [expandedRows, setExpandedRows] = useState({});
    const [showTiebreakers, setShowTiebreakers] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Función para cargar todos los datos
      
     const handleGenerateTiebreakers = async (tiedTeams, category) => {
        const team_ids = tiedTeams.map(t => t.id);
        setIsSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/matches/generate-tiebreakers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_ids, category, tournament_id: 1 }) // Asumimos un tournament_id por ahora
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Error al generar juegos de desempate.');
            }
            alert('Juegos de desempate generados. La tabla se actualizará.');
            await refreshData();
        } catch(err) {
            alert(err.message);
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
            // Suma los puntos de torneo desde el partido
            acc.TournamentPoints += isTeam1 ? (match.team1_tournament_points || 0) : (match.team2_tournament_points || 0);
            return acc;
        }, { G: 0, P: 0, GF: 0, GC: 0, TournamentPoints: 0 });
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
    
    return (
        <div className="space-y-8">
            {Object.keys(matchesByGroup).length > 0 ? (
                Object.entries(matchesByGroup).map(([groupId, groupMatches]) => {
                    const groupTeams = [...new Map(groupMatches.flatMap(m => [[m.team1_id, {id: m.team1_id, name: m.team1_name}], [m.team2_id, {id: m.team2_id, name: m.team2_name}]])).values()].sort((a,b) => a.id - b.id);
                    const groupStandings = groupTeams.map(team => {
                        const teamMatches = groupMatches.filter(m => m.team1_id === team.id || m.team2_id === team.id);
                        const stats = calculateStats(teamMatches, team.id);
                        return { ...team, stats, tournament_points: stats.TournamentPoints, diff: stats.GF - stats.GC };
                    }).sort((a,b) => b.tournament_points - a.tournament_points || b.diff - a.diff);

                    const numToEliminate = eliminationCount[groupId] || 0;
                    const eliminatedTeamIds = (numToEliminate > 0) ? groupStandings.slice(-numToEliminate).map(t => t.id) : [];
                    const groupLetter = String.fromCharCode(64 + parseInt(groupId));

                    return (
                       <Card key={groupId} title={`Round Robin - Grupo ${groupLetter}`} icon={BarChart2}
                            extraHeaderContent={<div className="flex items-center gap-2 text-sm"><label htmlFor={`elim-${groupId}`} className="text-slate-400">Eliminar últimos:</label><input id={`elim-${groupId}`} type="number" min="0" max={groupTeams.length -1} value={eliminationCount[groupId] || 0} onChange={(e) => onEliminationCountChange({...eliminationCount, [groupId]: parseInt(e.target.value, 10) || 0})} className="w-16 bg-slate-700 p-1 rounded text-center border border-slate-600"/></div>}
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
                                                    <>
                                                        {['Avanzado', 'Intermedio Fuerte', 'Intermedio'].map(category => {
                                                            const categoryMatches = groupMatches.filter(m => m.category === category);
                                                            const categoryStats = calculateStats(categoryMatches, team.id);
                                                            return (
                                                                <tr key={category} className="bg-slate-800/40 text-xs">
                                                                    <td className="py-2 px-3 pl-8 text-slate-400 font-semibold">{category}</td>
                                                                    {groupTeams.map(opponent => {
                                                                        if (opponent.id === team.id) return <td key={opponent.id} className="py-2 px-3 text-center">-</td>;
                                                                        const match = categoryMatches.find(m => (m.team1_id === team.id && m.team2_id === opponent.id) || (m.team1_id === opponent.id && m.team2_id === team.id));
                                                                        const score1 = match ? (match.team1_id === team.id ? match.team1_score : match.team2_score) : null;
                                                                        const score2 = match ? (match.team1_id === team.id ? match.team2_score : match.team1_score) : null;
                                                                        return ( <td key={opponent.id} className="p-1 text-center">{match ? (<div onClick={() => setModalData(match)} className="bg-slate-700/50 hover:bg-slate-700 rounded-md p-2 cursor-pointer relative font-mono text-base">{score1 !== null ? `${score1}/${score2}` : '-'}<span className="absolute bottom-0 right-1 text-[8px] text-slate-500">ID:{match.id}</span></div>) : <div className="p-2">-</div>}</td> )
                                                                    })}
                                                                    <td className="py-2 px-3 text-center font-mono">{categoryStats.G}/{categoryStats.P}</td>
                                                                    <td className="py-2 px-3 text-center font-mono">{categoryStats.GF}/{categoryStats.GC}</td>
                                                                    <td className="py-2 px-3 text-center font-semibold">{categoryStats.GF - categoryStats.GC}</td>
                                                                    <td className="py-2 px-3"></td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </>
                                                )}
                                            </React.Fragment>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )
                })
            ) : ( <Card title="Gestión de Torneo" icon={Gamepad2}><div className="text-center text-slate-400 py-8"><p>No se encontraron partidos.</p></div></Card> )}
            
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
 
// --- PESTAÑA 3: STANDING (CORREGIDA) ---
const StandingTab = ({ teams, matches, eliminationCount }) => {
    const calculateStats = (teamMatches, teamId) => {
        return teamMatches.reduce((acc, match) => {
            if (match.status !== 'finalizado' || match.is_tiebreaker) return acc;
            
            const isTeam1 = match.team1_id === teamId;
            if (isTeam1) {
                acc.GF += match.team1_score;
                acc.GC += match.team2_score;
                acc.TournamentPoints += match.team1_tournament_points || 0;
            } else {
                acc.GF += match.team2_score;
                acc.GC += match.team1_score;
                acc.TournamentPoints += match.team2_tournament_points || 0;
            }
            if (match.winner_id === teamId) acc.G += 1; else acc.P += 1;
            return acc;
        }, { G: 0, P: 0, GF: 0, GC: 0, TournamentPoints: 0 });
    };

    const standingsByGroup = useMemo(() => {
        if (!teams || !matches) return [];
        
        const getGroupLetter = (id) => id ? String.fromCharCode(64 + id) : null;
        
        const groups = teams.reduce((acc, team) => {
            const groupKey = team.groupId;
            if (groupKey) {
                if (!acc[groupKey]) {
                    acc[groupKey] = { name: `Grupo ${getGroupLetter(groupKey)}`, id: groupKey, teams: [] };
                }
                const teamMatches = matches.filter(m => !m.is_tiebreaker && (m.team1_id === team.id || m.team2_id === team.id));
                const stats = calculateStats(teamMatches, team.id);
                acc[groupKey].teams.push({ ...team, stats, diff: stats.GF - stats.GC, tournament_points: stats.TournamentPoints });
            }
            return acc;
        }, {});

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
            {standingsByGroup.length > 0 ? standingsByGroup.map(group => {
                if (!group.teams || group.teams.length === 0) return null;
                const numToEliminate = eliminationCount[group.id] || 0;
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
            }) : <Card title="Standing"><p className="text-slate-400 text-center">No hay grupos definidos o partidos jugados en esta fase del torneo.</p></Card>}
        </div>
    );
};
// --- PESTAÑA 3: JUEGOS EN CURSO (DISEÑO ACTUALIZADO) ---
const JuegosEnCursoTab = ({ matches, courts }) => {
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 
    const matchesByCourt = useMemo(() => {
        const data = {};
        if (!courts || !matches) return data;
        
        courts.forEach(court => {
            const courtMatches = matches.filter(m => m.court_id === court.id);
            data[court.id] = {
                name: court.name,
                live: courtMatches.filter(m => m.status === 'en_vivo'),
                upcoming: courtMatches.filter(m => m.status === 'asignado'),
                played: courtMatches
                    .filter(m => m.status === 'finalizado')
                    .sort((a,b) => new Date(b.end_time) - new Date(a.end_time))
                    .slice(0, 3)
            };
        });
        return data;
    }, [matches, courts]);
  
   // if (loading) return <div className="flex justify-center items-center p-10 text-slate-400"><Loader2 className="animate-spin h-8 w-8" /> <span className="ml-3">Cargando estado de las canchas...</span></div>;
    // if (error) return <div className="text-red-400 text-center p-10 bg-red-900/20 rounded-lg">{error}</div>;

    // --- Componente ServiceDots (Puntos de Servicio) ---
    const ServiceDots = ({ isServingTeam, serverNum, isFirstServeOfGame }) => {
        const secondDotActive = isServingTeam && isFirstServeOfGame || isServingTeam && serverNum === 2;
        const firstDotActive = isServingTeam || isServingTeam && serverNum === 1;
        return (
            // Reducimos el 'gap' y el tamaño de los puntos para hacerlos más compactos
            <div className="flex gap-0.5 items-center"> 
                <div className={`w-2 h-2 rounded-full transition-all ${firstDotActive ? 'bg-yellow-400 shadow-[0_0_6px_yellow]' : 'bg-slate-600'}`}></div>
                <div className={`w-2 h-2 rounded-full transition-all ${secondDotActive ? 'bg-yellow-400 shadow-[0_0_6px_yellow]' : 'bg-slate-600'}`}></div>
            </div>
        );
    };





    
    // --- Componente MatchCard (Tarjeta de Partido) ---
    const MatchCard = ({ match }) => {
        const winner = match.winner_id ? (match.winner_id === match.team1_id ? 'team1' : 'team2') : null;
        const isFirstServeOfGame = !match.first_side_out_done;
        return (
            <div className={`bg-slate-800 p-2.5 rounded-lg border border-slate-700`}>
                <div className="text-center text-xs font-bold text-cyan-400 mb-2">{match.category}</div>
                <div className="space-y-1.5">
                     <div className={`flex items-center rounded-md ${winner === 'team1' ? 'bg-green-800/30' : ''}`}>
                        <div className="flex-grow min-w-0">
                            <div className={`text-sm font-semibold ${winner === 'team1' ? 'text-amber-400' : ''}`}>
                                {winner === 'team1' && '🏆 '}{match.team1_name}
                            </div>
                            <div className="text-xs text-slate-400 truncate">{match.team1_player1_name} / {match.team1_player2_name}</div>
                        </div>
                        <div className="flex items-center justify-end gap-1 flex-shrink-0">
                           <ServiceDots isServingTeam={match.server_team_id === match.team1_id} serverNum={match.server_number} isFirstServeOfGame={isFirstServeOfGame} />
                           <div className="w-px h-5 bg-slate-600 mx-0.5"></div>
                           <span className="font-mono font-bold text-base w-6 text-right">{match.team1_score ?? '-'}</span>
                        </div>
                    </div>
                    <div className={`flex items-center rounded-md ${winner === 'team2' ? 'bg-green-800/30' : ''}`}>
                        <div className="flex-grow min-w-0">
                           <div className={`text-sm font-semibold ${winner === 'team2' ? 'text-amber-400' : ''}`}>
                               {winner === 'team2' && '🏆 '}{match.team2_name}
                           </div>
                           <div className="text-xs text-slate-400 truncate">{match.team2_player1_name} / {match.team2_player2_name}</div>
                        </div>
                        <div className="flex items-center justify-end gap-1 flex-shrink-0">
                           <ServiceDots isServingTeam={match.server_team_id === match.team2_id} serverNum={match.server_number} isFirstServeOfGame={isFirstServeOfGame} />
                           <div className="w-px h-5 bg-slate-600 mx-0.5"></div>
                           <span className="font-mono font-bold text-base w-6 text-right">{match.team2_score ?? '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const Section = ({ title, children }) => (
        <div>
            <h4 className="font-bold text-slate-400 text-base mb-1.5 uppercase tracking-wider">{title}</h4>
            <div className="space-y-1.5">{children}</div>
        </div>
    );

    return (
        //<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            {courts.map(court => {
                const data = matchesByCourt[court.id] || { live: [], upcoming: [], played: [] };
                return (
                    <div key={court.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col space-y-4">
                        <h3 className="font-bold text-lg text-center mb-3">{court.name}</h3>
                        <div className="space-y-4">
                            <Section title="En Vivo">
                                {data.live.length > 0 ? data.live.map(m => <MatchCard key={m.id} match={m} />) : <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 min-h-[106px] flex items-center justify-center text-slate-500 text-sm">
  VACIA
</div>}
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
const AvisosTab = ({ allData }) => {
    const [manualMessage, setManualMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [sentWhatsApp, setSentWhatsApp] = useState({});

    const assignedMatches = useMemo(() => 
        allData.matches.filter(m => m.status === 'asignado'), 
    [allData.matches]);
    
    const handleSendGeneral = async () => {
        if (!manualMessage.trim()) return;
        setIsSending(true);
        try {
            await fetch(`${API_BASE_URL}/api/announcements/general`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: manualMessage })
            });
            setManualMessage("");
        } catch (err) {
            alert('Error al enviar el aviso.');
        } finally {
            setIsSending(false);
        }
    };
    
    // --- FUNCIÓN CORREGIDA ---
    // Ahora solo envía el ID del partido al endpoint correcto.
    const handleAnnounceGame = async (matchId) => {
        try {
            await fetch(`${API_BASE_URL}/api/matches/${matchId}/announce`, {
                method: 'POST',
            });
            // El backend se encarga de todo. El WebSocket actualizará el estado del botón.
        } catch (err) {
            alert('Error al anunciar el partido.');
            console.error(err);
        }
    };

    const handleSendWhatsApp = (playerName, match) => {
        const court = allData.courts.find(c => c.id === match.court_id);
        const message = `El juego No. ${match.id} entre ${match.team1_name} y ${match.team2_name} va a comenzar en la ${court?.name || `Cancha #${match.court_id}`}, favor presentarte.`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setSentWhatsApp(prev => ({...prev, [`${match.id}-${playerName}`]: true}));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <Card title="Aviso General" icon={Megaphone}>
                    <div className="space-y-3">
                        <textarea value={manualMessage} onChange={(e) => setManualMessage(e.target.value)} placeholder="Escribe un mensaje para mostrar en el tablero público..." className="w-full bg-slate-700 p-2 rounded-md border border-slate-600 min-h-[80px]"></textarea>
                        <button onClick={handleSendGeneral} disabled={isSending} className="w-full flex items-center justify-center p-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-sm">
                            <Send className="mr-2 h-4 w-4" /> Enviar Aviso
                        </button>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
                <Card title="Anunciar Partidos Asignados" icon={Bell}>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {assignedMatches.length > 0 ? assignedMatches.map(match => {
                            const wasAnnounced = match.is_announced;
                            return (
                                <div key={match.id} className="bg-slate-800/50 p-2 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm">{match.team1_name} vs {match.team2_name}</p>
                                        <p className="text-xs text-slate-400">Categoría: {match.category} - Cancha: {match.court_id}</p>
                                    </div>
                                    <button onClick={() => handleAnnounceGame(match.id)} className={`px-3 py-1 text-xs rounded-md flex items-center transition-colors ${wasAnnounced ? 'bg-green-700 hover:bg-green-800' : 'bg-cyan-600 hover:bg-cyan-700'}`}>
                                        {wasAnnounced ? <Check className="mr-2 h-4 w-4"/> : <Bell className="mr-2 h-4 w-4"/>}
                                        {wasAnnounced ? 'Anunciado' : 'Anunciar'}
                                    </button>
                                </div>
                            )
                        }) : <p className="text-slate-400 text-center text-sm">No hay partidos asignados para anunciar.</p>}
                    </div>
                </Card>
                <Card title="Notificar Jugadores vía WhatsApp" icon={Users}>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto">
                         {assignedMatches.length > 0 ? assignedMatches.map(match => (
                            <div key={`wa-${match.id}`} className="bg-slate-800/50 p-3 rounded-lg">
                               <p className="font-semibold mb-2 text-sm">{match.team1_name} vs {match.team2_name}</p>
                               <div className="grid grid-cols-2 gap-2 text-sm">
                                   <div className="space-y-2">
                                       <p className="font-bold">{match.team1_name}</p>
                                       {[match.team1_player1_name, match.team1_player2_name].map(name => {
                                           if (!name) return null;
                                           const wasSent = sentWhatsApp[`${match.id}-${name}`];
                                           return <button key={name} onClick={() => handleSendWhatsApp(name, match)} className={`w-full text-left px-2 py-1 rounded flex items-center justify-between text-xs ${wasSent ? 'bg-green-800/70' : 'bg-slate-700 hover:bg-slate-600'}`}>{name} {wasSent ? <Check size={14}/> : <Send size={14}/>}</button>
                                       })}
                                   </div>
                                   <div className="space-y-2">
                                       <p className="font-bold">{match.team2_name}</p>
                                        {[match.team2_player1_name, match.team2_player2_name].map(name => {
                                           if (!name) return null;
                                           const wasSent = sentWhatsApp[`${match.id}-${name}`];
                                           return <button key={name} onClick={() => handleSendWhatsApp(name, match)} className={`w-full text-left px-2 py-1 rounded flex items-center justify-between text-xs ${wasSent ? 'bg-green-800/70' : 'bg-slate-700 hover:bg-slate-600'}`}>{name} {wasSent ? <Check size={14}/> : <Send size={14}/>}</button>
                                       })}
                                   </div>
                               </div>
                            </div>
                         )) : <p className="text-slate-400 text-center text-sm">No hay partidos asignados para notificar.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const HorariosTab = ({ matches, courts, openScheduleModal }) => {
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let h = 7; h < 22; h++) {
            for (let m = 0; m < 60; m += 15) {
                const time = new Date();
                time.setHours(h, m, 0, 0);
                slots.push(time);
            }
        }
        return slots;
    }, []);

    const getStatusColor = (status) => {
        if (status === 'finalizado') return 'border-green-500 bg-green-500/20';
        if (status === 'en_vivo') return 'border-red-500 bg-red-500/20';
        if (status === 'asignado') return 'border-blue-500 bg-blue-500/20';
        return 'border-slate-600 bg-slate-700/50';
    };

    const MatchBlock = ({ match }) => (
        <div 
            onClick={() => openScheduleModal(match)}
            className={`p-2 rounded-md cursor-pointer hover:scale-105 transition-transform border-l-4 mb-1 ${getStatusColor(match.status)}`}
        >
            <p className="text-xs font-bold truncate">{match.team1_name} vs {match.team2_name}</p>
            <p className="text-xs text-slate-400">{match.category}</p>
        </div>
    );

    return (
        <Card title="Calendario de Partidos" icon={Calendar}>
            <div className="overflow-x-auto">
                <table style={{ minWidth: `${120 + 200 * (courts.length + 1)}px` }} className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-700/50">
                            <th className="sticky left-0 bg-slate-700 p-2 border border-slate-600 w-24 text-sm">Hora</th>
                            <th className="p-2 border border-slate-600 w-48 text-sm">Pendiente Asignar</th>
                            {courts.map(court => (
                                <th key={court.id} className="p-2 border border-slate-600 w-48 text-sm">{court.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map((slot, index) => (
                            <tr key={index}>
                                <td className="sticky left-0 bg-slate-800 p-2 border border-slate-700 text-center text-xs font-mono">
                                    {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-1 border border-slate-700 align-top">
                                    {matches.filter(m => !m.court_id && m.scheduled_start_time && Math.abs(new Date(m.scheduled_start_time).getTime() - slot.getTime()) < 1000).map(match => <MatchBlock key={match.id} match={match} />)}
                                </td>
                                {courts.map(court => (
                                    <td key={court.id} className="p-1 border border-slate-700 align-top">
                                        {matches.filter(m => m.court_id === court.id && m.scheduled_start_time && Math.abs(new Date(m.scheduled_start_time).getTime() - slot.getTime()) < 1000).map(match => <MatchBlock key={match.id} match={match} />)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function TournamentAdminPage() {
    const [activeTab, setActiveTab] = useState('partidos');
    const [tournaments, setTournaments] = useState([]);
    const [activeTournamentId, setActiveTournamentId] = useState(null);
    const [allData, setAllData] = useState({ matches: [], teams: [], courts: [] });
    const [allTeamsForSelection, setAllTeamsForSelection] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eliminationCount, setEliminationCount] = useState({});
    
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isCreatePhaseOpen, setIsCreatePhaseOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState(null);
    const [schedulingMatch, setSchedulingMatch] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const fetchDataForTournament = useCallback(async (tournamentId, isSilent = false) => {
        if (!tournamentId) { setLoading(false); return; }
        if (!isSilent) setLoading(true);
        try {
            const [matchesRes, teamsRes, courtsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/matches/scoreboard/${tournamentId}`),
                fetch(`${API_BASE_URL}/api/teams/by-tournament/${tournamentId}`),
                fetch(`${API_BASE_URL}/api/courts`)
            ]);
            if (!matchesRes.ok || !teamsRes.ok || !courtsRes.ok) throw new Error('No se pudieron cargar los datos del torneo.');
            const matchesData = await matchesRes.json();
            const teamsData = await teamsRes.json();
            const courtsData = await courtsRes.json();
            setAllData({ matches: matchesData, teams: teamsData, courts: courtsData });
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

    const fetchInitialData = useCallback(async () => {
        try {
            const [tournamentsRes, allTeamsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/tournaments`),
                fetch(`${API_BASE_URL}/api/teams`)
            ]);
            const tournamentsData = await tournamentsRes.json();
            const allTeamsData = await allTeamsRes.json();
            setTournaments(tournamentsData);
            setAllTeamsForSelection(allTeamsData);
            if (tournamentsData.length > 0) {
                if (!activeTournamentId) {
                    setActiveTournamentId(tournamentsData[0].id);
                }
            } else {
                setLoading(false);
            }
        } catch (err) {
            setError("Error al cargar datos iniciales.");
            setLoading(false);
        }
    }, [activeTournamentId]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if (activeTournamentId) {
            fetchDataForTournament(activeTournamentId);
        }
    }, [activeTournamentId, fetchDataForTournament]);

    useEffect(() => {
        if (!activeTournamentId) return;
        const socket = new WebSocket(WS_URL);
        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if ((message.type === 'MATCH_UPDATE' || message.type === 'SCORE_UPDATE') && message.payload.tournament_id === parseInt(activeTournamentId)) {
                    fetchDataForTournament(activeTournamentId, true);
                }
            } catch (error) {
                console.error("Error procesando mensaje de WebSocket:", error);
            }
        };
        return () => socket.close();
    }, [activeTournamentId, fetchDataForTournament]);

    const handleSaveMatch = async (matchId, updateData) => {
        setIsSaving(true);
        try {
            await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            setEditingMatch(null);
            setSchedulingMatch(null);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleGenerationComplete = () => {
        fetchDataForTournament(activeTournamentId);
        setIsConfigOpen(false);
    };

    const handleCreatePhase = async (phaseData) => {
        setIsSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/tournaments/create_phase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(phaseData)
            });
            const newTournament = await response.json();
            if (!response.ok) throw new Error(newTournament.msg || "Error al crear la fase");
            
            await fetchInitialData();
            setActiveTournamentId(newTournament.id);
            setIsCreatePhaseOpen(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const activeTournament = tournaments.find(t => t.id === parseInt(activeTournamentId));

    return (
        <div className="bg-slate-900 text-white min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-screen-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-cyan-400">Panel de Control</h1>
                    <div className="flex items-center gap-4">
                        <select
                            value={activeTournamentId || ''}
                            onChange={(e) => setActiveTournamentId(parseInt(e.target.value))}
                            className="bg-slate-700 border border-slate-600 rounded-md p-2"
                        >
                            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button onClick={() => setIsCreatePhaseOpen(true)} className="p-2 rounded-full hover:bg-slate-700" title="Crear Nueva Fase"><PlusCircle /></button>
                        <button onClick={() => setIsConfigOpen(true)} className="p-2 rounded-full hover:bg-slate-700" title="Configuración General"><Settings /></button>
                    </div>
                </div>
                
                <div className="flex border-b border-slate-700 overflow-x-auto">
                    <TabButton tabName="partidos" label="Partidos" icon={BarChart2} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabName="horarios" label="Horarios" icon={Calendar} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabName="grupos" label="Grupos" icon={Users} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabName="standing" label="Standing" icon={ListOrdered} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabName="juegos" label="En Vivo" icon={MonitorPlay} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabName="avisos" label="Avisos" icon={Megaphone} activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

                <div className="pt-8">
                    {editingMatch && <EditScoreModal match={editingMatch} courts={allData.courts} onClose={() => setEditingMatch(null)} onSave={handleSaveMatch} isSaving={isSaving} />}
                    {schedulingMatch && <ScheduleMatchModal match={schedulingMatch} courts={allData.courts} onClose={() => setSchedulingMatch(null)} onSave={handleSaveMatch} isSaving={isSaving} tournamentStartDate={activeTournament?.start_date} />}
                    
                    {loading ? ( <div className="flex justify-center items-center p-10"><Loader2 className="animate-spin h-8 w-8" /></div> ) : 
                    error ? (<div className="text-red-400 text-center p-10">{error}</div>) : (
                        <div key={activeTournamentId}>
                           {activeTab === 'partidos' && <PartidosTab matches={allData.matches} courts={allData.courts} refreshData={() => fetchDataForTournament(activeTournamentId)} setEditingMatch={setEditingMatch} openScheduleModal={setSchedulingMatch}/>}
                           {activeTab === 'horarios' && <HorariosTab matches={allData.matches} courts={allData.courts} openScheduleModal={setSchedulingMatch} />}
                           {activeTab === 'grupos' && <GestionTorneoTab allData={allData} onEliminationCountChange={setEliminationCount} eliminationCount={eliminationCount} setModalData={setEditingMatch} />}
                           {activeTab === 'standing' && <StandingTab teams={allData.teams} matches={allData.matches} eliminationCount={eliminationCount} />}
                           {activeTab === 'juegos' && <JuegosEnCursoTab matches={allData.matches} courts={allData.courts} />}
                           {activeTab === 'avisos' && <AvisosTab allData={allData} />}
                        </div>
                    )}
                </div>
                
                <CreatePhaseModal 
                    isOpen={isCreatePhaseOpen} 
                    onClose={() => setIsCreatePhaseOpen(false)} 
                    allTeams={allTeamsForSelection} 
                    tournaments={tournaments}
                    onCreate={handleCreatePhase} 
                    isSaving={isSaving}
                />
                {isConfigOpen && (
                    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 pt-20">
                        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-6xl max-h-[85vh] flex flex-col">
                            <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                                <h2 className="text-xl font-bold text-cyan-400 flex items-center"><Settings className="mr-3" />Configuración General del Torneo</h2>
                                <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
                            </header>
                            <main className="p-6 overflow-y-auto">
                                <ConfiguracionPanel 
                                    initialData={allData}
                                    onGenerationComplete={handleGenerationComplete} 
                                    activeTournamentId={activeTournamentId}
                                    onClose={() => setIsConfigOpen(false)}
                                />
                            </main>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
