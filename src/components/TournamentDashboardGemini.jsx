/* ---------- TournamentHubPage.jsx (versión integrada) ---------- */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Trophy,
  Calendar,
  Users,
  Megaphone,
  MonitorPlay,
  Loader2,CheckCircle,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const WS_URL       = API_BASE_URL.replace(/^http/, "ws");

/* ------------------------------------------------------------------ */
/*  Colores Michelob                                                   */
/* ------------------------------------------------------------------ */
const c = {
  navy:  "#051638",
  red:   "#E51937",
  cyan:  "#00B7FF",
  gray:  "#F1F5F9",
};

/* ------------------------------------------------------------------ */
/*  Estilos en JS                                                      */
/* ------------------------------------------------------------------ */
const styles = {
    page: { fontFamily: "'Inter', sans-serif", backgroundColor: '#F8F8F8', minHeight: '100vh' },
    header: { position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    headerContent: { padding: '0.75rem 1rem', borderBottom: '1px solid #E2E8F0', textAlign: 'center' },
    tournamentName: { fontSize: '1.25rem', fontWeight: 'bold', color: '#051638' },
    tournamentDate: { fontSize: '0.875rem', color: '#64748B' },
    nav: { display: 'flex', justifyContent: 'space-around', padding: '0.5rem 0', borderBottom: '1px solid #E2E8F0' },
    navButton: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', color: '#64748B', fontSize: '0.75rem', border: 'none', background: 'none', cursor: 'pointer', padding: '0.5rem', flex: 1 },
    navButtonActive: { color: '#E51937', fontWeight: 'bold' },
    content: { padding: '1rem' },
    card: { backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '1rem', border: '1px solid #E2E8F0' },
    cardHeader: { padding: '0.75rem 1rem', borderBottom: '1px solid #E2E8F0', fontWeight: 'bold', color: '#051638' },
    cardBody: { padding: '1rem' },
    tableHeader: { padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', fontSize: '0.8rem' },
    tableCell: { padding: '12px', verticalAlign: 'middle' },
    tableRow: { borderBottom: '1px solid #f0f0f0' },
    winnerIcon: { height: '20px', marginRight: '8px' },
    teamSelect: { width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', backgroundColor: '#F8F8F8', marginBottom: '1rem' },
    bracketContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', flexDirection: 'column', gap: '2rem' },
    bracketRound: { display: 'flex', flexDirection: 'column', gap: '2.5rem' },
    bracketMatch: { position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: '#F1F5F9', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', width: '250px' },
    bracketTeam: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' },
    bracketWinner: { fontWeight: 'bold', color: '#166534' },
    bracketConnector: { position: 'absolute', top: '25%', right: '-20px', width: '20px', height: '50%', borderTop: '2px solid #CBD5E1', borderBottom: '2px solid #CBD5E1', borderRight: '2px solid #CBD5E1' },
    finalRound: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' },

  
  
  serviceDotsContainer: { display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center' },
  serviceDot: { width: '10px', height: '10px', borderRadius: '50%', transition: 'all 0.3s ease' },
  serviceDotActive: { backgroundColor: '#FFB81C', boxShadow: '0 0 8px #FFB81C' },
  inactiveDotStyle: { backgroundColor: '#d1d5db' },
  teamCard: {
 
  borderRadius: "1rem",
  overflow: "hidden",
  border: "1px solid #e0e0e0",
  boxShadow: "0 8px 20px -10px rgba(5,22,56,.3)",
},
teamHeader:   { background: c.navy, color:"#fff", display:"flex", alignItems:"center", gap:"8px", padding:"6px 10px" },
teamLogo:     { width:"32px", height:"32px", borderRadius:"50%", objectFit:"cover" },
posChip:      { marginLeft:"auto", fontSize:"11px", background:c.cyan, color:"#fff", padding:"2px 6px", borderRadius:"8px", fontWeight:600 },





};

/* ------------------------------------------------------------------ */
/*  Utilidades                                                         */
/* ------------------------------------------------------------------ */

/* ---------- Helpers ---------- */
const safeFetch = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
};
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) : "";
const fmtHour = (iso) => iso ? new Date(iso).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "--:--";
const Placeholder = ({children}) => <p className="text-center text-sm text-gray-400 py-8">{children}</p>;



 

const TeamStatCard = ({ team }) => (
  <div style={styles.teamCard}>
    {/* header */}
    <div style={styles.teamHeader}>
  <span style={{ fontWeight: 600 }}>{team.name}</span>
  <span style={styles.posChip}>
        #{team.rank}&nbsp;en&nbsp;
        {team.group}
      </span>
</div>
  
    {/* body */}
    <div style={{padding:"10px 14px", fontSize:"13px", color:c.navy}}>
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
        <span><strong>{team.wins}</strong> G / <strong>{team.losses}</strong> P</span>
        <span>Sets {team.sets_won}-{team.sets_lost}</span>
      </div>
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
        <span>Diff&nbsp;<strong>{team.points_diff}</strong></span>
        <span>Puntos&nbsp;<strong>{team.tournament_points}</strong></span>
      </div>

      {/* racha */}
      <div style={{display:"flex", gap:"4px", marginBottom:6}}>
        {team.last5.map((r,i)=>
          <span key={i} style={{
            width:8,height:8,borderRadius:"50%",
            background:r==="W"?"#16a34a":"#ef4444"
          }}/>
        )}
      </div>

      {/* horario/próx partido */}
      <div style={{fontSize:"11px", color:"#475569"}}>
        <span style={{marginRight:6}}>⏰ {team.next_time}</span>
        {team.is_live && <span style={{
          display:"inline-block",width:8,height:8,borderRadius:"50%",
          background:"#ef4444",animation:"pulse 1.5s infinite"
        }}/>}
      </div>
    </div>
  </div>
);

function mapTeamStats(team, matches) {
  const tMatches = matches.filter(
    (m) => m.team1_id === team.id || m.team2_id === team.id
  );
  const wins  = tMatches.filter((m) => m.winner_id === team.id).length;
  const lost  = tMatches.filter(
    (m) => m.status === "finalizado" && m.winner_id !== team.id
  ).length;

  /* último 5 resultados (W/L) */
  const last5 = tMatches
    .filter((m) => m.status === "finalizado")
    .sort((a, b) => new Date(b.end_time) - new Date(a.end_time))
    .slice(0, 5)
    .map((m) => (m.winner_id === team.id ? "W" : "L"));

  /* diff de juegos / puntos si tu backend lo envía; si no, calcúlalo */
  const diff = team.points_diff ?? 0;

  /* próximo partido pendiente */
  const next = tMatches
    .filter((m) => m.status === "pendiente")
    .sort((a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time))[0];

  return {
    id: team.id,
    logo_url: team.logo_url,      // asegúrate de tener este campo
    name: team.name,
    rank: team.rank ?? "-",       // o calcúlalo con buildGroups
    group: team.groupLabel
      ? `Grupo ${String.fromCharCode(64 + team.groupId)}`
      : "-",
    wins,
    losses: lost,
    sets_won: team.sets_won ?? 0,
    sets_lost: team.sets_lost ?? 0,
    points_diff: diff,
    tournament_points: team.tournament_points ?? 0,
    last5,
    next_time: next ? new Date(next.scheduled_start_time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "—",
    is_live: tMatches.some((m) => m.status === "en_vivo" || m.status === "live"),
  };
}



/* ------------------------------------------------------------------ */
/*  Construcción de grupos (standing)                                  */
/* ------------------------------------------------------------------ */
function buildGroups(matches, teams) {
  if (!matches.length || !teams.length) return [];

  /* --- 1. Construir diccionario por id --------------------------- */
  const byId = Object.fromEntries(
    teams.map((t) => [
      t.id,
      { ...t,
        stats: { G: 0, P: 0, GF: 0, GC: 0 },
        diff: 0,
        tournament_points: 0,
      },
    ])
  );

  /* --- 2. Recorrer partidos finalizados y acumular stats --------- */
  matches
    .filter((m) => m.status === "finalizado" && !m.is_tiebreaker)
    .forEach((m) => {
      const t1 = byId[m.team1_id];
      const t2 = byId[m.team2_id];
      if (!t1 || !t2) return;

      t1.stats.GF += m.team1_score; t1.stats.GC += m.team2_score;
      t2.stats.GF += m.team2_score; t2.stats.GC += m.team1_score;

      if (m.winner_id === m.team1_id) { t1.stats.G++; t2.stats.P++; }
      else                            { t2.stats.G++; t1.stats.P++; }

      t1.tournament_points += m.team1_tournament_points || 0;
      t2.tournament_points += m.team2_tournament_points || 0;

      t1.diff = t1.stats.GF - t1.stats.GC;
      t2.diff = t2.stats.GF - t2.stats.GC;
    });

  /* --- 3. Agrupar por groupId ------------------------------------ */
  const groups = {};
  Object.values(byId).forEach((t) => {
    if (!t.groupId) return;
    if (!groups[t.groupId]) {
      groups[t.groupId] = {
        name: `Grupo ${String.fromCharCode(64 + t.groupId)}`,
        teams: [],
      };
    }
    groups[t.groupId].teams.push(t);
  });

  /* --- 4. Ordenar y asignar rank ⚑⚑⚑ ---------------------------- */
  Object.values(groups).forEach((g) => {
    g.teams.sort(
      (a, b) =>
        b.tournament_points - a.tournament_points ||
        b.diff              - a.diff              ||
        b.stats.GF          - a.stats.GF
    );

    /*  ⚑  Asignamos rank: primero = 1, segundo = 2 …               */
    g.teams.forEach((team, idx) => {
      team.rank = idx + 1;                 // ← ahora cada team tiene rank
    });
  });

  return Object.values(groups);
}

/* ------------------------------------------------------------------ */
/*  Sub-componentes de vista                                           */
/* ------------------------------------------------------------------ */


/* 0. Bolitas de Quien esta Sirviendo -------------------------------------------------- */
const ServiceDots = ({ isServing, s }) => (
  <div style={s.serviceDotsContainer}>
    <div style={{ ...s.serviceDot, ...(isServing ? s.serviceDotActive : s.inactiveDotStyle) }} />
    <div style={{ ...s.serviceDot, ...(isServing ? s.serviceDotActive : s.inactiveDotStyle) }} />
  </div>
);











const scoreboardStyles = (isMobile) => ({
  title: {               /* si más tarde lo necesitas */
    textAlign: "center",
    fontSize: isMobile ? "1.25rem" : "1.75rem",
    fontWeight: 700,
    color: "#051638",
    marginBottom: "0.1rem",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "repeat(auto-fit, minmax(300px, 1fr))"
      : "repeat(auto-fit, minmax(500px, 1fr))",
    gap: "1.5rem",
  },
  matchCard: {
    backgroundColor: "#FFFFFF",
    color: "#051638",
    borderRadius: "1rem",
    border: "1px solid #e0e0e0",
    overflow: "hidden",
    boxShadow: "0 10px 30px -15px rgba(5, 22, 56, 0.3)",
  },
  cardHeader: {
    backgroundColor: "#051638",
    color: "white",
    padding: "0.5rem",
    textAlign: "center",
  },
  cardHeaderTitle: {
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontSize: isMobile ? "0.75rem" : "0.9rem",
  },
  cardBody: {
    padding: isMobile ? "0.75rem 1rem" : "1rem 1.5rem",
  },
  teamRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  teamDetails: { textAlign: "left" },
  playersName: {
    fontWeight: 600,
    fontSize: isMobile ? "0.9em" : "1em",
    color: "#051638",
  },
  teamName: {
    color: "#667",
    fontSize: "0.75em",
    fontWeight: "normal",
    textTransform: "uppercase",
  },
  rightSection: { display: "flex", alignItems: "center", gap: "1rem" },
  score: {
    fontFamily: "'Teko', sans-serif",
    fontSize: isMobile ? "4em" : "8em",
    fontWeight: 700,
    lineHeight: 1,
    color: "#E51937",
    minWidth: "50px",
    textAlign: "right",
  },
  cardFooter: {
    backgroundColor: "rgba(5, 22, 56, 0.05)",
    color: "#666",
    padding: "0.5rem 1.5rem",
    textAlign: "center",
    fontSize: "0.6rem",
  },
  serviceDotsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    transition: "all 0.3s ease",
  },
  serviceDotActive: { backgroundColor: "#FFB81C", boxShadow: "0 0 8px #FFB81C" },
  inactiveDotStyle: { backgroundColor: "#d1d5db" },
  divider: { height: "1px", backgroundColor: "#e0e0e0", border: "none", margin: "0.75rem 0" },
  verticalDivider: { width: "1px", height: "35px", backgroundColor: "#e0e0e0" },
});








































/* 1. Score en vivo -------------------------------------------------- */
const ScoreboardView = ({ matches }) => {
  const isMobile = window.innerWidth < 768; // Ajusta el breakpoint según tus necesidades
  const s = scoreboardStyles(isMobile);
  if (!matches.length) return <p style={{ textAlign: "center", color: "#051638", fontStyle: "italic" }}>Sin partidos en vivo</p>;
    return (
    <div style={s.grid}>
      {matches.map((m) => {
        const isTeam1Serving = m.server_team_id === m.team1_id;
        const isTeam2Serving = m.server_team_id === m.team2_id;

        return (
          <div key={m.id} style={s.matchCard}>
            {/* encabezado */}
            <div style={s.cardHeader}>
              <h2 style={s.cardHeaderTitle}>{m.court_name || `CANCHA #${m.court_id}`}</h2>
            </div>

            {/* cuerpo */}
            <div style={s.cardBody}>
              {/* fila equipo 1 */}
              <div style={s.teamRow}>
                <div style={s.teamDetails}>
                  <p style={s.playersName}>{m.team1_player1_name} / {m.team1_player2_name}</p>
                  <p style={s.teamName}>{m.team1_name}</p>
                </div>
                <div style={s.rightSection}>
                  <ServiceDots isServing={isTeam1Serving} s={s} />
                  <div style={s.verticalDivider}></div>
                  <span style={s.score}>{m.team1_score}</span>
                </div>
              </div>

              <hr style={s.divider} />

              {/* fila equipo 2 */}
              <div style={s.teamRow}>
                <div style={s.teamDetails}>
                  <p style={s.playersName}>{m.team2_player1_name} / {m.team2_player2_name}</p>
                  <p style={s.teamName}>{m.team2_name}</p>
                </div>
                <div style={s.rightSection}>
                  <ServiceDots isServing={isTeam2Serving} s={s} />
                  <div style={s.verticalDivider}></div>
                  <span style={s.score}>{m.team2_score}</span>
                </div>
              </div>
            </div>

            {/* pie */}
            <div style={s.cardFooter}>
              GRUPO {m.group_id ? String.fromCharCode(64 + m.group_id) : "N/A"} – {m.category}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* 2. Standings ------------------------------------------------------ */
const StandingsView = ({ allTeams, allMatches, tournaments }) => {
    const [activeTournamentId, setActiveTournamentId] = useState(tournaments[0]?.id || null);

    const { standingsByGroup, playoffMatches } = useMemo(() => {
        if (!activeTournamentId || !allTeams || !allMatches) return { standingsByGroup: [], playoffMatches: {} };
        
        const teamsOfTournament = allTeams.filter(t => t.tournament_id === activeTournamentId);
        const matchesOfTournament = allMatches.filter(m => m.tournament_id === activeTournamentId);
        
        const getGroupLetter = (id) => id ? String.fromCharCode(64 + id) : null;
        
        const groups = teamsOfTournament.reduce((acc, team) => {
            const groupKey = team.groupId;
            if (groupKey) {
                if (!acc[groupKey]) {
                    acc[groupKey] = { name: `Grupo ${getGroupLetter(groupKey)}`, id: groupKey, teams: [] };
                }
                const teamMatches = matchesOfTournament.filter(m => !m.is_tiebreaker && (m.team1_id === team.id || m.team2_id === team.id));
                const stats = teamMatches.reduce((s, match) => {
                    if (match.status !== 'finalizado') return s;
                    const isTeam1 = match.team1_id === team.id;
                    const myScore = isTeam1 ? (match.team1_score || 0) : (match.team2_score || 0);
                    const opponentScore = isTeam1 ? (match.team2_score || 0) : (match.team1_score || 0);
                    s.GF += myScore; s.GC += opponentScore;
                    if (myScore > opponentScore) s.G += 1; else s.P += 1;
                    return s;
                }, { G: 0, P: 0, GF: 0, GC: 0 });
                acc[groupKey].teams.push({ ...team, stats, diff: stats.GF - stats.GC, tournament_points: team.tournament_points || 0 });
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
        
        const playoffMatches = {
            semifinals: matchesOfTournament.filter(m => m.match_type === 'semifinal'),
            bronze: matchesOfTournament.filter(m => m.match_type === 'final_bronce'),
            gold: matchesOfTournament.filter(m => m.match_type === 'final_oro')
        };

        return { standingsByGroup: Object.values(groups), playoffMatches };
    }, [activeTournamentId, allTeams, allMatches]);

    const BracketMatch = ({ match, title }) => (
        <div style={styles.bracketMatch}>
            <p style={{fontSize: '0.7rem', fontWeight: 'bold', color: '#64748B', marginBottom: '0.5rem'}}>{title}</p>
            <div style={{...styles.bracketTeam, ...(match?.winner_id === match?.team1_id && styles.bracketWinner)}}>
                <span>{match?.team1_name || '??'}</span>
                <span>{match?.team1_score ?? '-'}</span>
            </div>
            <hr style={{margin: '0.25rem 0', borderColor: '#E2E8F0'}}/>
            <div style={{...styles.bracketTeam, ...(match?.winner_id === match?.team2_id && styles.bracketWinner)}}>
                <span>{match?.team2_name || '??'}</span>
                <span>{match?.team2_score ?? '-'}</span>
            </div>
        </div>
    );
    
    return (
        <div>
            <select onChange={e => setActiveTournamentId(parseInt(e.target.value))} value={activeTournamentId || ''} style={styles.teamSelect}>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            {playoffMatches.semifinals.length > 0 ? (
                <div style={styles.bracketContainer}>
                    <div style={styles.bracketRound}>
                        <BracketMatch match={playoffMatches.semifinals[0]} title="Semifinal 1" />
                        <BracketMatch match={playoffMatches.semifinals[1]} title="Semifinal 2" />
                    </div>
                    <div style={styles.finalRound}>
                        <BracketMatch match={playoffMatches.gold[0]} title="Final Oro/Plata" />
                        <BracketMatch match={playoffMatches.bronze[0]} title="Final Bronce" />
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {standingsByGroup.map((group, groupIndex) => (
                        <div key={groupIndex} style={{...styles.card, margin: 0}}>
                            <div style={{...styles.cardHeader, backgroundColor: '#051638', color: 'white'}}><h2 style={{fontSize: '1.1rem'}}>{group.name}</h2></div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                                        <th style={{...styles.tableHeader, width: '40px', textAlign: 'center'}}>#</th>
                                        <th style={styles.tableHeader}>Equipo</th>
                                        <th style={{...styles.tableHeader, textAlign: 'center'}}>G/P</th>
                                        <th style={{...styles.tableHeader, textAlign: 'center'}}>Dif.</th>
                                        <th style={{...styles.tableHeader, textAlign: 'center'}}>Pts.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.teams.map((team, index) => (
                                        <tr key={team.id} style={styles.tableRow}>
                                            <td style={{...styles.tableCell, textAlign: 'center', fontWeight: 'bold'}}>{index + 1}</td>
                                            <td style={{...styles.tableCell, fontWeight: '500'}}>
                                                <div style={{display: 'flex', alignItems: 'center'}}>
                                                    {index === 0 && <img src="/icon1.png" alt="Líder" style={styles.winnerIcon} />}
                                                    {team.name}
                                                </div>
                                            </td>
                                            <td style={{...styles.tableCell, textAlign: 'center', fontFamily: 'monospace'}}>{team.stats.G}/{team.stats.P}</td>
                                            <td style={{...styles.tableCell, textAlign: 'center', fontWeight: 'bold'}}>{team.diff}</td>
                                            <td style={{...styles.tableCell, textAlign: 'center', fontWeight: 'bold', color: '#E51937'}}>{team.tournament_points}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* 3. Schedule ------------------------------------------------------- */
const ScheduleView = ({ matches }) => {
  const upcoming = useMemo(
    () => matches
      .filter((m) => m.status === "pendiente" && m.scheduled_start_time)
      .sort((a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time))
      .slice(0, 25),
    [matches]
  );

  if (!upcoming.length) return <Placeholder>No hay juegos programados</Placeholder>;

  return (
    <ul className="p-2 space-y-2">
      {upcoming.map((m) => (
        <li key={m.id}
            className="border border-gray-300 shadow-md shadow-gray-200/40 rounded-xl p-2"
            style={{ borderLeft: `4px solid ${c.navy}` }}>
          <div className="flex justify-between text-[11px]">
            <span className="font-bold" style={{ color: c.navy }}>{fmtHour(m.scheduled_start_time)}</span>
            <span className="text-gray-500">
              {m.court_id ? (m.court_name || `Cancha ${m.court_id}`) : <span className="text-red-600">Sin cancha</span>}
            </span>
          </div>
          <p className="text-xs font-semibold mt-0.5">{m.team1_name} vs {m.team2_name}</p>

          {/* jugadores alineados a la derecha */}
          <p className="text-[9px] text-gray-800 leading-tight text-right">
            {m.team1_player1_name ?? "—"} / {m.team1_player2_name ?? "—"}
            <span className="mx-1 text-gray-400">|</span>
            {m.team2_player1_name ?? "—"} / {m.team2_player2_name ?? "—"}
          </p>

          <p className="text-[10px] text-gray-500">
            Grupo {m.group_id ? String.fromCharCode(64 + m.group_id) : "N/A"} – {m.category}
          </p>
        </li>
      ))}
    </ul>
  );
};

/* 4. My Team -------------------------------------------------------- */
const MyTeamView = ({ teams, matches }) => {
  if (!teams.length) return <Placeholder>No hay equipos</Placeholder>;

  const [teamId, setTeamId] = useState(teams[0].id);
  const team = teams.find((t) => t.id === Number(teamId));

  const teamMatches = useMemo(
    () => matches.filter((m) => m.team1_id === Number(teamId) || m.team2_id === Number(teamId)),
    [matches, teamId]
  );

  const stats = useMemo(() => {
    let G = 0, P = 0, pending = 0;
    teamMatches.forEach((m) => {
      if (m.status === "pendiente") pending++;
      else if (m.winner_id === Number(teamId)) G++; else P++;
    });
    return { G, P, pending, played: G + P };
  }, [teamMatches, teamId]);

  return (
    <div className="space-y-3">
      <select value={teamId} onChange={(e) => setTeamId(e.target.value)}
              className="w-full bg-gray-100 rounded border px-2 py-1 text-sm">
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      <div>
      <div style={styles.grid}>
     <TeamStatCard team={mapTeamStats(team, matches)} />
   </div>

      </div>

      <h3 className="text-xs font-bold uppercase" style={{ color: c.navy }}>Jugadores</h3>
      <PlayerAccordion players={team.players || []} matches={matches} />

      <h3 className="text-xs font-bold uppercase mt-3" style={{ color: c.navy }}>Próximos juegos</h3>
      {teamMatches.filter((m) => m.status === "pendiente").length ? (
        <ul className="space-y-2">
          {teamMatches
            .filter((m) => m.status === "pendiente")
            .sort((a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time))
            .map((m) => (
              <li key={m.id} className="border-l-4 p-2" style={{ borderColor: c.cyan }}>
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold">{fmtHour(m.scheduled_start_time)}</span>
                  <span className="text-gray-500">
                    {m.court_id ? (m.court_name || `Cancha ${m.court_id}`) : <span className="text-red-600">(Sin cancha)</span>}
                  </span>
                </div>
                <p className="text-xs font-semibold mt-0.5">{m.team1_name} vs {m.team2_name}</p>
              </li>
            ))}
        </ul>
      ) : <p className="text-[11px] text-gray-500">Nada pendiente</p>}
    </div>
  );
};

const StatBox = ({ label, value }) => (
  <div className="p-2" style={{ backgroundColor: c.gray }}>
    <p className="text-[10px] text-gray-500">{label}</p>
    <p className="text-lg font-extrabold" style={{ color: c.red }}>{value}</p>
  </div>
);

const PlayerAccordion = ({ players, matches }) => {
  const [openId, setOpenId] = useState(null);
  if (!players.length) return <p className="text-[11px] text-gray-500">Sin jugadores</p>;

  const byCat = players.reduce((acc, p) => {
    acc[p.category] = acc[p.category] ? [...acc[p.category], p] : [p];
    return acc;
  }, {});

  return (
    <div className="space-y-1">
      {Object.entries(byCat).map(([cat, plist]) => (
        <div key={cat}>
          <p className="text-[10px] font-bold uppercase text-gray-600">{cat}</p>
          {plist.map((p) => {
            const pMatches = matches.filter((m) =>
              [m.team1_player1_id, m.team1_player2_id, m.team2_player1_id, m.team2_player2_id].includes(p.id)
            );
            const won  = pMatches.filter((m) => m.winner_ids?.includes(p.id)).length;
            const lost = pMatches.filter((m) => m.status === "finalizado" && !m.winner_ids?.includes(p.id)).length;

            return (
              <div key={p.id}
                   className="flex justify-between items-center border px-2 py-1 rounded cursor-pointer text-sm"
                   onClick={() => setOpenId(openId === p.id ? null : p.id)}>
                <span>{p.full_name || p.fullName}</span>
                <span className="text-[10px] text-gray-500">{won}-{lost}</span>

                {openId === p.id && (
                  <Modal onClose={() => setOpenId(null)}>
                    <PlayerStats player={p} won={won} lost={lost} pMatches={pMatches} />
                  </Modal>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex justify-center items-start pt-20 z-50">
    <div className="bg-white w-11/12 max-w-sm rounded-lg p-4 space-y-2 relative">
      <button className="absolute top-2 right-2" onClick={onClose}><X size={18} /></button>
      {children}
    </div>
  </div>
);

const PlayerStats = ({ player, won, lost, pMatches }) => (
  <>
    <h4
      className="font-bold text-sm"
      style={{
        color: c.navy,
        background: "#F1F5F9",
        padding: "4px 6px",
        borderRadius: "6px",
        marginBottom: "6px"
      }}
    >
      {player.full_name || player.fullName}
    </h4>
    <p className="text-xs">   Partidos jugados: <strong>{won + lost}</strong></p>
    <p className="text-xs">&nbsp;&nbsp;&nbsp;&nbsp;Ganados: <strong className="text-green-600">{won}</strong> &nbsp;
      Perdidos: <strong className="text-red-600">{lost}</strong></p>
    <h5 className="font-bold text-xs mt-2" style={{ color: c.navy }}>Próximos juegos</h5>
    <ul className="space-y-1 max-h-40 overflow-y-auto text-[11px]">
      {pMatches.filter((m) => m.status === "pendiente").length ? (
        pMatches.filter((m) => m.status === "pendiente").map((m) => (
          <li key={m.id} className="border-l-4 pl-1" style={{ borderColor: c.cyan }}>
            {fmtHour(m.scheduled_start_time)} – {m.team1_name} vs {m.team2_name}
          </li>
        ))
      ) : <li className="text-gray-500">Sin pendientes</li>}
    </ul>
  </>
);

/* 5. Anuncios ------------------------------------------------------- */
const FinalsView = ({ matches = [] }) => {
  const finished = useMemo(
    () =>  {
    return matches
      .filter((m) => m.status === "finalizado")
      .sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
  }, [matches]);  // ← aquí va la coma

  if (finished.length === 0) {
    return <Placeholder>No hay partidos finalizados</Placeholder>;
  }

  // Reutilizamos ScoreboardView para renderizar las tarjetas
  return <ScoreboardView matches={finished} />;
};

/* ------------------------------------------------------------------ */
/*  Componente principal                                              */
/* ------------------------------------------------------------------ */

/* ---------- Componente principal ---------- */
export default function TournamentHubPage() {
  const [activeView, setActiveView] = useState("live");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [tournaments, setTournaments]     = useState([]);
  const [activeTournamentId, setActiveTournamentId] = useState(null);
  const [tournamentInfo, setTournamentInfo] = useState({ name:"Cargando…", start_date:"" });

  const [matches, setMatches] = useState([]);
  const [teams,   setTeams]   = useState([]);
  const [groups,  setGroups]  = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [players, setPlayers] = useState([]);

 /* -------- fetchTournaments -------- */
  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const list = await safeFetch(`${API_BASE_URL}/api/tournaments`);
      setTournaments(list);
      const active = list.find(t => t.is_active) || list[0];
      setActiveTournamentId(active?.id);
      setTournamentInfo(active);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

 const fetchTournamentData = useCallback(
  async (id, isSilent = false) => {
    if (!isSilent) setLoading(true);

    try {
      /* 1. Traemos la data cruda */
      const [m, t, p] = await Promise.all([
        safeFetch(`${API_BASE_URL}/api/matches/scoreboard/${id}`),
        safeFetch(`${API_BASE_URL}/api/teams/by-tournament/${id}`),
        safeFetch(`${API_BASE_URL}/api/players/by-tournament/${id}`)
      ]);
    console.log("Partidos del torneo 1:", m);
      /* 2. Calculamos los grupos (buildGroups YA devuelve rank) */
      const groupList = buildGroups(m, t);

      /* 3. Creamos diccionarios rank y etiqueta de grupo por id */
      const rankById  = {};
      const labelById = {};
      groupList.forEach(g => {
        g.teams.forEach(team => {
          rankById[team.id]  = team.rank;
          labelById[team.id] = g.name;         // ej. "Grupo A"
        });
      });

      /* 4. Copiamos los teams originales y les inyectamos datos extra */
      const teamsWithRank = t.map(team => ({
        ...team,
        groupId: team.group_id,   // 👈  normalizamos
        rank:  rankById[team.id]  ?? "-",      // ← ahora SÍ tienen rank
        groupLabel: labelById[team.id] ??
                    (team.groupId
                      ? `Grupo ${String.fromCharCode(64 + team.groupId)}`
                      : "-")
      }));

      /* 5. Actualizamos estados */
      setMatches(m);
      setTeams(teamsWithRank);
      setPlayers(p);
      setGroups(groupList);         // el mismo objeto de grupos
      setPlayers(t);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching tournament data:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  },
  []
);

  /* -------- efectos -------- */
  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);
  useEffect(() => { if (activeTournamentId) fetchTournamentData(activeTournamentId); },
    [activeTournamentId, fetchTournamentData]);

  /* -------- WebSocket -------- */
  useEffect(() => {
    // No hace nada si aún no hay un torneo activo
    if (!activeTournamentId) return;

    // La función que recarga los datos del torneo. 
    // Asegúrate de que el nombre coincida con el que usas en tu componente 
    // (ej. fetchDataForTournament o fetchTournamentData)
    const reloadTournamentData = () => {
        fetchTournamentData(activeTournamentId, true); // 'true' para una actualización silenciosa
    };

    const socket = new WebSocket(WS_URL);
    socket.onopen = () => console.log("WebSocket conectado.");
        socket.onmessage = ({ data }) => {
        try {
            const msg = JSON.parse(data);
            
            // CORRECCIÓN: Se accede directamente a 'msg.payload.tournament_id'
            if (
                (msg.type === "SCORE_UPDATE" || msg.type === "MATCH_UPDATE") &&
                Number(msg.payload?.tournament_id) === Number(activeTournamentId)
            ) {
                // CORRECCIÓN: Se vuelve a cargar toda la información del torneo
                // para asegurar consistencia total de los datos.
                fetchTournamentData(activeTournamentId, true);   // ✔ recarga en modo “silencioso”
            }
            if (msg.type === "ANNOUNCEMENT_NEW") {
                setAnnouncements(prev => [{ ...msg.payload, receivedAt: new Date() }, ...prev]);
            }
        } catch (err) { 
            console.error("Error procesando mensaje de WebSocket:", err); 
        }
    };

    // Se asegura de cerrar la conexión cuando el componente se desmonta
    return () => socket.close();

// La dependencia ahora es la función de carga de datos, para asegurar que siempre
// se use la versión más reciente.
}, [activeTournamentId, fetchTournamentData]);

  /* -------- renderContent -------- */
  const renderContent = () => {
    if (loading) return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" />
      </div>
    );
    if (error) return <Placeholder>{error}</Placeholder>;

    switch (activeView) {
      case "standings":     return <StandingsView groups={groups} />;
      case "schedule":      return <ScheduleView  matches={matches} />;
      case "my-team":       return <MyTeamView    teams={teams} matches={matches} />;
      case "finals":        return <FinalsView     matches={matches} />;
      default:              return (
        <ScoreboardView
          matches={matches.filter(
            (m) => m.status === "en_vivo" || m.status === "live"
          )}
        />
      );
    }
  };

  /* -------- JSX principal -------- */
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.tournamentName}>{tournamentInfo.name}</h1>
          <p style={styles.tournamentDate}>{fmtDate(tournamentInfo.start_date)}</p>
        </div>

        <nav style={styles.nav}>
          <NavBtn icon={<MonitorPlay size={20} />} label="En Vivo"   view="live"
                  active={activeView} setActive={setActiveView} />
          <NavBtn icon={<Trophy size={20} />}     label="Standing"  view="standings"
                  active={activeView} setActive={setActiveView} />
          <NavBtn icon={<Calendar size={20} />}   label="Horarios"  view="schedule"
                  active={activeView} setActive={setActiveView} />
          <NavBtn icon={<Users size={20} />}      label="Mi Equipo" view="my-team"
                  active={activeView} setActive={setActiveView} />
          <NavBtn icon={<CheckCircle    size={20} />} label="Finales"    view="finals"        active={activeView} setActive={setActiveView} />
        </nav>
      </header>

      <main style={styles.content}>{renderContent()}</main>
    </div>
  );
}   //  ←  cierre de la función TournamentHubPage

/* ---------- Botón de navegación ---------------------------------- */
const NavBtn = ({ icon, label, view, active, setActive }) => (
  <button
    style={{ ...styles.navButton, ...(active === view && styles.navButtonActive) }}
    onClick={() => setActive(view)}
  >
    {icon}
    <span>{label}</span>
  </button>
);
