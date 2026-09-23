# PRD — Slop Detector: A Chrome MV3 extension that flags AI slop in the X feed

Date: 2026-09-22 · Status: Draft v1 · Author: AdaL

## Origin

Robin Bilgil's post (https://x.com/RBilgil/status/2100976648552169805, 8:54 AM · Sep 18, 2026 — 771.9K views, 16K likes):

> "Made a real-time slop detector with jev as you scroll"

The post demonstrates a scrolling X feed where every post gets a live slop score from Jev. Follow-ups in the thread shape this PRD:

- David Pieropan: "Could you just hide it instead of marking it?" — Robin: "Probably should be the default but the demo is less compelling!" → **we take the opposite, non-destructive stance: nothing is ever hidden or removed.**
- willyham: wants to "configure what it classifies" → thresholds and prompt configurable.
- Tales (@talesreisa) skepticism: no detector is fully reliable → **we show the score, never auto-act on it**; medium confidence gets an explicit "check this" not a verdict.

## Problem

AI-generated slop floods the X timeline. Readers have no fast, per-post signal of how likely a post is AI slop. Manual judgment is slow; existing detectors are all-or-nothing or hide content, which breaks trust.

## Goal

A Chrome MV3 extension that, as the user scrolls their X feed (x.com), sends each feed card's text to **TypeSafe Jev** and overlays a judgment on the card. Judgment is advisory-only: annotate, never remove.

## User experience (per feed card)

Jev returns a confidence score (0–100) that a post is AI slop. Banding:

| Band | Score | What the user sees |
|---|---|---|
| High | ≥ 80 (configurable) | **LIKELY AI SLOP** badge overlaid on the card, with the numeric score, e.g. `LIKELY AI SLOP · 93` |
| Medium | 40–79 | A subtle **CHECK THIS** outline around the card (dashed accent border), with the score on hover |
| Low | < 40 | Card is left completely untouched |

Hard rules:
- **Nothing is ever hidden, removed, collapsed, or reordered.** The feed remains byte-for-byte identical except for additive overlays.
- Classification is asynchronous and non-blocking; cards render normally before Jev responds.
- Failures (API error, empty text, rate limit) silently leave the card untouched and are retried with backoff at most twice.

## Functional requirements

1. **Feed observation** — MutationObserver on the X timeline (`article` elements under `[data-testid="primaryColumn"]`). Extract post text from `[data-testid="tweetText"]`. Deduplicate by post permalink (status URL inside each article) so a card seen twice isn't scored twice.
2. **Classification** — each card's text becomes the `state` of a single request to `POST https://api.typesafe.ai/v1/systemone` (auth: `Authorization: Bearer <TYPESAFE_API_KEY>`, `model: "jev-latest"`), asking one **Score** question `slop` with instructions "How likely is this text to be AI-generated slop posted to social media?" and five descriptive criteria levels from "clearly human-written..." (0) to "unmistakably AI slop..." (4). The response's `score` (0–4) is normalized to 0–100 (`score / 4 * 100`) and becomes the card's confidence. Calls are made only from the background service worker.
3. **Overlay rendering** — injected per article: badge (high), outline (medium), nothing (low). Overlays are positioned inside the card, never overlapping action buttons.
4. **Settings** — options page: high threshold (default 80), medium threshold (default 40), and the judge prompt are editable.
5. **Key handling** — the TypeSafe API key is stored in `chrome.storage.local`; the user pastes it on first run. The key never leaves the local machine except in requests to the TypeSafe API.

## Non-goals

- No hiding, filtering, or removal of content (explicit product decision, contra. the thread's suggestion).
- No video/image analysis — text only in v1.
- No browser other than Chrome-family (MV3).

## Architecture

- `content.js` — feed observation, text extraction, overlay rendering.
- `background.js` (service worker) — the only component that calls the Jev API (avoids CORS / host-permission issues and centralizes rate limiting). Content script ↔ background via `chrome.runtime.sendMessage`.
- `judge.js` — the single module wrapping the Jev call: request shape, score parsing, banding.
- `options.js/html` — thresholds, prompt, API key.
- Fixtures & tests: three representative cards (high slop, borderline, human-written) exercised through `judge.js` + a mock transport; a relay (content→background message round-trip) test; a DOM harness that loads a fixture feed page and asserts badge/outline/no-op per band.

## Success criteria

1. Scrolling the X home feed marks high-slop cards with the badge + score, medium cards with the outline, and touches nothing else.
2. All three bands verified against a three-card fixture in automated tests.
3. Relay path (content → background → Jev → back) covered by unit tests with the real key from `TYPESAFE_API_KEY`.
4. Zero mutations of feed DOM beyond additive overlays (asserted by the harness comparing article innerHTML before/after for low-band cards).
