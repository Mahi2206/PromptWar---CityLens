// Safe Route Navigator Frontend Logic
let currentRouteResult = null;

function setAsNavTarget(lat, lng, name) {
  // Switch to route tab
  switchTab('routes');

  document.getElementById('routeEndLat').value = lat;
  document.getElementById('routeEndLng').value = lng;
  document.getElementById('routeEndLabel').value = name;

  // If start is empty, set default central hub based on city
  if (!document.getElementById('routeStartLat').value) {
    const currentCity = document.getElementById('citySelector').value;
    const defaults = {
      "Pune": { lat: 18.5196, lng: 73.8553, name: "Shaniwar Wada Hub" },
      "Mumbai": { lat: 18.9220, lng: 72.8347, name: "Gateway of India Hub" },
      "Delhi": { lat: 28.6328, lng: 77.2197, name: "Connaught Place Hub" },
      "Bengaluru": { lat: 12.9754, lng: 77.6066, name: "MG Road Hub" },
      "New York": { lat: 40.7580, lng: -73.9855, name: "Times Square Hub" }
    };
    const def = defaults[currentCity] || defaults["Pune"];
    document.getElementById('routeStartLat').value = def.lat;
    document.getElementById('routeStartLng').value = def.lng;
    document.getElementById('routeStartLabel').value = def.name;
  }

  calculateCurrentRoute();
}

function setPickPointMode(pointType) {
  window.pendingRoutePin = pointType;
  updateRouteStatusText(`📍 Click any point on the map to set ${pointType.toUpperCase()} location...`);
}

function updateRouteStatusText(txt) {
  const el = document.getElementById('routeStatusNotice');
  if (el) {
    el.innerText = txt;
    el.classList.remove('hidden');
  }
}

async function calculateCurrentRoute() {
  const startLat = parseFloat(document.getElementById('routeStartLat').value);
  const startLng = parseFloat(document.getElementById('routeStartLng').value);
  const endLat = parseFloat(document.getElementById('routeEndLat').value);
  const endLng = parseFloat(document.getElementById('routeEndLng').value);
  const city = document.getElementById('citySelector').value;
  const mode = document.querySelector('input[name="routingMode"]:checked')?.value || 'safest';

  if (isNaN(startLat) || isNaN(endLat)) {
    if (window.showToast) window.showToast("Please choose both start and destination points", "warning");
    return;
  }

  const calcBtn = document.getElementById('btnCalculateRoute');
  if (calcBtn) calcBtn.innerHTML = `<span>Calculating Safe Path...</span>`;

  try {
    const res = await fetch('/api/routes/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_lat: startLat,
        start_lng: startLng,
        end_lat: endLat,
        end_lng: endLng,
        city: city,
        mode: mode
      })
    });

    const data = await res.json();
    currentRouteResult = data;
    renderRouteResults(data);
    drawRouteOnMap(data.coordinates, data.mode, data.safety_grade);
  } catch (err) {
    console.error("Route calculation error:", err);
  } finally {
    if (calcBtn) calcBtn.innerHTML = `<span>Calculate Route</span>`;
  }
}

function renderRouteResults(data) {
  const container = document.getElementById('routeResultsContainer');
  container.classList.remove('hidden');

  // Grade color
  let gradeBadge = `<span class="px-2.5 py-1 rounded font-bold text-emerald-300 bg-emerald-950 border border-emerald-500/30 text-sm">Grade ${data.safety_grade}</span>`;
  if (data.safety_grade === 'C' || data.safety_grade === 'D') {
    gradeBadge = `<span class="px-2.5 py-1 rounded font-bold text-amber-300 bg-amber-950 border border-amber-500/30 text-sm">Grade ${data.safety_grade} (Caution)</span>`;
  }

  document.getElementById('routeSafetyGrade').innerHTML = gradeBadge;
  document.getElementById('routeDistance').innerText = `${data.total_distance_km} km`;
  document.getElementById('routeTime').innerText = `~${data.total_time_mins} mins`;
  document.getElementById('routeSafetyScore').innerText = `${data.safety_score}/100`;
  document.getElementById('routeWellLit').innerText = `${data.well_lit_percentage}%`;
  document.getElementById('routeBypassed').innerText = `${data.risk_zones_avoided}`;

  // Alerts
  const alertBox = document.getElementById('routeAlertsBox');
  if (data.alerts_along_route && data.alerts_along_route.length > 0) {
    alertBox.innerHTML = data.alerts_along_route.map(a => `
      <div class="text-xs p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-200 flex items-start gap-1.5">
        <span>🛡️</span> <span>${a}</span>
      </div>
    `).join('');
    alertBox.classList.remove('hidden');
  } else {
    alertBox.classList.add('hidden');
  }

  // Steps
  const stepsList = document.getElementById('routeStepsList');
  stepsList.innerHTML = data.steps.map((s, idx) => `
    <div class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex items-start gap-2.5">
      <div class="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
        ${idx + 1}
      </div>
      <div class="flex-1">
        <p class="font-medium text-slate-200">${s.instruction}</p>
        <div class="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
          <span>📏 ${s.distance_m} m</span>
          <span>⏱️ ${Math.max(1, Math.round(s.duration_s / 60))} min</span>
        </div>
        ${s.safety_note ? `<p class="mt-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-block">🔒 ${s.safety_note}</p>` : ''}
      </div>
    </div>
  `).join('');
}
