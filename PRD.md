# Product Requirements Document: Slop Detector

## Overview
Slop Detector is a Chrome Manifest V3 extension that evaluates posts in real time on x.com as the user scrolls, highlighting suspected synthetic content without altering feed structure.

This document derives from and cites RESEARCH.md.

## Reference Deviation
We deviate from the reference video by omitting the large diagonal SLOP stamp, replacing it with a compact badge and outline to prevent obscuring original post text and avoid false accusation.

## Core Requirements

### 1. Evaluation Architecture
- Trigger: IntersectionObserver detects newly visible tweet cards on x.com.
- Request rate: One Jev question per card. Batching multiple cards into a single question or running multi-turn follow up queries is prohibited.
- Backend relay: A local lightweight relay server holds TYPESAFE_API_KEY. The Chrome extension communicates with this relay. TYPESAFE_API_KEY never touches extension storage or content scripts.
- Model: jev-latest, resolving to jev-1.13.0 on TypeSafe API (https://docs.typesafe.ai/models).

### 2. Scoring and Banding Rules
- Question Type: score primitive with ordered criteria (https://docs.typesafe.ai/primitives/score).
- Scale: Normalized to 0 to 100 integer score.
- High Band (Score >= 80):
  - Badge text: LIKELY AI SLOP [score]
  - Badge style: Compact pill rendered on the card.
- Medium Band (Score 40 to 79):
  - Card style: Amber CHECK THIS outline around the card border.
  - No badge, no definitive verdict.
- Low Band (Score < 40):
  - Untouched: No marker, border, or alteration.
- Fallback / Error:
  - Untouched: Empty text, network errors, or rate limits leave the card untouched.
- Content integrity: Additive styling only. Cards are never hidden, collapsed, reordered, or deleted.

### 3. Language and Terminology
- Use "likely AI slop".
- Never use "is AI-generated".
- Reports statistical confidence, not certainty.

### 4. Options and Configuration
- Configurable thresholds for high band (default 80) and medium band (default 40).
- Relay endpoint configuration (default http://127.0.0.1:3824).
- Stored in chrome.storage.sync with fallback defaults.

### 5. Extension Components
- manifest.json: Manifest V3 declaring permissions, host_permissions for x.com and relay, content scripts, and options page.
- content.js: Card observation, text extraction, deduplication, DOM styling.
- judge.js: API request formatting, score parsing, threshold banding, retry handling.
- relay.js: Local Node.js relay server communicating with https://api.typesafe.ai/v1/systemone.
- options.html / options.js: User configuration UI.
- styles.css: Pill badge and outline styling.
