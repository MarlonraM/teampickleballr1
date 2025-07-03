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
    const [allPlayers, setAllPlayers] = useState([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState("");
    const [selectedDate, setSelectedDate] = useState('');

    const activeTournament = useMemo(() => 
        tournaments.find(t => t.id === Number(activeTournamentId)),
    [tournaments, activeTournamentId]);

    // --- LÓGICA DE CARGA DE DATOS CORREGIDA ---
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
            const [tournamentsRes, allPlayersRes, courtsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/tournaments`),
                fetch(`${API_BASE_URL}/api/players`),
                fetch(`${API_BASE_URL}/api/courts`),
            ]);
            if (!tournamentsRes.ok || !allPlayersRes.ok || !courtsRes.ok) {
                throw new Error("Error en la comunicación con el servidor.");
            }

            const tournamentsData = await tournamentsRes.json();
            const allPlayersData = await allPlayersRes.json();
            const courtsData = await courtsRes.json();
            
            setTournaments(tournamentsData);
            setAllPlayers(allPlayersData);
            setAllData(prev => ({...prev, courts: courtsData}));

            if (allPlayersData.length > 0) {
                setSelectedPlayerId(String(allPlayersData[0].id));
            }

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
    }, []); // CORRECCIÓN: Se elimina la dependencia de activeTournamentId para romper el bucle

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

    const filteredMatches = useMemo(() => {
        if (!selectedPlayerId || !allData.matches) return [];
        const pid = String(selectedPlayerId);
        
        return allData.matches
            .filter(m => {
                const playerIds = [
                    m.team1_player1_id, m.team1_player2_id,
                    m.team2_player1_id, m.team2_player2_id
                ].map(pId => String(pId));
                return playerIds.includes(pid);
            })
            .filter(m => m.scheduled_start_time?.slice(0, 10) === selectedDate)
            .sort((a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time));
    }, [allData.matches, selectedPlayerId, selectedDate]);

    const fmtHour = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur p-3 flex flex-col gap-3 shadow-lg border-b border-slate-700">
                <h1 className="text-center text-cyan-400 font-bold">Horarios de Juegos por Jugador</h1>
                <div className="flex flex-col sm:flex-row gap-2">
                    <select
                        value={selectedPlayerId}
                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                        className="flex-1 bg-slate-700 rounded px-2 py-2 border border-slate-600"
                    >
                        {allPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.full_name ?? "Sin nombre"}
                            </option>
                        ))}
                    </select>
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
                ) : filteredMatches.length === 0 ? (
                    <p className="text-center text-slate-400 mt-8">No hay partidos programados para este jugador en la fecha seleccionada.</p>
                ) : (
                    <ul className="space-y-3">
                        {filteredMatches.map((m) => (
                            <li key={m.id} className="bg-slate-800 border-l-4 border-cyan-400 p-3 rounded-lg shadow">
                                <header className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-slate-400 flex items-center gap-2">
                                        <Clock size={15} /> {fmtHour(m.scheduled_start_time)}
                                    </span>
                                    <span className="bg-slate-700 text-xs px-2 py-1 rounded">
                                        {m.court_name || 'Pendiente'}
                                    </span>
                                </header>
                                <p className="font-semibold text-sm">{m.team1_name} vs {m.team2_name}</p>
                                <div className="text-[11px] text-slate-300 leading-tight mt-1">
                                    <p><strong>{m.team1_name}:</strong> {m.team1_player1_name || "N/A"} / {m.team1_player2_name || "N/A"}</p>
                                    <p><strong>{m.team2_name}:</strong> {m.team2_player1_name || "N/A"} / {m.team2_player2_name || "N/A"}</p>
                                </div>
                                <footer className="text-right mt-2">
                                    <span className="text-xs text-slate-500">Partido #{m.id} - {m.category}</span>
                                </footer>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default HorariosPage;
