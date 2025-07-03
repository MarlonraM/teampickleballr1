// 3. Actualiza tu archivo principal de rutas: src/App.jsx

import React from 'react';
// CORRECCIÓN: Se elimina BrowserRouter de aquí, asumiendo que está en main.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import TournamentAdminPage from './components/TournamentAdminPage';
import ScorekeeperPage from './components/ScorekeeperPage';
import PublicScoreboard from './components/PublicScoreboard';
import PublicScoreboardMichelob from './components/PublicScoreboardMichelob';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import HorariosTentativosJuegos from './components/HorariosTentativosJuegos';

function App() {
  // CORRECCIÓN: Se elimina el <BrowserRouter> que envolvía todo.
  // El componente <Routes> debe ser el elemento de nivel superior.
  return (
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/scoreboard" element={<PublicScoreboard />} />
        <Route path="/scoreboard/michelob" element={<PublicScoreboardMichelob />} />
        <Route path="/HorariosTentativos" element={<HorariosTentativosJuegos />} />
        
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
  );
}

export default App;
