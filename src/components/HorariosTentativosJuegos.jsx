import React, { useMemo, useState, useEffect } from "react";
import { Calendar } from "lucide-react";

const HorariosTentativosJuegos = ({
  matches: rawMatches,
  allPlayers: rawPlayers,
  tournamentStartDate,
}) => {
  /* ------------------------------------------------------------------ */
  /* 1.  Sanitizar props para que nunca sean null/undefined ni de tipo   */
  /*     incorrecto.                                                     */
  /* ------------------------------------------------------------------ */
  const matches = Array.isArray(rawMatches) ? rawMatches : [];
  const allPlayers = Array.isArray(rawPlayers) ? rawPlayers : [];

  /* ------------------------------------------------------------------ */
  /* 2.  Fecha por defecto                                               */
  /* ------------------------------------------------------------------ */
  const defaultDate = useMemo(() => {
    const base = tournamentStartDate ? new Date(tournamentStartDate) : new Date();
    return isNaN(base.getTime())
      ? new Date().toISOString().substring(0, 10)
      : base.toISOString().substring(0, 10);
  }, [tournamentStartDate]);

  const [selectedDate, setSelectedDate] = useState(defaultDate);

  /* ------------------------------------------------------------------ */
  /* 3.  Jugador seleccionado.  En cuanto llegue el array de jugadores   */
  /*     lo sincronizamos.                                               */
  /* ------------------------------------------------------------------ */
  const [selectedPlayerId, setSelectedPlayerId] = useState("");

  useEffect(() => {
    if (!selectedPlayerId && allPlayers.length) {
      setSelectedPlayerId(String(allPlayers[0].id));
    }
  }, [allPlayers, selectedPlayerId]);

  /* ------------------------------------------------------------------ */
  /* 4.  Calcular partidos filtrados                                     */
  /* ------------------------------------------------------------------ */
  const filteredMatches = useMemo(() => {
    if (!selectedPlayerId) return [];

    // forzamos a string para comparar manzanas con manzanas
    const playerIdStr = String(selectedPlayerId);

    return matches
      .filter((m) => m.status === "pendiente")
      .filter((m) =>
        [m.team1_player1_id,
         m.team1_player2_id,
         m.team2_player1_id,
         m.team2_player2_id].map(String).includes(playerIdStr)
      )
      .filter((m) => {
        if (!m.scheduled_start_time) return false;
        return m.scheduled_start_time.slice(0, 10) === selectedDate;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time)
      );
  }, [matches, selectedPlayerId, selectedDate]);

  /* ------------------------------------------------------------------ */
  /* 5.  Formatear hora                                                  */
  /* ------------------------------------------------------------------ */
  const formatHour = (iso) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";

  /* ------------------------------------------------------------------ */
  /* 6.  Render                                                          */
  /* ------------------------------------------------------------------ */
  return (
    <div className="bg-slate-950 min-h-screen flex flex-col">
      {/* Barra fija */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur p-3 flex flex-col gap-3 shadow-lg border-b border-slate-700">
        <h2 className="text-lg font-bold text-cyan-400 text-center">
          Horarios Tentativos de Juegos
        </h2>

        {/* Filtros */}
        <div className="flex gap-2">
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="flex-1 bg-slate-700 text-white rounded-md px-2 py-2 text-base border border-slate-600"
          >
            {allPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName ?? p.full_name ?? "Sin nombre"}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-700 text-white rounded-md px-2 py-2 border border-slate-600 text-base"
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {filteredMatches.length === 0 ? (
          <p className="text-center text-slate-400 mt-8">
            No hay partidos pendientes para este jugador en esta fecha.
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredMatches.map((match) => (
              <li
                key={match.id}
                className="bg-slate-800 border-l-4 border-cyan-400 p-3 rounded-lg shadow"
              >
                <header className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400 flex items-center gap-2">
                    <Calendar size={15} /> {formatHour(match.scheduled_start_time)}
                  </span>
                  <span className="bg-slate-700 text-xs px-2 py-1 rounded-md">
                    {match.category}
                  </span>
                </header>

                <p className="font-semibold text-sm text-white">
                  {match.team1_name} vs {match.team2_name}
                </p>

                <div className="text-[11px] text-slate-300 leading-tight mb-1">
                  <p>
                    <strong>{match.team1_name}:</strong>{" "}
                    {match.team1_player1_name || "N/A"} / {match.team1_player2_name || "N/A"}
                  </p>
                  <p>
                    <strong>{match.team2_name}:</strong>{" "}
                    {match.team2_player1_name || "N/A"} / {match.team2_player2_name || "N/A"}
                  </p>
                </div>

                <footer className="text-right">
                  <span className="text-xs text-slate-400">Partido #{match.id}</span>
                </footer>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HorariosTentativosJuegos;
