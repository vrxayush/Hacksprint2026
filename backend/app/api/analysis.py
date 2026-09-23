# backend/app/api/analysis.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json
import os
from typing import Any

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..services.file_parser import EvidenceParser
from ..services.money_tracer import MoneyTracer
from ..services.pattern_detector import PatternDetector
from ..services.report_generator import ReportGenerator

router = APIRouter()

def json_serializer(obj: Any) -> str:
    """Custom JSON serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, set):
        return list(obj)
    if isinstance(obj, bytes):
        return obj.decode('utf-8')
    return str(obj)

@router.post("/analyze/{case_id}")
async def analyze_case(
    case_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get case
    case = db.query(models.Case).filter(models.Case.id == case_id, models.Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Get evidence files
    evidence_files = db.query(models.EvidenceFile).filter(models.EvidenceFile.case_id == case_id).all()
    
    if not evidence_files:
        raise HTTPException(status_code=400, detail="No evidence files found for this case")
    
    # Process all evidence files
    parser = EvidenceParser()
    all_transactions = []
    all_entities = {'accounts': set(), 'people': set(), 'phones': set()}
    
    for evidence in evidence_files:
        if os.path.exists(evidence.file_path):
            extracted = parser.parse_file(evidence.file_path, evidence.file_type)
            all_transactions.extend(extracted.get('transactions', []))
            
            # Merge entities
            entities = extracted.get('entities', {})
            for key in all_entities:
                all_entities[key].update(entities.get(key, set()))
    
    if not all_transactions:
        raise HTTPException(status_code=400, detail="No transactions could be extracted from evidence files")
    
    # Convert datetime objects to strings in transactions
    for tx in all_transactions:
        if isinstance(tx.get('timestamp'), datetime):
            tx['timestamp'] = tx['timestamp'].isoformat()
    
    # Build graph and trace money
    tracer = MoneyTracer(all_transactions)
    
    # Trace money flow if fraud amount is specified
    flow_paths = []
    if case.fraud_amount:
        # Find starting accounts (accounts with most incoming suspicious transactions)
        # For now, use first transaction's from account
        if all_transactions:
            start_account = all_transactions[0]['from']
            flow_paths = tracer.trace_money(
                start_account=start_account,
                amount=case.fraud_amount
            )
    
    # Detect patterns
    detector = PatternDetector(all_transactions)
    patterns = detector.detect_all_patterns()
    
    # Calculate network statistics
    network_stats = tracer.calculate_network_stats()
    
    # Find central nodes
    central_nodes = tracer.find_central_nodes()
    
    # Generate report
    report_gen = ReportGenerator(flow_paths, patterns, network_stats)
    report = report_gen.generate_report()
    
    # Save analysis result with custom serializer
    analysis_result = models.AnalysisResult(
        result_data=json.dumps({
            'transactions': all_transactions,
            'patterns': patterns,
            'network_stats': network_stats,
            'central_nodes': central_nodes
        }, default=json_serializer),
        flow_chart_data=json.dumps({
            'flow_paths': flow_paths,
            'transactions': all_transactions
        }, default=json_serializer),
        report=json.dumps(report, default=json_serializer),
        case_id=case_id
    )
    
    db.add(analysis_result)
    case.status = "completed"
    db.commit()
    db.refresh(analysis_result)
    
    return {
        "analysis_id": analysis_result.id,
        "flow_paths": flow_paths,
        "patterns": patterns,
        "report": report,
        "network_stats": network_stats,
        "central_nodes": central_nodes
    }