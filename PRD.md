# Product Requirements Document: Slop Detector

## Overview

Slop Detector is a Chrome MV3 extension that marks likely AI slop in the X feed in real time as the user scrolls.

This specification cites and builds directly from RESEARCH.md.

Deviation: The reference product rendered a large angled stamp blocking card content, whereas this extension renders a compact badge or outline so content is never obscured.

## Architecture

1. Chrome MV3 Extension
   - Manifest V3 architecture with declarative permissions.
   - Content script running on `https://x.com/*` detecting timeline cards (`article[data-testid="tweet"]`).
   - Non-destructive DOM injection: compact pill badge for high confidence slop, card outline for moderate confidence, zero modifications for clean content.
   - Configurable options page stored in `chrome.storage.sync`.
   - Single Jev question per card dispatched through the background relay.

2. Server Relay (`relay/server.js`)
   - Lightweight local HTTP service running on port 3000.
   - Holds `TYPESAFE_API_KEY` strictly server-side in `process.env`.
   - Dispatches single score question requests to `https://api.typesafe.ai/v1/systemone` using model `jev-latest`.
   - Normalizes Jev score (0.0 to 1.0) into a calibrated 0 to 100 confidence value.
   - Handles rate limits (HTTP 429 and 529) with exponential backoff.

## Product Rules

1. One Jev question per card: Each visible card text goes to Jev as a single score question. No batching several judgments into one question, no follow up question per card.
2. High Confidence (Score 80 and above): A `LIKELY AI SLOP` badge on the card, carrying the score number.
3. Moderate Confidence (Score 40 to 79): A `CHECK THIS` outline around the card. An outline, not a badge, not a verdict.
4. Low Confidence (Score under 40): Untouched. No marker of any kind.
5. Non-destructive Display: Never remove, hide, collapse, reorder, or blur content. Overlays are purely additive. A failed or empty judgment leaves the card untouched.
6. Calibrated Copy: Say "likely AI slop", never "is AI-generated". The product reports a confidence, it does not accuse.
7. Badge Rendering: Compact pill on the card, legible at a glance and at thumbnail size.

## Options Page

- Configurable High Threshold (default: 80).
- Configurable Check Threshold (default: 40).
- Configurable Relay URL (default: `http://127.0.0.1:3000/api/judge`).
- Options saved to and loaded from `chrome.storage.sync`.

## Testing and Verification

- Unit test suite for `judge.js`: request shape, score parsing, banding at boundaries (80, 79, 40, 39), and error paths (empty text, missing key, rate limit, retry).
- Browser verification driving live Edge session on `https://x.com`: search feed (#mindset #success) and For You feed.
- Live API execution with verified score logging.
- Screenshot evidence collection under `screenshots/`.
