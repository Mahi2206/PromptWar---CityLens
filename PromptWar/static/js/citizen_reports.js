// CityLens: Citizen Crowdsourcing, Voice Dictation, Privacy/Secrecy & NLP Verifier
let recognition = null;
let isRecording = false;

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.log("Web Speech API not supported in this browser. Fallback enabled.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = function() {
    isRecording = true;
    updateRecordingUI(true);
  };

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById('reportVoiceTranscript').value = transcript;
    
    // Auto populate description if empty
    const descField = document.getElementById('reportDescription');
    if (!descField.value) {
      descField.value = transcript;
    }
    
    runNLPPreflight();
    if (window.showToast) window.showToast("Voice transcribed successfully!", "success");
  };

  recognition.onerror = function(event) {
    console.warn("Speech recognition error:", event.error);
    isRecording = false;
    updateRecordingUI(false);
  };

  recognition.onend = function() {
    isRecording = false;
    updateRecordingUI(false);
  };
}

function toggleVoiceRecording() {
  if (!recognition) {
    initSpeechRecognition();
  }

  if (!recognition) {
    // Simulated Voice dictation fallback if browser blocks microphone
    const simulatedVoicePrompts = [
      "Major pothole on right turn near metro pillar 45, two bikes slipped.",
      "Three street lights are completely dark near the bus terminal, very deserted.",
      "Discovered incredible heritage tea stall behind the old haveli courtyard!",
      "Waterlogging 2 feet deep under the railway bridge, traffic stopped."
    ];
    const picked = simulatedVoicePrompts[Math.floor(Math.random() * simulatedVoicePrompts.length)];
    document.getElementById('reportVoiceTranscript').value = picked;
    const descField = document.getElementById('reportDescription');
    if (!descField.value) descField.value = picked;
    runNLPPreflight();
    if (window.showToast) window.showToast("Simulated voice note captured!", "info");
    return;
  }

  if (isRecording) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (e) {
      console.warn("Could not start recognition:", e);
    }
  }
}

function updateRecordingUI(active) {
  const btn = document.getElementById('btnVoiceRecord');
  if (!btn) return;

  if (active) {
    btn.innerHTML = `<span class="rec-indicator mr-2"></span> <span class="text-red-400 font-bold">Listening... (Speak now)</span>`;
    btn.classList.add('border-red-500', 'bg-red-950/40');
  } else {
    btn.innerHTML = `<span>🎙️ Record Voice Note</span>`;
    btn.classList.remove('border-red-500', 'bg-red-950/40');
  }
}

// Privacy & Secrecy Mode Controller
function togglePrivacyMode() {
  const checkbox = document.getElementById('confidentialToggle');
  const levelSelect = document.getElementById('privacyLevelContainer');
  const nameField = document.getElementById('reporterNameInput');
  const helperNotice = document.getElementById('privacyHelperNotice');

  if (checkbox && checkbox.checked) {
    if (levelSelect) levelSelect.classList.remove('hidden');
    if (helperNotice) helperNotice.classList.remove('hidden');
    if (nameField) {
      nameField.value = "Masked (Identity Protected)";
      nameField.disabled = true;
      nameField.classList.add('bg-purple-950/30', 'border-purple-500/50', 'text-purple-300');
    }
    if (window.showToast) window.showToast("🔒 Privacy & Secrecy mode enabled", "info");
  } else {
    if (levelSelect) levelSelect.classList.add('hidden');
    if (helperNotice) helperNotice.classList.add('hidden');
    if (nameField) {
      nameField.value = "";
      nameField.disabled = false;
      nameField.placeholder = "e.g. Urban Explorer";
      nameField.classList.remove('bg-purple-950/30', 'border-purple-500/50', 'text-purple-300');
    }
  }
}

async function runNLPPreflight() {
  const title = document.getElementById('reportTitle').value;
  const desc = document.getElementById('reportDescription').value;
  const voice = document.getElementById('reportVoiceTranscript').value;
  const text = `${title} ${desc} ${voice}`.trim();

  if (text.length < 5) return;

  try {
    const res = await fetch('/api/nlp/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    });
    const data = await res.json();

    const badge = document.getElementById('nlpPreflightBadge');
    if (badge) {
      let colorClass = 'bg-slate-800 text-slate-300';
      if (data.severity === 'High') colorClass = 'bg-red-950 border border-red-500 text-red-300';
      else if (data.severity === 'Medium') colorClass = 'bg-amber-950 border border-amber-500 text-amber-300';
      else if (data.sentiment === 'Positive') colorClass = 'bg-emerald-950 border border-emerald-500 text-emerald-300';

      badge.innerHTML = `
        <span class="text-[11px] px-2.5 py-1 rounded-lg ${colorClass} font-semibold inline-flex items-center gap-1.5">
          <span>AI Severity: ${data.severity}</span>
          <span>•</span>
          <span>${(data.authenticity_score * 100).toFixed(0)}% Authenticity</span>
        </span>
      `;
      badge.classList.remove('hidden');
    }
  } catch (err) {
    console.error("NLP preflight error:", err);
  }
}

async function loadCitizenReports(city = "Delhi") {
  try {
    const res = await fetch(`/api/citizen-reports?city=${city}`);
    const reports = await res.json();
    renderReportsList(reports);
    if (window.renderCitizenReportsOnMap) {
      window.renderCitizenReportsOnMap(reports);
    }
  } catch (err) {
    console.error("Failed to load reports:", err);
  }
}

function renderReportsList(reports) {
  const container = document.getElementById('citizenReportsFeed');
  if (!container) return;

  if (reports.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 p-6 text-center leading-relaxed">No reports filed yet for this city. Be the first citizen to report!</p>`;
    return;
  }

  container.innerHTML = reports.map(r => {
    let sevBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">${r.ai_severity}</span>`;
    if (r.ai_severity === 'High') {
      sevBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 border border-red-500/40 text-red-300">CRITICAL</span>`;
    } else if (r.ai_severity === 'Medium') {
      sevBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 border border-amber-500/40 text-amber-300">MODERATE</span>`;
    } else if (r.ai_sentiment === 'Positive') {
      sevBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">GEM</span>`;
    }

    const isConfidential = r.is_confidential || r.privacy_level !== 'standard';
    const privacyBadge = isConfidential ? `
      <span class="px-2 py-0.5 rounded text-[10px] font-bold stealth-badge flex items-center gap-1" title="Protected identity and anonymized location">
        🔒 ${r.privacy_level === 'stealth' ? 'Stealth Whistleblower' : 'Anonymous Verified'}
      </span>
    ` : '';

    return `
      <div class="p-4 rounded-xl bg-slate-900/75 border border-slate-800 hover:border-slate-700 transition space-y-2.5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            ${sevBadge}
            ${privacyBadge}
            <span class="text-[11px] font-semibold uppercase tracking-wide text-cyan-400">${r.category.replace('_', ' ')}</span>
          </div>
          <span class="text-[10px] text-slate-400 font-medium">${r.timestamp}</span>
        </div>

        <h4 class="text-sm font-bold text-slate-100 leading-snug">${r.title}</h4>
        <p class="text-xs text-slate-300 leading-relaxed">${r.description}</p>

        ${r.voice_transcript ? `
          <div class="p-2 rounded-lg bg-cyan-950/35 border border-cyan-800/40 text-[11px] text-cyan-300 flex items-center gap-2 leading-relaxed">
            <span>🎙️</span>
            <span class="italic">"${r.voice_transcript}"</span>
          </div>
        ` : ''}

        <div class="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
          <div class="flex items-center gap-2 text-slate-400 text-[11px]">
            <span class="${isConfidential ? 'text-purple-300 font-semibold' : ''}">👤 ${r.reporter_name}</span>
            <span>•</span>
            <span class="text-emerald-400 font-medium">✓ AI Verified (${(r.ai_authenticity_score * 100).toFixed(0)}%)</span>
          </div>

          <button onclick="upvoteReport('${r.id}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition">
            👍 <span id="upvote-count-${r.id}">${r.upvotes}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function upvoteReport(reportId) {
  try {
    const res = await fetch(`/api/citizen-reports/${reportId}/upvote`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      const el = document.getElementById(`upvote-count-${reportId}`);
      if (el) el.innerText = data.upvotes;
      if (window.showToast) window.showToast("Upvoted!", "success");
    }
  } catch (err) {
    console.error("Upvote failed:", err);
  }
}

async function handleReportSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('citizenReportForm');
  const formData = new FormData(form);
  const city = document.getElementById('citySelector').value;
  formData.set('city', city);

  // Check secrecy toggle
  const isConfidential = document.getElementById('confidentialToggle')?.checked || false;
  formData.set('is_confidential', isConfidential);
  
  if (isConfidential) {
    const privLevel = document.getElementById('privacyLevelSelect')?.value || 'stealth';
    formData.set('privacy_level', privLevel);
  } else {
    formData.set('privacy_level', 'standard');
  }

  // Set default coordinates based on city if not set
  if (!formData.get('lat') || parseFloat(formData.get('lat')) === 0) {
    const coords = CITY_COORDINATES[city] || [28.6250, 77.2250];
    formData.set('lat', coords[0]);
    formData.set('lng', coords[1]);
  }

  const submitBtn = document.getElementById('btnSubmitReport');
  submitBtn.disabled = true;
  submitBtn.innerText = "Analyzing & Publishing...";

  try {
    const res = await fetch('/api/citizen-reports', {
      method: 'POST',
      body: formData
    });

    const newReport = await res.json();
    if (window.showToast) window.showToast(isConfidential ? "🔒 Confidential report published anonymously!" : "Report published to city network!", "success");

    form.reset();
    document.getElementById('confidentialToggle').checked = false;
    togglePrivacyMode();
    document.getElementById('nlpPreflightBadge').classList.add('hidden');
    document.getElementById('photoPreviewContainer').classList.add('hidden');
    loadCitizenReports(city);
  } catch (err) {
    console.error("Report submit error:", err);
    if (window.showToast) window.showToast("Failed to submit report", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Publish Report to City Grid";
  }
}

// Photo preview listener
function handlePhotoSelect(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('photoPreviewContainer');
  const img = document.getElementById('photoPreviewImg');

  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      img.src = event.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  } else {
    preview.classList.add('hidden');
  }
}
