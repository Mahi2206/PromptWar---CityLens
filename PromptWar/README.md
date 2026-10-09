# 🌆 CityLens IQ: Smart Urban Exploration & Safety Grid
> **Problem Statement:** *City Life: Exploring, Experiencing & Navigating the Chaos We Call Home*  
> **Mission:** Transform fragmented real-world city data, sensor feeds, crowdsourced reports, and cultural history into actionable, verified insights and safe, enjoyable navigation.

---

## 🌟 Overview & Problem Statement Alignment

Urban life is dynamic, vibrant, and unpredictable — from discovering centuries-old street food stalls and UNESCO heritage sites to navigating sudden weather changes, traffic choke points, and dimly lit corridors.

**CityLens IQ** is a full-stack, AI-driven urban intelligence platform designed to turn urban chaos into structured clarity across the 5 pillars specified in the challenge:

| Challenge Pillar | Solution in CityLens IQ |
|---|---|
| **1. Exploration & Hospitality** | Curated catalog of tourist attractions, legendary street food, boutique stays, and budget gems with budget filters (`$`, `$$`, `$$$`) and rating verification. |
| **2. History & Culture** | Living history narratives, architectural folklore, and **in-browser Voice Audio Guide narration** powered by the Web Speech API. |
| **3. Safety & Security** | Real-time hazard monitoring (accident blackspots, waterlogging, poor street lighting), 24/7 Safe Havens, and the **Safe Route Navigator** with hazard deflection. |
| **4. Best vs. Worst Places** | Multi-dimensional **Livability Radar Matrix** comparing sectors on Safety, Cleanliness/AQI, Affordability, User Ratings, Transit, and Nightlife. |
| **5. Smart City Insights** | Real-time weather, Air Quality Index (AQI), live traffic congestion gauge, emergency SOS directory, and **Live Social Buzz stream** with NLP sentiment analysis. |
| **Citizen Studio & Privacy Mode** | Crowdsource studio with **Voice Dictation (Web Speech)**, photo evidence, **NLP Severity Verification**, and **Confidential Whistleblower Secrecy Mode** (Identity cloaking + GPS jitter). |
| **AI/ML & NLP Intelligence** | Conversational **CityLens AI Copilot** grounded in live sensor data, places, and safety grids. |

---

## 🚀 Key Features

### 1. 🧭 Safe Route Navigator (AI Hazard Avoidance)
- Computes optimal routes between any two points in the city.
- Three specialized routing modes:
  - 🛡️ **Safest (Well-Lit & Monitored):** Evaluates proximity to reported accident blackspots, crime risks, and unlit alleys, actively recalculating waypoints around hazard perimeters. Delivers a **Safety Grade (A+, A, B, C)**, Well-Lit percentage (e.g. 95%), and count of risk zones bypassed.
  - ⚡ **Fastest:** Direct path minimizing travel time, with warning overlays if cutting through active hazards.
  - 🌿 **Scenic:** Routes through green parks, heritage boulevards, and pedestrian zones.
- Step-by-step turn guidance with micro-level safety directives.

### 2. 🏛️ Living History, Street Food & Audio Stories
- Comprehensive directory spanning iconic street food, cultural heritage, and budget finds.
- **Interactive Audio Guide:** Click *"Audio Story"* on any landmark to listen to spoken history and architectural secrets directly in your browser.
- Filter by category, budget (`$`, `$$`, `$$$`), and real-time search terms.

### 3. 📊 Best vs. Worst Places: Urban Livability Radar
- Select any two neighborhoods (e.g., *Connaught Place* vs *Old Delhi*, or *South Mumbai* vs *Bandra*).
- Interactive Chart.js Radar visualization comparing:
  1. Safety Score
  2. Cleanliness & Air Quality
  3. Affordability Index
  4. Community Rating
  5. Public Transit Connectivity
  6. Nightlife & Dining
- Deep-dive breakdown of pros, cons, *"Best for"*, and *"Avoid for"*.

### 4. 📢 Multi-Modal Citizen Voice Studio & NLP Verifier
- Citizens can report civic hazards (potholes, lighting blackouts, waterlogging) or share hidden culinary discoveries.
- **Speech-to-Text / Voice Recording:** Dictate reports directly using browser speech recognition.
- **Photo Evidence:** Upload and preview visual proof.
- **Instant NLP Preflight & Scoring:** The built-in NLP engine evaluates urgency, distress keywords, sentiment score (-1.0 to +1.0), and authenticity confidence score before publishing to the live city grid.
- **Community Upvoting:** Crowdsourced verification and consensus building.

### 5. 🤖 UrbanIQ AI Copilot
- Conversational AI assistant with full spatial and sensor awareness.
- Ready-to-use prompt chips: *Solo Night Safety*, *Budget Street Food*, *Historic Walking Tour*, *Compare Sectors*.
- Generates structured itineraries, local customs advice, and routing recommendations.

### 6. 🚨 24/7 Crisis & Emergency Response Grid
- One-click SOS access to Police PCR (112), Ambulance (108), Women's Helpline (1091/103), and Tourist Assistance.
- Maps 24/7 illuminated **Safe Havens** where commuters can seek shelter and emergency assistance.

---

## 🏗️ Architecture & Technology Stack

```
c:\PromptWar\
├── app/
│   ├── main.py                  # FastAPI REST routes, static file mounting & controllers
│   ├── models.py                # Pydantic schemas (Places, Hazards, Routes, Reports, AI chats)
│   ├── database.py              # In-memory + persisted storage for multi-city urban datasets
│   ├── router_engine.py         # Geo-mathematical routing engine with hazard deflection
│   ├── nlp_verifier.py          # NLP sentiment classifier & urgency verification pipeline
│   ├── ai_copilot.py            # Conversational assistant grounded in city knowledge
│   ├── smart_city_service.py    # Simulated real-time sensor streams (weather, AQI, traffic)
│   └── data/                    # Rich datasets for Delhi, Mumbai, Bengaluru, New York
│       ├── places.json          # Curated culinary, cultural, hotel, and budget spots
│       ├── safety_zones.json    # Hazards, blackspots, flood points, and safe havens
│       ├── neighborhoods.json   # Comparative metrics & pros/cons scorecard
│       └── social_buzz.json     # Live social pulse feed with sentiment tags
├── static/
│   ├── css/style.css            # Modern glassmorphism UI, glowing accents & animations
│   ├── js/
│   │   ├── app.js               # Main application coordinator & state manager
│   │   ├── map.js               # Leaflet map manager, custom pins & polyline rendering
│   │   ├── routing.js           # Safe route UI, waypoints & step-by-step navigation
│   │   ├── comparison.js        # Chart.js radar charts & neighborhood comparison matrix
│   │   ├── citizen_reports.js   # Crowdsource studio, Web Speech dictation & photo preview
│   │   └── ai_copilot.js        # AI chat interface & suggestion cards
│   └── uploads/                 # Storage directory for citizen photo evidence
├── templates/
│   └── index.html               # Master Single-Page Application (responsive)
├── run.py                       # Single-command application launcher
├── requirements.txt             # Clean backend dependencies
└── README.md                    # Project documentation
```

### Technologies Used
- **Backend:** Python 3.13, FastAPI, Uvicorn, Pydantic, Requests
- **Frontend:** HTML5, Tailwind CSS, JavaScript (ES6+), Leaflet.js, Chart.js
- **Audio / Speech APIs:** Web Speech API (SpeechSynthesis for Audio Stories & SpeechRecognition for Voice Dictation)
- **Algorithms:** Haversine formula, radial hazard deflection pathfinding, keyword-driven NLP sentiment & urgency scoring

---

## 🏃 Running the Application

### 1. Install Dependencies
```bash
python -m pip install -r requirements.txt
```

### 2. Launch the Platform
```bash
python run.py
```

### 3. Open in Browser
- **Web Application:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive OpenAPI Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🌐 Supported Cities
The platform features rich pre-configured spatial datasets for:
1. **Delhi NCR:** Chandni Chowk, Paranthe Wali Gali, Humayun's Tomb, Hauz Khas, ISBT Blackspot, Connaught Place Safe Haven.
2. **Mumbai:** Colaba, Marine Drive Promenade, Bademiya, Bandra Bandstand, Milan Subway flood hazards.
3. **Bengaluru:** Indiranagar Craft Corridor, VV Puram Food Street, Cubbon Park, Silk Board Junction, MG Road Hub.
4. **New York:** Central Park, Greenwich Village Jazz, Times Square Safe Haven.
