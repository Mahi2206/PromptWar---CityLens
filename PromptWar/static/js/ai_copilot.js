// AI City Copilot Chat Controller
async function sendAiMessage(customPrompt = null) {
  const input = document.getElementById('aiChatInput');
  const message = customPrompt || input.value.trim();
  if (!message) return;

  const city = document.getElementById('citySelector').value;
  const messagesBox = document.getElementById('aiChatMessages');

  // Render user message
  messagesBox.innerHTML += `
    <div class="flex items-start justify-end gap-2 my-2">
      <div class="p-3 rounded-2xl rounded-tr-none bg-cyan-600 text-white text-xs max-w-[85%] shadow-md">
        ${escapeHtml(message)}
      </div>
      <div class="w-7 h-7 rounded-full bg-cyan-800 text-cyan-200 flex items-center justify-center text-xs font-bold shrink-0">
        You
      </div>
    </div>
  `;

  if (!customPrompt) input.value = '';
  messagesBox.scrollTop = messagesBox.scrollHeight;

  // Typing indicator
  const typingId = `typing-${Date.now()}`;
  messagesBox.innerHTML += `
    <div id="${typingId}" class="flex items-start gap-2 my-2">
      <div class="w-7 h-7 rounded-full bg-slate-800 border border-cyan-500/50 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">
        AI
      </div>
      <div class="p-3 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5">
        <span class="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span>Synthesizing city intelligence & live sensor data...</span>
      </div>
    </div>
  `;
  messagesBox.scrollTop = messagesBox.scrollHeight;

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message, city: city })
    });
    const data = await res.json();

    document.getElementById(typingId)?.remove();

    // Render formatted response
    let tipsHtml = '';
    if (data.curated_tips && data.curated_tips.length > 0) {
      tipsHtml = `
        <div class="mt-2.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 space-y-1">
          <div class="font-bold flex items-center gap-1 text-emerald-400">💡 Local Insider Tips:</div>
          ${data.curated_tips.map(t => `<div>• ${t}</div>`).join('')}
        </div>
      `;
    }

    let safetyHtml = '';
    if (data.safety_alerts && data.safety_alerts.length > 0) {
      safetyHtml = `
        <div class="mt-2.5 p-2 rounded-lg bg-amber-950/40 border border-amber-500/20 text-[11px] text-amber-200 space-y-1">
          <div class="font-bold flex items-center gap-1 text-amber-400">🛡️ Safety Advisory:</div>
          ${data.safety_alerts.map(s => `<div>${s}</div>`).join('')}
        </div>
      `;
    }

    let cardsHtml = '';
    if (data.recommendations && data.recommendations.length > 0) {
      cardsHtml = `
        <div class="mt-3 pt-2 border-t border-slate-800">
          <span class="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-2">Recommended Stops:</span>
          <div class="grid grid-cols-1 gap-2">
            ${data.recommendations.map(p => `
              <div class="p-2 rounded bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-2">
                <div class="overflow-hidden">
                  <div class="font-bold text-slate-100 text-xs truncate">${p.name}</div>
                  <div class="text-[10px] text-slate-400">${p.subcategory} • ⭐ ${p.rating} (${p.price_level})</div>
                </div>
                <button onclick="setAsNavTarget(${p.lat}, ${p.lng}, '${p.name.replace(/'/g, "\\'")}')" class="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-[11px] text-white font-medium shrink-0 transition">
                  Route
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    const formattedReply = data.reply.replace(/\n\n/g, '<br><br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    messagesBox.innerHTML += `
      <div class="flex items-start gap-2 my-2">
        <div class="w-7 h-7 rounded-full bg-slate-800 border border-cyan-500/50 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">
          AI
        </div>
        <div class="p-3 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 text-slate-200 text-xs max-w-[90%] shadow-lg space-y-1">
          <div>${formattedReply}</div>
          ${safetyHtml}
          ${tipsHtml}
          ${cardsHtml}
        </div>
      </div>
    `;

    messagesBox.scrollTop = messagesBox.scrollHeight;
  } catch (err) {
    document.getElementById(typingId)?.remove();
    console.error("AI Chat failed:", err);
  }
}

function sendChipPrompt(text) {
  sendAiMessage(text);
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
