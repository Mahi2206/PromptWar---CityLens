from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Place(BaseModel):
    id: str
    name: str
    category: str  # food, attraction, hotel, culture, budget_spot
    subcategory: str
    city: str
    lat: float
    lng: float
    rating: float
    reviews_count: int
    price_level: str  # $, $$, $$$
    address: str
    description: str
    historical_significance: Optional[str] = None
    audio_guide_text: Optional[str] = None
    tags: List[str] = []
    image_url: str
    verified: bool = True
    best_time: Optional[str] = "Anytime"

class SafetyZone(BaseModel):
    id: str
    city: str
    title: str
    category: str  # accident_blackspot, poor_lighting, crime_risk, flood_hazard, safe_haven
    severity: str  # high, medium, low, safe
    lat: float
    lng: float
    radius_meters: int
    description: str
    reported_at: str
    verified_count: int
    safety_tips: str

class NeighborhoodComparison(BaseModel):
    id: str
    city: str
    name: str
    safety_score: int       # 0 - 100
    cleanliness_score: int  # 0 - 100
    affordability_score: int # 0 - 100 (higher = more affordable)
    rating_score: float     # 0.0 - 5.0
    transit_score: int      # 0 - 100
    nightlife_score: int    # 0 - 100
    overall_index: float
    pros: List[str]
    cons: List[str]
    best_for: str
    worst_for: str
    summary: str

class CitizenReportCreate(BaseModel):
    title: str
    category: str  # safety_hazard, pothole_roadwork, broken_lighting, waterlogging, hidden_gem, general
    description: str
    city: str
    lat: float
    lng: float
    voice_transcript: Optional[str] = None
    reporter_name: Optional[str] = "Anonymous Citizen"
    has_photo: Optional[bool] = False
    is_confidential: bool = False
    privacy_level: str = "standard"  # standard, anonymous, stealth

class CitizenReport(CitizenReportCreate):
    id: str
    timestamp: str
    verified: bool = True
    ai_severity: str       # High, Medium, Low
    ai_sentiment: str      # Urgent, Negative, Neutral, Positive
    ai_authenticity_score: float  # 0.0 to 1.0
    status: str = "Active" # Active, In Review, Resolved
    upvotes: int = 1

class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    city: str
    mode: str = "safest"  # safest, fastest, scenic, well_lit

class RouteStep(BaseModel):
    instruction: str
    distance_m: int
    duration_s: int
    safety_note: Optional[str] = None

class RouteResponse(BaseModel):
    mode: str
    total_distance_km: float
    total_time_mins: int
    safety_grade: str      # A+, A, B, C
    safety_score: int      # 0 - 100
    risk_zones_avoided: int
    well_lit_percentage: int
    coordinates: List[List[float]]  # [[lat, lng], ...]
    steps: List[RouteStep]
    alerts_along_route: List[str]

class AiChatRequest(BaseModel):
    message: str
    city: str
    budget: Optional[str] = "all"
    travel_type: Optional[str] = "general"

class AiChatResponse(BaseModel):
    reply: str
    recommendations: List[Place] = []
    safety_alerts: List[str] = []
    curated_tips: List[str] = []
