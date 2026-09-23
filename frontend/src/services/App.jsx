// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CaseDetail from './components/CaseDetail';
import CaseHistory from './components/CaseHistory';
import authService from './services/auth';

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
        setLoading(false);
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/login" element={
                        currentUser ? <Navigate to="/dashboard" /> : <Login setCurrentUser={setCurrentUser} />
                    } />
                    <Route path="/register" element={
                        currentUser ? <Navigate to="/dashboard" /> : <Register setCurrentUser={setCurrentUser} />
                    } />
                    <Route path="/dashboard" element={
                        currentUser ? <Dashboard currentUser={currentUser} setCurrentUser={setCurrentUser} /> : <Navigate to="/login" />
                    } />
                    <Route path="/cases/:caseId" element={
                        currentUser ? <CaseDetail currentUser={currentUser} /> : <Navigate to="/login" />
                    } />
                    <Route path="/history" element={
                        currentUser ? <CaseHistory currentUser={currentUser} /> : <Navigate to="/login" />
                    } />
                    <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;