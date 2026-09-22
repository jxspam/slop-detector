// Shared TypeSafe (System One / Jev) integration for the slop detector.
// Used by the service worker and by the Node tests/relay.
// Docs: https://docs.typesafe.ai  (POST /v1/systemone, Noul questions)

export const TYPESAFE_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
export const TYPESAFE_MODELS_ENDPOINT = "https://api.typesafe.ai/v1/models";
export const DEFAULT_MODEL = "jev-latest";

// Jev context limits: 64k tokens for state + all questions. ~30 compact
// card descriptions stay far below that; the content script batches with this cap.
export const MAX_CANDIDATES_PER_REQUEST = 30;

export const DEFAULTS = {
  enabled: true,
  highThreshold: 0.85, // >= → LIKELY AI SLOP badge with score
  mediumThreshold: 0.6, // >= → CHECK THIS outline
  displayMode: "both", // "both" | "badge" | "outline"
};

// Jev returns probabilities, never commands. Code owns the tiers:
export function verdictFor(p, { highThreshold = DEFAULTS.highThreshold, mediumThreshold = DEFAULTS.mediumThreshold } = {}) {
  if (p >= highThreshold) return "high";
  if (p >= mediumThreshold) return "medium";
  return "low";
}

const SLOP_CRITERIA = {
  true:
    "AI slop: low-effort, mass-produced content that reads as machine-generated. Tell-tale signs: " +
    "filler clichés (\"in today's fast-paced world\", \"game-changing\", \"unlock the power of\", \"delve\", " +
    "\"it's important to note\", \"look no further\"), vague claims with no named people, places, numbers or sources, " +
    "listicles whose items could apply to any topic, uniformly paced sentences with no personal voice, " +
    "over-hedged both-sides writing that commits to nothing, a clickbait title over an empty body, " +
    "or a post whose 'author' has no specific experience in it.",
  false:
    "Human, specific, useful content: concrete reporting with names, dates, prices or places; a personal voice " +
    "with specific first-hand detail; original phrasing or humour; verifiable claims; functional updates " +
    "(release notes, event announcements, price changes); short factual posts; questions to the community. " +
    "Generic-but-genuine writing with one or two concrete details is NOT slop. Judge the whole card, " +
    "and remember the card must look LOW-EFFORT and mass-produced to count.",
};

/** Build the System One request for a batch of feed-card descriptions. */
export function buildRequest({ page, candidates, model = DEFAULT_MODEL }) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("buildRequest: candidates must be a non-empty array");
  }
  if (candidates.length > MAX_CANDIDATES_PER_REQUEST) {
    throw new Error(`buildRequest: at most ${MAX_CANDIDATES_PER_REQUEST} candidates per request`);
  }
  const questions = {};
  candidates.forEach((_, i) => {
    questions[`slop_${i}`] = {
      type: "noul",
      instructions:
        `Does the feed card \`candidates[${i}]\` look like AI slop — low-effort, mass-produced content? ` +
        "Judge it by its title, text, source and link targets, in the context of `page`. " +
        "Return the probability that it is slop. Hedge your wording toward \"likely\": this is an annotation, not an accusation.",
    };
  });
  return { model, state: { page, candidates }, questions };
}

/** Extract the per-card "is slop" probabilities from a response body. */
export function parseResponse(body, count) {
  const probabilities = [];
  for (let i = 0; i < count; i++) {
    const answer = body?.answers?.[`slop_${i}`];
    if (!answer || answer.type !== "noul" || typeof answer.noul !== "number") {
      throw new Error(`parseResponse: missing noul answer for candidate ${i}`);
    }
    probabilities.push(answer.noul);
  }
  return { model: body.model, probabilities, usage: body.usage };
}

const RETRYABLE = new Set([429, 529, 500, 502, 503, 504]);

async function postWithRetry({ url, apiKey, payload, fetchImpl, attempts = 4 }) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    let res;
    try {
      res = await fetchImpl(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      lastError = err;
      await sleep(backoffMs(attempt));
      continue;
    }
    if (res.ok) return res.json();

    const text = await res.text().catch(() => "");
    lastError = new Error(`TypeSafe API ${res.status}: ${text.slice(0, 300)}`);
    if (!RETRYABLE.has(res.status)) throw lastError;

    const retryAfter = Number(res.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffMs(attempt));
  }
  throw lastError;
}

function backoffMs(attempt) {
  return 500 * 2 ** attempt + Math.random() * 250;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Judge a batch of feed cards. Returns { model, probabilities, usage }. */
export async function judgeCandidates({ apiKey, page, candidates, model, fetchImpl = globalThis.fetch }) {
  if (!apiKey) throw new Error("No TypeSafe API key set.");
  const payload = buildRequest({ page, candidates, model });
  const body = await postWithRetry({ url: TYPESAFE_ENDPOINT, apiKey, payload, fetchImpl });
  return parseResponse(body, candidates.length);
}

/** GET /v1/models – used by the popup's "Test key" button. */
export async function listModels({ apiKey, fetchImpl = globalThis.fetch }) {
  if (!apiKey) throw new Error("No TypeSafe API key set.");
  const res = await fetchImpl(TYPESAFE_MODELS_ENDPOINT, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`TypeSafe API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  return body.models ?? [];
}