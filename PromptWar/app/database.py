import json
import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models import Place, SafetyZone, NeighborhoodComparison, CitizenReport, CitizenReportCreate

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

class Database:
    def __init__(self):
        self.places: List[Place] = []
        self.safety_zones: List[SafetyZone] = []
        self.neighborhoods: List[NeighborhoodComparison] = []
        self.social_buzz: List[Dict[str, Any]] = []
        self.citizen_reports: List[CitizenReport] = []
        self.load_data()
        self.seed_citizen_reports()

    def _read_json(self, filename: str) -> list:
        filepath = os.path.join(DATA_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def load_data(self):
        places_raw = self._read_json("places.json")
        self.places = [Place(**p) for p in places_raw]

        safety_raw = self._read_json("safety_zones.json")
        self.safety_zones = [SafetyZone(**s) for s in safety_raw]

        neighborhoods_raw = self._read_json("neighborhoods.json")
        self.neighborhoods = [NeighborhoodComparison(**n) for n in neighborhoods_raw]

        self.social_buzz = self._read_json("social_buzz.json")

    def seed_citizen_reports(self):
        self.citizen_reports = [
            CitizenReport(
                id="rep-101",
                title="Pothole cluster at Outer Ring Road Underpass",
                category="pothole_roadwork",
                description="Deep pothole near the left curb right after the blind curve. Caused a scooter puncture. Municipal team alerted.",
                city="Delhi",
                lat=28.6650,
                lng=77.2340,
                voice_transcript="Warning to drivers: big pothole on the curb side underpass. Slow down.",
                reporter_name="Rahul Verma",
                has_photo=True,
                timestamp="25 minutes ago",
                verified=True,
                ai_severity="High",
                ai_sentiment="Urgent",
                ai_authenticity_score=0.94,
                status="Active",
                upvotes=18
            ),
            CitizenReport(
                id="rep-102",
                title="Streetlight blackout on 4th cross lane",
                category="broken_lighting",
                description="Three consecutive street lamps are out of service along the walking path to the metro station.",
                city="Delhi",
                lat=28.6475,
                lng=77.2215,
                voice_transcript="The whole alleyway is pitch dark after 9 PM. Very unsafe for solo pedestrians.",
                reporter_name="Stealth Sentinel #8421",
                has_photo=True,
                is_confidential=True,
                privacy_level="stealth",
                timestamp="1 hour ago",
                verified=True,
                ai_severity="High",
                ai_sentiment="Urgent",
                ai_authenticity_score=0.91,
                status="Active",
                upvotes=34
            ),
            CitizenReport(
                id="rep-103",
                title="Secret rooftop tea stall with sunset view",
                category="hidden_gem",
                description="Small artisanal masala chai shop overlooking the historic courtyard. Homemade almond cookies and great music.",
                city="Delhi",
                lat=28.6540,
                lng=77.2320,
                voice_transcript="Found this incredible peaceful rooftop with piping hot ginger tea and panoramic sunset views.",
                reporter_name="Kabir M.",
                has_photo=True,
                timestamp="3 hours ago",
                verified=True,
                ai_severity="Low",
                ai_sentiment="Positive",
                ai_authenticity_score=0.89,
                status="Active",
                upvotes=56
            ),
            CitizenReport(
                id="rep-104",
                title="Waterlogging hazard after brief shower",
                category="waterlogging",
                description="Water accumulation reaching wheel-depth near lower promenade access steps.",
                city="Mumbai",
                lat=18.9320,
                lng=72.8250,
                voice_transcript="Water is stagnant here, avoid driving small hatchbacks or walking barefoot.",
                reporter_name="Farhan K.",
                has_photo=True,
                timestamp="45 mins ago",
                verified=True,
                ai_severity="Medium",
                ai_sentiment="Negative",
                ai_authenticity_score=0.92,
                status="Active",
                upvotes=23
            ),
            CitizenReport(
                id="rep-pune-001",
                title="Blind corner pothole near Goodluck Chowk turn",
                category="pothole_roadwork",
                description="Deep pothole right after turning onto FC Road from the cafe junction. Two two-wheelers lost balance this morning. Municipal ward officer tagged.",
                city="Pune",
                lat=18.5205,
                lng=73.8425,
                voice_transcript="Attention Pune riders: slow down at Goodluck chowk turn, deep pothole concealed near road curve.",
                reporter_name="Aditya Kulkarni",
                has_photo=True,
                timestamp="18 mins ago",
                verified=True,
                ai_severity="High",
                ai_sentiment="Urgent",
                ai_authenticity_score=0.95,
                status="Active",
                upvotes=42
            ),
            CitizenReport(
                id="rep-pune-002",
                title="Streetlight blackout along Koregaon Park Lane 5",
                category="broken_lighting",
                description="Four consecutive streetlamps out of commission along the residential connector road near Osho Garden back gate. Zero foot illumination after 8 PM.",
                city="Pune",
                lat=18.5370,
                lng=73.8965,
                voice_transcript="Lane 5 back entrance is pitch black tonight. Solo pedestrians please use North Main Road instead.",
                reporter_name="Stealth Sentinel #7819",
                has_photo=True,
                is_confidential=True,
                privacy_level="stealth",
                timestamp="55 mins ago",
                verified=True,
                ai_severity="High",
                ai_sentiment="Urgent",
                ai_authenticity_score=0.93,
                status="Active",
                upvotes=61
            ),
            CitizenReport(
                id="rep-pune-003",
                title="Hidden 80-year-old Irani Bun Maska & Parsi Chai nook",
                category="hidden_gem",
                description="Tucked behind an unassuming blue doorway in Pune Camp. Authentic wood-fired broon bread, spiced chai, and vintage mechanical wall clocks.",
                city="Pune",
                lat=18.5130,
                lng=73.8790,
                voice_transcript="Discovered this incredible vintage Irani bakery in Camp Pune. Best mawa cake and warm hospitality!",
                reporter_name="Tanvi Deshmukh",
                has_photo=True,
                timestamp="2 hours ago",
                verified=True,
                ai_severity="Low",
                ai_sentiment="Positive",
                ai_authenticity_score=0.91,
                status="Active",
                upvotes=88
            )
        ]

    def get_places(self, city: Optional[str] = None, category: Optional[str] = None, query: Optional[str] = None, budget: Optional[str] = None) -> List[Place]:
        results = self.places
        if city and city.lower() != "all":
            results = [p for p in results if p.city.lower() == city.lower()]
        if category and category.lower() != "all":
            results = [p for p in results if p.category.lower() == category.lower()]
        if budget and budget != "all":
            results = [p for p in results if p.price_level == budget]
        if query:
            q = query.lower()
            results = [p for p in results if q in p.name.lower() or q in p.description.lower() or any(q in t.lower() for t in p.tags)]
        return results

    def get_place_by_id(self, place_id: str) -> Optional[Place]:
        for p in self.places:
            if p.id == place_id:
                return p
        return None

    def get_safety_zones(self, city: Optional[str] = None, severity: Optional[str] = None) -> List[SafetyZone]:
        results = self.safety_zones
        if city and city.lower() != "all":
            results = [s for s in results if s.city.lower() == city.lower()]
        if severity and severity.lower() != "all":
            results = [s for s in results if s.severity.lower() == severity.lower()]
        return results

    def get_neighborhoods(self, city: Optional[str] = None) -> List[NeighborhoodComparison]:
        if city and city.lower() != "all":
            return [n for n in self.neighborhoods if n.city.lower() == city.lower()]
        return self.neighborhoods

    def get_social_buzz(self, city: Optional[str] = None) -> List[Dict[str, Any]]:
        if city and city.lower() != "all":
            return [b for b in self.social_buzz if b["city"].lower() == city.lower()]
        return self.social_buzz

    def get_citizen_reports(self, city: Optional[str] = None) -> List[CitizenReport]:
        if city and city.lower() != "all":
            return [r for r in self.citizen_reports if r.city.lower() == city.lower()]
        return self.citizen_reports

    def add_citizen_report(self, report: CitizenReport) -> CitizenReport:
        self.citizen_reports.insert(0, report)
        return report

    def upvote_report(self, report_id: str) -> Optional[CitizenReport]:
        for r in self.citizen_reports:
            if r.id == report_id:
                r.upvotes += 1
                return r
        return None

db = Database()
