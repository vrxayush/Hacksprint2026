// frontend/src/components/CaseDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import api from '../services/api';
import FlowChart from './FlowChart';
import PatternChart from './PatternChart';

function CaseDetail({ currentUser }) {
    const [caseData, setCaseData] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('flow');
    const { caseId } = useParams();
    const navigate = useNavigate();

    const fetchCaseDetails = useCallback(async () => {
        try {
            const response = await api.get(`/api/cases/${caseId}`);
            setCaseData(response.data);
            
            // Check if analysis exists
            if (response.data.analysis_results && response.data.analysis_results.length > 0) {
                setAnalysis(response.data.analysis_results[0]);
            }
        } catch (error) {
            console.error('Error fetching case:', error);
        } finally {
            setLoading(false);
        }
    }, [caseId]);

    useEffect(() => {
        fetchCaseDetails();
    }, [fetchCaseDetails]);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const response = await api.post(`/api/analyze/${caseId}`);
            setAnalysis(response.data);
            fetchCaseDetails();
            
            // Show flow chart after analysis
            setActiveTab('flow');
            
            // Scroll to visualization section
            setTimeout(() => {
                document.getElementById('visualization-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (error) {
            console.error('Error analyzing case:', error);
            alert('Error analyzing case: ' + (error.response?.data?.detail || error.message));
        } finally {
            setAnalyzing(false);
        }
    };

    const handleBack = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    if (!caseData) {
        return <div>Case not found</div>;
    }

    // Parse report if it exists
    let reportData = null;
    if (analysis && analysis.report) {
        try {
            reportData = JSON.parse(analysis.report);
        } catch (e) {
            console.error('Error parsing report:', e);
        }
    }

    // Prepare flow chart data
    let flowData = null;
    let patternData = null;
    if (analysis) {
        try {
            const resultData = JSON.parse(analysis.result_data);
            flowData = {
                transactions: resultData?.transactions || [],
                flow_paths: JSON.parse(analysis.flow_chart_data)?.flow_paths || [],
                patterns: reportData?.flagged_patterns || []
            };
            
            patternData = {
                patterns: reportData?.flagged_patterns || [],
                suspicious_accounts: reportData?.suspicious_accounts || [],
                summary: reportData?.summary || {}
            };
        } catch (e) {
            console.error('Error parsing flow data:', e);
        }
    }

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper to format amount
    const formatAmount = (amount) => {
        if (amount === null || amount === undefined) return 'N/A';
        return `₹${Number(amount).toLocaleString('en-IN')}`;
    };

    // Get risk level color
    const getRiskColor = (level) => {
        const colors = {
            'critical': '#f44336',
            'high': '#ff9800',
            'medium': '#ffc107',
            'low': '#4caf50',
            'minimal': '#2196f3'
        };
        return colors[level] || '#666';
    };

    return (
        <div className="dashboard">
            {/* Top Navigation */}
            <nav className="navbar">
                <div className="navbar-left">
                    <button className="back-button" onClick={handleBack}>
                        ← Back
                    </button>
                    <h1>Case Details</h1>
                </div>
                <div className="nav-actions">
                    <Link to="/dashboard">Dashboard</Link>
                </div>
            </nav>
            
            <div className="dashboard-content">
                {/* Case Header Card */}
                <div className="case-header-card">
                    <div className="case-header-left">
                        <span className="case-number">Case #{caseData.case.id}</span>
                        <h2 className="case-title">{caseData.case.case_name}</h2>
                        <div className="case-meta">
                            <span className="meta-item">
                                <span className="meta-icon">📅</span>
                                Created: {formatDate(caseData.case.created_at)}
                            </span>
                            <span className="meta-item">
                                <span className="meta-icon">📝</span>
                                Status: <span className="status-badge">{caseData.case.status.toUpperCase()}</span>
                            </span>
                        </div>
                    </div>
                    <div className="case-header-right">
                        <div className="fraud-amount-box">
                            <span className="fraud-label">Fraud Amount</span>
                            <span className="fraud-value">{formatAmount(caseData.case.fraud_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {caseData.case.description && (
                    <div className="case-description">
                        <h4>📋 Description</h4>
                        <p>{caseData.case.description}</p>
                    </div>
                )}

                {/* Evidence Files */}
                <div className="evidence-section">
                    <h4>📁 Evidence Files</h4>
                    {caseData.evidence_files.length === 0 ? (
                        <p className="no-evidence">No evidence files uploaded</p>
                    ) : (
                        <div className="evidence-file-list">
                            {caseData.evidence_files.map(file => (
                                <div key={file.id} className="evidence-file-item">
                                    <span className="file-icon">📄</span>
                                    <span className="file-name">{file.filename}</span>
                                    <span className="file-date">{formatDate(file.uploaded_at)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Analysis Section */}
                <div className="analysis-section">
                    <div className="section-header">
                        <h3>🔍 Analysis</h3>
                        {analysis && (
                            <button 
                                onClick={handleAnalyze}
                                className="reanalyze-button"
                            >
                                🔄 Re-run Analysis
                            </button>
                        )}
                    </div>
                    
                    {!analysis ? (
                        <div className="analyze-box">
                            <p>Run analysis to detect money laundering patterns in this case.</p>
                            <button onClick={handleAnalyze} disabled={analyzing} className="analyze-button">
                                {analyzing ? '⏳ Analyzing...' : '▶️ Run Analysis'}
                            </button>
                        </div>
                    ) : (
                        <div className="analysis-results">
                            {reportData && (
                                <div className="report-content">
                                    {/* Summary Cards */}
                                    <div className="summary-cards">
                                        <div className="summary-card-item">
                                            <div className="summary-card-icon">💰</div>
                                            <div className="summary-card-info">
                                                <span className="summary-card-label">Total Amount Traced</span>
                                                <span className="summary-card-value">{formatAmount(reportData.summary?.total_amount_traced)}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="summary-card-item">
                                            <div className="summary-card-icon">📊</div>
                                            <div className="summary-card-info">
                                                <span className="summary-card-label">Patterns Detected</span>
                                                <span className="summary-card-value">{reportData.summary?.total_patterns_detected}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="summary-card-item">
                                            <div className="summary-card-icon">🚨</div>
                                            <div className="summary-card-info">
                                                <span className="summary-card-label">Risk Level</span>
                                                <span className="summary-card-value" style={{ color: getRiskColor(reportData.summary?.risk_level) }}>
                                                    {reportData.summary?.risk_level?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Suspicious Accounts */}
                                    {reportData.suspicious_accounts && reportData.suspicious_accounts.length > 0 && (
                                        <div className="suspicious-accounts-section">
                                            <h4>🚨 Top Suspicious Accounts</h4>
                                            <div className="suspicious-accounts-grid">
                                                {reportData.suspicious_accounts.slice(0, 3).map((account, index) => (
                                                    <div key={index} className="suspicious-account-card">
                                                        <div className="account-number">{account.account}</div>
                                                        <div className="account-risk">
                                                            <span className="risk-badge" style={{ background: getRiskColor(account.risk_level) }}>
                                                                {account.risk_level?.toUpperCase()}
                                                            </span>
                                                            <span className="risk-score">Score: {account.risk_score}/100</span>
                                                        </div>
                                                        <div className="account-patterns">
                                                            {account.patterns?.slice(0, 2).join(' • ')}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Key Recommendations */}
                                    {reportData.recommendations && reportData.recommendations.length > 0 && (
                                        <div className="recommendations-section">
                                            <h4>📋 Key Recommendations</h4>
                                            <ul className="recommendations-list">
                                                {reportData.recommendations.slice(0, 3).map((rec, index) => (
                                                    <li key={index}>
                                                        <span className="rec-icon">✅</span>
                                                        {rec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Visualization Section */}
                {analysis && (
                    <div id="visualization-section" className="visualization-section">
                        <h3>📊 Visualization</h3>
                        
                        {/* Tabs */}
                        <div className="visualization-tabs">
                            <button 
                                className={`tab-button ${activeTab === 'flow' ? 'active' : ''}`}
                                onClick={() => setActiveTab('flow')}
                            >
                                <span className="tab-icon">📊</span>
                                Money Flow
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'patterns' ? 'active' : ''}`}
                                onClick={() => setActiveTab('patterns')}
                            >
                                <span className="tab-icon">⚠️</span>
                                Flagged Patterns
                            </button>
                        </div>
                        
                        {/* Tab Content */}
                        <div className="tab-content">
                            {activeTab === 'flow' && flowData && (
                                <div className="flowchart-container">
                                    <ReactFlowProvider>
                                        <FlowChart data={flowData} />
                                    </ReactFlowProvider>
                                </div>
                            )}
                            
                            {activeTab === 'patterns' && patternData && (
                                <div className="patterns-container">
                                    <PatternChart data={patternData} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CaseDetail;
