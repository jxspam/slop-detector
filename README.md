# slop-detector

A real-time AI slop detector for your feed, powered by TypeSafe Jev. Chrome MV3, plain JavaScript, zero dependencies, no build step.

Jev judges each visible feed card with one question — "does this look like AI slop?" — and the extension annotates:

- **high confidence** (default ≥ 0.85): a red `⚠ LIKELY AI SLOP · NN%` badge on the card
- **medium confidence** (default ≥ 0.60): a subdued amber `CHECK THIS · NN%` dashed outline
- **low confidence**: the card stays untouched

Hard rule: **never delete content.** Annotate with confidence, never remove. Say "likely AI slop", never "is AI-generated".

## Layout

```
manifest.json          MV3 manifest
src/typesafe.js        TypeSafe Jev client + thresholds (shared by worker and tests)
src/background.js      service worker: holds the API key, calls the API, keeps the badge count
src/content.js         card discovery, compact JSON descriptions, batching, DOM annotation
src/popup.html/js      on/off, high/medium thresholds, display mode, key test
test/fixture.html      three-card fixture: slop, ambiguous, clean
test/relay.mjs         local relay that holds TYPESAFE_API_KEY server-side
test/harness.html      loads the fixture with a faked chrome API and the REAL content script
test/live-check.mjs    calls the real API with the three fixture cards as compact candidates
test/unit.mjs          unit tests (node:test) for the pure parts
```

## Use

Load unpacked from this directory at `chrome://extensions`, then set your TypeSafe API key in the popup.

## Test

```sh
npm test                       # unit tests (no key needed)
TYPESAFE_API_KEY=... npm run live-check   # real API, three fixture cards
TYPESAFE_API_KEY=... npm run relay        # relay on :8788
npm run serve                             # static server on :8787
# then open http://localhost:8787/test/harness.html
```

The harness runs the real content script against the fixture; without the relay running it falls back to a cliché-count heuristic.

## Verified

- unit: 7/7 pass
- live-check (real key, jev-1.13.0, 271 ms): p=0.92 high · p=0.62 medium · p=0.08 low → 3/3 tiers correct
- harness in headless Chrome (real key via relay): slop card got the badge, ambiguous got the CHECK THIS outline, clean card untouched — no content removed
