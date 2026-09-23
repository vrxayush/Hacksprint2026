// frontend/src/components/CaseHistory.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function CaseHistory({ currentUser }) {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCases();
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

    return (
        <div className="dashboard">
            <nav className="navbar">
                <h1>Case History</h1>
                <div className="nav-actions">
                    <Link to="/dashboard">Back to Dashboard</Link>
                </div>
            </nav>
            
            <div className="dashboard-content">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        <h2>Your Case History</h2>
                        {cases.length === 0 ? (
                            <p>No cases found</p>
                        ) : (
                            <div className="case-list">
                                {cases.map(caseItem => (
                                    <div key={caseItem.id} className="case-card">
                                        <h4>{caseItem.case_name}</h4>
                                        <p>Status: {caseItem.status}</p>
                                        <p>Fraud Amount: ₹{caseItem.fraud_amount}</p>
                                        <p>Created: {new Date(caseItem.created_at).toLocaleString()}</p>
                                        <Link to={`/cases/${caseItem.id}`}>View Details</Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default CaseHistory;