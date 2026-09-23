# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy.orm import Session

from .database import Base, engine, get_db, SessionLocal
from .api import auth, cases, analysis
from . import models
from .auth import get_password_hash

# Create all tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(title="Money Trace System", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
os.makedirs("data/uploads", exist_ok=True)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(cases.router, prefix="/api", tags=["cases"])
app.include_router(analysis.router, prefix="/api", tags=["analysis"])

# Create default users on startup
def create_default_users():
    db = SessionLocal()
    try:
        # Check if users already exist
        if db.query(models.User).count() > 0:
            return
        
        # Predefined police officers
        default_users = [
            {
                "username": "inspector_sharma",
                "email": "inspector.sharma@mumbaipolice.gov.in",
                "password": "Police@2024",
                "full_name": "Inspector Rajesh Sharma",
                "designation": "Inspector",
                "sp_name": "SP Mumbai",
                "badge_number": "MP-2024-001",
                "phone": "+91-9876543210",
                "department": "Cyber Crime Cell"
            },
            {
                "username": "asi_patel",
                "email": "asi.patel@mumbaipolice.gov.in",
                "password": "Police@2024",
                "full_name": "ASI Meera Patel",
                "designation": "Assistant Sub-Inspector",
                "sp_name": "SP Mumbai",
                "badge_number": "MP-2024-002",
                "phone": "+91-9876543211",
                "department": "Cyber Crime Cell"
            },
            {
                "username": "constable_kumar",
                "email": "constable.kumar@mumbaipolice.gov.in",
                "password": "Police@2024",
                "full_name": "Constable Amit Kumar",
                "designation": "Constable",
                "sp_name": "SP Mumbai",
                "badge_number": "MP-2024-003",
                "phone": "+91-9876543212",
                "department": "Cyber Crime Cell"
            },
            {
                "username": "dy_sp_singh",
                "email": "dy.sp.singh@mumbaipolice.gov.in",
                "password": "Police@2024",
                "full_name": "Dy. SP Vikram Singh",
                "designation": "Deputy Superintendent of Police",
                "sp_name": "SP Mumbai",
                "badge_number": "MP-2024-004",
                "phone": "+91-9876543213",
                "department": "Cyber Crime Cell"
            },
            {
                "username": "acp_verma",
                "email": "acp.verma@mumbaipolice.gov.in",
                "password": "Police@2024",
                "full_name": "ACP Kavita Verma",
                "designation": "Assistant Commissioner of Police",
                "sp_name": "SP Mumbai",
                "badge_number": "MP-2024-005",
                "phone": "+91-9876543214",
                "department": "Cyber Crime Cell"
            }
        ]
        
        for user_data in default_users:
            new_user = models.User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                designation=user_data["designation"],
                sp_name=user_data["sp_name"],
                badge_number=user_data["badge_number"],
                phone=user_data["phone"],
                department=user_data["department"]
            )
            db.add(new_user)
        
        db.commit()
        print("✅ Default police officer accounts created!")
        print("📋 Login credentials:")
        print("   - inspector_sharma / Police@2024 (Inspector)")
        print("   - asi_patel / Police@2024 (ASI)")
        print("   - constable_kumar / Police@2024 (Constable)")
        print("   - dy_sp_singh / Police@2024 (Dy. SP)")
        print("   - acp_verma / Police@2024 (ACP)")
        
    except Exception as e:
        print(f"Error creating default users: {e}")
    finally:
        db.close()

# Call the function on startup
@app.on_event("startup")
async def startup_event():
    create_default_users()

@app.get("/")
def read_root():
    return {"message": "Money Trace System API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}