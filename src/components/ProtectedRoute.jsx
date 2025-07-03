// 2. Crea un nuevo archivo: src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Si no hay token, redirige al usuario a la página de login
        return <Navigate to="/login" replace />;
    }
    // Si hay un token, muestra el componente protegido
    return children;
};

export default ProtectedRoute;

