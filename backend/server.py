from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class LoginRequest(BaseModel):
    email: EmailStr

class OnboardingRequest(BaseModel):
    email: EmailStr
    vicio_alvo: str

class User(BaseModel):
    email: str
    vicio_alvo: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)

class Progress(BaseModel):
    user_email: str
    dia_atual: int = 1
    dias_completados: List[int] = []
    pontos_totais: int = 0
    tempo_limpo_inicio: Optional[datetime] = None
    medalhas: List[str] = []
    tool_data: Dict[str, Any] = {}
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CompleteDayRequest(BaseModel):
    email: str
    dia: int
    pontos: int

class SaveToolDataRequest(BaseModel):
    email: str
    dia: int
    data: Dict[str, Any]

# ==================== ROUTES ====================

@api_router.post("/auth/login")
async def login(request: LoginRequest):
    """Simple email-based login"""
    try:
        # Check if user exists
        user = await db.users.find_one({"email": request.email})
        
        if not user:
            # Create new user
            user_data = User(email=request.email).dict()
            await db.users.insert_one(user_data)
            
            # Create initial progress
            progress_data = Progress(user_email=request.email).dict()
            await db.progress.insert_one(progress_data)
            
            return {
                "success": True,
                "message": "Novo usuário criado",
                "email": request.email,
                "is_new": True
            }
        else:
            # Update last active
            await db.users.update_one(
                {"email": request.email},
                {"$set": {"last_active": datetime.utcnow()}}
            )
            
            return {
                "success": True,
                "message": "Login bem-sucedido",
                "email": request.email,
                "is_new": False,
                "has_onboarding": user.get("vicio_alvo") is not None
            }
    except Exception as e:
        logging.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/onboarding")
async def complete_onboarding(request: OnboardingRequest):
    """Complete onboarding with target addiction"""
    try:
        result = await db.users.update_one(
            {"email": request.email},
            {"$set": {"vicio_alvo": request.vicio_alvo}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Start tempo limpo counter
        await db.progress.update_one(
            {"user_email": request.email},
            {"$set": {"tempo_limpo_inicio": datetime.utcnow()}}
        )
        
        return {
            "success": True,
            "message": "Onboarding completo! Seu desafio começou."
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Onboarding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/user/{email}")
async def get_user(email: str):
    """Get user data"""
    try:
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Convert ObjectId to string
        user["_id"] = str(user["_id"])
        return user
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/progress/{email}")
async def get_progress(email: str):
    """Get user progress"""
    try:
        progress = await db.progress.find_one({"user_email": email})
        if not progress:
            raise HTTPException(status_code=404, detail="Progresso não encontrado")
        
        # Convert ObjectId to string
        progress["_id"] = str(progress["_id"])
        return progress
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get progress error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/progress/complete-day")
async def complete_day(request: CompleteDayRequest):
    """Mark a day as complete and award points"""
    try:
        progress = await db.progress.find_one({"user_email": request.email})
        if not progress:
            raise HTTPException(status_code=404, detail="Progresso não encontrado")
        
        # Check if day already completed
        if request.dia in progress.get("dias_completados", []):
            return {
                "success": True,
                "message": "Dia já estava completo",
                "already_completed": True
            }
        
        # Update progress
        update_data = {
            "$addToSet": {"dias_completados": request.dia},
            "$inc": {"pontos_totais": request.pontos},
            "$set": {
                "dia_atual": request.dia + 1 if request.dia < 7 else 7,
                "updated_at": datetime.utcnow()
            }
        }
        
        # Award medals
        medalhas = progress.get("medalhas", [])
        new_medalhas = []
        
        if request.dia == 1 and "primeira_vitoria" not in medalhas:
            new_medalhas.append("primeira_vitoria")
        
        if request.dia == 3 and "guerreiro_3_dias" not in medalhas:
            new_medalhas.append("guerreiro_3_dias")
        
        if new_medalhas:
            update_data["$addToSet"]["medalhas"] = {"$each": new_medalhas}
        
        await db.progress.update_one(
            {"user_email": request.email},
            update_data
        )
        
        return {
            "success": True,
            "message": f"Dia {request.dia} completo!",
            "pontos_ganhos": request.pontos,
            "novas_medalhas": new_medalhas,
            "already_completed": False
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Complete day error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/progress/save-tool-data")
async def save_tool_data(request: SaveToolDataRequest):
    """Save data from day tools"""
    try:
        result = await db.progress.update_one(
            {"user_email": request.email},
            {
                "$set": {
                    f"tool_data.dia_{request.dia}": request.data,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Progresso não encontrado")
        
        return {
            "success": True,
            "message": "Dados salvos com sucesso"
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Save tool data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/")
async def root():
    return {"message": "Protocolo 7D API v1.0"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
