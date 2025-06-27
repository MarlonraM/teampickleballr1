// src/App.jsx
import React from 'react';
import './App.css';
import MatchList from './components/MatchList'; // <--- This line is the culprit
import TournamentList from './components/TournamentList';
import PlayerList from './components/PlayerList'; // <-- ¿Está este import?
import.meta.env.VITE_API_URL

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Panel de Control del Torneo</h1>
        <TournamentList />
        <hr />
        <PlayerList /> {/* <-- ¿Está esta línea? */}
      </header>
    </div>
  );
}

export default App;
