import uvicorn
import sys
import os

# Ensure current directory is on python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    print("=" * 60)
    print("[*] Starting CityLens IQ: Smart Urban Exploration & Safety Grid")
    print("[*] Web UI & API available at: http://127.0.0.1:8000")
    print("[*] Interactive API Documentation at: http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
