// frontend/src/components/FlowChart.jsx
import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node Component for Accounts
const AccountNode = ({ data }) => {
    const isSource = data.type === 'source';
    const isDestination = data.type === 'destination';
    
    return (
        <div style={{
            padding: '12px 15px',
            borderRadius: '10px',
            background: isSource ? '#e8f5e9' : isDestination ? '#fce4ec' : '#ffffff',
            border: '3px solid',
            borderColor: isSource ? '#4caf50' : isDestination ? '#f44336' : '#667eea',
            minWidth: '160px',
            maxWidth: '200px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontFamily: 'Arial, sans-serif',
            transition: 'all 0.3s ease'
        }}>
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: '10px', height: '10px' }} />
            <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '5px', 
                fontSize: '14px', 
                wordBreak: 'break-all',
                color: isSource ? '#2e7d32' : isDestination ? '#c62828' : '#333'
            }}>
                {data.label}
            </div>
            {data.amount > 0 && (
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>
                    ₹{data.amount.toLocaleString()}
                </div>
            )}
            {data.subLabel && (
                <div style={{ 
                    fontSize: '11px', 
                    color: '#fff', 
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    background: isSource ? '#4caf50' : isDestination ? '#f44336' : '#667eea',
                    marginTop: '4px'
                }}>
                    {data.subLabel}
                </div>
            )}
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: '10px', height: '10px' }} />
        </div>
    );
};

// Custom Node Component for Transactions
const TransactionNode = ({ data }) => {
    const isFraud = data.isFraud;
    
    return (
        <div style={{
            padding: '10px 15px',
            borderRadius: '25px',
            background: isFraud ? 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)' : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            border: '3px solid',
            borderColor: isFraud ? '#f44336' : '#2196f3',
            fontSize: '12px',
            textAlign: 'center',
            minWidth: '140px',
            maxWidth: '180px',
            fontFamily: 'Arial, sans-serif',
            boxShadow: isFraud ? '0 4px 15px rgba(244,67,54,0.3)' : '0 4px 10px rgba(33,150,243,0.2)',
            transition: 'all 0.3s ease'
        }}>
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: '10px', height: '10px' }} />
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: isFraud ? '#c62828' : '#1565c0' }}>
                💸 Transfer
            </div>
            <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: isFraud ? '#f44336' : '#2196f3',
                marginBottom: '5px'
            }}>
                ₹{data.amount.toLocaleString()}
            </div>
            {data.timestamp && (
                <div style={{ 
                    fontSize: '11px', 
                    color: '#555', 
                    marginTop: '4px',
                    background: 'rgba(255,255,255,0.8)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                }}>
                    🕐 {data.timestamp}
                </div>
            )}
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: '10px', height: '10px' }} />
        </div>
    );
};

// Custom Node for Pattern/Anomaly
const PatternNode = ({ data }) => {
    const severityColor = data.severity === 'high' ? '#f44336' : data.severity === 'medium' ? '#ff9800' : '#4caf50';
    
    return (
        <div style={{
            padding: '12px 15px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${severityColor}15 0%, ${severityColor}25 100%)`,
            border: '3px solid',
            borderColor: severityColor,
            fontSize: '12px',
            textAlign: 'center',
            minWidth: '200px',
            maxWidth: '250px',
            fontFamily: 'Arial, sans-serif',
            boxShadow: `0 4px 15px ${severityColor}30`,
            transition: 'all 0.3s ease'
        }}>
            <Handle type="target" position={Position.Left} style={{ background: severityColor, width: '10px', height: '10px' }} />
            <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px', color: severityColor }}>
                ⚠️ {data.label}
            </div>
            <div style={{ fontSize: '11px', color: '#555', lineHeight: '1.4', marginBottom: '6px' }}>
                {data.description}
            </div>
            {data.amount && (
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
                    ₹{data.amount.toLocaleString()}
                </div>
            )}
            <div style={{ 
                fontSize: '10px', 
                color: '#fff', 
                fontWeight: 'bold',
                padding: '3px 8px',
                borderRadius: '4px',
                display: 'inline-block',
                background: severityColor,
                marginTop: '5px'
            }}>
                {data.severity.toUpperCase()}
            </div>
            <Handle type="source" position={Position.Right} style={{ background: severityColor, width: '10px', height: '10px' }} />
        </div>
    );
};

const nodeTypes = {
    account: AccountNode,
    transaction: TransactionNode,
    pattern: PatternNode
};

function FlowChart({ data }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        if (data) {
            const { nodes: newNodes, edges: newEdges } = processData(data);
            setNodes(newNodes);
            setEdges(newEdges);
        }
    }, [data]);

    const processData = (data) => {
        const nodes = [];
        const edges = [];
        const accountMap = {};
        
        // Limit transactions for performance
        const maxTransactions = 8;
        const transactions = data.transactions ? data.transactions.slice(0, maxTransactions) : [];

        // Create unique accounts
        const uniqueAccounts = new Set();
        transactions.forEach(tx => {
            uniqueAccounts.add(tx.from);
            uniqueAccounts.add(tx.to);
        });

        // Identify source and destination accounts
        const accountIncoming = {};
        const accountOutgoing = {};
        
        transactions.forEach(tx => {
            if (!accountIncoming[tx.to]) accountIncoming[tx.to] = 0;
            if (!accountOutgoing[tx.from]) accountOutgoing[tx.from] = 0;
            accountIncoming[tx.to] += tx.amount;
            accountOutgoing[tx.from] += tx.amount;
        });

        // Separate accounts by type
        const sourceAccounts = [];
        const intermediateAccounts = [];
        const destinationAccounts = [];
        
        uniqueAccounts.forEach(account => {
            const isSource = !accountIncoming[account] || accountIncoming[account] === 0;
            const isDestination = !accountOutgoing[account] || accountOutgoing[account] === 0;
            
            if (isSource) {
                sourceAccounts.push(account);
            } else if (isDestination) {
                destinationAccounts.push(account);
            } else {
                intermediateAccounts.push(account);
            }
        });

        // Layout positions
        const sourceX = 0;
        const intermediateX = 350;
        const destinationX = 700;
        const patternX = 1050;
        const ySpacing = 160;
        const yStart = 50;

        // Place source accounts
        sourceAccounts.forEach((account, index) => {
            accountMap[account] = {
                id: `account_${account}`,
                type: 'account',
                position: { x: sourceX, y: yStart + index * ySpacing },
                data: {
                    label: account,
                    amount: accountOutgoing[account] || accountIncoming[account] || 0,
                    subLabel: 'SOURCE',
                    type: 'source'
                }
            };
            nodes.push(accountMap[account]);
        });

        // Place intermediate accounts
        intermediateAccounts.forEach((account, index) => {
            accountMap[account] = {
                id: `account_${account}`,
                type: 'account',
                position: { x: intermediateX, y: yStart + index * ySpacing },
                data: {
                    label: account,
                    amount: accountOutgoing[account] || accountIncoming[account] || 0,
                    subLabel: 'INTERMEDIATE',
                    type: 'intermediate'
                }
            };
            nodes.push(accountMap[account]);
        });

        // Place destination accounts
        destinationAccounts.forEach((account, index) => {
            accountMap[account] = {
                id: `account_${account}`,
                type: 'account',
                position: { x: destinationX, y: yStart + index * ySpacing },
                data: {
                    label: account,
                    amount: accountIncoming[account] || accountOutgoing[account] || 0,
                    subLabel: 'DESTINATION',
                    type: 'destination'
                }
            };
            nodes.push(accountMap[account]);
        });

        // Add transaction nodes between accounts
        transactions.forEach((tx, index) => {
            const fromNode = accountMap[tx.from];
            const toNode = accountMap[tx.to];
            
            if (!fromNode || !toNode) return;
            
            // Create transaction node
            const txId = `tx_${index}`;
            const txNode = {
                id: txId,
                type: 'transaction',
                position: {
                    x: (fromNode.position.x + toNode.position.x) / 2,
                    y: (fromNode.position.y + toNode.position.y) / 2
                },
                data: {
                    label: 'Transfer',
                    amount: tx.amount,
                    timestamp: tx.timestamp,
                    isFraud: tx.amount >= 10000
                }
            };
            nodes.push(txNode);
            
            // Create edges
            edges.push({
                id: `edge_from_${index}`,
                source: `account_${tx.from}`,
                target: txId,
                type: 'smoothstep',
                animated: true,
                style: { 
                    stroke: tx.amount >= 10000 ? '#f44336' : '#667eea', 
                    strokeWidth: tx.amount >= 10000 ? 3 : 2
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: tx.amount >= 10000 ? '#f44336' : '#667eea',
                    width: 20,
                    height: 20
                }
            });
            
            edges.push({
                id: `edge_to_${index}`,
                source: txId,
                target: `account_${tx.to}`,
                type: 'smoothstep',
                animated: true,
                style: { 
                    stroke: tx.amount >= 10000 ? '#f44336' : '#667eea', 
                    strokeWidth: tx.amount >= 10000 ? 3 : 2
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: tx.amount >= 10000 ? '#f44336' : '#667eea',
                    width: 20,
                    height: 20
                }
            });
        });

        // Add pattern nodes (limit to top 5)
        if (data.patterns && data.patterns.length > 0) {
            const topPatterns = data.patterns.slice(0, 5);
            
            topPatterns.forEach((pattern, patternIndex) => {
                const patternNode = {
                    id: `pattern_${patternIndex}`,
                    type: 'pattern',
                    position: { 
                        x: patternX,
                        y: yStart + patternIndex * ySpacing
                    },
                    data: {
                        label: pattern.type.replace('_', ' ').toUpperCase(),
                        description: pattern.description.substring(0, 60) + (pattern.description.length > 60 ? '...' : ''),
                        severity: pattern.severity || 'medium',
                        amount: pattern.total_amount || 0
                    }
                };
                nodes.push(patternNode);
                
                // Connect pattern to relevant accounts
                if (pattern.accounts_involved && pattern.accounts_involved.length > 0) {
                    const mainAccount = pattern.accounts_involved[0];
                    if (accountMap[mainAccount]) {
                        edges.push({
                            id: `edge_pattern_${patternIndex}`,
                            source: `account_${mainAccount}`,
                            target: `pattern_${patternIndex}`,
                            type: 'smoothstep',
                            animated: true,
                            style: { 
                                stroke: pattern.severity === 'high' ? '#f44336' : '#ff9800', 
                                strokeWidth: 2,
                                strokeDasharray: '8 4'
                            },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: pattern.severity === 'high' ? '#f44336' : '#ff9800',
                                width: 20,
                                height: 20
                            },
                            label: 'PATTERN'
                        });
                    }
                }
            });
        }

        return { nodes, edges };
    };

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    return (
        <div style={{ width: '100%', height: '800px', background: '#f8f9fa' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.3}
                maxZoom={2}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    style: { strokeWidth: 2 }
                }}
                attributionPosition="bottom-right"
            >
                <Background color="#ddd" gap={20} />
                <Controls showInteractive={false} />
                <MiniMap 
                    nodeColor={(node) => {
                        if (node.type === 'account') {
                            if (node.data.type === 'source') return '#4caf50';
                            if (node.data.type === 'destination') return '#f44336';
                            return '#667eea';
                        }
                        if (node.type === 'transaction') return node.data.isFraud ? '#f44336' : '#2196f3';
                        if (node.type === 'pattern') {
                            return node.data.severity === 'high' ? '#f44336' : '#ff9800';
                        }
                        return '#fff';
                    }}
                    nodeStrokeWidth={2}
                    pannable={true}
                    zoomable={true}
                />
            </ReactFlow>
        </div>
    );
}

export default FlowChart;