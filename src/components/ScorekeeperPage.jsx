import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

// --- Estilos ---
const styles = {
  court: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gridTemplateRows: '1fr',
    border: '3px solid #fff',
    width: '100%',
    maxWidth: '800px',
    margin: '20px auto',
    backgroundColor: '#004d40',
    aspectRatio: '2 / 1',
  },
  teamSide: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr 1fr',
    position: 'relative',
  },
  net: {
    width: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  playerBox: {
    border: '1px solid #a7ffeb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    position: 'relative',
    paddingTop: '20px',
  },
  kitchenArea: {
    position: 'absolute',
    top: '0',
    bottom: '0',
    width: '31.8%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 1,
  },
  teamNameOnCourt: {
    position: 'absolute',
    top: '8px',
    width: '100%',
    textAlign: 'center',
    fontSize: '1em',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '1px 1px 2px black',
    zIndex: 3,
  },
  playerName: {
    fontSize: '0.9em',
    fontWeight: 'bold',
    zIndex: 2,
    position: 'relative',
    backgroundColor: 'rgba(0, 77, 64, 0.5)',
    padding: '2px 5px',
    borderRadius: '4px',
  },
  scoreboard: {
    padding: '15px',
    border: '1px solid gray',
    borderRadius: '8px',
    margin: '20px auto',
    maxWidth: '700px',
  },
  score: {
    fontSize: '2.5em',
    fontWeight: 'bold',
  },
  teamInfo: {
    fontSize: '1.1em',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  serviceDotsContainer: {
    display: 'flex',
    gap: '5px',
  },
  serviceDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#444',
    transition: 'background-color 0.3s',
  },
  serviceDotActive: {
    backgroundColor: 'yellow',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#282c34',
    padding: '30px',
    borderRadius: '10px',
    textAlign: 'center',
    color: 'white',
    border: '2px solid #61DAFB',
  },
  modalTitle: {
    fontSize: '2em',
    marginBottom: '20px',
  },
  modalScoreInput: {
    width: '60px',
    fontSize: '1.5em',
    textAlign: 'center',
    margin: '0 10px',
  },
  modalButton: {
    padding: '10px 20px',
    fontSize: '1.2em',
    cursor: 'pointer',
    margin: '30px 10px 0 10px'
  }
};

const GameOverModal = ({ isOpen, winner, finalScore, onConfirm, onScoreChange, onUndo, team1Name, team2Name }) => {
    if (!isOpen) return null;
    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h2 style={styles.modalTitle}>¡Juego Terminado!</h2>
                <h3>🏆 Ganador: {winner?.name || 'N/A'} 🏆</h3>
                <div>
                    <h4>Confirmar Puntuación Final:</h4>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8em', marginBottom: '5px' }}>{team1Name}</div>
                            <input type="number" style={styles.modalScoreInput} value={finalScore.team1} onChange={(e) => onScoreChange('team1', parseInt(e.target.value, 10))} />
                        </div>
                        <span>-</span>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8em', marginBottom: '5px' }}>{team2Name}</div>
                            <input type="number" style={styles.modalScoreInput} value={finalScore.team2} onChange={(e) => onScoreChange('team2', parseInt(e.target.value, 10))} />
                        </div>
                    </div>
                </div>
                <div>
                    <button onClick={onUndo} style={{...styles.modalButton, backgroundColor: '#ffc107'}}>Deshacer Último Punto</button>
                    <button onClick={onConfirm} style={{...styles.modalButton, backgroundColor: '#28a745'}}>Confirmar Resultado</button>
                </div>
            </div>
        </div>
    );
}

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

    const handleUndo = () => { if (history.length === 0) return; const lastState = history[history.length - 1]; setScore(lastState.score); setServingTeamId(lastState.servingTeamId); setServerNumber(lastState.serverNumber); setPlayerPositions(lastState.playerPositions); setFirstSideOutDone(lastState.firstSideOutDone); setHistory(prev => prev.slice(0, -1)); };

    const handleUndoFromModal = () => { handleUndo(); setIsGameOver(false); setWinner(null); };

    

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



        // --- CORRECCIÓN CLAVE ---

        // Se llama a la función correcta 'persistGameState' y se envía el estado 'en_vivo'.

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



  if (gameState === 'loading') {
        return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.5em' }}>Cargando datos del partido...</div>;
    }

    if (gameState === 'error' || !matchDetails || !matchDetails.team1 || !matchDetails.team2) {
        return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.5em', color: 'red' }}>Error al cargar los datos. Revisa la consola.</div>;
    }

    // A partir de aquí, es seguro usar matchDetails
    const { team1, team2 } = matchDetails;

    if (gameState === 'setup') {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Configurar Partido #{matchDetails.match.id}</h2>
                <h3>{team1.name} vs {team2.name}</h3>
                <p>Por favor, define qué equipo sirve primero.</p>
                <button style={{padding: '10px 20px', fontSize: '1.2em', marginRight: '20px'}} onClick={() => handleStartGame(team1.id)}>{team1.name} Sirve Primero</button>
                <button style={{padding: '10px 20px', fontSize: '1.2em'}} onClick={() => handleStartGame(team2.id)}>{team2.name} Sirve Primero</button>
            </div>
        );
    }

    if (gameState === 'finished') {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1>Partido Finalizado</h1>
                <h2>{team1.name}: {score.team1}</h2>
                <h2>{team2.name}: {score.team2}</h2>
            </div>
        );
    }
    
    const getPlayerById = (id) => team1.players.find(p => p.id === id) || team2.players.find(p => p.id === id);
    const PlayerInfo = ({ playerId, teamId }) => {
        const player = getPlayerById(playerId);
        if (!player) return null;
        const isFirstServer = firstServers && firstServers[teamId === team1.id ? 'team1' : 'team2'] === playerId;
        return <div style={styles.playerName}>{player.full_name} {isFirstServer && '(1)'}</div>
    };



    const isFirstServeOfGame = !firstSideOutDone;
    const ServiceDots = ({ isServingTeam, serverNum, isFirstServeOfGame }) => {
        const secondDotActive = isServingTeam && isFirstServeOfGame || isServingTeam && serverNum === 2;
        const firstDotActive = isServingTeam || isServingTeam && serverNum === 1;

        return (
            <div style={styles.serviceDotsContainer}>
                <div style={{...styles.serviceDot, ...(firstDotActive && styles.serviceDotActive)}}></div>
                <div style={{...styles.serviceDot, ...(secondDotActive && styles.serviceDotActive)}}></div>
            </div>
        );
    };

    return (
        <div style={{ textAlign: 'center' }}>
            {isGameOver && (
                <GameOverModal 
                    winner={winner} 
                    finalScore={editableFinalScore}
                    onConfirm={handleConfirmWin}
                    onUndo={handleUndoFromModal}
                    onScoreChange={(team, value) => setEditableFinalScore(prev => ({...prev, [team]: isNaN(value) ? 0 : value}))}
                    team1Name={team1.name}
                    team2Name={team2.name}
                />

            )}

            <h3>Partido #{matchDetails.match.id} - {matchDetails.match.category}</h3>

            

            <div style={styles.court}>

                <div style={styles.teamSide}>

                    <div style={styles.teamNameOnCourt}>{team1.name}</div>

                    <div style={{ ...styles.kitchenArea, right: '0' }}></div>

                    <div style={{ ...styles.playerBox }}>

                        <PlayerInfo playerId={playerPositions.team1_left} teamId={team1.id} />

                    </div>

                    <div style={{ ...styles.playerBox }}>

                        <PlayerInfo playerId={playerPositions.team1_right} teamId={team1.id} />

                    </div>

                </div>

                

                <div style={styles.net}></div>

                

                <div style={styles.teamSide}>

                    <div style={styles.teamNameOnCourt}>{team2.name}</div>

                    <div style={{ ...styles.kitchenArea, left: '0' }}></div>

                    <div style={{ ...styles.playerBox }}>

                        <PlayerInfo playerId={playerPositions.team2_left} teamId={team2.id} />

                    </div>

                    <div style={{ ...styles.playerBox }}>

                        <PlayerInfo playerId={playerPositions.team2_right} teamId={team2.id} />

                    </div>

                </div>

            </div>



            <div style={styles.scoreboard}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                    <div style={styles.teamInfo}>

                        {/* Pasamos el prop 'isFirstServeOfGame' que faltaba */}

                        <ServiceDots isServingTeam={servingTeamId === team1.id} serverNum={serverNumber} isFirstServeOfGame={isFirstServeOfGame} />

                        {team1.name}

                    </div>

                    <div style={styles.score}>{score.team1}</div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>

                    <div style={styles.teamInfo}>

                        {/* Pasamos el prop 'isFirstServeOfGame' que faltaba */}

                        <ServiceDots isServingTeam={servingTeamId === team2.id} serverNum={serverNumber} isFirstServeOfGame={isFirstServeOfGame} />

                        {team2.name}

                    </div>

                    <div style={styles.score}>{score.team2}</div>

                </div>

                {/* ----- FIN DE LA CORRECCIÓN ----- */}

                <hr style={{margin: '15px 0'}}/>

                <div style={{display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px'}}>

                    <button onClick={handlePoint} style={{padding: '10px 15px', fontSize: '1em', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px'}}>Punto (+)</button>

                    <button onClick={handleSideOut} style={{padding: '10px 15px', fontSize: '1em', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px'}}>Side Out / Falta</button>

                    <button onClick={handleUndo} disabled={history.length === 0} style={{padding: '10px 15px', fontSize: '1em', border: '1px solid white', borderRadius: '5px'}}>Deshacer</button>

                </div>

            </div>

        </div>

    );

}



export default ScorekeeperPage;
