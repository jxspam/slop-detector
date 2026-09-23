# Slop Detector

A Chrome MV3 extension that marks likely AI slop in the X feed as you scroll. Each post is judged by TypeSafe Jev with one score question, and the card is marked in place. Nothing is ever hidden, filtered or removed.

## How it works

- Watch: a content script watches the feed with an IntersectionObserver as cards scroll in.
- Judge: each card's text goes to Jev as a single score question (0 to 100, how likely is this low-effort AI generated slop). One question per card, never batched.
- Mark, by confidence band (configurable on the options page):
  - 80 to 100: a `LIKELY AI SLOP` badge carrying the numeric score.
  - 40 to 79: a `CHECK THIS` outline. An outline, not a verdict.
  - Under 40: the card is left untouched.

A failed or empty judgment leaves the card exactly as it was. The product reports a confidence, not an accusation.

## Setup

1. The API key stays server side. Run the relay with `TYPESAFE_API_KEY` in the environment:

```
npm run relay
```

The relay listens on `http://127.0.0.1:8787/score`.

2. Load the `extension/` folder as an unpacked extension in Chrome or Edge.

## Tests

```
npm install
npm test
```

Unit tests cover `judge.js` on its own: request shape, score parsing, banding at each boundary, and the failure paths (empty text, missing key, rate limit, retry with backoff). The three card fixture in `test/fixtures/feed.html` (clear slop, borderline, human written) is asserted through an injected mock transport, so a fixture run never touches the network and gives the same result every time.