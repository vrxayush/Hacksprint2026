# backend/app/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    full_name: Optional[str] = None
    designation: Optional[str] = None
    sp_name: Optional[str] = None
    badge_number: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class CaseBase(BaseModel):
    case_name: str
    description: Optional[str] = None
    fraud_amount: Optional[float] = None

class CaseCreate(CaseBase):
    pass

class Case(CaseBase):
    id: int
    status: str
    created_at: datetime
    user_id: int
    
    class Config:
        from_attributes = True

class EvidenceFile(BaseModel):
    id: int
    filename: str
    file_type: str
    file_path: str
    uploaded_at: datetime
    case_id: int
    
    class Config:
        from_attributes = True

class AnalysisResult(BaseModel):
    id: int
    result_data: dict
    flow_chart_data: dict
    report: str
    created_at: datetime
    case_id: int
    
    class Config:
        from_attributes = True