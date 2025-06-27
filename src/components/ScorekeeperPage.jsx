import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, X, Undo } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

const GameOverModal = ({ isOpen, onClose, winner, finalScore, onConfirm, onScoreChange, onUndo, team1Name, team2Name }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-lg text-center">
                <h2 className="text-3xl font-bold text-white mb-4">¡Juego Terminado!</h2>
                <div className="space-y-2 mb-6">
                    <h3 className="text-xl font-semibold text-amber-400">GANADOR:</h3>
                    <p className="text-4xl font-bold text-white">{winner?.name}</p>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-4">Confirmar Puntuación Final</h4>
                    <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                            <label className="text-sm text-slate-300">{team1Name}</label>
                            <div className="text-6xl font-bold bg-slate-900/50 border-2 border-slate-600 rounded-lg p-2">{finalScore.team1}</div>
                        </div>
                        <span className="text-4xl font-bold text-slate-500">-</span>
                        <div className="text-center">
                            <label className="text-sm text-slate-300">{team2Name}</label>
                            <div className="text-6xl font-bold bg-slate-900/50 border-2 border-slate-600 rounded-lg p-2">{finalScore.team2}</div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                    <button onClick={onConfirm} className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg uppercase tracking-wider">Confirmar</button>
                    <button onClick={onUndo} className="px-8 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg font-bold text-lg uppercase tracking-wider flex items-center">
                        <Undo className="mr-2 h-5 w-5" /> Deshacer
                    </button>
                </div>
            </div>
        </div>
    );
};
const ServiceDots = ({ isServingTeam }) => {
    return (
        <div className="flex flex-col gap-1.5">
            <div className={`w-3 h-3 rounded-full transition-all ${isServingTeam ? 'bg-yellow-400 shadow-[0_0_6px_yellow]' : 'bg-slate-600'}`}></div>
            <div className={`w-3 h-3 rounded-full transition-all ${isServingTeam ? 'bg-yellow-400 shadow-[0_0_6px_yellow]' : 'bg-slate-600'}`}></div>
        </div>
    );
};
function ScorekeeperPage() {
    const { matchId } = useParams();
    const [gameState, setGameState] = useState('loading');
    const [matchDetails, setMatchDetails] = useState(null);
    const [score, setScore] = useState({ team1: 0, team2: 0 });
    const [servingTeamId, setServingTeamId] = useState(null);
    const [serverNumber, setServerNumber] = useState(1);
    const [playerPositions, setPlayerPositions] = useState({ team1_left: null, team1_right: null, team2_left: null, team2_right: null });
    const [firstServers, setFirstServers] = useState({ team1: null, team2: null });
    const [history, setHistory] = useState([]);
    const [firstSideOutDone, setFirstSideOutDone] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [editableFinalScore, setEditableFinalScore] = useState({ team1: 0, team2: 0 });
    const socket = useRef(null);

    const fetchMatchDetails = useCallback(() => {
        fetch(`${API_BASE_URL}/api/matches/${matchId}/details`)
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Network response was not ok')))
            .then(data => {
                setMatchDetails(data);
                setScore({ team1: data.match.team1_score || 0, team2: data.match.team2_score || 0 });

                if (data.match.status === 'finalizado') {
                    setGameState('finished');
                } else if (data.match.status === 'en_vivo' && data.match.player_positions) {
                    setServingTeamId(data.match.server_team_id);
                    setServerNumber(data.match.server_number || 1);
                    setFirstServers(data.match.first_servers);
                    setPlayerPositions(data.match.player_positions);
                    setFirstSideOutDone(data.match.first_side_out_done ?? false);
                    setGameState('playing');
                } else {
                    setGameState('setup');
                }
            })
            .catch(err => {
                console.error("Error fetching match details:", err);
                setGameState('error');
            });
    }, [matchId]);

    useEffect(() => {
        fetchMatchDetails();
        socket.current = new WebSocket(WS_URL);
        socket.current.onopen = () => console.log("Scorekeeper conectado al WebSocket.");
        socket.current.onclose = () => console.log("Scorekeeper desconectado del WebSocket.");
        return () => { if (socket.current) { socket.current.close(); }};
    }, [fetchMatchDetails]);

    const persistGameState = async (updateData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) throw new Error('Server response not OK');
            const savedMatch = await response.json();
            if (socket.current && socket.current.readyState === WebSocket.OPEN) {
                const message = { type: 'SCORE_UPDATE', matchId: savedMatch.id, payload: { ...savedMatch, ...updateData } };
                socket.current.send(JSON.stringify(message));
            }
        } catch (error) {
            console.error("Error persisting/notifying game state:", error);
        }
    };
  
    // El resto de tus funciones lógicas (handleStartGame, handlePoint, etc.)

    const saveStateToHistory = () => { setHistory(prev => [...prev, { score, servingTeamId, serverNumber, playerPositions, firstSideOutDone }]);};

    const handleUndo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setScore(lastState.score);
        setServingTeamId(lastState.servingTeamId);
        setServerNumber(lastState.serverNumber);
        setPlayerPositions(lastState.playerPositions);
        setFirstSideOutDone(lastState.firstSideOutDone);
        setHistory(prev => prev.slice(0, -1));
        persistGameState({
            team1_score: lastState.score.team1,
            team2_score: lastState.score.team2,
            server_team_id: lastState.servingTeamId,
            server_number: lastState.serverNumber,
            player_positions: lastState.playerPositions,
            first_side_out_done: lastState.firstSideOutDone,
            status: 'en_vivo'
        });
    };

        const handleUndoFromModal = () => {
        handleUndo();
        setIsGameOver(false);
        setWinner(null);
        setGameState('playing'); // <-- CORRECCIÓN CLAVE
    };
                                     
    const handleStartGame = async (firstServingTeamId) => {
        const category = matchDetails.match.category;
        const team1Players = matchDetails.team1.players.filter(p => p.category === category);
        const team2Players = matchDetails.team2.players.filter(p => p.category === category);

        if (team1Players.length < 2 || team2Players.length < 2) {
            console.error("No hay suficientes jugadores para la categoría seleccionada");
            return;
        }

        const team1_first_server = team1Players[0].id;
        const team1_partner = team1Players[1].id;
        const team2_first_server = team2Players[0].id;
        const team2_partner = team2Players[1].id;

        const newPlayerPositions = { team1_right: team1_first_server, team1_left: team1_partner, team2_right: team2_first_server, team2_left: team2_partner };
        const newFirstServers = { team1: team1_first_server, team2: team2_first_server };

        setFirstServers(newFirstServers);
        setServingTeamId(firstServingTeamId);
        setServerNumber(1);
        setPlayerPositions(newPlayerPositions);
        setGameState('playing');

        await persistGameState({
            status: 'en_vivo',
            server_team_id: firstServingTeamId,
            server_number: 1,
            start_time: new Date().toISOString(),
            first_servers: newFirstServers,
            player_positions: newPlayerPositions,
        });
    };

    const checkWinCondition = (newScore) => { const { team1: team1Score, team2: team2Score } = newScore; const winByTwo = Math.abs(team1Score - team2Score) >= 2; if ((team1Score >= 11 || team2Score >= 11) && winByTwo) { const currentWinner = team1Score > team2Score ? matchDetails.team1 : matchDetails.team2; setWinner(currentWinner); setEditableFinalScore(newScore); setIsGameOver(true); } };
    const handlePoint = () => { saveStateToHistory(); let newScore = { ...score }; if (servingTeamId === matchDetails.team1.id) newScore.team1++; else newScore.team2++; setScore(newScore); persistGameState({ team1_score: newScore.team1, team2_score: newScore.team2 }); checkWinCondition(newScore); setPlayerPositions(prev => { if (servingTeamId === matchDetails.team1.id) { return { ...prev, team1_right: prev.team1_left, team1_left: prev.team1_right }; } else { return { ...prev, team2_right: prev.team2_left, team2_left: prev.team2_right }; } }); };
    const handleSideOut = () => { saveStateToHistory(); const isFirstServeOfGame = !firstSideOutDone; const performSideOut = () => { const otherTeamId = servingTeamId === matchDetails.team1.id ? matchDetails.team2.id : matchDetails.team1.id; setServingTeamId(otherTeamId); setServerNumber(1); persistGameState({ server_team_id: otherTeamId, server_number: 1, first_side_out_done: true }); }; if (isFirstServeOfGame) { setFirstSideOutDone(true); performSideOut(); } else if (serverNumber === 1) { setServerNumber(2); persistGameState({ server_number: 2 }); } else { performSideOut(); } };
    const handleConfirmWin = async () => {
        const { team1: score1, team2: score2 } = editableFinalScore;
        if (Math.max(score1, score2) < 11 || Math.abs(score1 - score2) < 2) {
            alert("Puntuación final inválida.");
            return;

        }

        try {

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/${matchId}/finalize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team1_score: score1, team2_score: score2 })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Error al guardar el resultado');
            }
            const finalizedMatch = await response.json();
            if (socket.current && socket.current.readyState === WebSocket.OPEN) {
                socket.current.send(JSON.stringify({
                    type: 'SCORE_UPDATE',
                    matchId: finalizedMatch.id,
                    payload: { status: 'finalizado', winner_id: finalizedMatch.winner_id, team1_score: finalizedMatch.team1_score, team2_score: finalizedMatch.team2_score }
                }));
            }
            alert("Resultado guardado y puntos de torneo asignados exitosamente");
            setScore(editableFinalScore);
            setIsGameOver(false);
            setGameState('finished');
        } catch (error) {
            console.error("Error al confirmar el resultado:", error);
            alert(error.message);
        }
    };

    // --- LÓGICA DE RENDERIZADO CORREGIDA ---
if (gameState === 'loading' || !matchDetails) return <div className="flex justify-center items-center h-screen"><p>Cargando partido...</p></div>;
    if (gameState === 'error') return <div className="flex justify-center items-center h-screen text-red-500"><p>Error al cargar el partido.</p></div>;


    const getPlayerById = (id) => {
        if (!id || !team1?.players || !team2?.players) return null;
        return team1.players.find(p => p.id === id) || team2.players.find(p => p.id === id);
    };
   
    const { team1, team2 } = matchDetails;
    const team1PlayingPlayers = playerPositions ? [getPlayerById(playerPositions.team1_left), getPlayerById(playerPositions.team1_right)] : [];
    const team2PlayingPlayers = playerPositions ? [getPlayerById(playerPositions.team2_left), getPlayerById(playerPositions.team2_right)] : [];
    const team1PlayerNames = team1PlayingPlayers.map(p => p?.full_name).filter(Boolean).join(' / ');
    const team2PlayerNames = team2PlayingPlayers.map(p => p?.full_name).filter(Boolean).join(' / ');
    
    
    
    const PlayerInfo = ({ playerId }) => {
        const player = matchDetails.team1.players.find(p => p.id === playerId) || matchDetails.team2.players.find(p => p.id === playerId);
        return <p className="font-semibold text-lg">{player?.full_name || 'Jugador'}</p>;
    };
 
    const getGroupLetter = (id) => id ? String.fromCharCode(64 + id) : null;
    
    if (gameState === 'setup') {
        return ( <div className="flex flex-col items-center justify-center h-screen text-center p-8 text-white"> <h1 className="text-3xl font-bold">Configurar Partido #{matchDetails.match.id}</h1> <h2 className="text-xl mt-2">{matchDetails.team1.name} vs {matchDetails.team2.name}</h2> <p className="mt-4">Por favor, define qué equipo sirve primero.</p> <div className="flex gap-4 mt-4"> <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md" onClick={() => handleStartGame(matchDetails.team1.id)}>{matchDetails.team1.name} Sirve</button> <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-md" onClick={() => handleStartGame(matchDetails.team2.id)}>{matchDetails.team2.name} Sirve</button> </div> </div> );
    }
    if (gameState === 'finished') {
        return <div className="flex flex-col items-center justify-center h-screen text-center"><h1 className="text-4xl font-bold">Partido Finalizado</h1><p className="text-2xl mt-4">{matchDetails.team1.name}: {score.team1} - {matchDetails.team2.name}: {score.team2}</p></div>;
    }
return (
        <div className="bg-slate-900 min-h-screen text-white p-4 font-sans">
            <GameOverModal isOpen={isGameOver} onClose={() => setIsGameOver(false)} winner={winner} finalScore={editableFinalScore} onConfirm={handleConfirmWin} onScoreChange={(team, value) => setEditableFinalScore(prev => ({...prev, [team]: value}))} onUndo={handleUndoFromModal} team1Name={matchDetails.team1.name} team2Name={matchDetails.team2.name} />
            
            <div className="max-w-md mx-auto">
                <header className="text-center mb-4">
                    <h1 className="text-2xl font-bold">CANCHA #{matchDetails.match.court_id || 'N/A'}</h1>
                    <p className="text-sm text-slate-500 font-mono">PARTIDO #{matchDetails.match.id}</p>
                    <div className="flex justify-between items-center text-sm text-slate-400 mt-2">
                        <span>GRUPO {getGroupLetter(matchDetails.match.group_id) || '?'}</span>
                        <span className="bg-slate-700 px-2 py-0.5 rounded">{matchDetails.match.category}</span>
                        <span>{matchDetails.team1.name} VS {matchDetails.team2.name}</span>
                    </div>
                </header>

                <div className="grid grid-cols-2 gap-px bg-slate-600 rounded-lg overflow-hidden my-6">
                  {playerPositions && <>
                    <div className="bg-blue-900/50 p-4 flex items-center justify-center text-center min-h-[80px] md:min-h-[140px]">
                      <PlayerInfo playerId={playerPositions.team1_left} />
                    </div>
                    <div className="bg-blue-900/50 p-4 flex items-center justify-center text-center min-h-[80px] md:min-h-[140px]">
                      <PlayerInfo playerId={playerPositions.team2_left} />
                    </div>
                    <div className="bg-blue-900/50 p-4 flex items-center justify-center text-center min-h-[80px] md:min-h-[140px]">
                      <PlayerInfo playerId={playerPositions.team1_right} />
                    </div>
                    <div className="bg-blue-900/50 p-4 flex items-center justify-center text-center min-h-[80px] md:min-h-[140px]">
                      <PlayerInfo playerId={playerPositions.team2_right} />
                    </div>
                  </>}
                </div>
                <div className="bg-slate-800 p-4 rounded-lg space-y-3">
                    <div className="flex items-center">
                        <div className="w-10"><ServiceDots isServingTeam={servingTeamId === matchDetails.team1.id} /></div>
                        <div className="flex-grow">
                            <p className="text-xs text-slate-400">{matchDetails.team1.players.map(p=>p.full_name).join(' / ')}</p>
                            <p className="font-bold text-xl">{matchDetails.team1.name}</p>
                        </div>
                        <p className="text-5xl font-bold">{score.team1}</p>
                    </div>
                    <hr className="border-slate-600" />
                    <div className="flex items-center">
                         <div className="w-10"><ServiceDots isServingTeam={servingTeamId === matchDetails.team2.id} /></div>
                        <div className="flex-grow">
                            <p className="text-xs text-slate-400">{matchDetails.team2.players.map(p=>p.full_name).join(' / ')}</p>
                            <p className="font-bold text-xl">{matchDetails.team2.name}</p>
                        </div>
                        <p className="text-5xl font-bold">{score.team2}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6">
                    <button className="col-span-2 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-bold uppercase" onClick={handlePoint}>Punto (+)</button>
                    <button className="py-4 bg-slate-600 hover:bg-slate-700 rounded-lg flex items-center justify-center" onClick={handleUndo} disabled={history.length === 0}>
                        <Undo />
                    </button>
                    <button className="col-span-3 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-bold uppercase" onClick={handleSideOut}>Side Out / Falta</button>
                </div>
            </div>
        </div>
    );
}
export default ScorekeeperPage;
