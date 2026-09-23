// judge.js — the single module wrapping the TypeSafe Jev call:
// request shape, score parsing, and banding. Shared by the background
// service worker and the unit tests. No browser APIs in this file.

const API_URL = 'https://api.typesafe.ai/v1/systemone';
const MODEL = 'jev-latest';

// Five descriptive levels, low end (0) to high end (4). Jev scores each
// level on its own against the state; score is the probability-weighted
// position on this line.
const SLOP_CRITERIA = [
  'Clearly human-written: specific personal detail, typos, idiosyncratic phrasing, or first-hand experience',
  'Likely human-written: ordinary personal posting with no generic AI patterns',
  'Ambiguous: could be either a human writing generically or light AI assistance',
  'Likely AI slop: generic engagement-bait phrasing, listicle structure, hollow inspirational tone, templated hooks',
  'Unmistakably AI slop: classic LLM tells throughout — em-dash-heavy listicles, "In today\'s fast-paced world", fake anecdotes, call-to-action boilerplate',
];

// Builds the request body for the TypeSafe System One endpoint.
function buildRequest(state, { instructions, criteria } = {}) {
  return {
    state,
    model: MODEL,
    questions: {
      slop: {
        type: 'score',
        instructions:
          instructions ||
          'How likely is this text to be AI-generated slop posted to social media?',
        criteria: criteria || SLOP_CRITERIA,
      },
    },
  };
}

// Calls the Jev API and returns a normalized 0-100 slop confidence.
// transport is injectable for tests: async (url, options) => Response-like.
async function judge(text, apiKey, transport = fetch) {
  if (!text || !text.trim()) throw new Error('empty state');
  if (!apiKey) throw new Error('missing API key');

  const res = await transport(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildRequest(text)),
  });
  if (!res.ok) throw new Error(`typesafe api ${res.status}`);
  return parseAnswer(await res.json());
}

// Extracts the normalized 0-100 slop confidence from a System One response.
function parseAnswer(body) {
  const answer = body && body.answers && body.answers.slop;
  if (!answer || typeof answer.score !== 'number') {
    throw new Error('malformed typesafe response');
  }
  const top = Object.keys(answer.legend || {}).length - 1;
  const maxLevel = top > 0 ? top : 4;
  return {
    score100: Math.round((answer.score / maxLevel) * 100),
    confidence: typeof answer.confidence === 'number' ? answer.confidence : null,
  };
}

// Bands a normalized score. Returns 'high' | 'medium' | 'low'.
// high -> LIKELY AI SLOP badge, medium -> CHECK THIS outline, low -> untouched.
function band(score100, { highThreshold = 80, mediumThreshold = 40 } = {}) {
  if (score100 >= highThreshold) return 'high';
  if (score100 >= mediumThreshold) return 'medium';
  return 'low';
}

export { API_URL, MODEL, SLOP_CRITERIA, buildRequest, judge, parseAnswer, band };
