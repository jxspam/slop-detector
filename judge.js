const DEFAULT_MODEL = "jev-latest";
const CRITERIA_LEVELS = [
  "Original human post with personal voice, specific experience, authentic thought, or genuine reporting",
  "Mixed or ambiguous, standard phrasing, common commentary, or mildly formulaic structure",
  "Formulaic AI-generated slop, generic motivational platitudes, engagement bait, or buzzword-stuffed synthetic content"
];

const DEFAULT_INSTRUCTIONS = "Rate how likely this post is to be generic AI-generated slop, motivational spam, engagement bait, or unoriginal synthetic content.";

function buildEvaluationRequest(text, options = {}) {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) {
    throw new Error("Empty text");
  }

  return {
    state: trimmed,
    model: options.model || DEFAULT_MODEL,
    questions: {
      slop_score: {
        type: "score",
        instructions: options.instructions || DEFAULT_INSTRUCTIONS,
        criteria: options.criteria || CRITERIA_LEVELS
      }
    }
  };
}

function parseEvaluationResponse(data, criteriaLength = CRITERIA_LEVELS.length) {
  if (!data || !data.answers || !data.answers.slop_score) {
    throw new Error("Invalid response format from evaluation endpoint");
  }

  const answer = data.answers.slop_score;
  if (typeof answer.score !== "number" || isNaN(answer.score)) {
    throw new Error("Missing or invalid score in answer");
  }

  const maxLevel = Math.max(1, criteriaLength - 1);
  const normalized = Math.min(100, Math.max(0, Math.round((answer.score / maxLevel) * 100)));

  return {
    score: normalized,
    rawScore: answer.score,
    confidence: typeof answer.confidence === "number" ? answer.confidence : 1.0,
    model: data.model || ""
  };
}

function determineBand(score, thresholds = {}) {
  const high = typeof thresholds.high === "number" ? thresholds.high : 80;
  const check = typeof thresholds.check === "number" ? thresholds.check : 40;

  if (score >= high) {
    return {
      band: "badge",
      label: "LIKELY AI SLOP",
      score
    };
  }

  if (score >= check) {
    return {
      band: "outline",
      label: "CHECK THIS",
      score
    };
  }

  return {
    band: "none",
    label: "",
    score
  };
}

async function judgeCard(text, apiKey, fetchFn = globalThis.fetch, options = {}) {
  if (!apiKey) {
    throw new Error("Missing API key");
  }

  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) {
    throw new Error("Empty text");
  }

  const payload = buildEvaluationRequest(trimmed, options);
  const endpoint = options.endpoint || "https://api.typesafe.ai/v1/systemone";
  const maxRetries = typeof options.maxRetries === "number" ? options.maxRetries : 3;
  const initialBackoffMs = options.initialBackoffMs || 200;

  let attempt = 0;
  let response;
  const startTime = Date.now();

  while (attempt <= maxRetries) {
    attempt++;
    try {
      response = await fetchFn(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (networkErr) {
      if (attempt <= maxRetries) {
        const delay = initialBackoffMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(`Network failure after ${maxRetries} retries: ${networkErr.message}`);
    }

    if (response.status === 429 || response.status === 529) {
      if (attempt <= maxRetries) {
        const delay = initialBackoffMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(`Rate limit exceeded (${response.status}) after ${maxRetries} retries`);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`API error ${response.status}: ${errText}`);
    }

    break;
  }

  const data = await response.json();
  const parsed = parseEvaluationResponse(data);
  const bandInfo = determineBand(parsed.score, options.thresholds);
  const latencyMs = Date.now() - startTime;

  return {
    score: parsed.score,
    rawScore: parsed.rawScore,
    confidence: parsed.confidence,
    band: bandInfo.band,
    label: bandInfo.label,
    model: parsed.model,
    latencyMs
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_MODEL,
    CRITERIA_LEVELS,
    DEFAULT_INSTRUCTIONS,
    buildEvaluationRequest,
    parseEvaluationResponse,
    determineBand,
    judgeCard
  };
}
