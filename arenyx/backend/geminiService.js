const { GoogleGenAI } = require('@google/genai');

// ── Rate-limit guard ──────────────────────────────────────────────────────────
// Track when each gate/stand last got a Gemini call so we don't spam the API.
const lastCalledAt = {};
const COOLDOWN_MS = 60_000; // 1 minute per gate/stand

function isCoolingDown(id) {
  const last = lastCalledAt[id];
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
}
function markCalled(id) {
  lastCalledAt[id] = Date.now();
}

// ── Shared helper: call Gemini with one retry on 429 ─────────────────────────
async function callGemini(prompt) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    return response.text;
  } catch (err) {
    if (err?.status === 429) {
      // Wait 4 seconds and try once more
      await new Promise(r => setTimeout(r, 4000));
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      return response.text;
    }
    throw err;
  }
}

// ── Strip markdown fences from JSON responses ─────────────────────────────────
function stripFences(text) {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

// ─────────────────────────────────────────────────────────────────────────────

const getActionSuggestion = async (gateName, density) => {
  const fallback = {
    attendeeMsg: `Expect delays at ${gateName}. Please consider an alternate gate.`,
    staffMsg: `Monitor congestion at ${gateName} and open overflow lanes.`
  };

  if (!process.env.GEMINI_API_KEY) return fallback;
  if (isCoolingDown(gateName)) return fallback;

  markCalled(gateName);

  const prompt = `You are a real-time crowd flow AI. ${gateName} is suddenly congested at ${density}%.
Return a raw JSON object (NO markdown) with two keys:
- "attendeeMsg": A concise 1-sentence instruction for attendees (e.g. "Head to Gate 3 now — estimated 2 min wait").
- "staffMsg": A concise 1-sentence action for staff (e.g. "Deploy 2 extra staff to ${gateName} immediately").`;

  try {
    const text = stripFences(await callGemini(prompt));
    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini getActionSuggestion Error:', err?.status || err?.message);
    return fallback;
  }
};

const getConcessionOffer = async (standName, waitTime, clearStandName) => {
  const fallback = {
    attendeeMsg: `${standName} has a ${waitTime}m wait — head to ${clearStandName} for a faster experience!`,
    staffMsg: `Redirect crowd from ${standName} to ${clearStandName}.`,
    incentive: `EXPRESS PASS`
  };

  if (!process.env.GEMINI_API_KEY) return fallback;
  if (isCoolingDown(standName)) return fallback;

  markCalled(standName);

  const prompt = `You are a real-time smart stadium AI. ${standName} has a sudden ${waitTime}-minute wait. However, ${clearStandName} is currently clear.
Return a raw JSON object (NO markdown) with three keys:
- "attendeeMsg": A fun 1-sentence prompt telling the user to skip the line and head to the empty stand, mentioning a discount.
- "staffMsg": A concise 1-sentence action for staff.
- "incentive": A short uppercase 2-3 word string like "10% OFF" or "EXPRESS LANE".`;

  try {
    const text = stripFences(await callGemini(prompt));
    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini getConcessionOffer Error:', err?.status || err?.message);
    return fallback;
  }
};

const askAttendeeGuide = async (query, simulatorState) => {
  if (!process.env.GEMINI_API_KEY) {
    return "I'm operating offline right now. Check the Gates and Concessions tabs for live data!";
  }

  const prompt = `You are "Arenyx Guide", a helpful and concise AI assistant for stadium attendees.
Here is the real-time status of the stadium:
GATES: ${JSON.stringify(simulatorState.gates)}
CONCESSIONS: ${JSON.stringify(simulatorState.concessions)}

The user asks: "${query}"
Answer the user directly and conversationally in 1-2 short sentences. Recommend the best option based on current congestion/wait times.`;

  try {
    return await callGemini(prompt);
  } catch (err) {
    console.error('Gemini askAttendeeGuide Error:', err?.status || err?.message);
    // Give a helpful data-driven fallback even if Gemini fails
    const clearGate = simulatorState.gates?.find(g => g.status === 'CLEAR');
    const clearFood = simulatorState.concessions?.find(c => c.status === 'CLEAR');
    if (clearGate || clearFood) {
      const parts = [];
      if (clearGate) parts.push(`${clearGate.name} is clear (${clearGate.density}% density)`);
      if (clearFood) parts.push(`${clearFood.name} has only a ${clearFood.waitTime}m food wait`);
      return `Based on live data: ${parts.join(' and ')}. Check the Heatmap tab for full details!`;
    }
    return "The stadium is filling up — check the Heatmap tab for the best routes right now!";
  }
};

module.exports = { getActionSuggestion, getConcessionOffer, askAttendeeGuide };
