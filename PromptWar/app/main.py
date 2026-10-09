import os
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Request, Query, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse

from app.models import (
    Place, SafetyZone, NeighborhoodComparison, CitizenReport,
    CitizenReportCreate, RouteRequest, RouteResponse, AiChatRequest, AiChatResponse
)
from app.database import db
from app.router_engine import route_engine
from app.nlp_verifier import nlp_verifier
from app.ai_copilot import ai_copilot
from app.smart_city_service import smart_city_service

app = FastAPI(
    title="CityLens: Smart Urban Exploration & Safety Grid",
    description="CityLens transforms real-world city chaos into smart, verified insights, safe navigation, and cultural discovery.",
    version="2.0.0"
)

# Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")

os.makedirs(UPLOADS_DIR, exist_ok=True)

# Mount static files and templates
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    index_path = os.path.join(TEMPLATES_DIR, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# 1. Exploration & Hospitality / History & Culture API
@app.get("/api/places", response_model=List[Place])
async def get_places(
    city: Optional[str] = Query("Pune"),
    category: Optional[str] = Query("all"),
    query: Optional[str] = Query(None),
    budget: Optional[str] = Query("all")
):
    return db.get_places(city=city, category=category, query=query, budget=budget)

@app.get("/api/places/{place_id}", response_model=Place)
async def get_place_detail(place_id: str):
    p = db.get_place_by_id(place_id)
    if not p:
        raise HTTPException(status_code=404, detail="Place not found")
    return p

# 2. Safety & Security API
@app.get("/api/safety-zones", response_model=List[SafetyZone])
async def get_safety_zones(
    city: Optional[str] = Query("Pune"),
    severity: Optional[str] = Query("all")
):
    return db.get_safety_zones(city=city, severity=severity)

# 3. Best vs Worst Neighborhood Comparison API
@app.get("/api/neighborhoods", response_model=List[NeighborhoodComparison])
async def get_neighborhoods(city: Optional[str] = Query("Pune")):
    return db.get_neighborhoods(city=city)

# 4. Safe Route Navigator API
@app.post("/api/routes/calculate", response_model=RouteResponse)
async def calculate_route(request: RouteRequest):
    return route_engine.calculate_route(request)

# 5. Smart City Insights & Live Dashboard
@app.get("/api/dashboard")
async def get_dashboard(city: Optional[str] = Query("Pune")):
    return smart_city_service.get_city_dashboard(city=city)

# 6. Citizen Reports & Crowdsourcing with NLP verification & Secrecy/Privacy Protection
@app.get("/api/citizen-reports", response_model=List[CitizenReport])
async def get_citizen_reports(city: Optional[str] = Query("Pune")):
    return db.get_citizen_reports(city=city)

@app.post("/api/citizen-reports", response_model=CitizenReport)
async def create_citizen_report(
    title: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    city: str = Form("Delhi"),
    lat: float = Form(28.6139),
    lng: float = Form(77.2090),
    reporter_name: Optional[str] = Form("Anonymous Citizen"),
    voice_transcript: Optional[str] = Form(""),
    is_confidential: bool = Form(False),
    privacy_level: str = Form("standard"),
    photo: Optional[UploadFile] = File(None)
):
    import random
    has_photo = False
    if photo and photo.filename:
        has_photo = True
        save_path = os.path.join(UPLOADS_DIR, photo.filename)
        try:
            with open(save_path, "wb") as f:
                content = await photo.read()
                f.write(content)
        except Exception:
            pass

    # Privacy and Secrecy enforcement:
    # Anonymize name and add location jitter to scrub exact doorstep if secrecy requested
    final_reporter = reporter_name or "Anonymous Citizen"
    if is_confidential or privacy_level in ("anonymous", "stealth"):
        pseudonym_id = uuid.uuid4().hex[:4].upper()
        if privacy_level == "stealth":
            final_reporter = f"Stealth Sentinel #{pseudonym_id}"
            # Add subtle geo-jitter (approx 35-50 meters) so exact home/origin is not leaked
            lat += (random.random() - 0.5) * 0.0006
            lng += (random.random() - 0.5) * 0.0006
        else:
            final_reporter = f"Confidential Citizen #{pseudonym_id}"

    # Run AI/NLP verification pipeline
    nlp_res = nlp_verifier.analyze_report(
        title=title,
        description=description,
        voice_transcript=voice_transcript or ""
    )

    report_id = f"rep-{uuid.uuid4().hex[:6]}"
    report = CitizenReport(
        id=report_id,
        title=title,
        category=category,
        description=description,
        city=city,
        lat=round(lat, 6),
        lng=round(lng, 6),
        voice_transcript=voice_transcript,
        reporter_name=final_reporter,
        has_photo=has_photo,
        is_confidential=is_confidential or (privacy_level != "standard"),
        privacy_level=privacy_level,
        timestamp="Just now",
        verified=nlp_res["verified"],
        ai_severity=nlp_res["severity"],
        ai_sentiment=nlp_res["sentiment"],
        ai_authenticity_score=nlp_res["authenticity_score"],
        status="Active",
        upvotes=1
    )
    return db.add_citizen_report(report)

@app.post("/api/citizen-reports/{report_id}/upvote")
async def upvote_report(report_id: str):
    res = db.upvote_report(report_id)
    if not res:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "upvotes": res.upvotes}

# 7. AI City Copilot Conversational API
@app.post("/api/ai/chat", response_model=AiChatResponse)
async def ai_chat(request: AiChatRequest):
    return ai_copilot.chat(request)

# 8. Standalone NLP Text/Voice Analyzer
@app.post("/api/nlp/analyze")
async def analyze_text(payload: dict):
    text = payload.get("text", "")
    return nlp_verifier.analyze_report(title="", description=text)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
