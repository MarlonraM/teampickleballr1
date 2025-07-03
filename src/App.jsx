// 3. Actualiza tu archivo principal de rutas: src/App.jsx

import React from 'react';
// --- ¡CORRECCIÓN CLAVE! ---
// Se asegura de que BrowserRouter y todos los componentes de rutas estén importados.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TournamentAdminPage from './components/TournamentAdminPage';
import ScorekeeperPage from './components/ScorekeeperPage';
import PublicScoreboard from './components/PublicScoreboard';
import PublicScoreboardMichelob from './components/PublicScoreboardMichelob';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import HorariosTentativosJuegos from './components/HorariosTentativosJuegos';

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


