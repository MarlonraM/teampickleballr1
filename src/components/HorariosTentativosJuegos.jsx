import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, Loader2 } from "lucide-react";

// --- CONSTANTES ---
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const WS_URL = API_BASE_URL.replace(/^http/, "ws");

// --- COMPONENTE DE BLOQUE DE PARTIDO ---
const MatchBlock = ({ match, styles }) => {
    const getStatusColor = (status) => {
        if (status === 'finalizado') return styles.matchFinalizado;
        if (status === 'en_vivo') return styles.matchEnVivo;
        if (status === 'asignado') return styles.matchAsignado;
        return styles.matchPendiente;
    };

    return (
        <div style={{ ...styles.scheduleMatch, ...getStatusColor(match.status) }}>
            <p style={styles.scheduleMatchText}>{match.team1_name} vs {match.team2_name}</p>
            <p style={styles.scheduleMatchCategory}>{match.category}</p>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DE LA PÁGINA DE HORARIOS ---
const HorariosPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tournaments, setTournaments] = useState([]);
    const [activeTournamentId, setActiveTournamentId] = useState(null);
    const [allData, setAllData] = useState({ matches: [], courts: [] });

    // --- LÓGICA DE CARGA DE DATOS CORREGIDA ---
    const fetchDataForTournament = useCallback(async (tournamentId, isSilent = false) => {
        if (!tournamentId) {
            setLoading(false);
            return;
        }
        if (!isSilent) setLoading(true);
        try {
            const [matchesRes, courtsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/matches/scoreboard/${tournamentId}`),
                fetch(`${API_BASE_URL}/api/courts`),
            ]);
            if (!matchesRes.ok || !courtsRes.ok) throw new Error("No se pudieron cargar los datos del torneo.");
            
            const matchesData = await matchesRes.json();
            const courtsData = await courtsRes.json();
            setAllData({ matches: matchesData, courts: courtsData });
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/tournaments`);
                const data = await res.json();
                setTournaments(data);
                if (data.length > 0) {
                    setActiveTournamentId(data[0].id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                setError("Error al cargar la lista de torneos.");
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    useEffect(() => {
        if (activeTournamentId) {
            fetchDataForTournament(activeTournamentId);
        }
    }, [activeTournamentId, fetchDataForTournament]);

    useEffect(() => {
        if (!activeTournamentId) return;
        const socket = new WebSocket(WS_URL);
        socket.onopen = () => console.log("WebSocket conectado a Horarios.");
        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if ((message.type === "MATCH_UPDATE" || message.type === "SCORE_UPDATE") && Number(message.payload.tournament_id) === Number(activeTournamentId)) {
                    fetchDataForTournament(activeTournamentId, true);
                }
            } catch (err) {
                console.error("Mensaje WS inválido:", err);
            }
        };
        return () => socket.close();
    }, [activeTournamentId, fetchDataForTournament]);

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

    const styles = {
        tableHeader: { padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #374151', backgroundColor: '#1f2937', color: '#9ca3af' },
        tableCell: { padding: '8px', verticalAlign: 'top', minHeight: '60px', border: '1px solid #374151' },
        scheduleMatch: { backgroundColor: 'rgba(55, 65, 81, 0.5)', padding: '8px', borderRadius: '4px', fontSize: '0.8rem', borderLeft: '4px solid', marginBottom: '4px' },
        scheduleMatchText: { fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
        scheduleMatchCategory: { fontSize: '0.75rem', color: '#9ca3af' },
        matchFinalizado: { borderLeftColor: '#22c55e' },
        matchEnVivo: { borderLeftColor: '#ef4444' },
        matchAsignado: { borderLeftColor: '#3b82f6' },
        matchPendiente: { borderLeftColor: '#6b7280' },
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            <header className="p-4 bg-slate-800 flex justify-between items-center">
                <h1 className="text-xl font-bold text-cyan-400">Horarios de Partidos</h1>
                <select
                    value={activeTournamentId ?? ""}
                    onChange={(e) => setActiveTournamentId(e.target.value)}
                    className="bg-slate-700 rounded px-2 py-1"
                >
                    {tournaments.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
            </header>

            {error && <p className="bg-red-800 text-center p-2 text-sm font-semibold">{error}</p>}

            {loading ? (
                <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin h-8 w-8" /></div>
            ) : (
                <div className="flex-1 overflow-auto">
                    <table style={{ minWidth: `${120 + 200 * (allData.courts.length + 1)}px` }} className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="sticky left-0 z-10 bg-slate-800 p-2 border border-slate-700 w-24 text-sm">Hora</th>
                                <th className="p-2 border border-slate-700 w-48 text-sm">Pendiente Asignar</th>
                                {allData.courts.map(court => (
                                    <th key={court.id} className="p-2 border border-slate-700 w-48 text-sm">{court.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map((slot, index) => (
                                <tr key={index}>
                                    <td className="sticky left-0 bg-slate-800 p-2 border border-slate-700 text-center text-xs font-mono">
                                        {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={styles.tableCell}>
                                        {allData.matches
                                            .filter(m => !m.court_id && m.scheduled_start_time && Math.abs(new Date(m.scheduled_start_time).getTime() - slot.getTime()) < 1000)
                                            .map(match => <MatchBlock key={match.id} match={match} styles={styles} />)
                                        }
                                    </td>
                                    {allData.courts.map(court => (
                                        <td key={court.id} style={styles.tableCell}>
                                            {allData.matches
                                                .filter(m => m.court_id === court.id && m.scheduled_start_time && Math.abs(new Date(m.scheduled_start_time).getTime() - slot.getTime()) < 1000)
                                                .map(match => <MatchBlock key={match.id} match={match} styles={styles} />)
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HorariosPage;
