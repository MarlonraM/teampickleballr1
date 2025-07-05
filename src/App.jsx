// 3. Actualiza tu archivo principal de rutas: src/App.jsx

import React from 'react';
// CORRECCIÓN: Se elimina BrowserRouter de aquí, asumiendo que está en main.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import TournamentAdminPage from './components/TournamentAdminPage';
import ScorekeeperPage from './components/ScorekeeperPage';
import PublicScoreboard from './components/PublicScoreboard';
import PublicScoreboardMichelob from './components/PublicScoreboardMichelob';
import RegisterPage from './components/RegisterPage';
import LoginPage from './pages/LoginPage';
import Horarios from './components/HorariosTentativosJuegos';
import ProtectedRoute from './components/ProtectedRoute';
//import TournamentDashboard from './components/TournamentDashboard';
import TournamentDashboardGemini from './components/TournamentDashboardGemini';


function App() {
  // CORRECCIÓN: Se elimina el <BrowserRouter> que envolvía todo.
  // El componente <Routes> debe ser el elemento de nivel superior.
  return (

    <Routes>
    
        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/Horarios" element={<Horarios />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/scoreboard" element={<PublicScoreboard />} />
        <Route path="/scoreboard/michelob" element={<PublicScoreboardMichelob />} />
      {/*<Route path="/scoreboard/Dashboard" element={<TournamentDashboard />} />*/}
        <Route path="/scoreboard/gemini" element={<TournamentDashboardGemini />} />
        


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
          path="/match/:matchId" 
          element={
            <ProtectedRoute>
              <ScorekeeperPage />
            </ProtectedRoute>
          } 
        />
        
            {/* --- CORRECCIÓN --- */}
        {/* Redirección por defecto a la página de Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
      </Routes>
 
  );
}

export default App;
