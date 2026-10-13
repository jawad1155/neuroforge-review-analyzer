from fastapi import FastAPI, UploadFile, File, HTTPException, Body, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from pathlib import Path
import os
import uvicorn
import asyncio
import json
from sqlalchemy.orm import Session

from backend.analyzer import ReviewAnalyzer
from backend.scraper import ReviewScraper
from backend.database import Base, engine, get_db, User, Project, Dataset, Review, AnalysisResult, APIKey, init_db
from backend.auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_api_key_user, oauth2_scheme
)

app = FastAPI(title="NeuroForge Review Analyzer API")

# Initialize DB tables on startup
init_db()

# Configure CORS to allow frontend requests
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the analyzer and scraper
analyzer = ReviewAnalyzer()
scraper = ReviewScraper()

# In-memory session store for chatbot context
sessions: Dict[str, List[Dict[str, str]]] = {}

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: str
    password: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class AskRequest(BaseModel):
    question: str
    reviews: List[str]
    session_id: Optional[str] = None

@app.post("/auth/signup")
async def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(email=user_in.email, password_hash=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.id}

@app.post("/auth/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "is_active": current_user.is_active
    }

@app.post("/projects")
async def create_project(proj_in: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_project = Project(name=proj_in.name, description=proj_in.description, user_id=current_user.id)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/projects")
async def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Project).filter(Project.user_id == current_user.id).all()


@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }

from fastapi import FastAPI, UploadFile, File, HTTPException, Body, BackgroundTasks, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from pathlib import Path
import os
import uvicorn
import asyncio
import json
from sqlalchemy.orm import Session

from backend.analyzer import ReviewAnalyzer
from backend.scraper import ReviewScraper
from backend.database import Base, engine, get_db, User, Project, Dataset, Review, AnalysisResult, APIKey, Job, WebhookSubscription, init_db
from backend.auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_api_key_user, oauth2_scheme
)

app = FastAPI(title="NeuroForge Review Analyzer API")

# Initialize DB tables on startup
init_db()

# Configure CORS to allow frontend requests
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the analyzer and scraper
analyzer = ReviewAnalyzer()
scraper = ReviewScraper()

# In-memory session store for chatbot context
sessions: Dict[str, List[Dict[str, str]]] = {}

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: str
    password: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class AnalysisRequest(BaseModel):
    project_id: int
    file_name: Optional[str] = None

class AskRequest(BaseModel):
    question: str
    reviews: List[str]
    session_id: Optional[str] = None

@app.post("/auth/signup")
async def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(email=user_in.email, password_hash=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.id}

@app.post("/auth/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "is_active": current_user.is_active
    }

@app.post("/projects")
async def create_project(proj_in: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_project = Project(name=proj_in.name, description=proj_in.description, user_id=current_user.id)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/projects")
async def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Project).filter(Project.user_id == current_user.id).all()

@app.get("/projects/{project_id}/analysis")
async def get_project_analysis(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get latest dataset and its analysis
    dataset = db.query(Dataset).filter(Dataset.project_id == project_id).order_by(Dataset.created_at.desc()).first()
    if not dataset:
        return {"message": "No analysis available for this project."}

    analysis = db.query(AnalysisResult).filter(AnalysisResult.dataset_id == dataset.id).first()
    reviews = db.query(Review).filter(Review.dataset_id == dataset.id).all()

    return {
        "dataset": dataset,
        "analysis": analysis,
        "reviews": [
            {"text": r.text, "rating": r.rating, "sentiment": r.sentiment} for r in reviews
        ]
    }

# ... (existing imports)
from fastapi import FastAPI, UploadFile, File, HTTPException, Body, BackgroundTasks, Depends, status, Header
import hmac
import hashlib
import httpx
# ... (rest of imports)

# ... (existing app config and models)

# ... (existing /auth and /projects endpoints)

# ... (existing get_project_analysis)

async def dispatch_webhook(user_id: int, event_type: str, payload: Dict[str, Any], db_session_factory):
    from backend.database import SessionLocal, WebhookSubscription
    db = SessionLocal()
    try:
        subscriptions = db.query(WebhookSubscription).filter(
            WebhookSubscription.user_id == user_id,
            WebhookSubscription.is_active == True,
            WebhookSubscription.events.contains(event_type) # Simplified for JSON list
        ).all()

        for sub in subscriptions:
            # 1. SSRF Protection: Validate target URL
            from backend.scraper import ReviewScraper
            scr = ReviewScraper()
            if not scr._is_safe_url(sub.target_url):
                print(f"Webhook blocked: unsafe URL {sub.target_url}")
                continue

            # 2. Sign the payload
            json_payload = json.dumps(payload, sort_keys=True)
            signature = hmac.new(
                sub.secret.encode(),
                json_payload.encode(),
                hashlib.sha256
            ).hexdigest()

            # 3. Async Delivery
            async with httpx.AsyncClient(timeout=5.0) as client:
                try:
                    await client.post(
                        sub.target_url,
                        content=json_payload,
                        headers={
                            "Content-Type": "application/json",
                            "X-NeuroForge-Signature": signature,
                            "X-NeuroForge-Event": event_type
                        }
                    )
                except Exception as e:
                    print(f"Webhook delivery failed to {sub.target_url}: {e}")
    finally:
        db.close()

async def run_analysis_task(job_id: int, project_id: int, file_content: bytes, db_session_factory):
    # Use a new session for background task
    from backend.database import SessionLocal, Job, Dataset, Review, AnalysisResult
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job: return

        job.status = "PROCESSING"
        db.commit()

        # 1. Process reviews using the analyzer
        result = analyzer.process_reviews(file_content)
        if not result.get("success"):
            job.status = "FAILED"
            job.error_message = result.get("error", "Unknown error")
            db.commit()
            # Trigger failure webhook
            await dispatch_webhook(job.user_id, "analysis.failed", {"job_id": job.id, "error": job.error_message}, db_session_factory)
            return

        # 2. Save Dataset
        dataset = Dataset(
            project_id=project_id,
            name=f"Dataset {job.id}",
            source_type="CSV",
            review_count=result["stats"]["total_reviews"]
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        # 3. Save Reviews
        reviews_to_save = [
            Review(dataset_id=dataset.id, text=r["text"], rating=r["rating"], sentiment=r["sentiment"])
            for r in result["reviews"]
        ]
        db.bulk_save_objects(reviews_to_save)

        # 4. Save Analysis Result
        analysis = AnalysisResult(
            dataset_id=dataset.id,
            metrics=result["sentiment"],
            summary=result["summary"]
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        # 5. Complete Job
        job.status = "COMPLETED"
        job.result_id = analysis.id
        db.commit()

        # 6. Dispatch Completion Webhook
        await dispatch_webhook(job.user_id, "analysis.completed", {
            "job_id": job.id,
            "project_id": project_id,
            "dataset_id": dataset.id,
            "summary": result["summary"]
        }, db_session_factory)

    except Exception as e:
        db.query(Job).filter(Job.id == job_id).update({"status": "FAILED", "error_message": str(e)})
        db.commit()
    finally:
        db.close()

# ... (keep analyze_csv and get_job_status as they were)

@app.post("/webhooks/subscribe")
async def subscribe_webhook(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import secrets
    url = payload.get("url")
    events = payload.get("events", ["analysis.completed"])

    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    # SSRF Check
    from backend.scraper import ReviewScraper
    if not ReviewScraper()._is_safe_url(url):
        raise HTTPException(status_code=400, detail="Invalid or unsafe webhook URL")

    secret = secrets.token_urlsafe(32)
    sub = WebhookSubscription(
        user_id=current_user.id,
        target_url=url,
        secret=secret,
        events=events
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    return {"message": "Subscribed successfully", "secret": secret, "subscription_id": sub.id}

@app.get("/webhooks/subscriptions")
async def list_webhooks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(WebhookSubscription).filter(WebhookSubscription.user_id == current_user.id).all()

@app.delete("/webhooks/subscriptions/{sub_id}")
async def delete_webhook(sub_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(WebhookSubscription).filter(WebhookSubscription.id == sub_id, WebhookSubscription.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    db.delete(sub)
    db.commit()
    return {"message": "Webhook removed"}

# ... (keep the rest of the file)

@app.post("/analyze")
async def analyze_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: int = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify project ownership
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Project not found or unauthorized")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    content = await file.read()

    # Create a Job record
    job = Job(user_id=current_user.id, project_id=project_id, status="QUEUED")
    db.add(job)
    db.commit()
    db.refresh(job)

    # Queue the analysis
    background_tasks.add_task(run_analysis_task, job.id, project_id, content, get_db)

    return {"job_id": job.id, "status": "queued"}

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": job.id,
        "status": job.status,
        "error": job.error_message,
        "result_id": job.result_id
    }

@app.post("/import-url")
async def import_url(
    background_tasks: BackgroundTasks,
    request: Dict[str, str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    url = request.get("url")
    project_id = request.get("project_id")
    if not url or not project_id:
        raise HTTPException(status_code=400, detail="URL and project_id are required.")

    project = db.query(Project).filter(Project.id == int(project_id), Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Project not found or unauthorized")

    # For now, implement as a blocking call for simplicity, but should follow Job pattern
    try:
        reviews = scraper.fetch_reviews(url)
        if not reviews:
            raise HTTPException(status_code=404, detail="No reviews found at the provided URL.")

        import pandas as pd
        from io import BytesIO
        df = pd.DataFrame(reviews)
        csv_buffer = BytesIO()
        df.to_csv(csv_buffer, index=False)

        result = analyzer.process_reviews(csv_buffer.getvalue())

        # Persist
        dataset = Dataset(project_id=project.id, name=f"Import from {url}", source_type="URL", review_count=len(reviews))
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        reviews_to_save = [
            Review(dataset_id=dataset.id, text=r["text"], rating=r["rating"], sentiment=r["sentiment"])
            for r in result["reviews"]
        ]
        db.bulk_save_objects(reviews_to_save)

        analysis = AnalysisResult(dataset_id=dataset.id, metrics=result["sentiment"], summary=result["summary"])
        db.add(analysis)
        db.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@app.post("/ask")
async def ask_ai(request: AskRequest):
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if not request.reviews or len(request.reviews) == 0:
        raise HTTPException(status_code=400, detail="No reviews provided for context.")

    try:
        session_id = request.session_id
        history = []
        if session_id and session_id in sessions:
            history = sessions[session_id]

        answer = analyzer.answer_question(request.reviews, request.question)

        if session_id:
            if session_id not in sessions:
                sessions[session_id] = []
            sessions[session_id].append({"role": "user", "content": request.question})
            sessions[session_id].append({"role": "assistant", "content": answer})
            if len(sessions[session_id]) > 20:
                sessions[session_id] = sessions[session_id][-20:]

        return {
            "success": True,
            "question": request.question,
            "answer": answer,
            "session_id": session_id or "new_session"
        }
    except RuntimeError as re:
        raise HTTPException(status_code=500, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ... (existing imports)
from fastapi import FastAPI, UploadFile, File, HTTPException, Body, BackgroundTasks, Depends, status, Header
# ... (rest of imports)

# ... (existing app config and models)

class APIKeyCreate(BaseModel):
    name: str

@app.post("/api/keys", response_model=Dict[str, Any])
async def create_api_key(
    key_in: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import secrets
    # Generate a secure random key
    raw_key = f"nf_{secrets.token_urlsafe(32)}"
    # In production, we should store the hash of the key
    # For this implementation, we'll store it as a hash for security
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    key_hash = pwd_context.hash(raw_key)

    new_key = APIKey(
        user_id=current_user.id,
        key_hash=key_hash,
        name=key_in.name,
        is_active=True
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)

    # Return the raw key ONLY ONCE
    return {
        "id": new_key.id,
        "name": new_key.name,
        "api_key": raw_key,
        "note": "Save this key safely. It will not be shown again."
    }

@app.get("/api/keys")
async def list_api_keys(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(APIKey).filter(APIKey.user_id == current_user.id).all()

@app.delete("/api/keys/{key_id}")
async def revoke_api_key(key_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == current_user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    key.is_active = False
    db.commit()
    return {"message": "API key revoked successfully"}

# --- API v1 Router ---
# To keep the code clean, we use a prefix for programmatic access
from fastapi import APIRouter

v1_router = APIRouter(prefix="/api/v1")

async def verify_api_key(x_api_key: str = Header(None), db: Session = Depends(get_db)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="X-API-KEY header missing")

    user = get_api_key_user(x_api_key, db)
    if not user:
        raise HTTPException(status_code=403, detail="Invalid or inactive API key")
    return user

@v1_router.post("/analyze")
async def v1_analyze_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: int = Body(..., embed=True),
    current_user: User = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    # Reuse the existing logic from the main app
    # We manually call the function that handles the logic
    return await analyze_csv(background_tasks, file, project_id, current_user, db)

@v1_router.get("/jobs/{job_id}")
async def v1_get_job(
    job_id: int,
    current_user: User = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    return await get_job_status(job_id, current_user, db)

@v1_router.get("/projects/{project_id}/analysis")
async def v1_get_analysis(
    project_id: int,
    current_user: User = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    return await get_project_analysis(project_id, current_user, db)

app.include_router(v1_router)

@app.post("/ask")
async def ask_ai(request: AskRequest):
    """
    Answers natural language questions about a set of reviews using Gemini AI.
    Supports conversational context via session_id.
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if not request.reviews or len(request.reviews) == 0:
        raise HTTPException(status_code=400, detail="No reviews provided for context.")

    try:
        # Handle conversation history
        session_id = request.session_id
        history = []
        if session_id and session_id in sessions:
            history = sessions[session_id]

        # We pass the question and reviews to the analyzer.
        # To implement true history, we would modify analyzer.answer_question
        # to accept the history list. For now, we'll send the current question.
        answer = analyzer.answer_question(request.reviews, request.question)

        # Update history
        if session_id:
            if session_id not in sessions:
                sessions[session_id] = []
            sessions[session_id].append({"role": "user", "content": request.question})
            sessions[session_id].append({"role": "assistant", "content": answer})
            # Keep history manageable
            if len(sessions[session_id]) > 20:
                sessions[session_id] = sessions[session_id][-20:]

        return {
            "success": True,
            "question": request.question,
            "answer": answer,
            "session_id": session_id or "new_session"
        }
    except RuntimeError as re:
        raise HTTPException(status_code=500, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Mount static frontend files (must be defined AFTER API routes so API routes take priority)
frontend_dir = Path("frontend")
if not frontend_dir.exists():
    frontend_dir = Path(__file__).resolve().parent.parent / "frontend"

if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")

if __name__ == "__main__":
    # Use "backend.main:app" to ensure uvicorn can find the app when run from root
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
