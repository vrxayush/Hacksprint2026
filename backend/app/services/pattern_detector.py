# backend/app/services/pattern_detector.py
from typing import List, Dict, Any
from collections import defaultdict
from datetime import datetime, timedelta

class PatternDetector:
    """Detect suspicious patterns in transactions"""
    
    def __init__(self, transactions: List[Dict[str, Any]]):
        self.transactions = transactions
        self.patterns = []
    
    def detect_all_patterns(self) -> List[Dict[str, Any]]:
        """Run all pattern detection methods"""
        self.detect_structuring()
        self.detect_rapid_movement()
        self.detect_fan_out()
        self.detect_fan_in()
        self.detect_circular_flow()
        self.detect_layering()
        self.detect_money_mixing()
        
        # Remove duplicate patterns and keep only important ones
        return self.remove_duplicates_and_filter()
    
    def remove_duplicates_and_filter(self) -> List[Dict[str, Any]]:
        """Remove duplicate patterns and keep only unique important ones"""
        unique_patterns = []
        seen_patterns = set()

        for pattern in self.patterns:
            # Skip duplicate patterns
            if pattern['type'] == 'layering':
                if len(pattern.get('accounts_involved', [])) > 4:
                    continue
                key = (pattern['type'], pattern['accounts_involved'][0], pattern['accounts_involved'][-1])
            elif pattern['type'] == 'circular_flow':
                if len(pattern.get('accounts_involved', [])) > 5:
                    continue
                key = (pattern['type'], tuple(pattern['accounts_involved']))
            else:
                key = (pattern['type'], pattern.get('description', ''))

            if key not in seen_patterns:
                seen_patterns.add(key)
                unique_patterns.append(pattern)

        # Sort by severity (high first)
        severity_order = {'high': 0, 'medium': 1, 'low': 2}
        unique_patterns.sort(key=lambda x: severity_order.get(x.get('severity', 'low'), 3))

        # Limit to top 8 patterns
        return unique_patterns[:8]
    
    def detect_structuring(self, threshold: float = 50000, min_transactions: int = 3):
        """Detect structuring/smurfing - splitting large amounts into smaller ones"""
        sender_txs = defaultdict(list)
        for tx in self.transactions:
            sender_txs[tx['from']].append(tx)
        
        for sender, txs in sender_txs.items():
            if len(txs) >= min_transactions:
                total = sum(tx['amount'] for tx in txs)
                avg_amount = total / len(txs)
                
                below_threshold = sum(1 for tx in txs if tx['amount'] < threshold)
                
                if below_threshold >= min_transactions and total >= threshold:
                    # Only add if not already added
                    if not any(p['type'] == 'structuring' and p.get('source_account') == sender for p in self.patterns):
                        self.patterns.append({
                            'type': 'structuring',
                            'severity': 'high',
                            'description': f'Structuring detected: {len(txs)} transactions from {sender}',
                            'total_amount': total,
                            'transactions': txs,  # This is a list of transaction objects
                            'accounts_involved': [sender] + [tx['to'] for tx in txs],
                            'source_account': sender
                        })
    
    def detect_rapid_movement(self, time_window_hours: int = 24, max_transactions: int = 5):
        """Detect rapid movement of money"""
        timed_txs = [tx for tx in self.transactions if tx.get('timestamp')]
        
        if not timed_txs:
            return
        
        sender_txs = defaultdict(list)
        for tx in timed_txs:
            try:
                if isinstance(tx['timestamp'], str):
                    tx['timestamp'] = datetime.strptime(tx['timestamp'], '%Y-%m-%d %H:%M:%S')
            except:
                pass
            
            sender_txs[tx['from']].append(tx)
        
        for sender, txs in sender_txs.items():
            if len(txs) >= max_transactions:
                txs.sort(key=lambda x: x.get('timestamp', datetime.min))
                
                for i in range(len(txs)):
                    window_txs = [txs[i]]
                    for j in range(i+1, len(txs)):
                        try:
                            time_diff = txs[j].get('timestamp', datetime.min) - txs[i].get('timestamp', datetime.min)
                            if isinstance(time_diff, timedelta) and time_diff <= timedelta(hours=time_window_hours):
                                window_txs.append(txs[j])
                            else:
                                break
                        except:
                            break
                    
                    if len(window_txs) >= max_transactions:
                        total_amount = sum(tx['amount'] for tx in window_txs)
                        # Check if not already added
                        if not any(p['type'] == 'rapid_movement' and p.get('source_account') == sender for p in self.patterns):
                            self.patterns.append({
                                'type': 'rapid_movement',
                                'severity': 'high',
                                'description': f'Rapid movement: {len(window_txs)} transactions from {sender} in {time_window_hours} hours',
                                'total_amount': total_amount,
                                'transactions': window_txs,  # This is a list of transaction objects
                                'accounts_involved': [sender] + [tx['to'] for tx in window_txs],
                                'source_account': sender
                            })
    
    def detect_fan_out(self, max_transactions: int = 5):
        """Detect one account sending to many accounts"""
        sender_txs = defaultdict(list)
        for tx in self.transactions:
            sender_txs[tx['from']].append(tx)
        
        for sender, txs in sender_txs.items():
            unique_receivers = set(tx['to'] for tx in txs)
            
            if len(unique_receivers) >= max_transactions:
                total_amount = sum(tx['amount'] for tx in txs)
                # Check if not already added
                if not any(p['type'] == 'fan_out' and p.get('source_account') == sender for p in self.patterns):
                    self.patterns.append({
                        'type': 'fan_out',
                        'severity': 'medium',
                        'description': f'Fan-out: {sender} sent money to {len(unique_receivers)} different accounts',
                        'total_amount': total_amount,
                        'transactions': txs,  # This is a list of transaction objects
                        'accounts_involved': [sender] + list(unique_receivers),
                        'source_account': sender
                    })
    
    def detect_fan_in(self, max_transactions: int = 5):
        """Detect many accounts sending to one account"""
        receiver_txs = defaultdict(list)
        for tx in self.transactions:
            receiver_txs[tx['to']].append(tx)
        
        for receiver, txs in receiver_txs.items():
            unique_senders = set(tx['from'] for tx in txs)
            
            if len(unique_senders) >= max_transactions:
                total_amount = sum(tx['amount'] for tx in txs)
                # Check if not already added
                if not any(p['type'] == 'fan_in' and p.get('target_account') == receiver for p in self.patterns):
                    self.patterns.append({
                        'type': 'fan_in',
                        'severity': 'medium',
                        'description': f'Fan-in: {receiver} received money from {len(unique_senders)} different accounts',
                        'total_amount': total_amount,
                        'transactions': txs,  # This is a list of transaction objects
                        'accounts_involved': list(unique_senders) + [receiver],
                        'target_account': receiver
                    })
    
    def detect_circular_flow(self):
        """Detect money returning to source - keep only shortest cycles"""
        import networkx as nx
        G = nx.DiGraph()
        for tx in self.transactions:
            G.add_edge(tx['from'], tx['to'], transaction=tx)
        
        try:
            cycles = list(nx.simple_cycles(G, length_bound=10))
            
            # Sort cycles by length (shortest first)
            cycles.sort(key=len)
            
            # Keep only the shortest cycles
            seen_accounts = set()
            for cycle in cycles:
                if len(cycle) > 1:
                    # Check if any account in cycle already seen
                    cycle_key = tuple(sorted(cycle))
                    if cycle_key not in seen_accounts:
                        seen_accounts.add(cycle_key)
                        
                        # Calculate total money in cycle and get actual transactions
                        cycle_amount = 0
                        cycle_transactions = []
                        for i in range(len(cycle)):
                            from_acct = cycle[i]
                            to_acct = cycle[(i+1) % len(cycle)]
                            
                            # Find the actual transaction object
                            for tx in self.transactions:
                                if tx['from'] == from_acct and tx['to'] == to_acct:
                                    cycle_amount += tx['amount']
                                    cycle_transactions.append(tx)
                                    break
                        
                        self.patterns.append({
                            'type': 'circular_flow',
                            'severity': 'high',
                            'description': f'Circular flow detected: {" → ".join(cycle)} → {cycle[0]}',
                            'total_amount': cycle_amount,
                            'transactions': cycle_transactions,  # This is a list of transaction objects
                            'accounts_involved': cycle
                        })
                        
                        # Only keep 2 circular flows
                        if len([p for p in self.patterns if p['type'] == 'circular_flow']) >= 2:
                            break
        except:
            pass
    
    def detect_layering(self, min_hops: int = 3):
        """Detect money passing through multiple accounts - keep only main paths"""
        import networkx as nx
        G = nx.DiGraph()
        for tx in self.transactions:
            G.add_edge(tx['from'], tx['to'], amount=tx['amount'], transaction=tx)
        
        # Find main paths (from source to sink)
        # Keep only paths that start from accounts with no incoming (sources)
        nodes = list(G.nodes())
        
        # Find source nodes (no incoming edges)
        source_nodes = [n for n in nodes if G.in_degree(n) == 0]
        # Find sink nodes (no outgoing edges)
        sink_nodes = [n for n in nodes if G.out_degree(n) == 0]
        
        # Find paths from sources to sinks
        for source in source_nodes:
            for sink in sink_nodes:
                if source != sink:
                    try:
                        paths = list(nx.all_simple_paths(G, source, sink, cutoff=min_hops + 2))
                        # Keep only shortest paths
                        if paths:
                            shortest_path = min(paths, key=len)
                            if len(shortest_path) >= min_hops:
                                path_amount = 0
                                path_transactions = []
                                for i in range(len(shortest_path)-1):
                                    for tx in self.transactions:
                                        if tx['from'] == shortest_path[i] and tx['to'] == shortest_path[i+1]:
                                            path_amount += tx['amount']
                                            path_transactions.append(tx)
                                            break
                                
                                # Check if not already added
                                path_key = tuple(shortest_path)
                                if not any(p.get('path_key') == path_key for p in self.patterns if p['type'] == 'layering'):
                                    self.patterns.append({
                                        'type': 'layering',
                                        'severity': 'high',
                                        'description': f'Layering: Money passed through {len(shortest_path)} accounts: {" → ".join(shortest_path)}',
                                        'total_amount': path_amount,
                                        'transactions': path_transactions,  # This is a list of transaction objects
                                        'accounts_involved': shortest_path,
                                        'path_key': path_key
                                    })
                    except:
                        pass
        
        # Keep only top 3 layering patterns
        layering_patterns = [p for p in self.patterns if p['type'] == 'layering']
        if len(layering_patterns) > 3:
            # Remove extra layering patterns
            self.patterns = [p for p in self.patterns if p['type'] != 'layering'] + layering_patterns[:3]
    
    def detect_money_mixing(self):
        """Detect accounts where legal money might be mixed"""
        account_info = defaultdict(lambda: {'incoming': [], 'outgoing': []})
        
        for tx in self.transactions:
            account_info[tx['to']]['incoming'].append(tx)
            account_info[tx['from']]['outgoing'].append(tx)
        
        for account, info in account_info.items():
            if info['incoming'] and info['outgoing']:
                total_in = sum(tx['amount'] for tx in info['incoming'])
                total_out = sum(tx['amount'] for tx in info['outgoing'])
                
                if total_out > total_in:
                    difference = total_out - total_in
                    # Check if not already added
                    if not any(p['type'] == 'money_mixing' and p.get('account') == account for p in self.patterns):
                        self.patterns.append({
                            'type': 'money_mixing',
                            'severity': 'high',
                            'description': f'Possible money mixing at {account}: ₹{total_in:.2f} in, ₹{total_out:.2f} out',
                            'total_amount': total_out,
                            'difference_amount': difference,
                            'transactions': info['incoming'] + info['outgoing'],  # This is a list of transaction objects
                            'accounts_involved': [account],
                            'account': account
                        })