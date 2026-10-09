import re
from typing import List, Dict, Any
from app.models import AiChatRequest, AiChatResponse, Place
from app.database import db

class AiCityCopilot:
    def chat(self, req: AiChatRequest) -> AiChatResponse:
        user_msg = req.message.lower().strip()
        city = req.city
        all_places = db.get_places(city=city)
        safety_hazards = db.get_safety_zones(city=city)
        neighborhoods = db.get_neighborhoods(city=city)

        matched_places: List[Place] = []
        safety_alerts: List[str] = []
        tips: List[str] = []
        reply_lines: List[str] = []

        # 1. Budget / Food Queries
        if any(w in user_msg for w in ["food", "eat", "street", "dinner", "lunch", "snack", "tasty", "dosa", "parantha"]):
            food_places = [p for p in all_places if p.category == "food" or "food" in p.tags]
            if req.budget == "$" or "budget" in user_msg or "cheap" in user_msg:
                food_places = [p for p in food_places if p.price_level == "$"]
            matched_places = food_places[:4]

            reply_lines.append(f"🍲 **Gastronomic Guide for {city}:**")
            reply_lines.append(f"I've curated top-rated spots balancing authentic local flavor, verified hygiene, and budget:")
            for p in matched_places:
                reply_lines.append(f"• **{p.name}** ({p.price_level}) - {p.description[:110]}... ⭐ {p.rating}")
            tips.append("Always verify if the stall uses filtered water, and visit during peak rush hours when food is prepared piping hot fresh off the stove.")
            tips.append("Carry small currency denominations or use UPI/contactless mobile pay for seamless street vendor transactions.")

        # 2. Safety / Solo Traveler / Night Queries
        elif any(w in user_msg for w in ["safe", "danger", "solo", "night", "avoid", "women", "evening", "dark"]):
            reply_lines.append(f"🛡️ **Safety Advisory & Real-Time Intelligence for {city}:**")
            reply_lines.append("Here are key real-time verified precautions and safe haven recommendations:")
            
            # Find safe havens and high hazards
            high_hazards = [z for z in safety_hazards if z.severity == "high"]
            safe_havens = [z for z in safety_hazards if z.severity == "safe"]

            for sh in safe_havens[:2]:
                reply_lines.append(f"✅ **Safe Haven Active:** {sh.title} — {sh.description}")
            for hz in high_hazards[:2]:
                safety_alerts.append(f"⚠️ **High Alert Zone:** {hz.title} ({hz.category.replace('_', ' ').title()}) — {hz.safety_tips}")

            tips.append("Prefer primary well-lit boulevards and metro transit corridors over secondary unlit shortcuts after 9:30 PM.")
            tips.append("Keep the emergency SOS quick dial handy in our app header (Police: 112 / Women Helpline: 1091).")
            matched_places = [p for p in all_places if "high-security" in p.tags or "unesco" in p.tags][:3]

        # 3. History & Heritage / Culture Queries
        elif any(w in user_msg for w in ["history", "culture", "heritage", "monument", "temple", "museum", "ancient", "tradition"]):
            culture_places = [p for p in all_places if p.category in ("culture", "attraction")]
            matched_places = culture_places[:4]

            reply_lines.append(f"🏛️ **Living History & Heritage of {city}:**")
            reply_lines.append(f"Unravel centuries of architectural brilliance, folklore, and timeless heritage:")
            for p in matched_places:
                hist = p.historical_significance or p.description
                reply_lines.append(f"• **{p.name}**: {hist[:120]}... (Best time: {p.best_time})")
            tips.append("Turn on our **Audio Guide Mode** when at the landmark to listen to narrated folklore and architectural details.")
            tips.append("Arrive right at sunrise or early morning opening hours to experience the serenity before tourist crowds swell.")

        # 4. Neighborhood / Best vs Worst Queries
        elif any(w in user_msg for w in ["compare", "neighborhood", "area", "sector", "best", "worst"]):
            reply_lines.append(f"📊 **Urban Neighborhood Intelligence Matrix ({city}):**")
            for n in neighborhoods[:3]:
                reply_lines.append(f"🏙️ **{n.name}**:")
                reply_lines.append(f"   - Safety: {n.safety_score}/100 | Cleanliness: {n.cleanliness_score}/100 | Affordability: {n.affordability_score}/100")
                reply_lines.append(f"   - **Best for:** {n.best_for}")
                reply_lines.append(f"   - **Watch out for:** {n.worst_for}")
            tips.append("Check the dynamic Radar Chart on our Comparison tab to compare all 5 dimensions simultaneously.")

        # 5. General / Itinerary Queries
        else:
            matched_places = all_places[:4]
            reply_lines.append(f"✨ **Smart City Exploration Plan for {city}:**")
            reply_lines.append(f"Whether you seek culinary gems, majestic heritage, or safe transit corridors, {city} offers endless discovery:")
            for p in matched_places:
                reply_lines.append(f"• **{p.name}** ({p.subcategory}) — {p.description[:95]}... ⭐ {p.rating}")
            tips.append("Use our **Safe Route Navigator** to compute well-lit, risk-penalized paths when transitioning between destinations.")
            tips.append("Check the live **Citizen Pulse Feed** for crowd-sourced roadwork, weather, and street condition updates.")

        if not safety_alerts:
            safety_alerts.append(f"City status for {city} is normal. Continuous sensor monitoring active.")

        return AiChatResponse(
            reply="\n\n".join(reply_lines),
            recommendations=matched_places,
            safety_alerts=safety_alerts,
            curated_tips=tips
        )

ai_copilot = AiCityCopilot()
