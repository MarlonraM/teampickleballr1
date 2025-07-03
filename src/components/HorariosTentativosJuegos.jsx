import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { UserPlus, ShieldPlus, Users, Save, AlertTriangle, Loader2, ChevronsUpDown, Gamepad2, Settings, BarChart2, X, Trophy, Swords, MonitorPlay, ListOrdered, Clock, ExternalLink, Pencil, Megaphone, Send, Bell, Check, PlusCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

// --- Componentes de UI Reutilizables ---
const Card = ({ children, title, icon: Icon, extraHeaderContent }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center text-cyan-400">
                {Icon && <Icon className="mr-3 h-5 w-5" />}
                {title}
            </h3>
            {extraHeaderContent}
        </div>
        <div className="p-6 space-y-6">{children}</div>
    </div>
);

const TabButton = ({ tabName, label, icon: Icon, activeTab, setActiveTab }) => (
    <button onClick={() => setActiveTab(tabName)} className={`flex items-center px-5 py-3 text-sm font-medium transition-colors ${activeTab === tabName ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white border-b-2 border-transparent'}`}>
        <Icon className="mr-2 h-5 w-5" />{label}
    </button>
);

// --- Modales ---
const CreatePhaseModal = ({ isOpen, onClose, allTeams, tournaments, onCreate, isSaving }) => { /* ... */ };
const EditScoreModal = ({ match, onClose, onSave, isSaving }) => { /* ... */ };
const ScheduleMatchModal = ({ match, courts, onClose, onSave, isSaving, tournamentStartDate }) => { /* ... */ };

// --- Pestañas ---
const ConfiguracionPanel = ({ initialData, allPlayers, onGenerationComplete, activeTournamentId, onClose }) => { /* ... */ };
const PartidosTab = ({ matches, courts, refreshData, setEditingMatch, openScheduleModal }) => { /* ... */ };
const GestionTorneoTab = ({ allData, onEliminationCountChange, eliminationCount, setModalData, refreshData }) => { /* ... */ };
const StandingTab = ({ teams, matches, eliminationCount }) => { /* ... */ };
const JuegosEnCursoTab = ({ matches, courts }) => { /* ... */ };
const AvisosTab = ({ allData, refreshData }) => { /* ... */ };

// --- PESTAÑA DE HORARIOS (CORREGIDA) ---
const HorariosTab = ({ matches, courts, openScheduleModal, activeTournament }) => {
    const [playerSearch, setPlayerSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        if (activeTournament?.start_date) {
            setSelectedDate(new Date(activeTournament.start_date).toISOString().substring(0, 10));
        } else {
            setSelectedDate(new Date().toISOString().substring(0, 10));
        }
    }, [activeTournament]);

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let h = 9; h < 22; h++) {
            for (let m = 0; m < 60; m += 20) {
                const time = new Date(`${selectedDate}T00:00:00`);
                time.setHours(h, m);
                slots.push(time);
            }
        }
        return slots;
    }, [selectedDate]);

    const filteredMatches = useMemo(() => {
        if (!matches) return [];
        let filtered = matches.filter(m => m.scheduled_start_time?.slice(0, 10) === selectedDate);

        if (playerSearch.trim()) {
            const searchTerm = playerSearch.toLowerCase();
            filtered = filtered.filter(m => {
                const playerNames = [m.team1_player1_name, m.team1_player2_name, m.team2_player1_name, m.team2_player2_name].filter(Boolean).map(name => name.toLowerCase());
                return playerNames.some(name => name.includes(searchTerm));
            });
        }
        return filtered.sort((a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time));
    }, [matches, playerSearch, selectedDate]);

    const getCategoryTag = (category) => {
        const baseClasses = "text-xs px-2 py-0.5 rounded-full font-semibold";
        switch (category) {
            case 'Avanzado': return <span className={`${baseClasses} bg-red-500/20 text-red-300`}>Avanzado</span>;
            case 'Intermedio Fuerte': return <span className={`${baseClasses} bg-yellow-500/20 text-yellow-300`}>I. Fuerte</span>;
            case 'Intermedio': return <span className={`${baseClasses} bg-blue-500/20 text-blue-300`}>Intermedio</span>;
            case 'Femenino': return <span className={`${baseClasses} bg-pink-500/20 text-pink-300`}>Femenino</span>;
            default: return <span className={`${baseClasses} bg-slate-700`}>{category}</span>;
        }
    };

    const fmtHour = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";

    return (
        <div className="flex flex-col h-full">
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur p-3 flex flex-col gap-3 shadow-lg border-b border-slate-700">
                <div className="flex justify-center items-center gap-3">
                    <img src="/pickleball-logo.png" alt="Logo" className="h-8 w-8" />
                    <h1 className="text-center text-cyan-400 font-bold text-xl">Horarios de Juegos</h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        placeholder="Busca por nombre de jugador..."
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        className="flex-1 bg-slate-700 rounded px-2 py-2 border border-slate-600"
                    />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-slate-700 rounded px-2 py-2 border border-slate-600"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-4">
                <div className="space-y-3">
                    {timeSlots.map((slot, index) => {
                        const slotEnd = new Date(slot.getTime() + 20 * 60000);
                        const matchesInSlot = filteredMatches.filter(m => {
                            const matchTime = new Date(m.scheduled_start_time);
                            return matchTime >= slot && matchTime < slotEnd;
                        });

                        if (matchesInSlot.length === 0) return null;

                        return (
                            <div key={index} className="flex gap-4">
                                <div className="w-20 text-right text-slate-400 font-mono text-sm pt-1">
                                    {fmtHour(slot.toISOString())}
                                </div>
                                <div className="flex-1 border-l-2 border-slate-700 pl-4 space-y-2">
                                    {matchesInSlot.map((m) => (
                                        <div key={m.id} className="bg-slate-800 p-3 rounded-lg shadow">
                                            <header className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-slate-400 flex items-center gap-2">
                                                    <Clock size={15} /> {fmtHour(m.scheduled_start_time)}
                                                </span>
                                                {getCategoryTag(m.category)}
                                            </header>
                                            <p className="font-semibold text-sm">{m.team1_name} vs {m.team2_name}</p>
                                            <div className="text-[11px] text-slate-400 leading-tight mt-1">
                                                <p><strong>{m.team1_name}:</strong> {m.team1_player1_name || "N/A"} / {m.team1_player2_name || "N/A"}</p>
                                                <p><strong>{m.team2_name}:</strong> {m.team2_player1_name || "N/A"} / {m.team2_player2_name || "N/A"}</p>
                                            </div>
                                            <footer className="text-right mt-2">
                                                <span className="bg-slate-700 text-xs px-2 py-1 rounded">
                                                    {m.court_name || 'Pendiente'}
                                                </span>
                                            </footer>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                     {filteredMatches.length === 0 && !loading && (
                        <p className="text-center text-slate-400 mt-8">No hay partidos para los filtros seleccionados.</p>
                     )}
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
export default function TournamentAdminPage() {
    const [activeTab, setActiveTab] = useState('partidos');
    const [tournaments, setTournaments] = useState([]);
    const [activeTournamentId, setActiveTournamentId] = useState(null);
    const [allData, setAllData] = useState({ matches: [], teams: [], courts: [] });
    const [allTeamsForSelection, setAllTeamsForSelection] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
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
            const [tournamentsRes, allTeamsRes, allPlayersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/tournaments`),
                fetch(`${API_BASE_URL}/api/teams`),
                fetch(`${API_BASE_URL}/api/players`)
            ]);
            const tournamentsData = await tournamentsRes.json();
            const allTeamsData = await allTeamsRes.json();
            const allPlayersData = await allPlayersRes.json();
            setTournaments(tournamentsData);
            setAllTeamsForSelection(allTeamsData);
            setAllPlayers(allPlayersData);
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
        fetchInitialData();
        fetchDataForTournament(activeTournamentId);
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
                                    allPlayers={allPlayers}
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
