import random
from typing import Dict, Any, List
from app.database import db
from app.nlp_verifier import nlp_verifier

EMERGENCY_DIRECTORIES = {
    "Pune": {
        "police": "112 / 100",
        "ambulance": "108",
        "women_helpline": "1091",
        "tourist_police": "+91-20-2612-2880",
        "disaster_management": "020-25501269",
        "child_helpline": "1098"
    },
    "Delhi": {
        "police": "112 / 100",
        "ambulance": "102 / 108",
        "women_helpline": "1091",
        "tourist_police": "+91-11-2346-9536",
        "disaster_management": "1077",
        "child_helpline": "1098"
    },
    "Mumbai": {
        "police": "112 / 100",
        "ambulance": "108",
        "women_helpline": "103",
        "tourist_police": "+91-22-2262-0111",
        "disaster_management": "1916",
        "child_helpline": "1098"
    },
    "Bengaluru": {
        "police": "112",
        "ambulance": "108",
        "women_helpline": "1091",
        "tourist_police": "+91-80-2294-2222",
        "disaster_management": "080-22221188",
        "child_helpline": "1098"
    },
    "New York": {
        "police": "911",
        "ambulance": "911",
        "women_helpline": "1-800-621-4673",
        "tourist_police": "311",
        "disaster_management": "911 / NYC 311",
        "child_helpline": "1-800-342-3720"
    }
}

CITY_WEATHER_DATA = {
    "Pune": {
        "temp_c": 28,
        "condition": "Pleasant Deccan Breeze",
        "humidity": 48,
        "wind_kmh": 12,
        "aqi": 52,
        "aqi_status": "Good",
        "aqi_advice": "Superb crisp air quality. Perfect for Sinhagad treks & hill cycling."
    },
    "Delhi": {
        "temp_c": 27,
        "condition": "Hazy Sunshine",
        "humidity": 51,
        "wind_kmh": 11,
        "aqi": 142,
        "aqi_status": "Moderate",
        "aqi_advice": "Sensitive groups should wear masks during long outdoor exertion."
    },
    "Mumbai": {
        "temp_c": 31,
        "condition": "Tropical Breeze",
        "humidity": 78,
        "wind_kmh": 19,
        "aqi": 68,
        "aqi_status": "Good",
        "aqi_advice": "Clean coastal air. Perfect conditions for outdoor sightseeing."
    },
    "Bengaluru": {
        "temp_c": 23,
        "condition": "Partly Cloudy & Cool",
        "humidity": 62,
        "wind_kmh": 14,
        "aqi": 54,
        "aqi_status": "Good",
        "aqi_advice": "Excellent air quality. Great for park visits and cycling."
    },
    "New York": {
        "temp_c": 16,
        "condition": "Clear Sky",
        "humidity": 45,
        "wind_kmh": 16,
        "aqi": 38,
        "aqi_status": "Good",
        "aqi_advice": "Crisp autumn weather."
    }
}

class SmartCityService:
    def get_city_dashboard(self, city: str = "Delhi") -> Dict[str, Any]:
        weather = CITY_WEATHER_DATA.get(city, CITY_WEATHER_DATA["Delhi"])
        emergency = EMERGENCY_DIRECTORIES.get(city, EMERGENCY_DIRECTORIES["Delhi"])
        
        hazards = db.get_safety_zones(city=city)
        places = db.get_places(city=city)
        reports = db.get_citizen_reports(city=city)
        buzz = db.get_social_buzz(city=city)

        # Traffic index calculation based on active hazards
        high_hazards_count = sum(1 for h in hazards if h.severity == "high")
        traffic_congestion_pct = min(88, 42 + high_hazards_count * 12)
        traffic_status = "Choked" if traffic_congestion_pct > 75 else ("Moderate" if traffic_congestion_pct > 50 else "Free Flow")

        # Process social buzz with NLP sentiment
        enriched_buzz = []
        for post in buzz:
            nlp_res = nlp_verifier.analyze_social_sentiment(post["content"])
            item = dict(post)
            item["nlp_sentiment"] = nlp_res["sentiment"]
            item["nlp_score"] = nlp_res["score"]
            enriched_buzz.append(item)

        return {
            "city": city,
            "weather": weather,
            "emergency": emergency,
            "traffic": {
                "congestion_percentage": traffic_congestion_pct,
                "status": traffic_status,
                "active_road_hazards": high_hazards_count,
                "average_speed_kmh": max(14, int(45 - traffic_congestion_pct * 0.35))
            },
            "stats": {
                "total_places": len(places),
                "verified_heritage": sum(1 for p in places if p.category == "culture"),
                "food_gems": sum(1 for p in places if p.category == "food"),
                "safety_zones_monitored": len(hazards),
                "citizen_reports_active": len(reports),
                "safe_havens_active": sum(1 for h in hazards if h.severity == "safe")
            },
            "social_buzz": enriched_buzz
        }

smart_city_service = SmartCityService()
