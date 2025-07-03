import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, Loader2, Clock } from "lucide-react";

// --- CONSTANTES ---
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const WS_URL = API_BASE_URL.replace(/^http/, "ws");

// --- COMPONENTE PRINCIPAL DE LA PÁGINA DE HORARIOS ---
const HorariosPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tournaments, setTournaments] = useState([]);
    const [activeTournamentId, setActiveTournamentId] = useState(null);
    const [allData, setAllData] = useState({ matches: [], courts: [] });
    const [playerSearch, setPlayerSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState('');

    const activeTournament = useMemo(() => 
        tournaments.find(t => t.id === Number(activeTournamentId)),
    [tournaments, activeTournamentId]);

    // --- LÓGICA DE CARGA DE DATOS ---
    const fetchDataForTournament = useCallback(async (tournamentId) => {
        if (!tournamentId) return;
        try {
            const matchesRes = await fetch(`${API_BASE_URL}/api/matches/scoreboard/${tournamentId}`);
            if (!matchesRes.ok) throw new Error("No se pudieron cargar los partidos del torneo.");
            const matchesData = await matchesRes.json();
            setAllData(prev => ({...prev, matches: matchesData}));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [tournamentsRes, courtsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/tournaments`),
                fetch(`${API_BASE_URL}/api/courts`),
            ]);
            if (!tournamentsRes.ok || !courtsRes.ok) {
                throw new Error("Error en la comunicación con el servidor.");
            }

            const tournamentsData = await tournamentsRes.json();
            const courtsData = await courtsRes.json();
            
            setTournaments(tournamentsData);
            setAllData(prev => ({...prev, courts: courtsData}));

            if (tournamentsData.length > 0) {
                const firstTournament = tournamentsData[0];
                setActiveTournamentId(firstTournament.id);
                setSelectedDate(firstTournament.start_date ? new Date(firstTournament.start_date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10));
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error("Error fetching initial data:", err);
            setError("Error al cargar datos iniciales.");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if (activeTournamentId) {
            fetchDataForTournament(activeTournamentId);
        }
    }, [activeTournamentId, fetchDataForTournament]);
    
    useEffect(() => {
        if (activeTournament?.start_date) {
            setSelectedDate(new Date(activeTournament.start_date).toISOString().substring(0, 10));
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
        if (!allData.matches) return [];
        let filtered = allData.matches.filter(m => m.scheduled_start_time?.slice(0, 10) === selectedDate);

        if (playerSearch.trim()) {
            const searchTerm = playerSearch.toLowerCase();
            filtered = filtered.filter(m => {
                const playerNames = [m.team1_player1_name, m.team1_player2_name, m.team2_player1_name, m.team2_player2_name].filter(Boolean).map(name => name.toLowerCase());
                return playerNames.some(name => name.includes(searchTerm));
            });
        }
        
        return filtered.sort((a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time));
    }, [allData.matches, playerSearch, selectedDate]);

    const fmtHour = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";

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

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
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
                {loading ? (
                    <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin h-8 w-8" /></div>
                ) : error ? (
                    <p className="text-center text-red-400 mt-8">{error}</p>
                ) : (
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
                )}
            </div>
        </div>
    );
};

export default HorariosPage;
