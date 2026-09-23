const DEFAULT_THRESHOLDS = {
  high: 80,
  medium: 40
};

const DEFAULT_RELAY_URL = "http://127.0.0.1:3824";

const JEV_CRITERIA = [
  "Authentic personal human thought, direct conversation, or unique original expression",
  "Informational update, standard news headline, or natural professional message",
  "Slightly formulaic marketing post, generic social commentary, or clichéd template",
  "Heavily repetitive promotional spam, engagement farming, or probable synthetic copy",
  "Obvious AI-generated slop, robotic LLM buzzword salad, or synthetic bot text"
];

function buildJevRequest(text) {
  return {
    state: text,
    model: "jev-latest",
    questions: {
      slop_score: {
        type: "score",
        instructions: "Rate how likely this post is to be synthetic AI slop, formulaic engagement farming, or low quality LLM filler.",
        criteria: JEV_CRITERIA
      }
    }
  };
}

function parseScore(rawScore, maxLevel = JEV_CRITERIA.length - 1) {
  if (typeof rawScore !== "number" || isNaN(rawScore)) {
    return 0;
  }
  const clamped = Math.max(0, Math.min(maxLevel, rawScore));
  return Math.round((clamped / maxLevel) * 100);
}

function classifyBand(score, thresholds = DEFAULT_THRESHOLDS) {
  const high = typeof thresholds.high === "number" ? thresholds.high : DEFAULT_THRESHOLDS.high;
  const medium = typeof thresholds.medium === "number" ? thresholds.medium : DEFAULT_THRESHOLDS.medium;

  if (typeof score !== "number" || isNaN(score)) {
    return { band: "untouched" };
  }

  if (score >= high) {
    return {
      band: "slop",
      score: score,
      label: "LIKELY AI SLOP",
      badgeText: `LIKELY AI SLOP ${score}`,
      outline: false
    };
  }

  if (score >= medium) {
    return {
      band: "check",
      score: score,
      label: "CHECK THIS",
      badgeText: null,
      outline: true
    };
  }

  return {
    band: "untouched",
    score: score,
    label: null,
    badgeText: null,
    outline: false
  };
}

async function judgeCard(text, options = {}) {
  const cleanText = (text || "").trim();
  if (!cleanText) {
    return { band: "untouched", score: 0, reason: "empty text" };
  }

  const relayUrl = options.relayUrl || DEFAULT_RELAY_URL;
  const thresholds = options.thresholds || DEFAULT_THRESHOLDS;
  const maxRetries = typeof options.maxRetries === "number" ? options.maxRetries : 3;
  const fetchFn = options.fetchFn || (typeof fetch !== "undefined" ? fetch : null);

  if (!fetchFn) {
    throw new Error("No fetch implementation available");
  }

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await fetchFn(`${relayUrl}/judge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText })
      });

      if (response.status === 200) {
        const data = await response.json();
        const score = typeof data.score === "number" ? data.score : 0;
        const classification = classifyBand(score, thresholds);
        return {
          ...classification,
          confidence: data.confidence || 0,
          model: data.model || "jev-latest",
          rawScore: data.rawScore
        };
      }

      if ((response.status === 429 || response.status === 529) && attempt < maxRetries) {
        attempt++;
        const backoff = 1000 * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }

      if (response.status === 401) {
        return { band: "untouched", error: "unauthorized", status: 401 };
      }

      return { band: "untouched", error: `HTTP ${response.status}`, status: response.status };
    } catch (err) {
      if (attempt < maxRetries) {
        attempt++;
        const backoff = 1000 * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      return { band: "untouched", error: err.message };
    }
  }

  return { band: "untouched", error: "max retries exceeded" };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_THRESHOLDS,
    DEFAULT_RELAY_URL,
    JEV_CRITERIA,
    buildJevRequest,
    parseScore,
    classifyBand,
    judgeCard
  };
}
