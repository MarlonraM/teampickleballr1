// 1. Crea un nuevo archivo: src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Error al iniciar sesión');
            }
            localStorage.setItem('token', data.token);
            navigate('/admin');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1a1a1a' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem', backgroundColor: '#282c34', borderRadius: '8px' }}>
                <h2 style={{color: 'white', textAlign: 'center'}}>Iniciar Sesión</h2>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={{padding: '0.5rem'}} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required style={{padding: '0.5rem'}} />
                <button type="submit" style={{padding: '0.5rem', backgroundColor: '#61DAFB', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Entrar</button>
                {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
            </form>
        </div>
    );
}
