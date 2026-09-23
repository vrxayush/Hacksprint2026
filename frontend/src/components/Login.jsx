// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';

function Login({ setCurrentUser }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await authService.login(username, password);
            setCurrentUser(data);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container police-theme">
            <div className="auth-card police-card">
                <div className="police-logo">
                    <span className="logo-icon">🛡️</span>
                </div>
                <h2>Police Cyber Crime System</h2>
                <p className="auth-subtitle">Money Laundering Investigation Portal</p>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Enter your username"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </div>
                    
                    <button type="submit" disabled={loading} className="login-button">
                        {loading ? '⏳ Logging in...' : '🔐 Login'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>Authorized Personnel Only</p>
                    <p className="footer-text">For official use only</p>
                </div>
            </div>
        </div>
    );
}

export default Login;