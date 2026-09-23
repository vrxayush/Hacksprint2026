# backend/app/services/file_parser.py
import pandas as pd
import pdfplumber
import re
import os
from typing import Dict, List, Any

class EvidenceParser:
    """Parse different types of evidence files and extract transactions"""
    
    def __init__(self):
        self.transactions = []
        self.entities = {
            'accounts': set(),
            'people': set(),
            'phones': set()
        }
    
    def parse_file(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """Main entry point to parse a file"""
        file_type = file_type.lower()
        
        if 'csv' in file_type or file_path.endswith('.csv'):
            self.parse_csv(file_path)
        elif 'excel' in file_type or 'spreadsheet' in file_type or file_path.endswith('.xlsx'):
            self.parse_excel(file_path)
        elif 'pdf' in file_type or file_path.endswith('.pdf'):
            self.parse_pdf(file_path)
        elif 'text' in file_type or file_path.endswith('.txt'):
            self.parse_text(file_path)
        elif 'image' in file_type or file_path.endswith(('.jpg', '.jpeg', '.png')):
            self.parse_image(file_path)
        else:
            # Try to parse as text
            self.parse_text(file_path)
        
        return {
            'transactions': self.transactions,
            'entities': self.entities
        }
    
    def parse_csv(self, file_path: str):
        """Parse CSV file with transaction data"""
        try:
            df = pd.read_csv(file_path)
            
            # Detect column names (case insensitive)
            cols = {col.lower(): col for col in df.columns}
            
            from_col = cols.get('from_account') or cols.get('from') or cols.get('sender')
            to_col = cols.get('to_account') or cols.get('to') or cols.get('receiver')
            amount_col = cols.get('amount') or cols.get('transaction_amount')
            timestamp_col = cols.get('timestamp') or cols.get('date') or cols.get('datetime')
            type_col = cols.get('transaction_type') or cols.get('type')
            
            if from_col and to_col and amount_col:
                for _, row in df.iterrows():
                    transaction = {
                        'from': str(row[from_col]),
                        'to': str(row[to_col]),
                        'amount': float(row[amount_col]),
                        'timestamp': str(row[timestamp_col]) if timestamp_col else '',
                        'type': str(row[type_col]) if type_col else 'unknown'
                    }
                    self.transactions.append(transaction)
                    
                    # Add to entities
                    self.entities['accounts'].add(transaction['from'])
                    self.entities['accounts'].add(transaction['to'])
        except Exception as e:
            print(f"Error parsing CSV: {e}")
    
    def parse_excel(self, file_path: str):
        """Parse Excel file with transaction data"""
        try:
            df = pd.read_excel(file_path)
            
            # Same logic as CSV
            cols = {col.lower(): col for col in df.columns}
            
            from_col = cols.get('from_account') or cols.get('from') or cols.get('sender')
            to_col = cols.get('to_account') or cols.get('to') or cols.get('receiver')
            amount_col = cols.get('amount') or cols.get('transaction_amount')
            timestamp_col = cols.get('timestamp') or cols.get('date') or cols.get('datetime')
            type_col = cols.get('transaction_type') or cols.get('type')
            
            if from_col and to_col and amount_col:
                for _, row in df.iterrows():
                    transaction = {
                        'from': str(row[from_col]),
                        'to': str(row[to_col]),
                        'amount': float(row[amount_col]),
                        'timestamp': str(row[timestamp_col]) if timestamp_col else '',
                        'type': str(row[type_col]) if type_col else 'unknown'
                    }
                    self.transactions.append(transaction)
                    
                    self.entities['accounts'].add(transaction['from'])
                    self.entities['accounts'].add(transaction['to'])
        except Exception as e:
            print(f"Error parsing Excel: {e}")
    
    def parse_pdf(self, file_path: str):
        """Parse PDF file and extract transactions"""
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
            
            self.extract_from_text(text)
        except Exception as e:
            print(f"Error parsing PDF: {e}")
    
    def parse_text(self, file_path: str):
        """Parse text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            self.extract_from_text(text)
        except Exception as e:
            print(f"Error parsing text: {e}")
    
    def parse_image(self, file_path: str):
        """Parse image file using OCR"""
        try:
            import pytesseract
            from PIL import Image
            
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            self.extract_from_text(text)
        except Exception as e:
            print(f"Error parsing image: {e}")
    
    def extract_from_text(self, text: str):
        """Extract transactions and entities from text"""
        # Extract account numbers (pattern: ACC followed by digits or just digits)
        account_pattern = r'(?:ACC|ACCT|Account[:\s]*)?(\d{10,18})'
        accounts = re.findall(account_pattern, text, re.IGNORECASE)
        
        # Extract amounts (pattern: Rs. or ₹ followed by number)
        amount_pattern = r'(?:Rs\.?|₹|INR)\s?([\d,]+\.?\d*)'
        amounts = re.findall(amount_pattern, text, re.IGNORECASE)
        
        # Extract phone numbers (Indian format)
        phone_pattern = r'(\+91[\-\s]?)?[0]?[6-9]\d{9}'
        phones = re.findall(phone_pattern, text)
        
        # Extract names (capitalized words pattern)
        name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b'
        names = re.findall(name_pattern, text)
        
        # Extract transaction patterns
        # Pattern: ACC123 → ACC456 amount
        tx_pattern = r'(?:ACC|ACCT)?(\d{10,18})\s*(?:→|->|to|transferred to)\s*(?:ACC|ACCT)?(\d{10,18})\s*(?:Rs\.?|₹|INR)?\s?([\d,]+\.?\d*)'
        tx_matches = re.findall(tx_pattern, text, re.IGNORECASE)
        
        for match in tx_matches:
            if len(match) >= 3:
                transaction = {
                    'from': match[0],
                    'to': match[1],
                    'amount': float(match[2].replace(',', '')),
                    'timestamp': '',
                    'type': 'text_extracted'
                }
                self.transactions.append(transaction)
                
                self.entities['accounts'].add(transaction['from'])
                self.entities['accounts'].add(transaction['to'])
        
        # Add all detected entities
        self.entities['accounts'].update(accounts)
        self.entities['phones'].update(phones)
        self.entities['people'].update(names)