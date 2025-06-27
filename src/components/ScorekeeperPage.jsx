import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, X } from 'lucide-react'; // Asumiendo que usas lucide-react para los iconos

// --- CONFIGURACIÓN DE URLS ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

// --- Componente GameOverModal con Tailwind CSS ---
const GameOverModal = ({ isOpen, onClose, winner, finalScore, onConfirm, onScoreChange, onUndo, team1Name, team2Name }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-cyan-400 mb-4 text-center">¡Juego Terminado!</h2>
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-amber-400 flex items-center justify-center">
                        <Trophy className="mr-2" />
                        Ganador: {winner?.name}
                    </h3>
                    <p className="text-center">Confirmar Puntuación Final:</p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                            <label className="text-sm text-slate-300">{team1Name}</label>
                            <input
                                type="number"
                                value={finalScore.team1}
                                onChange={(e) => onScoreChange('team1', parseInt(e.target.value, 10))}
                                className="w-20 p-2 text-center text-2xl font-bold bg-slate-700 rounded-md border-slate-600 border"
                            />
                        </div>
                        <span className="text-2xl font-bold">-</span>
                        <div className="text-center">
                            <label className="text-sm text-slate-300">{team2Name}</label>
                            <input
                                type="number"
                                value={finalScore.team2}
                                onChange={(e) => onScoreChange('team2', parseInt(e.target.value, 10))}
                                className="w-20 p-2 text-center text-2xl font-bold bg-slate-700 rounded-md border-slate-600 border"
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onUndo} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md font-semibold">Deshacer</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold">Confirmar Resultado</button>
                </div>
            </div>
        </div>
    );
};

// --- Componente ServiceDots con Tailwind CSS ---
const ServiceDots = ({ isServingTeam, serverNum, isFirstServeOfGame }) => {
    const firstDotActive = isServingTeam;
    // El segundo punto solo se muestra activo si es el turno del primer servidor
    // en un rally que no sea el primer servicio del juego.
    const secondDotActive = isServingTeam && !isFirstServeOfGame && serverNum === 1;

    return (
        <div className="flex gap-1.5">
            <div className={`w-3 h-3 rounded-full transition-all ${firstDotActive ? 'bg-yellow-400 shadow-[0_0_6px_yellow]' : 'bg-slate-600'}`}></div>
            <div className={`w-3 h-3 rounded-full transition-all ${secondDotActive ? 'bg-yellow-400 shadow-[0_0_6px_yellow]' : 'bg-slate-600'}`}></div>
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

    const persistAndNotify = useCallback(async (updateData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
            if (!response.ok) throw new Error('Failed to save game state');
            const savedMatch = await response.json();
            if (socket.current?.readyState === WebSocket.OPEN) {
                socket.current.send(JSON.stringify({ type: 'SCORE_UPDATE', matchId: savedMatch.id, payload: { ...savedMatch, ...updateData } }));
            }
        } catch (error) { console.error("Error persisting game state:", error); }
    }, [matchId]);
    
    const fetchMatchDetails = useCallback(() => {
        fetch(`${API_BASE_URL}/api/matches/${matchId}/details`)
            .then(res => res.json()).then(data => {
                setMatchDetails(data);
                setScore({ team1: data.match.team1_score || 0, team2: data.match.team2_score || 0 });
                if (data.match.status === 'finalizado') { setGameState('finished'); }
                else if (data.match.status === 'en_vivo' || data.match.status === 'asignado') {
                    setServingTeamId(data.match.server_team_id);
                    setServerNumber(data.match.server_number || 1);
                    setFirstServers(data.match.first_servers);
                    setPlayerPositions(data.match.player_positions);
                    setFirstSideOutDone(data.match.first_side_out_done ?? false);
                    setGameState('playing');
                } else { setGameState('setup'); }
            }).catch(err => setGameState('error'));
    }, [matchId]);
    
    useEffect(() => {
        fetchMatchDetails();
        socket.current = new WebSocket(WS_URL);
        return () => socket.current.close();
    }, [fetchMatchDetails]);

    const saveStateToHistory = () => { setHistory(prev => [...prev, { score, servingTeamId, serverNumber, playerPositions, firstSideOutDone }]);};
    const handleUndo = () => { if (history.length === 0) return; const lastState = history.pop(); setScore(lastState.score); setServingTeamId(lastState.servingTeamId); setServerNumber(lastState.serverNumber); setPlayerPositions(lastState.playerPositions); setFirstSideOutDone(lastState.firstSideOutDone); setHistory([...history]); };
    const handleStartGame = async (firstServingTeamId) => {
        const category = matchDetails.match.category;
        const team1Players = matchDetails.team1.players.filter(p => p.category === category);
        const team2Players = matchDetails.team2.players.filter(p => p.category === category);
        if (team1Players.length < 2 || team2Players.length < 2) return;
        const newPlayerPositions = { team1_right: team1Players[0].id, team1_left: team1Players[1].id, team2_right: team2Players[0].id, team2_left: team2Players[1].id };
        const newFirstServers = { team1: team1Players[0].id, team2: team2Players[0].id };
        setFirstServers(newFirstServers);
        setServingTeamId(firstServingTeamId);
        setServerNumber(1);
        setPlayerPositions(newPlayerPositions);
        setGameState('playing');
        await persistAndNotify({ status: 'en_vivo', server_team_id: firstServingTeamId, server_number: 1, start_time: new Date().toISOString(), first_servers: newFirstServers, player_positions: newPlayerPositions });
    };

    const checkWinCondition = (newScore) => {
        const { team1: score1, team2: score2 } = newScore;
        if ((score1 >= 11 || score2 >= 11) && Math.abs(score1 - score2) >= 2) {
            setWinner(score1 > score2 ? matchDetails.team1 : matchDetails.team2);
            setEditableFinalScore(newScore);
            setIsGameOver(true);
        }
    };
    
    const handlePoint = () => {
        saveStateToHistory();
        let newScore = { ...score };
        if (servingTeamId === matchDetails.team1.id) newScore.team1++; else newScore.team2++;
        setScore(newScore);
        persistAndNotify({ team1_score: newScore.team1, team2_score: newScore.team2 });
        checkWinCondition(newScore);
        setPlayerPositions(prev => servingTeamId === matchDetails.team1.id ? { ...prev, team1_right: prev.team1_left, team1_left: prev.team1_right } : { ...prev, team2_right: prev.team2_left, team2_left: prev.team2_right });
    };

    const handleSideOut = () => {
        saveStateToHistory();
        const isFirstServeOfGame = !firstSideOutDone;
        if (isFirstServeOfGame) {
            setFirstSideOutDone(true);
            const otherTeamId = servingTeamId === matchDetails.team1.id ? matchDetails.team2.id : matchDetails.team1.id;
            setServingTeamId(otherTeamId);
            setServerNumber(1);
            persistAndNotify({ server_team_id: otherTeamId, server_number: 1, first_side_out_done: true });
        } else if (serverNumber === 1) {
            setServerNumber(2);
            persistAndNotify({ server_number: 2 });
        } else {
            const otherTeamId = servingTeamId === matchDetails.team1.id ? matchDetails.team2.id : matchDetails.team1.id;
            setServingTeamId(otherTeamId);
            setServerNumber(1);
            persistAndNotify({ server_team_id: otherTeamId, server_number: 1 });
        }
    };
    
    const handleConfirmWin = async () => {
        await fetch(`${API_BASE_URL}/api/matches/${matchId}/finalize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ team1_score: editableFinalScore.team1, team2_score: editableFinalScore.team2 }) });
        setIsGameOver(false);
        setGameState('finished');
    };

    if (gameState === 'loading') return <div className="flex justify-center items-center h-screen"><p>Cargando...</p></div>;
    if (gameState === 'error' || !matchDetails) return <div className="flex justify-center items-center h-screen text-red-500"><p>Error al cargar el partido.</p></div>;

    const PlayerInfo = ({ playerId }) => {
        const player = matchDetails.team1.players.find(p => p.id === playerId) || matchDetails.team2.players.find(p => p.id === playerId);
        return <p className="font-bold bg-green-900/50 px-2 py-1 rounded">{player?.full_name || 'Jugador'}</p>;
    };

    if (gameState === 'setup') {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-8 text-white">
                <h1 className="text-3xl font-bold">Configurar Partido #{matchDetails.match.id}</h1>
                <h2 className="text-xl mt-2">{matchDetails.team1.name} vs {matchDetails.team2.name}</h2>
                <p className="mt-4">Por favor, define qué equipo sirve primero.</p>
                <div className="flex gap-4 mt-4">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md" onClick={() => handleStartGame(matchDetails.team1.id)}>{matchDetails.team1.name} Sirve</button>
                    <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-md" onClick={() => handleStartGame(matchDetails.team2.id)}>{matchDetails.team2.name} Sirve</button>
                </div>
            </div>
        );
    }
    
    if (gameState === 'finished') {
        return <div className="flex flex-col items-center justify-center h-screen text-center"><h1 className="text-4xl font-bold">Partido Finalizado</h1><p className="text-2xl mt-4">{matchDetails.team1.name}: {score.team1} - {matchDetails.team2.name}: {score.team2}</p></div>;
    }

    return (
        <div className="py-8 px-4 max-w-4xl mx-auto text-white">
            <GameOverModal isOpen={isGameOver} onClose={() => setIsGameOver(false)} winner={winner} finalScore={editableFinalScore} onConfirm={handleConfirmWin} onScoreChange={(team, value) => setEditableFinalScore(prev => ({...prev, [team]: value}))} onUndo={handleUndo} team1Name={matchDetails.team1.name} team2Name={matchDetails.team2.name} />
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold">Partido #{matchDetails.match.id} - {matchDetails.match.category}</h1>
            </div>
            
            <div className="grid grid-cols-[1fr_auto_1fr] w-full max-w-[800px] mx-auto border-4 border-white aspect-[2/1] bg-green-900">
                <div className="grid grid-rows-2 relative"><h2 className="absolute top-2 w-full text-center font-bold text-lg">{matchDetails.team1.name}</h2>
                    <div className="border border-green-300 flex items-center justify-center p-2"><PlayerInfo playerId={playerPositions.team1_left} /></div>
                    <div className="border border-green-300 flex items-center justify-center p-2"><PlayerInfo playerId={playerPositions.team1_right} /></div>
                </div>
                <div className="bg-white/50 w-1" />
                <div className="grid grid-rows-2 relative"><h2 className="absolute top-2 w-full text-center font-bold text-lg">{matchDetails.team2.name}</h2>
                     <div className="border border-green-300 flex items-center justify-center p-2"><PlayerInfo playerId={playerPositions.team2_left} /></div>
                     <div className="border border-green-300 flex items-center justify-center p-2"><PlayerInfo playerId={playerPositions.team2_right} /></div>
                </div>
            </div>

            <div className="bg-slate-700 p-4 rounded-lg w-full max-w-2xl mx-auto mt-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-3"><ServiceDots isServingTeam={servingTeamId === matchDetails.team1.id} serverNum={serverNumber} isFirstServeOfGame={!firstSideOutDone}/> <p className="text-lg">{matchDetails.team1.name}</p></div>
                        <p className="text-4xl font-bold">{score.team1}</p>
                    </div>
                     <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-3"><ServiceDots isServingTeam={servingTeamId === matchDetails.team2.id} serverNum={serverNumber} isFirstServeOfGame={!firstSideOutDone}/> <p className="text-lg">{matchDetails.team2.name}</p></div>
                        <p className="text-4xl font-bold">{score.team2}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-600 w-full flex justify-center gap-4">
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold" onClick={handlePoint}>Punto (+)</button>
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold" onClick={handleSideOut}>Side Out / Falta</button>
                        <button className="px-4 py-2 border border-white rounded-md disabled:opacity-50" onClick={handleUndo} disabled={history.length === 0}>Deshacer</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
