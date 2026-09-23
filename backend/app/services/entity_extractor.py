# services/entity_extractor.py

import re
from datetime import datetime

class EntityLinker:
    def __init__(self):
        self.entities = {
            'accounts': set(),
            'people': set(),
            'phones': set(),
            'transactions': []
        }
    
    def process_text(self, text):
        # Detect relationships from text patterns
        # "Account X transferred ₹Y to Account Z"
        pattern = r'Account\s+([A-Z0-9]+)\s+transferred\s+₹?\s?([\d,]+)\s+to\s+Account\s+([A-Z0-9]+)'
        matches = re.findall(pattern, text)
        
        for match in matches:
            from_acct = match[0]
            amount = float(match[1].replace(',', ''))
            to_acct = match[2]
            
            self.entities['transactions'].append({
                'from': from_acct,
                'to': to_acct,
                'amount': amount,
                'source': 'text'
            })
        
        # "Phone number X called Y"
        phone_pattern = r'(\+91[\-\s]?)?[0]?[6-9]\d{9}\s+(?:called|messaged)\s+(\+91[\-\s]?)?[0]?[6-9]\d{9}'
        phone_matches = re.findall(phone_pattern, text)
        
        return self.entities