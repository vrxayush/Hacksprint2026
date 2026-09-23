# app/services/money_tracer.py
import networkx as nx
from typing import List, Dict, Any
from datetime import datetime

class MoneyTracer:
    """Trace money flow through transaction network"""
    
    def __init__(self, transactions: List[Dict[str, Any]]):
        self.transactions = transactions
        self.graph = nx.DiGraph()
        self.build_graph()
    
    def build_graph(self):
        """Build directed graph from transactions"""
        for tx in self.transactions:
            from_acct = tx['from']
            to_acct = tx['to']
            amount = tx['amount']
            timestamp = tx.get('timestamp', '')
            tx_type = tx.get('type', 'unknown')
            
            # Add edge with attributes
            self.graph.add_edge(
                from_acct,
                to_acct,
                amount=amount,
                timestamp=timestamp,
                type=tx_type,
                transactions=[tx]
            )
            
            # If there are multiple transactions between same accounts, aggregate
            if self.graph.has_edge(from_acct, to_acct):
                edge_data = self.graph[from_acct][to_acct]
                edge_data['transactions'].append(tx)
                edge_data['amount'] += amount
    
    def trace_money(self, start_account: str, amount: float, max_depth: int = 10) -> List[Dict[str, Any]]:
        """Trace money flow from a starting account"""
        paths = []
        visited = set()
        
        def dfs(current: str, current_amount: float, path: List[tuple], depth: int):
            if depth > max_depth or current_amount <= 0:
                return
            
            # Get outgoing transactions
            if current not in self.graph:
                paths.append({
                    'path': path,
                    'amount': current_amount,
                    'status': 'sink',
                    'message': 'No more outgoing transactions'
                })
                return
            
            outgoing = list(self.graph.out_edges(current, data=True))
            
            if not outgoing:
                paths.append({
                    'path': path,
                    'amount': current_amount,
                    'status': 'sink',
                    'message': 'Money reached final destination'
                })
                return
            
            for _, to, data in outgoing:
                tx_amount = data['amount']
                
                # Check if money was split
                if tx_amount < current_amount:
                    split_amount = min(tx_amount, current_amount)
                    new_path = path + [(current, to, split_amount, data.get('timestamp', ''))]
                    
                    # Check if this is layering (multiple hops)
                    if len(new_path) >= 3:
                        paths.append({
                            'path': new_path,
                            'amount': split_amount,
                            'status': 'layering',
                            'message': f'Money passed through {len(new_path)} accounts'
                        })
                    
                    dfs(to, split_amount, new_path, depth + 1)
                
                # Check if legal money was mixed
                elif tx_amount > current_amount:
                    mixed_amount = tx_amount - current_amount
                    paths.append({
                        'path': path + [(current, to, current_amount, data.get('timestamp', ''))],
                        'amount': current_amount,
                        'status': 'mixing',
                        'message': f'₹{mixed_amount:.2f} legal money mixed with fraud amount',
                        'mixed_amount': mixed_amount
                    })
                    
                    dfs(to, current_amount, path + [(current, to, current_amount, data.get('timestamp', ''))], depth + 1)
                
                else:
                    # Exact amount transfer
                    new_path = path + [(current, to, tx_amount, data.get('timestamp', ''))]
                    dfs(to, tx_amount, new_path, depth + 1)
        
        dfs(start_account, amount, [], 0)
        return paths
    
    def detect_cycles(self) -> List[Dict[str, Any]]:
        """Detect circular money flows"""
        cycles = list(nx.simple_cycles(self.graph, length_bound=10))
        
        cycle_data = []
        for cycle in cycles:
            if len(cycle) > 1:
                cycle_data.append({
                    'cycle': cycle,
                    'length': len(cycle),
                    'type': 'circular_flow'
                })
        
        return cycle_data
    
    def find_central_nodes(self, top_n: int = 10) -> List[Dict[str, Any]]:
        """Find key intermediaries in the network"""
        try:
            betweenness = nx.betweenness_centrality(self.graph)
            degree = nx.degree_centrality(self.graph)
            
            central_nodes = []
            for node in sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:top_n]:
                central_nodes.append({
                    'account': node[0],
                    'betweenness': node[1],
                    'degree': degree.get(node[0], 0)
                })
            
            return central_nodes
        except:
            return []
    
    def find_connected_components(self) -> List[List[str]]:
        """Find clusters of connected accounts"""
        try:
            if self.graph.number_of_nodes() > 0:
                return list(nx.weakly_connected_components(self.graph))
            return []
        except:
            return []
    
    def calculate_network_stats(self) -> Dict[str, Any]:
        """Calculate network statistics"""
        stats = {
            'total_accounts': self.graph.number_of_nodes(),
            'total_transactions': self.graph.number_of_edges(),
            'total_amount_moved': sum(data['amount'] for _, _, data in self.graph.edges(data=True))
        }
        return stats