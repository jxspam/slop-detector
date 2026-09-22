# Idea: real-time AI slop detector (Chrome extension)

As the user scrolls a feed, the extension judges each visible card with one Jev question ("does this look like AI slop?") and marks the likely-slop cards with a badge and confidence score. Clean cards stay untouched.

## Core tech

- Chrome Extension Manifest V3: a content script (scans pages), a service worker (`background.js`, holds the API key and talks to the API), and a popup (on/off, confidence threshold, display mode). No build step: plain JavaScript, zero dependencies, load unpacked.
- Content script, candidate discovery: on load, on scroll and via a `MutationObserver`, find feed or article content cards (`article`, feed items, post containers), skip navigation, headers and our own UI, collapse duplicates. Each candidate becomes a compact JSON description: title, visible text excerpt (~200 chars), author or source, link host, label words.
- TypeSafe Jev API, the judgment layer: one `POST https://api.typesafe.ai/v1/systemone` per batch (model `jev-latest`). The batch carries all candidates as state plus one atomic Noul question per candidate, so 30 cards cost one call and return one probability each. Retry with exponential backoff on 429 and 5xx. Docs: https://docs.typesafe.ai
- Code owns the action: Jev returns probabilities, not commands. High confidence gets a `LIKELY AI SLOP` badge with the score, medium a subdued `CHECK THIS` outline, low nothing.
- Deterministic testing: a local fixture page (three cards: slop, ambiguous, clean), a tiny Node relay that holds `TYPESAFE_API_KEY` server side, and a browser harness that runs the real content script against the fixture with a faked `chrome` API.

## Hard rule

Never delete content. Annotate with confidence, never remove. Say "likely AI slop", never "is AI-generated".
