import React, { useState, useMemo } from "react";
import { Clock } from "lucide-react";
import {statictournaments, staticcourts, staticmatches} from "../data/staticData";

const HorariosPage = () => {
  // Estados de búsqueda y fecha
  const [playerSearch, setPlayerSearch] = useState("");
  // Inicializa la fecha con la del primer partido estático
  const defaultDate = staticMatches[0]?.scheduled_start_time.slice(0, 10)
    || new Date().toISOString().substring(0, 10);
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  // Torneo activo fijo al primero del array (útil si usas staticTournaments)
  const activeTournamentId = staticTournaments[0]?.id;

  // Datos estáticos agrupados
  const allData = useMemo(
    () => ({ matches: staticMatches, courts: staticCourts }),
    []
  );

  // Genera slots de 20 minutos entre 9:00 y 22:00
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

  // Filtra partidos por fecha y búsqueda de jugador
  const filteredMatches = useMemo(() => {
    let list = allData.matches.filter(
      m => m.scheduled_start_time.slice(0, 10) === selectedDate
    );

    if (playerSearch.trim()) {
      const term = playerSearch.toLowerCase();
      list = list.filter(m => {
        const names = [
          m.team1_player1_name,
          m.team1_player2_name,
          m.team2_player1_name,
          m.team2_player2_name
        ]
          .filter(Boolean)
          .map(n => n.toLowerCase());
        return names.some(n => n.includes(term));
      });
    }

    return list.sort(
      (a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time)
    );
  }, [allData.matches, playerSearch, selectedDate]);

  // Formatea la hora para display
  const fmtHour = iso =>
    iso
      ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : "--:--";

  // Renderiza etiqueta de categoría
  const getCategoryTag = category => {
    const base = "text-xs px-2 py-0.5 rounded-full font-semibold";
    switch (category) {
      case 'Avanzado':
        return <span className={`${base} bg-red-500/20 text-red-300`}>Avanzado</span>;
      case 'Intermedio Fuerte':
        return <span className={`${base} bg-yellow-500/20 text-yellow-300`}>I. Fuerte</span>;
      case 'Intermedio':
        return <span className={`${base} bg-blue-500/20 text-blue-300`}>Intermedio</span>;
      case 'Femenino':
        return <span className={`${base} bg-pink-500/20 text-pink-300`}>Femenino</span>;
      default:
        return <span className={`${base} bg-slate-700`}>{category}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur p-3 flex flex-col gap-3 shadow-lg border-b border-slate-700">
        <div className="flex justify-center items-center gap-3">
          <h1 className="text-cyan-400 font-bold text-xl">Horarios de Juegos</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Busca por nombre de jugador..."
            value={playerSearch}
            onChange={e => setPlayerSearch(e.target.value)}
            className="flex-1 bg-slate-700 rounded px-2 py-2 border border-slate-600"
          />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-slate-700 rounded px-2 py-2 border border-slate-600"
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-3">
        {timeSlots.map((slot, i) => {
          const slotEnd = new Date(slot.getTime() + 20 * 60000);
          const matchesInSlot = filteredMatches.filter(m => {
            const t = new Date(m.scheduled_start_time);
            return t >= slot && t < slotEnd;
          });
          if (!matchesInSlot.length) return null;
          return (
            <div key={i} className="flex gap-4">
              <div className="w-20 text-right text-slate-400 font-mono text-sm pt-1">
                {fmtHour(slot.toISOString())}
              </div>
              <div className="flex-1 border-l-2 border-slate-700 pl-4 space-y-2">
                {matchesInSlot.map(m => (
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

        {!filteredMatches.length && (
          <p className="text-center text-slate-400 mt-8">
            No hay partidos para los filtros seleccionados.
          </p>
        )}
      </div>
    </div>
  );
};

export default HorariosPage;
