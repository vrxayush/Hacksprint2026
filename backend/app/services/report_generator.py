# backend/app/services/report_generator.py
from typing import List, Dict, Any
import json

class ReportGenerator:
    """Generate investigation reports from analysis results"""
    
    def __init__(self, flow_paths: List[Dict], patterns: List[Dict], network_stats: Dict = None):
        self.flow_paths = flow_paths
        self.patterns = patterns
        self.network_stats = network_stats or {}
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate a comprehensive investigation report"""
        report = {
            'summary': self.generate_summary(),
            'money_flow': self.generate_flow_description(),
            'flagged_patterns': self.patterns,
            'suspicious_accounts': self.find_suspicious_accounts(),
            'recommendations': self.generate_recommendations(),
            'statistics': self.network_stats
        }
        
        return report
    
    def generate_summary(self) -> Dict[str, Any]:
        """Generate summary of findings"""
        total_amount = sum(path.get('amount', 0) for path in self.flow_paths)
        
        return {
            'total_amount_traced': total_amount,
            'total_paths_found': len(self.flow_paths),
            'total_patterns_detected': len(self.patterns),
            'layering_detected': any(p['type'] == 'layering' for p in self.patterns),
            'mixing_detected': any(p['type'] == 'money_mixing' for p in self.patterns),
            'structuring_detected': any(p['type'] == 'structuring' for p in self.patterns),
            'circular_flow_detected': any(p['type'] == 'circular_flow' for p in self.patterns),
            'risk_level': self.calculate_risk_level()
        }
    
    def generate_flow_description(self) -> List[Dict[str, Any]]:
        """Generate human-readable money flow descriptions"""
        descriptions = []
        for path in self.flow_paths:
            path_data = path.get('path', [])
            
            if path_data:
                flow_desc = []
                for i, (from_acct, to_acct, amount, timestamp) in enumerate(path_data):
                    flow_desc.append({
                        'step': i + 1,
                        'from': from_acct,
                        'to': to_acct,
                        'amount': amount,
                        'timestamp': timestamp
                    })
                
                descriptions.append({
                    'path': path_data,
                    'flow': flow_desc,
                    'amount': path.get('amount', 0),
                    'status': path.get('status', 'normal'),
                    'message': path.get('message', '')
                })
        
        return descriptions
    
    def find_suspicious_accounts(self) -> List[Dict[str, Any]]:
        """Find accounts that appear in multiple patterns with scores capped at 100"""
        account_risk = {}
        
        # Count occurrences and patterns per account
        for pattern in self.patterns:
            accounts = pattern.get('accounts_involved', [])
            severity = pattern.get('severity', 'medium')
            
            for account in accounts:
                if account not in account_risk:
                    account_risk[account] = {
                        'account': account,
                        'risk_score': 0,
                        'patterns': [],
                        'severity_counts': {'high': 0, 'medium': 0, 'low': 0}
                    }
                
                # Track severity
                if severity in account_risk[account]['severity_counts']:
                    account_risk[account]['severity_counts'][severity] += 1
                
                # Add pattern reference (unique)
                if pattern['type'] not in account_risk[account]['patterns']:
                    account_risk[account]['patterns'].append(pattern['type'])
        
        # Calculate normalized scores (max 100)
        for account in account_risk.values():
            # Base score from severity counts
            base_score = (account['severity_counts']['high'] * 15 + 
                         account['severity_counts']['medium'] * 10 + 
                         account['severity_counts']['low'] * 5)
            
            # Cap at 100
            account['risk_score'] = min(100, base_score)
        
        # Sort by risk score
        suspicious = sorted(account_risk.values(), key=lambda x: x['risk_score'], reverse=True)
        
        # Add risk level based on normalized score
        for account in suspicious:
            score = account['risk_score']
            if score >= 80:
                account['risk_level'] = 'critical'
            elif score >= 60:
                account['risk_level'] = 'high'
            elif score >= 40:
                account['risk_level'] = 'medium'
            elif score >= 20:
                account['risk_level'] = 'low'
            else:
                account['risk_level'] = 'minimal'
        
        return suspicious
    
    def generate_recommendations(self) -> List[str]:
        """Generate investigation recommendations"""
        recommendations = []
        
        # Check for specific patterns
        has_high_risk = any(p['severity'] == 'high' for p in self.patterns)
        has_mixing = any(p['type'] == 'money_mixing' for p in self.patterns)
        has_circular = any(p['type'] == 'circular_flow' for p in self.patterns)
        has_layering = any(p['type'] == 'layering' for p in self.patterns)
        
        if has_high_risk:
            recommendations.append("Freeze accounts involved in high-risk transactions")
        
        if has_mixing:
            recommendations.append("Investigate accounts where legal money appears to be mixed with fraudulent funds")
        
        if has_circular:
            recommendations.append("Examine circular money flows - this indicates possible money laundering")
        
        if has_layering:
            recommendations.append("Trace the full chain of transactions - layering detected")
        
        # Add general recommendations
        recommendations.append("Obtain KYC details for flagged accounts")
        recommendations.append("Question individuals associated with intermediate accounts")
        recommendations.append("Check for similar patterns in other cases")
        recommendations.append("Coordinate with other banks for transaction history")
        recommendations.append("Preserve digital evidence for legal proceedings")
        
        return recommendations
    
    def calculate_risk_level(self) -> str:
        """Calculate overall risk level"""
        high_count = sum(1 for p in self.patterns if p['severity'] == 'high')
        medium_count = sum(1 for p in self.patterns if p['severity'] == 'medium')
        
        if high_count >= 3:
            return 'critical'
        elif high_count >= 1:
            return 'high'
        elif medium_count >= 3:
            return 'medium'
        else:
            return 'low'