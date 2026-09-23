// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import authService from '../services/auth';
import api from '../services/api';

function Dashboard({ currentUser, setCurrentUser }) {
    const [cases, setCases] = useState([]);
    const [showNewCase, setShowNewCase] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCases();
        fetchProfile();
    }, []);

    const fetchCases = async () => {
        try {
            const response = await api.get('/api/cases');
            setCases(response.data);
        } catch (error) {
            console.error('Error fetching cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/auth/users/me');
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleLogout = () => {
        authService.logout();
        setCurrentUser(null);
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').filter(w => w.length > 0).map(word => word[0]).join('').toUpperCase();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="dashboard">
            {/* Top Navigation */}
            <nav className="navbar">
                <div className="navbar-left">
                    <h1>🛡️ Police Cyber Crime System</h1>
                </div>
                <div className="nav-actions">
                    <Link to="/history" className="nav-link">Case History</Link>
                    <div className="profile-container">
                        <button 
                            className="profile-button" 
                            onClick={() => setShowProfile(!showProfile)}
                        >
                            <div className="profile-avatar">
                                {getInitials(profile?.full_name || currentUser?.username)}
                            </div>
                            <span className="profile-name">{profile?.full_name?.split(' ').slice(-1)[0] || 'User'}</span>
                            <span className="profile-arrow">▼</span>
                        </button>
                        
                        {showProfile && (
                            <div className="profile-dropdown">
                                <div className="profile-header">
                                    <div className="profile-avatar-large">
                                        {getInitials(profile?.full_name || currentUser?.username)}
                                    </div>
                                    <div className="profile-info">
                                        <span className="profile-fullname">{profile?.full_name || 'User'}</span>
                                        <span className="profile-email">{profile?.email}</span>
                                    </div>
                                </div>
                                <div className="profile-details">
                                    <div className="profile-detail-item">
                                        <span className="detail-icon">🎖️</span>
                                        <span className="detail-label">Designation:</span>
                                        <span className="detail-value">{profile?.designation || 'N/A'}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <span className="detail-icon">📋</span>
                                        <span className="detail-label">Badge:</span>
                                        <span className="detail-value">{profile?.badge_number || 'N/A'}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <span className="detail-icon">🏢</span>
                                        <span className="detail-label">SP Name:</span>
                                        <span className="detail-value">{profile?.sp_name || 'N/A'}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <span className="detail-icon">🏛️</span>
                                        <span className="detail-label">Department:</span>
                                        <span className="detail-value">{profile?.department || 'N/A'}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <span className="detail-icon">📞</span>
                                        <span className="detail-label">Phone:</span>
                                        <span className="detail-value">{profile?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <span className="detail-icon">📅</span>
                                        <span className="detail-label">Joined:</span>
                                        <span className="detail-value">{formatDate(profile?.created_at)}</span>
                                    </div>
                                </div>
                                <div className="profile-actions">
                                    <button 
                                        className="logout-button"
                                        onClick={handleLogout}
                                    >
                                        🚪 Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            
            <div className="dashboard-content">
                {/* Welcome Banner */}
                <div className="welcome-banner">
                    <div className="welcome-text">
                        <h2>Welcome, {profile?.full_name?.split(' ')[0] || 'Officer'}! 👮</h2>
                        <p>{profile?.designation} • {profile?.department}</p>
                    </div>
                    <div className="welcome-stats">
                        <div className="stat-box">
                            <span className="stat-value">{cases.length}</span>
                            <span className="stat-label">Total Cases</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-value">{cases.filter(c => c.status === 'completed').length}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-value">{cases.filter(c => c.status === 'pending').length}</span>
                            <span className="stat-label">Pending</span>
                        </div>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="actions-section">
                    <button 
                        className={`new-case-button ${showNewCase ? 'active' : ''}`}
                        onClick={() => setShowNewCase(!showNewCase)}
                    >
                        {showNewCase ? '✖ Cancel' : '➕ New Case'}
                    </button>
                </div>
                
                {/* File Upload */}
                {showNewCase && (
                    <FileUpload 
                        onSuccess={() => {
                            setShowNewCase(false);
                            fetchCases();
                        }}
                    />
                )}
                
                {/* Cases Section */}
                <div className="cases-section">
                    <div className="section-header">
                        <h3>📁 Your Cases</h3>
                        {cases.length > 0 && (
                            <Link to="/history" className="view-all-link">View All →</Link>
                        )}
                    </div>
                    
                    {loading ? (
                        <div className="loading-state">Loading cases...</div>
                    ) : cases.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📂</div>
                            <p>No cases yet. Start a new investigation!</p>
                        </div>
                    ) : (
                        <div className="case-list">
                            {cases.slice(0, 6).map(caseItem => (
                                <div key={caseItem.id} className="case-card">
                                    <div className="case-card-header">
                                        <span className="case-id">Case #{caseItem.id}</span>
                                        <span className={`status-badge status-${caseItem.status}`}>
                                            {caseItem.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <h4>{caseItem.case_name}</h4>
                                    {caseItem.description && (
                                        <p className="case-description">{caseItem.description.substring(0, 80)}...</p>
                                    )}
                                    <div className="case-card-meta">
                                        <span className="meta-item">
                                            <span className="meta-icon">💰</span>
                                            ₹{caseItem.fraud_amount?.toLocaleString() || 'N/A'}
                                        </span>
                                        <span className="meta-item">
                                            <span className="meta-icon">📅</span>
                                            {formatDate(caseItem.created_at)}
                                        </span>
                                    </div>
                                    <Link to={`/cases/${caseItem.id}`} className="view-case-link">
                                        View Details →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;