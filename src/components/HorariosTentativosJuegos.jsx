// HorariosPage.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback
} from "react";
import { Calendar } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CONSTANTES DE CONEXIÓN                                            */
/* ------------------------------------------------------------------ */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const WS_URL       = API_BASE_URL.replace(/^http/, "ws");

/* ------------------------------------------------------------------ */
/*  COMPONENTE PRINCIPAL                                              */
/* ------------------------------------------------------------------ */
const HorariosPage = () => {
  /* ----------- estados globales (torneos + data del torneo activo) -- */
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [activeTournamentId, setActiveTournamentId] = useState(null);

  const [allPlayers, setAllPlayers] = useState([]);
  const [allTeamsForSelection, setAllTeamsForSelection] = useState([]);

  const [allData, setAllData] = useState({
    matches: [],
    teams:   [],
    courts:  [],
    categories: []
  });

  /* ------------------------------------------------------------------ */
  /*  1.  Fetch inicial (lista de torneos + catálogos globales)         */
  /* ------------------------------------------------------------------ */
  const fetchInitialData = useCallback(async () => {
    try {
      const [
        tournamentsRes,
        allTeamsRes,
        allPlayersRes,
        categoriesRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tournaments`),
        fetch(`${API_BASE_URL}/api/teams`),
        fetch(`${API_BASE_URL}/api/players`),
        fetch(`${API_BASE_URL}/api/categories`)
      ]);

      const [tournamentsData, allTeamsData, allPlayersData, categoriesData] =
        await Promise.all([
          tournamentsRes.json(),
          allTeamsRes.json(),
          allPlayersRes.json(),
          categoriesRes.json()
        ]);

      setTournaments(tournamentsData);
      setAllTeamsForSelection(allTeamsData);
      setAllPlayers(allPlayersData);

      // guardamos categorías como catálogo general
      setAllData((prev) => ({ ...prev, categories: categoriesData }));

      if (tournamentsData.length && !activeTournamentId) {
        setActiveTournamentId(tournamentsData[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar datos iniciales.");
    }
  }, [activeTournamentId]);

  /* ------------------------------------------------------------------ */
  /*  2.  Fetch de datos específicos del torneo activo                  */
  /* ------------------------------------------------------------------ */
  const fetchDataForTournament = useCallback(
    async (tournamentId, isSilent = false) => {
      if (!tournamentId) {
        setLoading(false);
        return;
      }
      if (!isSilent) setLoading(true);
      try {
        const [matchesRes, teamsRes, courtsRes, categoriesRes] =
          await Promise.all([
            fetch(`${API_BASE_URL}/api/matches/scoreboard/${tournamentId}`),
            fetch(`${API_BASE_URL}/api/teams/by-tournament/${tournamentId}`),
            fetch(`${API_BASE_URL}/api/courts`),
            fetch(`${API_BASE_URL}/api/categories`)
          ]);

        if (
          !matchesRes.ok ||
          !teamsRes.ok ||
          !courtsRes.ok ||
          !categoriesRes.ok
        ) {
          throw new Error("No se pudieron cargar los datos del torneo.");
        }

        const [matchesData, teamsData, courtsData, categoriesData] =
          await Promise.all([
            matchesRes.json(),
            teamsRes.json(),
            courtsRes.json(),
            categoriesRes.json()
          ]);

        setAllData({
          matches: matchesData,
          teams: teamsData,
          courts: courtsData,
          categories: categoriesData
        });
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    []
  );

  /* ------------------------------------------------------------------ */
  /*  3.  Efectos de montaje / cambio de torneo / WebSocket             */
  /* ------------------------------------------------------------------ */
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
    socket.onopen    = () => console.log("WebSocket conectado a Horarios.");
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (
          (message.type === "MATCH_UPDATE" || message.type === "SCORE_UPDATE") &&
          Number(message.payload.tournament_id) === Number(activeTournamentId)
        ) {
          // refresco silencioso (sin spinner)
          fetchDataForTournament(activeTournamentId, true);
        }
      } catch (err) {
        console.error("Mensaje WS inválido:", err);
      }
    };
    return () => socket.close();
  }, [activeTournamentId, fetchDataForTournament]);

  /* ------------------------------------------------------------------ */
  /*  4.  Render página                                                  */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="p-4 bg-slate-800 flex justify-between items-center">
        <h1 className="text-xl font-bold">Horarios tentativos</h1>
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

      {error && (
        <p className="bg-red-800 text-center p-2 text-sm font-semibold">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-center mt-8 text-slate-400">Cargando…</p>
      ) : (
        <HorariosTentativosJuegos
          matches={allData.matches}
          allPlayers={allPlayers}
          tournamentStartDate={
            tournaments.find((t) => t.id === Number(activeTournamentId))
              ?.start_date
          }
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  COMPONENTE HIJO: lista filtrable de partidos por jugador           */
/* ------------------------------------------------------------------ */
const HorariosTentativosJuegos = ({
  matches: rawMatches,
  allPlayers: rawPlayers,
  tournamentStartDate
}) => {
  /* --- sanitizar props --------------------------------------------- */
  const matches    = Array.isArray(rawMatches) ? rawMatches : [];
  const allPlayers = Array.isArray(rawPlayers) ? rawPlayers : [];

  /* --- fecha por defecto ------------------------------------------- */
  const defaultDate = useMemo(() => {
    const base = tournamentStartDate
      ? new Date(tournamentStartDate)
      : new Date();
    return isNaN(base.getTime())
      ? new Date().toISOString().substring(0, 10)
      : base.toISOString().substring(0, 10);
  }, [tournamentStartDate]);

  const [selectedDate, setSelectedDate] = useState(defaultDate);

  /* --- jugador seleccionado  --------------------------------------- */
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  useEffect(() => {
    if (!selectedPlayerId && allPlayers.length) {
      setSelectedPlayerId(String(allPlayers[0].id));
    }
  }, [allPlayers, selectedPlayerId]);

  /* --- partidos filtrados ------------------------------------------ */
  const filteredMatches = useMemo(() => {
    if (!selectedPlayerId) return [];

    const pid = String(selectedPlayerId);
    return matches
      //.filter((m) => m.status === "pendiente")
      .filter((m) =>
        [
          m.team1_player1_id,
          m.team1_player2_id,
          m.team2_player1_id,
          m.team2_player2_id
        ]
          .map(String)
          .includes(pid)
      )
      .filter(
        (m) =>
          m.scheduled_start_time?.slice(0, 10) === selectedDate // “YYYY-MM-DD”
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time)
      );
  }, [matches, selectedPlayerId, selectedDate]);

  /* --- ayuda para mostrar hora ------------------------------------- */
  const fmtHour = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--";

  /* --- render ------------------------------------------------------- */
  return (
    <div className="flex-1 flex flex-col">
      {/* Barra de filtros */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur p-3 flex flex-col gap-3 shadow-lg border-b border-slate-700">
        <h2 className="text-center text-cyan-400 font-bold">
          Horarios tentativos de juegos
        </h2>

        <div className="flex gap-2">
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="flex-1 bg-slate-700 rounded px-2 py-2 border border-slate-600"
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
            className="bg-slate-700 rounded px-2 py-2 border border-slate-600"
          />
        </div>
      </div>

      {/* Lista de partidos */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {filteredMatches.length === 0 ? (
          <p className="text-center text-slate-400 mt-8">
            No hay partidos pendientes para este jugador en esta fecha.
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredMatches.map((m) => (
              <li
                key={m.id}
                className="bg-slate-800 border-l-4 border-cyan-400 p-3 rounded-lg shadow"
              >
                <header className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400 flex items-center gap-2">
                    <Calendar size={15} />
                    {fmtHour(m.scheduled_start_time)}
                  </span>
                  <span className="bg-slate-700 text-xs px-2 py-1 rounded">
                    {m.category}
                  </span>
                </header>

                <p className="font-semibold text-sm">
                  {m.team1_name} vs {m.team2_name}
                </p>

                <div className="text-[11px] text-slate-300 leading-tight mb-1">
                  <p>
                    <strong>{m.team1_name}:</strong> {m.team1_player1_name || "N/A"} /{" "}
                    {m.team1_player2_name || "N/A"}
                  </p>
                  <p>
                    <strong>{m.team2_name}:</strong> {m.team2_player1_name || "N/A"} /{" "}
                    {m.team2_player2_name || "N/A"}
                  </p>
                </div>

                <footer className="text-right">
                  <span className="text-xs text-slate-400">Partido #{m.id}</span>
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
