// frontend/src/components/PatternChart.jsx
import React, { useState } from 'react';

function PatternChart({ data }) {
    const [expandedPattern, setExpandedPattern] = useState(null);
    const [visibleCount, setVisibleCount] = useState(5);
    
    const patterns = data.patterns || [];
    const suspiciousAccounts = data.suspicious_accounts || [];
    const summary = data.summary || {};
    
    const handleSeeMore = () => {
        setVisibleCount(visibleCount + 5);
    };
    
    const handlePatternClick = (index) => {
        setExpandedPattern(expandedPattern === index ? null : index);
    };
    
    const getPatternIcon = (type) => {
        const icons = {
            'structuring': '🔀',
            'layering': '🔄',
            'circular_flow': '⭕',
            'fan_out': '📤',
            'fan_in': '📥',
            'rapid_movement': '⚡',
            'money_mixing': '💧'
        };
        return icons[type] || '⚠️';
    };
    
    const getPatternColor = (severity) => {
        if (severity === 'high') return '#f44336';
        if (severity === 'medium') return '#ff9800';
        return '#4caf50';
    };
    
    // Helper to safely format amount
    const formatAmount = (amount) => {
        if (amount === null || amount === undefined) return 'N/A';
        return `₹${Number(amount).toLocaleString()}`;
    };
    
    // Helper to normalize risk score (cap at 100)
    const normalizeScore = (score) => {
        if (score === null || score === undefined) return 0;
        return Math.min(100, Math.max(0, Number(score)));
    };

    // Helper to get transactions from pattern
    const getPatternTransactions = (pattern) => {
        // Check if pattern has transactions array
        if (pattern.transactions && Array.isArray(pattern.transactions)) {
            // Filter out strings (account names)
            return pattern.transactions.filter(tx => typeof tx === 'object' && tx !== null);
        }
        return [];
    };

    // Helper to format transaction timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        return timestamp.toString();
    };

    return (
        <div className="pattern-chart">
            {/* Summary Cards */}
            <div className="pattern-summary">
                <div className="summary-card">
                    <div className="summary-icon">📊</div>
                    <div className="summary-info">
                        <span className="summary-title">Total Patterns</span>
                        <span className="summary-value">{patterns.length}</span>
                    </div>
                </div>
                
                <div className="summary-card">
                    <div className="summary-icon">🏦</div>
                    <div className="summary-info">
                        <span className="summary-title">Suspicious Accounts</span>
                        <span className="summary-value">{suspiciousAccounts.length}</span>
                    </div>
                </div>
                
                <div className="summary-card">
                    <div className="summary-icon">💰</div>
                    <div className="summary-info">
                        <span className="summary-title">Amount Traced</span>
                        <span className="summary-value">{formatAmount(summary.total_amount_traced)}</span>
                    </div>
                </div>
            </div>
            
            {/* Suspicious Accounts Section */}
            {suspiciousAccounts.length > 0 && (
                <div className="suspicious-accounts-section">
                    <h4>🚨 Suspicious Accounts</h4>
                    <div className="suspicious-accounts-list">
                        {suspiciousAccounts.slice(0, 5).map((account, index) => (
                            <div key={index} className="account-risk-card">
                                <div className="account-info">
                                    <span className="account-number">{account.account}</span>
                                    <span className="account-patterns">
                                        {account.patterns ? account.patterns.join(' • ') : 'No patterns'}
                                    </span>
                                </div>
                                <div className="risk-indicator">
                                    <span className={`risk-badge risk-${account.risk_level}`}>
                                        {account.risk_level ? account.risk_level.toUpperCase() : 'UNKNOWN'}
                                    </span>
                                    <span className="risk-score">
                                        Score: {normalizeScore(account.risk_score)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Flagged Patterns Section */}
            <div className="flagged-patterns-section">
                <h4>⚠️ Flagged Patterns</h4>
                
                {patterns.length === 0 ? (
                    <div className="no-patterns">No patterns detected</div>
                ) : (
                    <div className="patterns-list">
                        {patterns.slice(0, visibleCount).map((pattern, index) => (
                            <div 
                                key={index} 
                                className={`pattern-card ${expandedPattern === index ? 'expanded' : ''}`}
                                style={{ borderLeft: `4px solid ${getPatternColor(pattern.severity)}` }}
                                onClick={() => handlePatternClick(index)}
                            >
                                <div className="pattern-header">
                                    <span className="pattern-icon">
                                        {getPatternIcon(pattern.type)}
                                    </span>
                                    <span className="pattern-type">
                                        {pattern.type ? pattern.type.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                                    </span>
                                    <span className={`severity-badge severity-${pattern.severity}`}>
                                        {pattern.severity ? pattern.severity.toUpperCase() : 'UNKNOWN'}
                                    </span>
                                </div>
                                
                                <div className="pattern-description">
                                    {pattern.description || 'No description available'}
                                </div>
                                
                                {pattern.total_amount && (
                                    <div className="pattern-amount">
                                        <span className="amount-label">Amount Involved:</span>
                                        <span className="amount-value">{formatAmount(pattern.total_amount)}</span>
                                    </div>
                                )}
                                
                                {expandedPattern === index && (
                                    <div className="pattern-details">
                                        {pattern.accounts_involved && pattern.accounts_involved.length > 0 && (
                                            <div className="accounts-involved">
                                                <span className="details-label">Accounts Involved:</span>
                                                <div className="accounts-chain">
                                                    {pattern.accounts_involved.map((account, accIndex) => (
                                                        <React.Fragment key={accIndex}>
                                                            <span className="chain-account">{account}</span>
                                                            {accIndex < pattern.accounts_involved.length - 1 && (
                                                                <span className="chain-arrow">→</span>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Show actual transactions */}
                                        {getPatternTransactions(pattern).length > 0 && (
                                            <div className="transactions-involved">
                                                <span className="details-label">Transactions:</span>
                                                <div className="transaction-details">
                                                    {getPatternTransactions(pattern).slice(0, 5).map((tx, txIndex) => (
                                                        <div key={txIndex} className="transaction-item">
                                                            <div className="tx-main">
                                                                <span className="tx-route">{tx.from} → {tx.to}</span>
                                                                <span className="tx-amount">{formatAmount(tx.amount)}</span>
                                                            </div>
                                                            <div className="tx-meta">
                                                                <span className="tx-time">🕐 {formatTimestamp(tx.timestamp)}</span>
                                                                {tx.type && <span className="tx-type">{tx.type}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* If no transactions found, show message */}
                                        {getPatternTransactions(pattern).length === 0 && (
                                            <div className="no-transactions-message">
                                                <p>No transaction details available for this pattern.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="pattern-expand-hint">
                                    {expandedPattern === index ? 'Click to collapse ▲' : 'Click for details ▼'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {patterns.length > visibleCount && (
                    <button className="see-more-button" onClick={handleSeeMore}>
                        See More Patterns ({patterns.length - visibleCount} remaining)
                    </button>
                )}
            </div>
        </div>
    );
}

export default PatternChart;