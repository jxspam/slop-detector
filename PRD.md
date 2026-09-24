# Product Requirements Document: Slop Detector

Cites and derives from RESEARCH.md.

## 1. Product Overview

Slop Detector is a Chrome MV3 browser extension that evaluates posts in the X timeline in real time using TypeSafe Jev. As the user scrolls, each visible post card is judged and bordered with a distinct color-coded verdict boundary box. The system alerts users to synthetic low-value engagement bait and formulaic text without requiring them to read the post.

## 2. Architecture and Security

### Security and Key Isolation
- `TYPESAFE_API_KEY` remains strictly server side in the relay process environment.
- The browser extension, content scripts, extension storage, logs, and screenshots never access or store the raw API key.
- The extension communicates with a local lightweight relay server running on port 8787 via `POST /judge`.

### Components
1. **Relay Server (`relay.js`)**:
   - Reads `process.env.TYPESAFE_API_KEY`.
   - Exposes `POST /judge` with CORS support for browser extension requests.
   - Forwards text to TypeSafe endpoint `POST https://api.typesafe.ai/v1/systemone` using model `jev-latest`.
   - Handles network retries, 429 rate limit backoff, and 529 overload backoff.
   - Normalizes raw 0 to 2 score into 0 to 100 percentage and assigns band classifications.
2. **Judge Logic (`judge.js`)**:
   - Defines standard criteria, prompt instructions, and payload building.
   - Parses response, computes percentage, handles banding boundaries.
   - Fully unit tested in Node.js.
3. **Chrome MV3 Extension Shell**:
   - `manifest.json`: Manifest V3 specification with host permissions for x.com and relay server.
   - `content.js`: Observes DOM mutations on x.com, extracts visible tweet text, calls relay, applies marks.
   - `styles.css`: Styles for boundary boxes, animated slop marks, muted percentages, and reduced motion fallbacks.
   - `options.html` and `options.js`: User configurable thresholds and custom colors.

## 3. Strict Product Rules

1. **One Jev Question Per Card**: Each card text sends a single score question to Jev. No batching, no follow up question.
2. **Card Boundary Box**:
   - Score 80 and above: Red border (`#FF3B30`), 3px solid, plus loud slop badge.
   - Score 40 to 79: Orange border (`#FF9500`), 3px solid, plus quiet `CHECK THIS` label.
   - Score under 40: Green border (`#34C759`), 2px solid, clean verdict with no text label.
   - Boundary box hugs the card bounding box and matches the card border radius. It never spans multiple cards or bleeds into feed gutters.
3. **Slop Badge Treatment (80+)**:
   - Displays `AI SLOP` in bold display caps, white text on red background, positioned at the top right inside the card box.
   - Animated entrance: Fast scale and snap in (220ms), brief shake, followed by a continuous subtle border pulse while visible.
   - Supports `prefers-reduced-motion` media query by switching to an instantaneous fade.
   - Displays a small secondary line underneath the badge: `<N>% likely` at approximately one third the badge size.
4. **Quiet Label Treatment (40 to 79)**:
   - Displays `CHECK THIS` in clean orange pill styling without shaking, pulsing, or percentage text.
5. **Non-destructive Rendering**:
   - Content is never removed, collapsed, hidden, blurred, or reordered.
   - Failed or pending evaluations leave the card completely untouched without borders.
6. **Calibrated Language**:
   - Copy always states "likely AI slop" and never accuses posts of "being AI-generated".
7. **Spatial Integrity**:
   - All marks sit directly on the judged card and scroll with it naturally.

## 4. Default Configuration

- High Threshold (Red): 80
- Medium Threshold (Orange): 40
- Red Color: `#FF3B30`
- Orange Color: `#FF9500`
- Green Color: `#34C759`
- Relay Port: 8787
