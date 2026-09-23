# Slop Detector: PRD

Date: 2026-09-23
Status: shipping today
Source: https://x.com/RBilgil/status/2100976648552169805 ("Made a real-time slop detector with jev as you scroll")

## TL;DR

A Chrome MV3 extension that watches the X feed as the user scrolls, sends each post's text to TypeSafe Jev for a single slop score, and marks the card in place. Additive overlays only. Nothing is ever hidden or removed.

## Problem

X is filling with low-effort AI generated posts that look like engagement bait. Readers have no fast signal for which posts are likely slop before they spend time on them.

## Product

- Runs on x.com. Detects feed cards as they enter the viewport while scrolling.
- One Jev question per card. The card's text becomes a single `score` question ("How likely is this post to be low-effort AI generated slop, from 0 to 100?") with anchors 0 (clearly human) and 100 (obvious slop). Never batched, never follow-up questions.
- Bands, configurable on the options page, defaults:
  - score 80 to 100: a `LIKELY AI SLOP` badge on the card carrying the numeric score.
  - score 40 to 79: a `CHECK THIS` outline on the card. An outline, not a badge, not a verdict.
  - score under 40: untouched. No marker of any kind.
- Never removes content. Nothing is hidden, collapsed, reordered, blurred or filtered. Failed or empty judgments leave the card exactly as it was.
- Wording is always "likely AI slop", never "is AI-generated". The product reports a confidence, not an accusation.

## Architecture

- `manifest.json`: MV3, content script on x.com, service worker, options page, storage permission.
- `content.js`: card detection via IntersectionObserver, extracts post text, dedupes by post id, asks the service worker, paints overlays.
- `judge.js`: pure module. Builds the request, parses the score, applies bands, retries with backoff. Transport is injected so tests never hit the network.
- `background.js`: service worker. Receives score requests from the content script and forwards them to the relay. The API key never touches a content script.
- `relay.js`: tiny Node server that reads `TYPESAFE_API_KEY` from the environment and proxies to `https://api.typesafe.ai/v1/systemone`. The key stays server side.
- `options.html` / `options.js`: high and medium thresholds, stored in `chrome.storage.sync`.
- Calls `POST /v1/systemone` with `model: jev-latest` and a score question. The response `answers.slop.score` is 0 to 1; the extension multiplies by 100.

## Testing

- `test/fixtures/feed.html`: three cards, one clear slop, one borderline, one human written. Deterministic; the Jev call is mocked through an injected transport.
- Unit tests for `judge.js` on its own: request shape, score parsing, banding at each boundary (39/40, 79/80, 100), and failure paths: empty text, missing key, rate limit, retry with backoff.
- Fixture test asserts all three bands against the fixture.
- One live call against the real Jev endpoint with the real key before any claim that the product works. (Done at build time: slop example scored 0.85, human example 0.03.)
- `npm test` must pass before commit, PR and any completion claim.

## Verification

- Loaded against a real signed in x.com feed in the browser, scrolling live, confirming badges and outlines appear and low score cards stay untouched.

## Ship targets

- GitHub: PR from branch `single-session` on `jxspam/slop-detector`.
- Vercel: landing page in production.
- Launch: 16:9 and 9:16 clips in `launch/`, launch post in `LAUNCH.md`.

## Non-goals

- No blocking, filtering, hiding or reordering of content, ever.
- No accusations. Confidence bands only.
- No support for other sites in v1.