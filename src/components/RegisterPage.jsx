// Crea un nuevo archivo en: src/components/RegisterPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Error al registrar el usuario.');
            }
            setMessage('¡Usuario registrado con éxito! Ahora puedes iniciar sesión.');
            setTimeout(() => {
                navigate('/login');
            }, 2000); // Redirige al login después de 2 segundos
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1a1a1a' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem', backgroundColor: '#282c34', borderRadius: '8px', width: '350px' }}>
                <h2 style={{color: 'white', textAlign: 'center'}}>Registrar Nuevo Administrador</h2>
                <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Email" 
                    required 
                    style={{padding: '0.5rem'}} 
                />
                <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Contraseña" 
                    required 
                    style={{padding: '0.5rem'}} 
                />
                <button 
                    type="submit" 
                    style={{padding: '0.5rem', backgroundColor: '#61DAFB', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Registrar
                </button>
                {error && <p style={{color: 'red', textAlign: 'center', fontSize: '0.9rem'}}>{error}</p>}
                {message && <p style={{color: 'green', textAlign: 'center', fontSize: '0.9rem'}}>{message}</p>}
                 <p style={{color: '#aaa', textAlign: 'center', fontSize: '0.8rem', marginTop: '1rem'}}>
                    ¿Ya tienes una cuenta? <Link to="/login" style={{color: '#61DAFB'}}>Inicia sesión</Link>
                </p>
            </form>
        </div>
    );
}
