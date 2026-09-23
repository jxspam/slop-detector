# Slop Detector: standing instructions

You are building and shipping Slop Detector, a Chrome MV3 extension that marks likely AI slop in the X feed as the user scrolls. The prompt you get is one paragraph. Everything that never changes is here, so nobody has to say it again.

Work in four stages, in this order, and name the stage you are entering as you enter it.

## 1. Research

Research is not optional and it is not reading from memory. Open the browser and look.

- **Turn on `browser-use` first, then attach to the running Edge.** Every fact in this stage comes from a page you opened in that browser with `goto`, and read there.
- **`fetch_url` and `web_search` may only find a URL. They may never read a page you cite.** A fact is researched when the page carrying it was opened in the attached browser and read from the page. If a doc URL arrives from a search, open it in the browser and read it there before it goes in `RESEARCH.md`. A run whose documentation never appeared in the browser has skipped this stage, however good the notes are.
- **The API.** Find the TypeSafe Jev documentation yourself, open each page you need in the browser, and write down the exact request shape, the response shape, the model name, the limits and the error codes. Do not guess a field name. Do not copy a shape from a blog post. If two pages disagree, the docs win and you say so.
- **The reference product.** Open the X post the prompt names and read it, including the replies. What did people praise, what did they ask for, what did they complain about. Those replies are the requirements nobody wrote down.
- **Growth.** While you are there, look at what made that post travel: the hook, the claim, the visual, the numbers people quoted back. Note what the launch post will have to do to earn the same attention.
- **Cite the browser, not the search.** Every fact in `RESEARCH.md` carries the URL of the page you opened. A `docs.litellm.ai` mirror or any other third party page is not the TypeSafe documentation and never stands in for it.
- **Write `RESEARCH.md`** before any code: the API contract as you read it with the doc URL beside each fact, the reference product's behaviour, the requirements pulled out of the replies, and the growth notes. `PRD.md` is written from it and cites it.

## 2. Build

- **Build the real thing.** A working Chrome MV3 extension that runs on x.com. Not a prototype, not a demo harness, not a page that imitates X.
- **Never build a fake website, a mock feed, a sample page that looks like X, or fixture screenshots dressed up as the product.** The only page the product runs on is x.com itself. A mock proves nothing and it will be cut from the film.
- **Follow the reference.** The behaviour, the wording and the look stay close to the product in the research post. When you want to deviate, say why in one line in `PRD.md` first.
- **Working means working.** Loaded unpacked in the real browser, on the real feed, marking real cards, with real scores from the real API. If any of that is not true, the feature is not done, and you say it is not done rather than describing it as shipped.

### Product rules that never drift

1. **One Jev question per card.** Each visible card's text goes to Jev as a single score question. No batching several judgments into one question, no follow up question per card.
2. **Score 80 and above: a `LIKELY AI SLOP` badge on the card, carrying the number.**
3. **Score 40 to 79: a `CHECK THIS` outline.** An outline, not a badge, not a verdict.
4. **Under 40: untouched.** No marker of any kind.
5. **Never remove content.** Nothing hidden, collapsed, reordered, blurred or filtered. Overlays are additive. A failed or empty judgment leaves the card exactly as it was.
6. **Say "likely AI slop", never "is AI-generated".** In the badge, the options page, the README, the landing page, the PR and the launch copy. The product reports a confidence, it does not accuse.
7. **The badge is a badge.** A compact pill on the card, legible at a glance and at thumbnail size. If it renders as a bar, a stripe or a block down the gutter, that is a bug and you fix it before claiming the feature works.

Thresholds are configurable on the options page. The numbers above are what ships.

## 3. Verify

Verification happens in the browser, on the real site, or it has not happened.

- **Drive the tests with `browser-use`.** Load the extension in the running Edge, open x.com, scroll the live feed, and read back what the extension did to the real cards. A unit test suite is not verification of the product; it is verification of a function.
- **Unit tests still exist** for `judge.js` on its own: request shape, score parsing, banding at each boundary, and the failure paths (empty text, missing key, rate limit, retry). They run green before any commit.
- **The deterministic fixture is for the unit layer only.** It never stands in for the real feed, and a fixture screenshot is never presented as the product working.
- **One live API call before any claim**, read and quoted. If it has not run, the feature is untested, not done.
- **Capture evidence as you verify**, because the PR needs it: a full page screenshot of the real feed with badges visible, a close up of one badged card with its score, one card left untouched, and the console or log line showing the score that produced each. Save them under `screenshots/` with names that say what they are.
- **The key stays server side.** `TYPESAFE_API_KEY` is read by the relay only. It never appears in a content script, in extension storage, in the repo, in a log, in a test snapshot, in a screenshot or on the page.
- **Never print the key and never dump extension storage.** Do not echo `TYPESAFE_API_KEY`, do not read it back to check it, and do not print `chrome.storage` contents to the terminal. Check the relay by calling it and reading its answer, not by looking at the secret.

### The PR carries the proof

The pull request is where a reviewer sees that this works, so it is written for them.

- **Screenshots must render inline in the PR body.** Relative repo paths do not resolve in a PR description. Commit the images on your branch and link them with absolute `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>` URLs, and check each one returns 200 before you post the body.
- **What the body contains, in this order:** one line on what changed; the screenshots of the real feed with a caption saying what each one proves; a short table of the live run (cards judged, scores, band each landed in, latency per call, cost); the unit test result; the browser verification steps you actually drove, in order, so the reviewer can repeat them; and what is not covered.
- Never claim a screenshot is from the real feed when it came from the fixture.

## 4. Demo

Two videos, both real, both made through the `video` capability. Turn it on before this stage.

- **The product demo.** A high quality recording of the real app in real use: the real feed scrolling, real cards being marked, the real badge and score. Use Jax's demo skills for the craft, `adal-demo-browser` with `adal-demo-terminal` for the capture and render style. No mock UI, no reconstruction, no motion graphics standing in for the product.
- **The launch video.** A short piece that sells the product, generated with **MiniMax H3** through the `video` capability (it takes longer clips and 2K, and it carries its own audio). It shows the product, it does not invent one.
- **The landing page embeds the product demo video.** The demo is the centre of the page, playing, above the fold or immediately under the headline. A landing page without the demo on it is not finished.
- **The landing page follows `adal-product-landing-page`.** Load that skill. The page is part of the product: real copy, real screenshots from the verified run, the accent taken from the product's own badge, and no default template look.
- **The launch post** goes in `LAUNCH.md`, written from what the run actually produced and the growth notes from stage 1.

## Capabilities

- **Any task that touches a browser: `browser-use` on first.** Opening a page, reading the real feed, testing the extension, screenshotting for the PR, checking the deployed site.
- **Drive Microsoft Edge and attach to the browser already running.** It is exposed on a debug port (default `9333`) with the signed in session. Never launch a second browser, never start a clean profile, and never hand write a Playwright script instead: that bypasses the capability and loses the session. If nothing is listening, say so and stop.
- **Any clip, hero image, hero video or launch video: `video` on first.** That capability owns image and video generation. Do not call a model API directly.
- Turn a capability on when the stage reaches it.

## House style

- **Never an em dash, an en dash or a double hyphen.** Not in code, comments, copy, commits, the PR body or the launch post. Commas, colons, parentheses or two sentences.
- No emoji in product copy, page copy or design.
- No explanatory sentence under a heading or beside a control. A label is a label.
- Ship the whole loop without asking what is next: research, build, verify in the browser, PR with rendered proof, landing page with the demo embedded, launch video, launch post.
- If something is broken and you cannot fix it, say exactly what is broken and what you tried. Never describe unfinished work as shipped.

## Where it ships

- **The key is already in the environment.** `TYPESAFE_API_KEY` is exported in the shell that started this session. Read it from `process.env` on the server side. Never print it, never write it into a file that is committed.
- **GitHub**: `https://github.com/jxspam/slop-detector`, already authenticated through `gh`. Add it as the `origin` remote, push the branch `v5-research-first`, and open the PR from that branch. Never push to `main`, and never touch an existing branch or an existing pull request.
- **Vercel**: the CLI is at `~/.npm-global/bin/vercel`, already logged in. Deploy the landing page to production from its own folder. Check the project's stored environment before deploying, and after the deploy load the live URL in the browser and confirm it returns the page you built. "Ready" in the CLI output is not proof. Print the confirmed live URL in the terminal.
- **Launch clips**: 16:9 and 9:16, both written into `launch/`. The launch post goes in `LAUNCH.md`.
