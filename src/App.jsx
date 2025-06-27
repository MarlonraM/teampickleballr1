// src/App.jsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import MatchList from './components/MatchList';
import ScorekeeperPage from './components/ScorekeeperPage';
import PublicScoreboard from './components/PublicScoreboard';
// --- 1. IMPORTA EL NUEVO PANEL DE ADMINISTRACIÓN ---
import TournamentAdminPage from './components/TournamentAdminPage';

function AdminDashboard() {
  return (
    <header className="App-header">
      <h1>Panel de Control Básico</h1>
      
      {/* --- 3. AÑADE UN ENLACE AL NUEVO PANEL --- */}
      <nav style={{ padding: '20px', display: 'flex', gap: '30px' }}>
        <Link to="/scoreboard" style={{ color: '#61DAFB', fontSize: '1.2em' }}>
          VER TABLERO PÚBLICO
        </Link>
        <Link to="/admin" style={{ color: '#81C784', fontSize: '1.2em', fontWeight: 'bold' }}>
          IR A PANEL DE CONFIGURACIÓN
        </Link>
      </nav>

      <MatchList />
    </header>
  );
}

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Rutas existentes */}
        <Route path="/" element={<AdminDashboard />} />
        {/* He ajustado la ruta a como la tienes tú: /match/:matchId */}
        <Route path="/match/:matchId" element={<ScorekeeperPage />} />
        <Route path="/scoreboard" element={<PublicScoreboard />} />

        {/* --- 2. AÑADE LA RUTA PARA EL NUEVO PANEL --- */}
        <Route path="/admin" element={<TournamentAdminPage />} />

      </Routes>
    </div>
  );
}

export default App;
