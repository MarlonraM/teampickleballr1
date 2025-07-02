import React, { useMemo, useState } from "react";
import { Calendar } from "lucide-react";

const HorariosTentativosJuegos = ({
  matches = [],
  allPlayers = [],
  tournamentStartDate,
}) => {
  // --- FECHA POR DEFECTO ---
  const defaultDate = useMemo(() => {
    let date = new Date();
    if (tournamentStartDate) {
      const base = new Date(tournamentStartDate);
      if (!isNaN(base.getTime())) date = base;
    }
    return date.toISOString().substring(0, 10);
  }, [tournamentStartDate]);
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  // --- JUGADOR SELECCIONADO ---
  const [selectedPlayerId, setSelectedPlayerId] = useState(
    allPlayers.length ? allPlayers[0].id : ""
  );

  // --- OBTENER PARTIDOS FILTRADOS ---
  const filteredMatches = useMemo(() => {
    // Busca nombre o ID del jugador seleccionado
    if (!selectedPlayerId) return [];
    return matches.filter((m) => {
      if (m.status !== "pendiente") return false;
      // Check player in either team (debería venir en las props como id)
      return (
        m.team1_player1_id === selectedPlayerId ||
        m.team1_player2_id === selectedPlayerId ||
        m.team2_player1_id === selectedPlayerId ||
        m.team2_player2_id === selectedPlayerId
      );
    }).filter(m => {
      // Filtrar por día
      if (!m.scheduled_start_time) return false;
      const matchDate = new Date(m.scheduled_start_time);
      return (
        matchDate.toISOString().substring(0, 10) === selectedDate
      );
    }).sort((a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time));
  }, [matches, selectedPlayerId, selectedDate]);

  // --- FORMATO HORA ---
  const formatHour = (isoString) => {
    if (!isoString) return "--:--";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-slate-950 min-h-screen flex flex-col">
      {/* Barra fija */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur p-3 flex flex-col gap-3 shadow-lg border-b border-slate-700">
        <h2 className="text-lg font-bold text-cyan-400 text-center">Horarios Tentativos de Juegos</h2>
        <div className="flex gap-2">
          <select
            value={selectedPlayerId}
            onChange={e => setSelectedPlayerId(e.target.value)}
            className="flex-1 bg-slate-700 text-white rounded-md px-2 py-2 text-base border border-slate-600"
          >
            {allPlayers.map(p => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-slate-700 text-white rounded-md px-2 py-2 border border-slate-600 text-base"
          />
        </div>
      </div>
      {/* Contenido partidos */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {filteredMatches.length === 0 ? (
          <div className="text-center text-slate-400 mt-8">
            No hay partidos pendientes para este jugador en esta fecha.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map(match => (
              <div key={match.id} className="bg-slate-800 border-l-4 border-cyan-400 p-3 rounded-lg shadow flex flex-col gap-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Calendar size={15} className="inline" /> {formatHour(match.scheduled_start_time)}
                  </div>
                  <span className="bg-slate-700 text-xs px-2 py-1 rounded-md">{match.category}</span>
                </div>
                <div className="font-semibold text-sm text-white">
                  {match.team1_name} vs {match.team2_name}
                </div>
                <div className="text-[11px] text-slate-300 leading-tight mb-1">
                  <div>
                    <span className="font-semibold">{match.team1_name}:</span>{" "}
                    {match.team1_player1_name || "N/A"} / {match.team1_player2_name || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">{match.team2_name}:</span>{" "}
                    {match.team2_player1_name || "N/A"} / {match.team2_player2_name || "N/A"}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Partido #{match.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HorariosTentativosJuegos;
