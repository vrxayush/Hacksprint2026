# backend/app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    
    # Police-specific fields
    designation = Column(String, default="Police Officer")
    sp_name = Column(String, default="SP")
    badge_number = Column(String, unique=True)
    phone = Column(String)
    department = Column(String, default="Police Department")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    cases = relationship("Case", back_populates="owner")

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_name = Column(String, nullable=False)
    description = Column(Text)
    fraud_amount = Column(Float)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="cases")
    evidence_files = relationship("EvidenceFile", back_populates="case")
    analysis_results = relationship("AnalysisResult", back_populates="case")

class EvidenceFile(Base):
    __tablename__ = "evidence_files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String)
    file_path = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    case_id = Column(Integer, ForeignKey("cases.id"))
    
    case = relationship("Case", back_populates="evidence_files")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    result_data = Column(JSON)
    flow_chart_data = Column(JSON)
    report = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    case_id = Column(Integer, ForeignKey("cases.id"))
    
    case = relationship("Case", back_populates="analysis_results")