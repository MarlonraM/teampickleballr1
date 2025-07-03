// 3. Actualiza tu archivo principal de rutas: src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TournamentAdminPage from './pages/TournamentAdminPage';
import ScorekeeperPage from './pages/ScorekeeperPage';
import PublicScoreboard from './components/PublicScoreboard';
import PublicScoreboardMichelob from './components/PublicScoreboardMichelob';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    // ESTE ES EL ÚNICO <BrowserRouter> EN TODA LA APLICACIÓN
    <BrowserRouter>
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/scoreboard" element={<PublicScoreboard />} />
        <Route path="/scoreboard/michelob" element={<PublicScoreboardMichelob />} />
        
        {/* RUTAS PROTEGIDAS */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <TournamentAdminPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/scorekeeper/:matchId" 
          element={
            <ProtectedRoute>
              <ScorekeeperPage />
            </ProtectedRoute>
          } 
        />

        {/* Redirección por defecto a una página pública */}
        <Route path="*" element={<Navigate to="/scoreboard/michelob" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
