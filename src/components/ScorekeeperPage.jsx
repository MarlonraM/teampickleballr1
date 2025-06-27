import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, X, Undo } from 'lucide-react';

// --- CONFIGURACIÓN DE URLS ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

// --- Componente GameOverModal con Tailwind CSS ---
const GameOverModal = ({ isOpen, onClose, winner, finalScore, onConfirm, onScoreChange, onUndo, team1Name, team2Name }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-lg text-center">
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
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

// --- Componente ServiceDots con Tailwind CSS ---
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
    const [playerPositions, setPlayerPositions] = useState(null);
    const [firstServers, setFirstServers] = useState(null);
    const [history, setHistory] = useState([]);
    const [firstSideOutDone, setFirstSideOutDone] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [editableFinalScore, setEditableFinalScore] = useState({ team1: 0, team2: 0 });
    const socket = useRef(null);

    const persistAndNotify = useCallback(async (updateData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Failed to save game state');
            }
            
            const savedMatch = await response.json();
            if (socket.current?.readyState === WebSocket.OPEN) {
                socket.current.send(JSON.stringify({ type: 'SCORE_UPDATE', matchId: savedMatch.id, payload: { ...savedMatch, ...updateData } }));
            }
            return true; // Indica éxito
        } catch (error) {
            console.error("Error persisting/notifying game state:", error);
            alert(error.message); // Muestra el error al usuario
            return false; // Indica fallo
        }
    }, [matchId]);
    
    const fetchMatchDetails = useCallback(() => {
        fetch(`${API_BASE_URL}/api/matches/${matchId}/details`)
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Network response was not ok')))
            .then(data => {
                setMatchDetails(data);
                const currentStatus = data.match.status;
                const score1 = data.match.team1_score || 0;
                const score2 = data.match.team2_score || 0;
                setScore({ team1: score1, team2: score2 });
                setEditableFinalScore({ team1: score1, team2: score2 });

                if (currentStatus === 'finalizado') { setGameState('finished'); } 
                else if ((currentStatus === 'en_vivo') && data.match.player_positions) {
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
            .catch(err => setGameState('error'));
    }, [matchId]);

    useEffect(() => {
        fetchMatchDetails();
        const ws = new WebSocket(WS_URL);
        ws.onopen = () => console.log('WebSocket Connected');
        ws.onclose = () => console.log('WebSocket Disconnected');
        socket.current = ws;
        return () => ws.close();
    }, [fetchMatchDetails]);
    
    const saveStateToHistory = () => { setHistory(prev => [...prev, { score, servingTeamId, serverNumber, playerPositions, firstSideOutDone }]);};
    const handleUndo = () => { /* ... */ };
    
    const handleStartGame = async (firstServingTeamId) => {
        const category = matchDetails.match.category;
        const team1Players = matchDetails.team1.players.filter(p => p.category === category);
        const team2Players = matchDetails.team2.players.filter(p => p.category === category);
        if (team1Players.length < 2 || team2Players.length < 2) return;

        const newPlayerPositions = { team1_right: team1Players[0].id, team1_left: team1Players[1].id, team2_right: team2Players[0].id, team2_left: team2Players[1].id };
        const newFirstServers = { team1: team1Players[0].id, team2: team2Players[0].id };

        const success = await persistAndNotify({
            status: 'en_vivo',
            server_team_id: firstServingTeamId,
            server_number: 1,
            start_time: new Date().toISOString(),
            first_servers: newFirstServers,
            player_positions: newPlayerPositions,
        });

        if (success) {
            setFirstServers(newFirstServers);
            setServingTeamId(firstServingTeamId);
            setServerNumber(1);
            setPlayerPositions(newPlayerPositions);
            setGameState('playing');
        }
    };

    const checkWinCondition = (newScore) => { /* ... */ };
    const handlePoint = () => { /* ... */ };
    const handleSideOut = () => { /* ... */ };
    const handleConfirmWin = async () => { /* ... */ };
    
    if (gameState === 'loading' || !matchDetails) return <div className="flex justify-center items-center h-screen"><p>Cargando partido...</p></div>;
    if (gameState === 'error') return <div className="flex justify-center items-center h-screen text-red-500"><p>Error al cargar el partido.</p></div>;

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
    
    const team1PlayingPlayers = playerPositions ? [getPlayerById(playerPositions.team1_left), getPlayerById(playerPositions.team1_right)] : [];
    const team2PlayingPlayers = playerPositions ? [getPlayerById(playerPositions.team2_left), getPlayerById(playerPositions.team2_right)] : [];
    const team1PlayerNames = team1PlayingPlayers.map(p => p?.full_name).filter(Boolean).join(' / ');
    const team2PlayerNames = team2PlayingPlayers.map(p => p?.full_name).filter(Boolean).join(' / ');

    return (
        <div className="bg-slate-900 min-h-screen text-white p-4 font-sans">
            <GameOverModal isOpen={isGameOver} onClose={() => setIsGameOver(false)} winner={winner} finalScore={editableFinalScore} onConfirm={handleConfirmWin} onScoreChange={(team, value) => setEditableFinalScore(prev => ({...prev, [team]: value}))} onUndo={handleUndo} team1Name={matchDetails.team1.name} team2Name={matchDetails.team2.name} />
            <div className="max-w-md mx-auto">{/* ... (JSX del marcador y cancha) ... */}</div>
        </div>
    );
}

export default ScorekeeperPage;
