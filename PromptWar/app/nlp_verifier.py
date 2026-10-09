import re
from typing import Dict, Any, Tuple

# NLP Lexicons for Urban Safety, Infrastructure, and Sentiment
CRITICAL_KEYWORDS = {
    "danger", "unsafe", "threat", "harass", "accident", "crash", "blood", "injured",
    "mugged", "robbery", "dark", "blackout", "fire", "submerged", "drown", "deep hole",
    "electric shock", "wire open", "collapsed", "screaming", "assault"
}

MODERATE_KEYWORDS = {
    "pothole", "waterlogging", "jam", "stuck", "congestion", "broken light", "flicker",
    "garbage", "bad smell", "overcrowded", "delayed", "construction", "slow traffic"
}

POSITIVE_KEYWORDS = {
    "great", "amazing", "delicious", "peaceful", "beautiful", "safe", "vibrant",
    "gem", "historic", "serene", "recommended", "clean", "wonderful", "tasty", "scenic"
}

class NLPVerifier:
    def analyze_report(self, title: str, description: str, voice_transcript: str = "") -> Dict[str, Any]:
        combined_text = f"{title} {description} {voice_transcript}".lower()
        words = set(re.findall(r'\b[a-z]{3,}\b', combined_text))

        # Check critical overlaps
        crit_overlap = words.intersection(CRITICAL_KEYWORDS)
        mod_overlap = words.intersection(MODERATE_KEYWORDS)
        pos_overlap = words.intersection(POSITIVE_KEYWORDS)

        # 1. Severity Determination
        if len(crit_overlap) > 0 or "sos" in combined_text or "urgent" in combined_text:
            severity = "High"
            sentiment = "Urgent"
            sentiment_score = -0.85
        elif len(mod_overlap) > 0:
            severity = "Medium"
            sentiment = "Negative"
            sentiment_score = -0.45
        elif len(pos_overlap) > 0:
            severity = "Low"
            sentiment = "Positive"
            sentiment_score = 0.85
        else:
            severity = "Low"
            sentiment = "Neutral"
            sentiment_score = 0.05

        # 2. Authenticity & Confidence Score
        text_length = len(combined_text.strip())
        confidence = 0.70
        if text_length > 40:
            confidence += 0.15
        if voice_transcript and len(voice_transcript) > 10:
            confidence += 0.10  # Multi-modal voice note boosts authenticity
        if len(crit_overlap) + len(mod_overlap) + len(pos_overlap) >= 2:
            confidence += 0.05
        confidence = min(0.98, round(confidence, 2))

        # 3. Actionable Tags & Entities
        detected_entities = []
        if any(w in words for w in ["metro", "station", "train", "bus", "flyover", "road", "underpass", "gate"]):
            detected_entities.append("Transit Infrastructure")
        if any(w in words for w in ["water", "flood", "rain", "drain"]):
            detected_entities.append("Drainage & Weather")
        if any(w in words for w in ["light", "dark", "lamp", "blackout"]):
            detected_entities.append("Municipal Illumination")
        if any(w in words for w in ["food", "tea", "chai", "dosa", "snack", "cafe"]):
            detected_entities.append("Culinary Discovery")

        return {
            "severity": severity,
            "sentiment": sentiment,
            "sentiment_score": sentiment_score,
            "authenticity_score": confidence,
            "entities_extracted": detected_entities,
            "verified": confidence >= 0.80,
            "flagged_keywords": list(crit_overlap.union(mod_overlap))
        }

    def analyze_social_sentiment(self, text: str) -> Dict[str, Any]:
        lower = text.lower()
        words = set(re.findall(r'\b[a-z]{3,}\b', lower))
        
        pos = len(words.intersection(POSITIVE_KEYWORDS))
        neg = len(words.intersection(CRITICAL_KEYWORDS)) + len(words.intersection(MODERATE_KEYWORDS))

        if pos > neg:
            sentiment = "Positive"
            score = 0.5 + min(0.45, pos * 0.15)
        elif neg > pos:
            sentiment = "Urgent" if len(words.intersection(CRITICAL_KEYWORDS)) > 0 else "Warning"
            score = -0.5 - min(0.45, neg * 0.15)
        else:
            sentiment = "Neutral"
            score = 0.0

        return {
            "sentiment": sentiment,
            "score": round(score, 2),
            "is_actionable_civic_alert": neg > 0
        }

nlp_verifier = NLPVerifier()
