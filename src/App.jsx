// src/App.jsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import MatchList from './components/MatchList';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import ScorekeeperPage from './components/ScorekeeperPage';
import PublicScoreboard from './components/PublicScoreboard';
import HorariosTentativosJuegos from './components/HorariosTentativosJuegos';
import PublicScoreboardMichelob from './components/PublicScoreboardMichelob'; // O la ruta donde lo hayas guardado
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
        <Link to="/scoreboard/michelob" style={{ color: '#61DAFB', fontSize: '1.2em' }}>
          VER TABLERO PÚBLICO
        </Link>    
        <Link to="/admin" style={{ color: '#81C784', fontSize: '1.2em', fontWeight: 'bold' }}>
          IR A PANEL DE CONFIGURACIÓN
        </Link>
            <Link to="/HorariosTentativosJuegos" style={{ color: '#81C784', fontSize: '1.2em', fontWeight: 'bold' }}>
          Horarios Tentativos
        </Link>
      </nav>

      <MatchList />
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/scoreboard" element={<PublicScoreboard />} />
        <Route path="/scoreboard/michelob" element={<PublicScoreboardMichelob />} />
        
        {/* RUTAS PROTEGIDAS */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <TournamentAdminPage />
          </ProtectedRoute>
        } />
        <Route path="/scorekeeper/:matchId" element={
          <ProtectedRoute>
            <ScorekeeperPage />
          </ProtectedRoute>
        } />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/scoreboard/michelob" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
