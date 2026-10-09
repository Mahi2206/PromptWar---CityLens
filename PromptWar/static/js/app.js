// CityLens Core Application Orchestrator
let currentCity = "Pune";
let activeCategory = "all";
let activeBudget = "all";
let placesData = [];

document.addEventListener('DOMContentLoaded', () => {
  initMap(currentCity);
  loadCityData(currentCity);
  setupEventListeners();
  initSpeechRecognition();
});

function setupEventListeners() {
  // City dropdown
  const citySelect = document.getElementById('citySelector');
  if (citySelect) {
    citySelect.addEventListener('change', (e) => {
      currentCity = e.target.value;
      flyToCity(currentCity);
      loadCityData(currentCity);
      ensureRouteInputsInitialized(true);
    });
  }

  // Places search input
  const searchInput = document.getElementById('placeSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      filterAndRenderPlaces();
    }, 250));
  }

  // Budget filter buttons
  document.querySelectorAll('.budget-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.budget-filter-btn').forEach(b => b.classList.remove('bg-cyan-600', 'text-white'));
      btn.classList.add('bg-cyan-600', 'text-white');
      activeBudget = btn.dataset.budget;
      filterAndRenderPlaces();
    });
  });

  // Confidential / Secrecy toggle in Citizen Studio
  const privacyToggle = document.getElementById('confidentialToggle');
  if (privacyToggle) {
    privacyToggle.addEventListener('change', togglePrivacyMode);
  }

  // Citizen report photo input
  const photoInput = document.getElementById('reportPhotoInput');
  if (photoInput) {
    photoInput.addEventListener('change', handlePhotoSelect);
  }

  // Citizen report submit
  const reportForm = document.getElementById('citizenReportForm');
  if (reportForm) {
    reportForm.addEventListener('submit', handleReportSubmit);
  }

  // Real-time NLP preflight typing listeners
  ['reportTitle', 'reportDescription'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(runNLPPreflight, 400));
    }
  });

  // AI chat enter key listener
  const aiInput = document.getElementById('aiChatInput');
  if (aiInput) {
    aiInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendAiMessage();
    });
  }
}

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

async function loadCityData(city) {
  try {
    // 1. Fetch Dashboard & Live Sensors
    const dashRes = await fetch(`/api/dashboard?city=${city}`);
    const dashData = await dashRes.json();
    renderDashboardSensors(dashData);
    renderSocialBuzz(dashData.social_buzz || []);
    renderEmergencyDirectory(dashData.emergency || {});

    // 2. Fetch Places
    const placesRes = await fetch(`/api/places?city=${city}`);
    placesData = await placesRes.json();
    filterAndRenderPlaces();
    renderPlacesOnMap(placesData);

    // 3. Fetch Safety Zones
    const safetyRes = await fetch(`/api/safety-zones?city=${city}`);
    const safetyData = await safetyRes.json();
    renderSafetyZonesOnMap(safetyData);

    // 4. Fetch Neighborhood Comparisons
    loadNeighborhoodsComparison(city);

    // 5. Fetch Citizen Reports
    loadCitizenReports(city);

    // 6. Update Google Earth Embed
    if (window.updateEarthEmbedForCity) {
      updateEarthEmbedForCity(city);
    }
  } catch (err) {
    console.error("Error loading city data:", err);
  }
}

function renderDashboardSensors(data) {
  if (!data) return;

  // Weather & AQI
  const w = data.weather;
  if (w) {
    safeSetText('weatherTemp', `${w.temp_c}°C`);
    safeSetText('weatherCondition', w.condition);
    safeSetText('weatherHumidity', `Humidity ${w.humidity}% • Wind ${w.wind_kmh} km/h`);

    const aqiEl = document.getElementById('weatherAQI');
    if (aqiEl) {
      aqiEl.innerText = `AQI ${w.aqi} (${w.aqi_status})`;
      if (w.aqi_status === 'Good') {
        aqiEl.className = 'text-xs px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30';
      } else if (w.aqi_status === 'Moderate') {
        aqiEl.className = 'text-xs px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-400 border border-amber-500/30';
      } else {
        aqiEl.className = 'text-xs px-2 py-0.5 rounded font-bold bg-red-950 text-red-400 border border-red-500/30';
      }
    }
  }

  // Traffic
  const t = data.traffic;
  if (t) {
    safeSetText('trafficPercentage', `${t.congestion_percentage}% Congested`);
    safeSetText('trafficStatus', `${t.status} • Avg Speed: ${t.average_speed_kmh} km/h`);
    const tBar = document.getElementById('trafficProgressBar');
    if (tBar) {
      tBar.style.width = `${t.congestion_percentage}%`;
      tBar.className = t.congestion_percentage > 70 ? 'h-full bg-red-500 rounded' : (t.congestion_percentage > 40 ? 'h-full bg-amber-500 rounded' : 'h-full bg-emerald-500 rounded');
    }
  }

  // Stats Counters
  if (data.stats) {
    safeSetText('statTotalPlaces', data.stats.total_places);
    safeSetText('statSafetyZones', data.stats.safety_zones_monitored);
    safeSetText('statReportsActive', data.stats.citizen_reports_active);
    safeSetText('statSafeHavens', data.stats.safe_havens_active);
  }
}

function renderSocialBuzz(buzzList) {
  const container = document.getElementById('socialBuzzFeed');
  if (!container) return;

  container.innerHTML = buzzList.map(b => {
    let sentColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
    if (b.nlp_sentiment === 'Urgent') sentColor = 'text-red-400 border-red-500/30 bg-red-950/40';
    else if (b.nlp_sentiment === 'Warning') sentColor = 'text-amber-400 border-amber-500/30 bg-amber-950/40';

    return `
      <div class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-slate-200">${b.handle_name}</span>
            <span class="text-[10px] text-slate-500">${b.author}</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded border font-semibold ${sentColor}">${b.nlp_sentiment}</span>
        </div>
        <p class="text-slate-300 text-[11.5px] leading-relaxed">${b.content}</p>
        <div class="flex items-center justify-between mt-2 pt-1 border-t border-slate-800 text-[10px] text-slate-500">
          <span>📍 ${b.location}</span>
          <span>${b.timestamp} • ❤️ ${b.likes}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderEmergencyDirectory(emerg) {
  const container = document.getElementById('emergencyDirectoryContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="grid grid-cols-2 gap-2 text-xs">
      <a href="tel:${emerg.police.split('/')[0].trim()}" class="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30 hover:border-red-400 transition flex items-center justify-between">
        <div>
          <div class="font-bold text-red-400">🚓 Police PCR</div>
          <div class="text-[11px] text-slate-300 font-mono">${emerg.police}</div>
        </div>
        <span class="text-xs">📞</span>
      </a>
      <a href="tel:${emerg.ambulance.split('/')[0].trim()}" class="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-400 transition flex items-center justify-between">
        <div>
          <div class="font-bold text-emerald-400">🚑 Ambulance</div>
          <div class="text-[11px] text-slate-300 font-mono">${emerg.ambulance}</div>
        </div>
        <span class="text-xs">📞</span>
      </a>
      <a href="tel:${emerg.women_helpline}" class="p-2.5 rounded-lg bg-fuchsia-950/30 border border-fuchsia-500/30 hover:border-fuchsia-400 transition flex items-center justify-between">
        <div>
          <div class="font-bold text-fuchsia-400">🛡️ Women Helpline</div>
          <div class="text-[11px] text-slate-300 font-mono">${emerg.women_helpline}</div>
        </div>
        <span class="text-xs">📞</span>
      </a>
      <a href="tel:${emerg.tourist_police.split('/')[0].trim()}" class="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400 transition flex items-center justify-between">
        <div>
          <div class="font-bold text-cyan-400">🗺️ Tourist Assistance</div>
          <div class="text-[11px] text-slate-300 font-mono">${emerg.tourist_police}</div>
        </div>
        <span class="text-xs">📞</span>
      </a>
    </div>
  `;
}

function setCategoryFilter(category) {
  activeCategory = category;
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    if (btn.dataset.category === category) {
      btn.className = 'cat-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 transition';
    } else {
      btn.className = 'cat-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 transition';
    }
  });
  filterAndRenderPlaces();
}

function filterAndRenderPlaces() {
  const query = (document.getElementById('placeSearchInput')?.value || '').toLowerCase().trim();

  let filtered = placesData.filter(p => {
    let matchCat = activeCategory === 'all';
    if (!matchCat) {
      if (activeCategory === 'food') {
        matchCat = p.category === 'food' || p.tags.some(t => t.includes('food') || t.includes('eat') || t.includes('taste'));
      } else if (activeCategory === 'culture') {
        matchCat = p.category === 'culture' || p.category === 'attraction' || p.tags.some(t => t.includes('heritage') || t.includes('unesco') || t.includes('monument'));
      } else if (activeCategory === 'hotel') {
        matchCat = p.category === 'hotel' || p.tags.some(t => t.includes('stay') || t.includes('hotel'));
      } else if (activeCategory === 'budget_spot') {
        matchCat = p.category === 'budget_spot' || p.price_level === '$' || p.tags.some(t => t.includes('budget'));
      } else {
        matchCat = p.category === activeCategory;
      }
    }

    const matchBudget = activeBudget === 'all' || p.price_level === activeBudget;
    const matchQuery = !query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || p.tags.some(t => t.toLowerCase().includes(query));
    return matchCat && matchBudget && matchQuery;
  });

  renderPlacesGrid(filtered);
}

function resetAllFilters() {
  activeCategory = 'all';
  activeBudget = 'all';
  const searchInput = document.getElementById('placeSearchInput');
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('.budget-filter-btn').forEach(btn => {
    if (btn.dataset.budget === 'all') {
      btn.classList.add('bg-cyan-600', 'text-white');
    } else {
      btn.classList.remove('bg-cyan-600', 'text-white');
    }
  });

  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    if (btn.dataset.category === 'all') {
      btn.className = 'cat-filter-btn px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 transition';
    } else {
      btn.className = 'cat-filter-btn px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/70 text-slate-400 border border-slate-800 hover:text-slate-200 transition';
    }
  });

  filterAndRenderPlaces();
}

function renderPlacesGrid(places) {
  const grid = document.getElementById('placesGrid');
  if (!grid) return;

  if (places.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full p-8 text-center glass-panel rounded-2xl space-y-3">
        <div class="text-3xl">🔍</div>
        <p class="text-xs text-slate-300 font-medium">No spots match your specific combination of filters.</p>
        <button onclick="resetAllFilters()" class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md">
          Reset All Filters & Show All Spots
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = places.map(p => `
    <div class="rounded-2xl overflow-hidden glass-panel glass-panel-hover flex flex-col justify-between shadow-lg">
      <div>
        <div class="relative h-40 w-full overflow-hidden">
          <img src="${p.image_url}" class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=400&q=80'" />
          <div class="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/85 text-cyan-300 border border-cyan-500/35 backdrop-blur-md">
            ${p.subcategory}
          </div>
          <div class="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-950/85 text-amber-400 border border-amber-500/35 backdrop-blur-md">
            ⭐ ${p.rating} (${p.price_level})
          </div>
        </div>

        <div class="p-4 space-y-2">
          <h3 class="font-bold text-sm text-slate-100 hover:text-cyan-400 transition cursor-pointer leading-snug" onclick="map.flyTo([${p.lat}, ${p.lng}], 15)">
            ${p.name}
          </h3>
          <p class="text-xs text-slate-400 leading-relaxed line-clamp-2">${p.description}</p>
          
          <div class="flex flex-wrap gap-1.5 pt-1">
            ${p.tags.slice(0, 3).map(t => `<span class="px-2 py-0.5 rounded-md text-[10px] bg-slate-800/80 text-slate-300 font-medium">#${t}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="p-4 pt-0 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-3">
        <button onclick="playAudioGuide('${p.id}')" class="px-3 py-1.5 text-xs rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/50 flex items-center gap-1.5 font-semibold transition">
          🔊 Audio Story
        </button>
        <button onclick="setAsNavTarget(${p.lat}, ${p.lng}, '${p.name.replace(/'/g, "\\'")}')" class="px-3 py-1.5 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
          🧭 Safe Route
        </button>
      </div>
    </div>
  `).join('');
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-pill').forEach(pill => {
    if (pill.dataset.tab === tabId) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  const tabSections = ['explore', 'routes', 'compare', 'reports', 'copilot', 'emergency'];
  tabSections.forEach(s => {
    const el = document.getElementById(`tabSection-${s}`);
    if (el) {
      if (s === tabId) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  });

  // Tab specific behaviors
  if (tabId === 'routes') {
    ensureRouteInputsInitialized(false);
  } else if (tabId === 'compare') {
    if (typeof radarChart !== 'undefined' && radarChart) {
      setTimeout(() => radarChart.resize(), 100);
    }
  }

  // Trigger leaflet redraw if map was hidden
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 100);
}

function ensureRouteInputsInitialized(force = false) {
  const startLatEl = document.getElementById('routeStartLat');
  const endLatEl = document.getElementById('routeEndLat');
  if (!startLatEl || !endLatEl) return;

  if (force || !startLatEl.value || !endLatEl.value) {
    const defaults = {
      "Pune": {
        start: { lat: 18.5196, lng: 73.8553, name: "Shaniwar Wada Palace (Origin)" },
        end: { lat: 18.5200, lng: 73.8420, name: "FC Road & Cafe Goodluck (Destination)" }
      },
      "Mumbai": {
        start: { lat: 18.9220, lng: 72.8347, name: "Gateway of India Hub" },
        end: { lat: 18.9438, lng: 72.8232, name: "Marine Drive Promenade" }
      },
      "Delhi": {
        start: { lat: 28.6328, lng: 77.2197, name: "Connaught Place Hub" },
        end: { lat: 28.6562, lng: 77.2410, name: "Red Fort & Chandni Chowk" }
      },
      "Bengaluru": {
        start: { lat: 12.9754, lng: 77.6066, name: "MG Road Metro Hub" },
        end: { lat: 12.9177, lng: 77.6238, name: "Silk Board Junction" }
      },
      "New York": {
        start: { lat: 40.7580, lng: -73.9855, name: "Times Square Hub" },
        end: { lat: 40.7829, lng: -73.9654, name: "Central Park East" }
      }
    };
    const def = defaults[currentCity] || defaults["Pune"];
    startLatEl.value = def.start.lat;
    const startLngEl = document.getElementById('routeStartLng');
    if (startLngEl) startLngEl.value = def.start.lng;
    const startLabelEl = document.getElementById('routeStartLabel');
    if (startLabelEl) startLabelEl.value = def.start.name;

    endLatEl.value = def.end.lat;
    const endLngEl = document.getElementById('routeEndLng');
    if (endLngEl) endLngEl.value = def.end.lng;
    const endLabelEl = document.getElementById('routeEndLabel');
    if (endLabelEl) endLabelEl.value = def.end.name;
  }
}
window.ensureRouteInputsInitialized = ensureRouteInputsInitialized;

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  let bg = 'bg-slate-800 border-cyan-500 text-cyan-200';
  if (type === 'success') bg = 'bg-emerald-950 border-emerald-500 text-emerald-200';
  if (type === 'warning') bg = 'bg-amber-950 border-amber-500 text-amber-200';
  if (type === 'error') bg = 'bg-red-950 border-red-500 text-red-200';

  toast.className = `fixed bottom-5 right-5 z-50 p-3 rounded-xl border text-xs shadow-2xl transition-all duration-300 transform translate-y-5 opacity-0 ${bg}`;
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-5', 'opacity-0');
  }, 20);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-5');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
window.showToast = showToast;

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
