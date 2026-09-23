// judge.js: pure scoring module. Transport is injected so tests never hit the network.

export const MODEL = 'jev-latest';
export const QUESTION_ID = 'slop';

export const QUESTION = 'How likely is this post to be low-effort AI generated slop, from 0 to 100?';

export const DEFAULT_THRESHOLDS = { high: 80, medium: 40 };

export const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';

const RETRY_DELAYS_MS = [250, 1000];
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

// One Jev question per card. Never batch, never follow up.
export function buildRequest(text) {
  return {
    state: text,
    model: MODEL,
    questions: {
      [QUESTION_ID]: {
        type: 'score',
        instructions: QUESTION,
        criteria: [
          { score: 0, description: 'clearly written by a human, specific and personal' },
          { score: 100, description: 'obviously low-effort AI generated slop' }
        ]
      }
    }
  };
}

// Jev returns a 0 to 1 score; we report 0 to 100.
export function parseResponse(json) {
  const answer = json && json.answers && json.answers[QUESTION_ID];
  if (!answer || typeof answer.score !== 'number' || Number.isNaN(answer.score)) {
    throw new Error('missing score in response');
  }
  return Math.round(answer.score * 100);
}

export function band(score, thresholds = DEFAULT_THRESHOLDS) {
  const { high, medium } = { ...DEFAULT_THRESHOLDS, ...thresholds };
  if (score >= high) return 'slop';
  if (score >= medium) return 'check';
  return 'clear';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Returns a 0 to 100 score, or null when the card must be left untouched
// (empty text, failed request, unparseable response). Never throws.
export async function scoreText(text, transport, { sleepFn = sleep } = {}) {
  if (typeof text !== 'string' || text.trim().length === 0) return null;

  const body = JSON.stringify(buildRequest(text.trim()));
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) await sleepFn(RETRY_DELAYS_MS[attempt - 1]);
    let res;
    try {
      res = await transport(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
    } catch (err) {
      continue;
    }
    if (res.status === 200) {
      try {
        return parseResponse(res.json);
      } catch (err) {
        continue;
      }
    }
    if (!RETRYABLE_STATUS.has(res.status)) break;
  }

  return null;
}