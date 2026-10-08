from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from backend.analyzer import ReviewAnalyzer

app = FastAPI(title="NeuroForge Review Analyzer API")

# Configure CORS
# Allow common local development origins
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the analyzer
analyzer = ReviewAnalyzer()

class AskRequest(BaseModel):
    question: str
    reviews: List[str]

@app.get("/")
async def root():
    return {
        "message": "NeuroForge Review Analyzer API",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }

@app.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    """
    Accepts a CSV file, processes it using pandas for basic stats,
    and uses Gemini AI for deep sentiment and topic analysis.
    """
    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    try:
        content = await file.read()
        result = analyzer.process_reviews(content)

        if not result.get("success"):
            # If it's a validation error from analyzer, return 400
            error_msg = result.get("error", "")
            if "column" in error_msg.lower():
                raise HTTPException(status_code=400, detail=error_msg)
            elif "api_key" in error_msg.lower() or "configured" in error_msg.lower():
                raise HTTPException(status_code=503, detail=error_msg)
            elif "ai analysis failed" in error_msg.lower() or "unavailable" in error_msg.lower():
                raise HTTPException(status_code=503, detail="The AI service is currently overloaded. Please wait a few moments and try again.")
            else:
                raise HTTPException(status_code=500, detail=error_msg)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/ask")
async def ask_ai(request: AskRequest):
    """
    Answers natural language questions about a set of reviews using Gemini AI.
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if not request.reviews or len(request.reviews) == 0:
        raise HTTPException(status_code=400, detail="No reviews provided for context.")

    try:
        answer = analyzer.answer_question(request.reviews, request.question)
        return {
            "success": True,
            "question": request.question,
            "answer": answer
        }
    except RuntimeError as re:
        raise HTTPException(status_code=500, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    # Use "backend.main:app" to ensure uvicorn can find the app when run from root
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
