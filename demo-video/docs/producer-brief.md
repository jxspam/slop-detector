# Jev slop detector demo video



Documentation:


# Jev Demo Video — Producer Brief

Date: 2026-09-21 · Owner: Li · Producer: TBD
Deliverable: one 2:00 video (then a 1:00 cut). Recorded, not live.

## 1. Goal of the demo

Show that AdaL takes a proven product idea and ships it — built, tested, proven, presented — while
the viewer watches. The video must make three things legible in two minutes:

1. **The promise:** "You bring the idea. AdaL does the rest."
2. **The loop:** idea → build → tests → PR with screenshots as proof → demo video → launch post.
3. **The mechanism:** AdaL loads the capability each phase needs (browser to verify the product,
   video for the clip, writing for the post) and pulls task skills on demand. Nothing is
   pre-configured by hand.

Jev is the guest technology that makes the product interesting. AdaL is the host that makes it real.

## 2. Content of the demo

### Selected: real-time AI-slop detector (Chrome extension)

**Proven by:** [Robin Bilgil's real-time slop detector](https://x.com/RBilgil/status/2100976648552169805) — 761.6K views, 483 replies.
**Build approach: from scratch, no reference needed.** AdaL builds the extension fresh in one
session. **Model: `glm-5.3-flash`** ($0.15/M input, $0.50/M output, 50% off launch — flash-tier
cost) with the **browser-use capability turned on** for verification. This pairing is itself part
of the message: a proven 761.6K-view idea built from zero at flash-model cost in one session —
speed and low cost are the story, so the video must show the build clock and the real spend from
the recorded run. If browser-use fails to activate, stop and talk to Li — do not film a degraded
run. The [typesafe-adblock repo](https://github.com/realZachi/typesafe-adblock) is a **fallback
only**: keep the link, and if the from-scratch build fails or stalls, consult or borrow from it
before retrying.

**Core tech (what the extension is made of):**

- **Chrome Extension Manifest V3** — `manifest.json` declares a content script (scans pages),
  a service worker (`background.js`, holds the API key and talks to the API), and a popup
  (on/off, confidence threshold, display mode). No build step: plain JavaScript, zero dependencies,
  load-unpacked from `chrome://extensions`.
- **Content script — candidate discovery (plain DOM code):** on load, on scroll, and via a
  `MutationObserver`, find feed/article content cards (`article`, feed items, post containers),
  skip navigation/headers/our own UI, collapse duplicates. Each candidate becomes a compact JSON
  description: title, visible-text excerpt (~200 chars), author/source, link host, label words.
- **TypeSafe Jev API — the judgment layer:** one `POST https://api.typesafe.ai/v1/systemone` per
  batch (model `jev-latest`). The batch carries all candidates as *state* plus one atomic **Noul**
  question per candidate ("does this look like AI slop?") — the speculative fan-out pattern, so 30
  cards cost one call and return one probability each. Retry with exponential backoff on 429/5xx.
- **Code owns the action (confidence routing):** Jev returns probabilities, not commands. Code
  applies the policy — high confidence → `LIKELY AI SLOP` badge, medium → subdued `CHECK THIS`
  outline, low → nothing. Never delete content.
- **Deterministic testing:** a local fixture page (three cards: slop / ambiguous / clean) + a tiny
  Node relay that holds `TYPESAFE_API_KEY` server-side so the key never ships in the extension,
  plus a browser harness that runs the real content script against the fixture with a faked
  `chrome` API. This is what makes the demo filmable and the tests assertable.

**What the product does:** as the user scrolls a feed, the extension judges each visible card with
one Jev question ("does this look like AI slop?") and marks the likely-slop cards with a badge and
confidence score. Clean cards stay untouched.

**Decision policy (act or stop):**

| Jev result                | Extension behavior                        |
| ------------------------- | ----------------------------------------- |
| High confidence slop      | `LIKELY AI SLOP` badge + confidence shown |
| Medium confidence         | Subdued `CHECK THIS` outline              |
| Low confidence / not slop | No action — card stays untouched          |

**Hard rule:** never delete content. The demo is annotation with confidence, not removal. Say
"likely AI slop," never "is AI-generated" or "is false."

**Why this idea:** it's proven popular (761.6K views on the same hook), visually obvious in the
first 3 seconds (scroll → badge appears → next card untouched), and buildable in one session because
the reference repo already has the harness. The fixture makes recording deterministic.

### Backups (in priority order)

1. **Jev Trader** — one buy/sell decision per Monad block, live dashboard, dry-run only.
   [Post (~1.1M views)](https://x.com/jarrodwatts/status/2100356151468585346) ·
   [Code](https://github.com/jarrodwatts/jev-trader)
   Use if the slop-detector fixture doesn't land in the first 10 seconds. Always label "dry-run
   simulation." No real money, no investment claims.

2. **PR security review** — Jev checks a PR for risks a linter can't catch.
   [Post (352.8K views)](https://x.com/redp314/status/2100585126652481915)
   Use if we want the most AdaL-native story (AdaL writes → Jev reviews → AdaL fixes → PR proves
   it), accepting that it's less visual.

## 3. Production of the demo

### Storyboard (2:00)

Every number in the final cut comes from the recorded run — no invented latency, cost, or accuracy
claims. Placeholder numbers below get replaced with measured ones.

| Time      | Beat               | On screen                                                                                                                                                                 | Copy                                                                       |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 0:00–0:10 | **Hook**           | Feed scrolls. One card gets a `LIKELY AI SLOP` badge. Next card stays clean.                                                                                              | "A real-time slop detector, built by AdaL with Jev."                       |
| 0:10–0:24 | **Decision loop**  | Card state → Jev → typed result + confidence → badge / check / no action.                                                                                                 | "One fast judgment. Confidence decides whether the extension acts."        |
| 0:24–0:42 | **AdaL builds it** | Terminal: AdaL reads the idea, builds the extension from scratch, runs tests. Show the **elapsed build clock** and the **running token spend** from the recorded session. | "Built from scratch in one session. Total cost: [$X on the recorded run]." |
| 0:42–1:02 | **Browser proof**  | Fixture with three cards: slop → badge, ambiguous → `CHECK THIS`, clean → untouched.                                                                                      | "Three cards. Three confidence states. No fake certainty."                 |
| 1:02–1:22 | **PR with proofs** | GitHub PR: green tests, before/after screenshots, harness results.                                                                                                        | "AdaL tested it and opened the PR. Proofs attached."                       |
| 1:22–1:42 | **The bonus**      | AdaL-generated demo clip and draft launch post, next to the PR.                                                                                                           | "And it made the video. And the post."                                     |
| 1:42–2:00 | **Close**          | Replay: scroll → badge → shipped repo. Install command + promo code.                                                                                                      | "You bring the idea. AdaL does the rest."                                  |

**1:00 cut:** keep Hook, Decision loop, Browser proof, PR, Close. Drop the build timelapse; the PR
proves the build happened.

### Build order (for the producer)

1. Clone `typesafe-adblock` locally as a reference (credit it in the README). AdaL builds the
   extension from scratch following the "Core tech" spec in §2: MV3 manifest, content script
   (card discovery + batching), service worker (API client with fan-out + retry), popup (settings),
   relay, harness, and fixture.
2. Implement the slop logic: card-candidate discovery, the Noul slop question, and the
   badge/check/no-action confidence policy.
3. Build the deterministic fixture: exactly three cards — likely slop, ambiguous, clean. This makes
   both the demo and the tests assertable.
4. Test before filming: extraction/routing unit tests + browser harness with Jev through the local
   relay. Record the real count, latency, and cost.
5. Capture proof: Browser Use takes before/after fixture screenshots. AdaL opens the PR with
   screenshots, test output, and measured metrics.
6. Film the decisive AdaL moments only: reading the reference, edit/test loop, browser verification,
   PR creation. No long terminal scrolls.
7. Produce the video and launch copy from the verified run. Cut the 1:00 version after the 2:00 edit
   is approved.

### Success condition

First 10 seconds must communicate with sound off: one card changes, another doesn't. If that doesn't
read in the recorded run, switch to Jev Trader. After publishing, track views and likes per post —
but never put an unmeasured claim in the hook.


===


## Source
- Li's brief `hackathon_demo_proposal.md` in `#internal-all-sylphai`: https://sylphai-workspace.slack.com/archives/C0AUP47CU8J/p1790037906890589
- Build folder: `~/adal/videos/jev-slop-detector/`

## Decisions (Jax, 21 Sep 2026)
- Product: real-time AI slop detector Chrome extension, forked from `realZachi/typesafe-adblock`
- Hook: real X feed if a take reads cleanly; fixed 3-card test page for the proof section
- Jax on screen: captions only, no voice or face, no Tella
- Repo: public fork on Jax's GitHub; AdaL opens the PR on that fork (confirm before making public)
- Format: 16:9, 2:00 only
- Bonus beat: AdaL generates its own demo clip and launch post on camera
- Model: Muse Spark 1.3 (`meta-muse-spark-1.3`), switched from Opus 5 by Jax
- Close card: AdaL brand mark only, no code, no URL
- Jev key: `TYPESAFE_API_KEY` in `Keys/typesafe.md`; log real cost per run
- Style: house style (white terminal, pink highlights, no chips, music per section, mild click and typing sounds)
- Deadline: first cut within a day
- Review: Jax first, then preview posted in Li's thread

## Status
- PR #1: https://github.com/jxspam/jev-slop-detector/pull/1 (6/6 tests, live Jev: slop 0.97, ambiguous 0.63, clean 0.03, 220 to 285 ms per batch)
- v01 cut: `~/adal/videos/jev-slop-detector/out/versions/v01-2026-09-21-jev-slop-detector-sfx-only.mp4` (117.5 s, effects only)
- Music blocked: ElevenLabs out of credits
- Review page: `~/adal/videos/jev-slop-detector/review.html`

## Li's updated brief (21 Sep 2026, v2 of the proposal)
- Build from scratch in one session; `typesafe-adblock` is a fallback only
- Model `glm-5.3-flash` (AdaL key `zai-glm-5.3-flash`) with browser-use on; show build clock and real spend
- If browser-use fails to activate: stop and talk to Li
- Jax: re-record per Li; proof beat shows both the fixture and real X; no blur on X
- New repo: https://github.com/jxspam/slop-detector (build folder `~/adal/videos/jev-slop-detector/v2/`)

## v02 status
- Cut: `~/adal/videos/jev-slop-detector/out/versions/v02-2026-09-21-jev-slop-detector-glm-x-proof.mp4` (129.3 s, effects only)
- Build from scratch on GLM-5.3 Flash: 9:22, $0.099 (70,118 in, 18,162 out, 2,648,768 cached tokens at $0.15 / $0.50 / $0.03 per M)
- PR: https://github.com/jxspam/slop-detector/pull/1 (7/7 unit, 3/3 live tiers, 205 to 271 ms per batch, X results, screenshots render)
- X proof: installed extension on a signed-in X search, human posts untouched, automated accounts flagged 86 to 89%; AdaL fixed a badge stacking bug on camera
- AdaL clip (video capability): `~/adal/videos/jev-slop-detector/launch-clip/out/versions/v01-2026-09-22-slop-launch.mp4` (9:16, weaker than the Muse clip)

## v03 and the script re-cut (22 to 23 Sep 2026)
- Jax's script drives the film now: "2026-09-21-08-jev-slop-detector-demo-video SCRIPT.md". Beat sheet: `2026-09-22-03-jev-demo-beat-sheet.md` and `~/adal/videos/jev-slop-detector/v3/beats.json`
- v03 cut: `out/versions/v03-2026-09-22-jev-demo-script-cut.mp4`, 2:04, silent of narration (Li narrates live), effects only
- New footage filmed in Edge on port 9333 (browser-use capability, `Edg/152` proven per take): Robin Bilgil's X post, PRD.md, the TypeSafe Score doc, the landing page built with generated hero image (nano-banana-2) and hero video (veo-3.1), and AdaL testing that page as a user
- AdaL's own launch cuts: `v3/clips/out/x-feed-launch-16x9.mp4` and `x-feed-launch-9x16.mp4`, 13.4 s each
- Graphics: `v3/graphics/loop.mp4` (Idea to Launch loop) and `tiers.mp4` (confidence policy)
- Presenter deck: `v3/deck/deck.html`, 14 slides, manual control, one Li line plus its beat per slide
- Stage rail: `v3/graphics/stages.js` with `v3/stages.json` (Build 0 to 52, Verify 52 to 96, Demo 96 to end), plain type, 88 percent scene scale to keep its own band
- Standing instructions moved out of the filmed prompt: `v3/workspace/AGENTS.md` (always load browser-use and drive Microsoft Edge, load video for clips, product and test rules, landing page skill pointer)
- New skill: `adal-product-landing-page` (in `~/.claude/skills`, visible to AdaL through the `~/.adal/skills` symlink)
- Jax's asks for v04: one prompt in one long running session, no repeated demos of the same asset, shorter than v03, publish the landing page on Vercel, show the stage on screen
- PRs on `jxspam/slop-detector`: #1 (extension), #2 (landing page)

## Rules from the brief
- Every number on screen comes from the recorded run
- Say "likely AI slop", never "is AI-generated"; annotate, never delete
- First 10 seconds must read with sound off; if not, switch to Jev Trader

## Changelog
- v0 2026-09-21: decisions captured from Jax's selections
- 2026-09-21: model switched to Muse Spark 1.3; fork created at github.com/jxspam/jev-slop-detector
- 2026-09-21: v01 cut rendered (effects only); browser beat needed a pre-started shared Chrome and a forced prompt (take 6)
- 2026-09-21: Li updated the brief (from scratch, glm-5.3-flash, clock and spend); re-record started in `v2/`
- 2026-09-21: v02 cut from the from-scratch GLM-5.3 Flash takes (A build, B proof and PR and clip, C X fix)
- 2026-09-23: v03 delivered; deck, stage rail, AGENTS.md and the landing page skill in place; single-session v04 take recording
- 2026-09-29: v19 `out/versions/v19-2026-09-29-jev-script-no-hook.mp4` (162.5 s): v18 without the 9 s hook cards, Li presents on camera instead; script cues shifted to match
- 2026-09-29: presented cut v01 `~/adal/videos/jev-slop-detector/present/out/versions/v01-2026-09-29-present-16x9.mp4` (108.8 s): Jax Tella take (tella.tv/video/build-and-gtm-with-one-prompt-aq2a) with v19 retimed per line, captions = script text on whisper word times (Tella VTT timing is wrong, ~0.44x)
- 2026-09-29: presented cut v02: animated hook slide for the first sentence, face as a small square bottom right, demo full frame
- 2026-09-29: presented cut v03 (frame one = hook in motion, dead lead trimmed) and v04 (AdaL lockup bottom left on every frame)
