// CityLens Interactive Map Controller
let map;
let placesLayer;
let safetyLayer;
let safeHavensLayer;
let reportsLayer;
let routeLayer;

const CITY_COORDINATES = {
  "Pune": [18.5204, 73.8567],
  "Mumbai": [18.9600, 72.8300],
  "Delhi": [28.6250, 77.2250],
  "Bengaluru": [12.9716, 77.6100],
  "New York": [40.7580, -73.9855]
};

const CITY_EARTH_URLS = {
  "Pune": "https://earth.google.com/web/search/Pune,+Maharashtra/@18.5035801,73.8746239,584.0166196a,35272.37099332d,35y,0h,0t,0r/data=CjsaDQoJL20vMDE1eTJxGAIiJgokCR79530eOjRAESD9530eOjTAGT4CMEBVb0lAITkCMEBVb0nAQgIIAToDCgEwQgIIAEoNCP___________wEQAA",
  "Mumbai": "https://earth.google.com/web/search/Mumbai,+Maharashtra/@18.9600,72.8300,1000a,30000d,35y,0h,0t,0r",
  "Delhi": "https://earth.google.com/web/search/New+Delhi/@28.6250,77.2250,1000a,30000d,35y,0h,0t,0r",
  "Bengaluru": "https://earth.google.com/web/search/Bengaluru/@12.9716,77.6100,1000a,30000d,35y,0h,0t,0r",
  "New York": "https://earth.google.com/web/search/New+York/@40.7580,-73.9855,1000a,30000d,35y,0h,0t,0r"
};

function switchMapViewMode(mode) {
  const mapContainer = document.getElementById('map');
  const earthContainer = document.getElementById('googleEarthContainer');
  const btnGrid = document.getElementById('btnViewGrid');
  const btnEarth = document.getElementById('btnViewEarth');

  if (mode === 'earth') {
    if (mapContainer) mapContainer.classList.add('hidden');
    if (earthContainer) earthContainer.classList.remove('hidden');
    if (btnEarth) btnEarth.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-600 text-white shadow-md transition';
    if (btnGrid) btnGrid.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 text-slate-400 hover:text-slate-200 transition';
  } else {
    if (mapContainer) mapContainer.classList.remove('hidden');
    if (earthContainer) earthContainer.classList.add('hidden');
    if (btnGrid) btnGrid.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-600 text-white shadow-md transition';
    if (btnEarth) btnEarth.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 text-slate-400 hover:text-slate-200 transition';
    if (map) {
      setTimeout(() => map.invalidateSize(), 50);
    }
  }
}

function updateEarthEmbedForCity(cityName) {
  const coords = CITY_COORDINATES[cityName] || [18.5204, 73.8567];
  const iframe = document.getElementById('googleEarthIframe');
  const directLink = document.getElementById('googleEarthDirectLink');

  if (iframe) {
    iframe.src = `https://maps.google.com/maps?q=${coords[0]},${coords[1]}&t=k&z=15&ie=UTF8&iwloc=&output=embed`;
  }
  if (directLink && CITY_EARTH_URLS[cityName]) {
    directLink.href = CITY_EARTH_URLS[cityName];
  }
}

function initMap(initialCity = "Pune") {
  const coords = CITY_COORDINATES[initialCity] || [18.5204, 73.8567];

  map = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView(coords, 13);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Clean high-resolution OpenStreetMap tiles (100% free, no API key watermark)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  }).addTo(map);

  placesLayer = L.layerGroup().addTo(map);
  safetyLayer = L.layerGroup().addTo(map);
  safeHavensLayer = L.layerGroup().addTo(map);
  reportsLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);

  // Map click listener to allow setting origin/destination
  map.on('click', function(e) {
    if (window.pendingRoutePin) {
      if (window.pendingRoutePin === 'start') {
        document.getElementById('routeStartLat').value = e.latlng.lat.toFixed(5);
        document.getElementById('routeStartLng').value = e.latlng.lng.toFixed(5);
        document.getElementById('routeStartLabel').value = `Map Point (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`;
        window.pendingRoutePin = null;
        updateRouteStatusText("Origin set! Click destination or pick below.");
      } else if (window.pendingRoutePin === 'end') {
        document.getElementById('routeEndLat').value = e.latlng.lat.toFixed(5);
        document.getElementById('routeEndLng').value = e.latlng.lng.toFixed(5);
        document.getElementById('routeEndLabel').value = `Map Point (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`;
        window.pendingRoutePin = null;
        updateRouteStatusText("Destination set! Ready to calculate safe route.");
      }
    }
  });
}

function flyToCity(cityName) {
  if (CITY_COORDINATES[cityName]) {
    map.flyTo(CITY_COORDINATES[cityName], 13, { duration: 1.2 });
  }
}

// Custom icons builder
function createCustomPin(iconHtml, bgClass) {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shadow-lg ${bgClass} border-2 border-white/80 cursor-pointer transform hover:scale-110 transition-transform">
            ${iconHtml}
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

function renderPlacesOnMap(places) {
  placesLayer.clearLayers();

  places.forEach(p => {
    let iconChar = '📍';
    let bgClass = 'bg-cyan-600';

    if (p.category === 'food') {
      iconChar = '🍲';
      bgClass = 'bg-amber-500';
    } else if (p.category === 'culture') {
      iconChar = '🏛️';
      bgClass = 'bg-indigo-600';
    } else if (p.category === 'hotel') {
      iconChar = '🏨';
      bgClass = 'bg-emerald-600';
    } else if (p.category === 'budget_spot') {
      iconChar = '💎';
      bgClass = 'bg-fuchsia-600';
    }

    const marker = L.marker([p.lat, p.lng], {
      icon: createCustomPin(iconChar, bgClass)
    });

    const popupHtml = `
      <div class="p-1 max-w-xs text-slate-100">
        <img src="${p.image_url}" class="w-full h-24 object-cover rounded mb-2 border border-slate-700" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=400&q=80'" />
        <div class="flex items-center justify-between">
          <span class="text-xs uppercase font-bold tracking-wider text-cyan-400">${p.subcategory}</span>
          <span class="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">⭐ ${p.rating} (${p.price_level})</span>
        </div>
        <h4 class="font-bold text-sm mt-1 text-white">${p.name}</h4>
        <p class="text-xs text-slate-300 mt-1 line-clamp-2">${p.description}</p>
        
        <div class="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between gap-1">
          <button onclick="playAudioGuide('${p.id}')" class="px-2 py-1 text-xs rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 flex items-center gap-1 font-medium transition">
            🔊 Listen Story
          </button>
          <button onclick="setAsNavTarget(${p.lat}, ${p.lng}, '${p.name.replace(/'/g, "\\'")}')" class="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition flex items-center gap-1">
            🧭 Safe Route
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    placesLayer.addLayer(marker);
  });
}

function renderSafetyZonesOnMap(zones) {
  safetyLayer.clearLayers();
  safeHavensLayer.clearLayers();

  zones.forEach(z => {
    if (z.severity === 'safe') {
      // Safe Haven marker (Green shield)
      const marker = L.marker([z.lat, z.lng], {
        icon: createCustomPin('🛡️', 'bg-emerald-500 glow-emerald')
      });
      marker.bindPopup(`
        <div class="p-1 max-w-xs text-slate-100">
          <div class="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span>🛡️ Designated Safe Haven</span>
          </div>
          <h4 class="font-bold text-sm mt-1 text-white">${z.title}</h4>
          <p class="text-xs text-slate-300 mt-1">${z.description}</p>
          <p class="text-xs text-emerald-300 mt-2 p-1.5 bg-emerald-950/40 border border-emerald-500/20 rounded font-medium">💡 ${z.safety_tips}</p>
        </div>
      `);
      safeHavensLayer.addLayer(marker);

      // Safe Haven area circle
      const circle = L.circle([z.lat, z.lng], {
        radius: z.radius_meters,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4'
      });
      safeHavensLayer.addLayer(circle);

    } else {
      // Hazard marker (Red/Amber warning)
      const isHigh = z.severity === 'high';
      const color = isHigh ? '#ef4444' : '#f59e0b';
      const bgClass = isHigh ? 'bg-red-600 glow-rose' : 'bg-amber-600';

      const marker = L.marker([z.lat, z.lng], {
        icon: createCustomPin('⚠️', bgClass)
      });

      marker.bindPopup(`
        <div class="p-1 max-w-xs text-slate-100">
          <div class="flex items-center gap-1.5 ${isHigh ? 'text-red-400' : 'text-amber-400'} text-xs font-bold uppercase tracking-wider">
            <span>⚠️ Hazard Alert: ${z.category.replace('_', ' ').toUpperCase()}</span>
          </div>
          <h4 class="font-bold text-sm mt-1 text-white">${z.title}</h4>
          <p class="text-xs text-slate-300 mt-1">${z.description}</p>
          <p class="text-xs ${isHigh ? 'text-red-300 bg-red-950/50 border-red-500/30' : 'text-amber-300 bg-amber-950/50 border-amber-500/30'} mt-2 p-1.5 border rounded">
            🛡️ <b>Safety Advisory:</b> ${z.safety_tips}
          </p>
        </div>
      `);
      safetyLayer.addLayer(marker);

      // Hazard radius circle
      const circle = L.circle([z.lat, z.lng], {
        radius: z.radius_meters,
        color: color,
        fillColor: color,
        fillOpacity: isHigh ? 0.22 : 0.15,
        weight: 2
      });
      safetyLayer.addLayer(circle);
    }
  });
}

function renderCitizenReportsOnMap(reports) {
  reportsLayer.clearLayers();

  reports.forEach(r => {
    let iconChar = '📢';
    let bgClass = 'bg-orange-500';

    if (r.category === 'hidden_gem') {
      iconChar = '✨';
      bgClass = 'bg-teal-500';
    } else if (r.category === 'pothole_roadwork') {
      iconChar = '🚧';
      bgClass = 'bg-yellow-600';
    } else if (r.category === 'broken_lighting') {
      iconChar = '💡';
      bgClass = 'bg-purple-600';
    }

    const marker = L.marker([r.lat, r.lng], {
      icon: createCustomPin(iconChar, bgClass)
    });

    marker.bindPopup(`
      <div class="p-1 max-w-xs text-slate-100">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-orange-400 uppercase tracking-wider">${r.category.replace('_', ' ')}</span>
          <span class="text-slate-400 text-[10px]">${r.timestamp}</span>
        </div>
        <h4 class="font-bold text-sm mt-1 text-white">${r.title}</h4>
        <p class="text-xs text-slate-300 mt-1">${r.description}</p>
        ${r.voice_transcript ? `<p class="text-[11px] text-cyan-300 italic mt-1 bg-cyan-950/30 p-1 rounded border border-cyan-800/40">🎙️ "${r.voice_transcript}"</p>` : ''}
        <div class="flex items-center justify-between mt-2 pt-1 border-t border-slate-700 text-xs">
          <span class="text-slate-400">By <span class="${r.is_confidential ? 'text-purple-300 font-semibold' : ''}">${r.reporter_name}</span> ${r.is_confidential ? '🔒' : ''}</span>
          <span class="text-emerald-400 font-semibold">AI Conf: ${(r.ai_authenticity_score * 100).toFixed(0)}%</span>
        </div>
      </div>
    `);
    reportsLayer.addLayer(marker);
  });
}

function drawRouteOnMap(coordinates, mode, safetyGrade) {
  routeLayer.clearLayers();

  if (!coordinates || coordinates.length === 0) return;

  let routeColor = '#10b981'; // Green for safest
  if (mode === 'scenic') routeColor = '#06b6d4'; // Cyan
  if (mode === 'fastest') routeColor = '#f59e0b'; // Amber

  const polyline = L.polyline(coordinates, {
    color: routeColor,
    weight: 6,
    opacity: 0.9,
    lineJoin: 'round'
  }).addTo(routeLayer);

  // Add origin and destination pulse pins
  const startPt = coordinates[0];
  const endPt = coordinates[coordinates.length - 1];

  const startPin = L.marker(startPt, {
    icon: createCustomPin('🟢', 'bg-emerald-600')
  }).bindPopup('<b>Starting Point</b>').addTo(routeLayer);

  const endPin = L.marker(endPt, {
    icon: createCustomPin('🏁', 'bg-cyan-600')
  }).bindPopup('<b>Destination Point</b>').addTo(routeLayer);

  map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
}

// Text-to-speech Web Speech synthesis for audio guide
function playAudioGuide(placeId) {
  fetch(`/api/places/${placeId}`)
    .then(res => res.json())
    .then(p => {
      const text = p.audio_guide_text || p.historical_significance || p.description;
      if (!text) return;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // stop any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);

        if (window.showToast) {
          window.showToast(`🔊 Playing Audio Guide for: ${p.name}`, 'info');
        }
      } else {
        alert(text);
      }
    });
}
