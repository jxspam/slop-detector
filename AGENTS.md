# Slop Detector: standing instructions

You are building and shipping Slop Detector, a Chrome MV3 extension that marks likely AI slop in the X feed as the user scrolls. Everything the product is meant to do is in `PRD.md` and `IDEA.md`. Read `PRD.md` before your first edit.

The prompt you get will be short. These are the parts that never change, so nobody has to say them again.

## Capabilities

- **Any task that touches a browser: turn on `browser-use` first.** Opening a page, reading a real feed, checking the extension against x.com, verifying the landing page, taking a screenshot for the PR. No exceptions, including "I just need to look at one page".
- **Drive Microsoft Edge, and attach to the browser that is already running.** The shared Edge profile is already open with the extension loaded and the API key in place, exposed on a debug port (default `9333`). Attach over that port. Never launch a second browser, never start a clean profile, and never fall back to writing a Playwright script by hand: a hand-written script bypasses the capability and loses the signed-in session. If nothing is listening on the port, say so and stop rather than opening your own.
- **Any demo clip, hero image, hero video or launch video: turn on `video` first.** That capability owns image generation and video generation. Do not shell out to a model API directly.
- Turn a capability on when the task reaches it, not all of them at the start.

## Product rules that never drift

1. **One Jev question per card.** Each feed card's text goes to TypeSafe Jev as a single `score` question. Never batch several judgments into one question, never ask a follow-up question per card.
2. **High confidence (score 80 and above): a `LIKELY AI SLOP` badge on the card, carrying the numeric score.**
3. **Medium confidence (40 to 79): a `CHECK THIS` outline on the card.** An outline, not a badge, and not a verdict.
4. **Low confidence (under 40): the card is left untouched.** No marker of any kind.
5. **Never remove content.** Nothing is hidden, collapsed, reordered, blurred or filtered. Overlays are additive only. A failed or empty judgment leaves the card exactly as it was.
6. **Say "likely AI slop", never "is AI-generated".** That wording holds in the badge, the options page, the README, the landing page, the PR body and the launch copy. The product reports a confidence, it does not make an accusation.

Thresholds are configurable on the options page; the defaults above are what ships.

## Testing

- **Three card fixture, deterministic.** `test/fixtures/feed.html` carries one clear slop card, one borderline card and one human-written card. Every band is asserted against it. A fixture run must give the same result every time, so the Jev call is mocked through an injected transport, never live.
- **The API key stays server side.** `TYPESAFE_API_KEY` is already in the environment. It is read by the relay or the service worker only. It never appears in a content script, in the repo, in a log line, in a test snapshot, in a screenshot or in the landing page.
- **Unit tests cover `judge.js` on its own**: request shape, score parsing, banding at each boundary, and the failure paths (empty text, missing key, rate limit, retry with backoff).
- **One real API check before you claim anything works.** Run one live call against the real Jev endpoint with the real key and read the response. Green unit tests are not evidence that the product works; neither is a passing build. If the live check has not run, say the feature is untested rather than done.
- `npm test` runs the suite. It passes before any commit, any PR and any claim of completion.

## Landing page, hero media and demo video

The landing page is part of the product, not an afterthought, and a default-looking page is a failure. Load the `adal-product-landing-page` skill and follow it. It covers the layout and type scale, how to prompt the image and video models for the hero, how to place generated media so it does not look pasted in, the house rules, and the checklist to run before calling the page done.

The launch video and any demo clip follow the same skill for the frames that show the page, and the `video` capability makes them.

## House style, everywhere

- **Never an em dash, an en dash or a double hyphen.** Not in code comments, copy, commit messages, the PR body or the launch post. Use commas, colons, parentheses or two sentences.
- No emoji in product copy, page copy or design.
- No explanatory sentence under a heading or beside a control. A label is a label.
- Ship the whole loop: build, test, PR with screenshots as proof, landing page, demo video, launch post. Do not stop at the first one and ask what to do next.

## Where it ships

- **GitHub**: `https://github.com/jxspam/slop-detector`, already authenticated through `gh`. Add it as the `origin` remote, push the branch `single-session`, and open the PR from that branch. Never push to `main` and never touch an existing branch or an existing PR.
- **Vercel**: the CLI is at `~/.npm-global/bin/vercel`, already logged in. Deploy the landing page to production from its own folder. Check the project's stored environment before deploying, and after the deploy load the live URL and confirm it returns the page you built. "Ready" in the CLI output is not proof. Print the live URL in the terminal when it is confirmed.
- **Launch clips**: 16:9 and 9:16, both written into `launch/`. The launch post goes in `LAUNCH.md`.
