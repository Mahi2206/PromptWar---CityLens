// Urban Livability Scorecard & Radar Comparison Engine
let radarChart = null;
let currentNeighborhoods = [];

async function loadNeighborhoodsComparison(city = "Delhi") {
  try {
    const res = await fetch(`/api/neighborhoods?city=${city}`);
    const data = await res.json();
    currentNeighborhoods = data;

    populateNeighborhoodSelectors(data);
    if (data.length >= 2) {
      compareTwoNeighborhoods(data[0].id, data[1].id);
    } else if (data.length === 1) {
      compareTwoNeighborhoods(data[0].id, data[0].id);
    }
  } catch (err) {
    console.error("Failed to load neighborhoods:", err);
  }
}

function populateNeighborhoodSelectors(neighborhoods) {
  const selA = document.getElementById('selectNeighborhoodA');
  const selB = document.getElementById('selectNeighborhoodB');

  if (!selA || !selB) return;

  const optionsHtml = neighborhoods.map((n, i) => `
    <option value="${n.id}">${n.name}</option>
  `).join('');

  selA.innerHTML = optionsHtml;
  selB.innerHTML = optionsHtml;

  if (neighborhoods.length >= 2) {
    selA.selectedIndex = 0;
    selB.selectedIndex = 1;
  }
}

function onNeighborhoodSelectChange() {
  const idA = document.getElementById('selectNeighborhoodA').value;
  const idB = document.getElementById('selectNeighborhoodB').value;
  compareTwoNeighborhoods(idA, idB);
}

function compareTwoNeighborhoods(idA, idB) {
  const nA = currentNeighborhoods.find(n => n.id === idA);
  const nB = currentNeighborhoods.find(n => n.id === idB);

  if (!nA || !nB) return;

  renderComparisonCards(nA, nB);
  renderRadarChart(nA, nB);
}

function renderComparisonCards(nA, nB) {
  const renderSingleCard = (n, badgeColor, borderColor) => `
    <div class="p-4 rounded-xl bg-slate-900/80 border ${borderColor} flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider ${badgeColor}">${n.city} Sector</span>
          <span class="text-xs font-extrabold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            Index: ${n.overall_index}
          </span>
        </div>
        <h3 class="text-base font-bold text-white mb-1">${n.name}</h3>
        <p class="text-xs text-slate-300 mb-3">${n.summary}</p>

        <div class="space-y-2 mb-3">
          <div class="p-2 rounded bg-emerald-950/30 border border-emerald-500/20 text-xs">
            <span class="font-bold text-emerald-400 block mb-1">🌟 Top Highlights:</span>
            <ul class="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
              ${n.pros.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>

          <div class="p-2 rounded bg-rose-950/30 border border-rose-500/20 text-xs">
            <span class="font-bold text-rose-400 block mb-1">⚠️ Bottlenecks & Drawbacks:</span>
            <ul class="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
              ${n.cons.map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>

      <div class="pt-2 border-t border-slate-800 text-xs space-y-1">
        <div class="flex items-center justify-between text-emerald-400">
          <span class="font-semibold">Best For:</span>
          <span class="text-right text-[11px] text-slate-300 font-medium">${n.best_for}</span>
        </div>
        <div class="flex items-center justify-between text-amber-400">
          <span class="font-semibold">Avoid For:</span>
          <span class="text-right text-[11px] text-slate-300 font-medium">${n.worst_for}</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('comparisonCardA').innerHTML = renderSingleCard(nA, 'text-cyan-400', 'border-cyan-500/30');
  document.getElementById('comparisonCardB').innerHTML = renderSingleCard(nB, 'text-purple-400', 'border-purple-500/30');
}

function renderRadarChart(nA, nB) {
  const ctx = document.getElementById('radarComparisonChart');
  if (!ctx) return;

  const labels = [
    'Safety Score',
    'Cleanliness & Air',
    'Affordability',
    'Community Rating',
    'Transit Access',
    'Nightlife & Dining'
  ];

  const dataA = [
    nA.safety_score,
    nA.cleanliness_score,
    nA.affordability_score,
    nA.rating_score * 20, // scale 5.0 to 100
    nA.transit_score,
    nA.nightlife_score
  ];

  const dataB = [
    nB.safety_score,
    nB.cleanliness_score,
    nB.affordability_score,
    nB.rating_score * 20,
    nB.transit_score,
    nB.nightlife_score
  ];

  if (radarChart) {
    radarChart.destroy();
  }

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: nA.name,
          data: dataA,
          backgroundColor: 'rgba(6, 182, 212, 0.25)',
          borderColor: '#06b6d4',
          pointBackgroundColor: '#06b6d4',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#06b6d4'
        },
        {
          label: nB.name,
          data: dataB,
          backgroundColor: 'rgba(168, 85, 247, 0.25)',
          borderColor: '#a855f7',
          pointBackgroundColor: '#a855f7',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#a855f7'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
          pointLabels: {
            color: '#cbd5e1',
            font: { size: 11, family: 'Plus Jakarta Sans' }
          },
          ticks: {
            display: false,
            min: 0,
            max: 100
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#f8fafc',
            font: { family: 'Plus Jakarta Sans', weight: '600' }
          }
        }
      }
    }
  });
}
