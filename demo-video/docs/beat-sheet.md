# Jev demo beat sheet (re-cut, v3)

- Source of truth: `AdaL/Comm Channels/Video/2026-09-21-08-jev-slop-detector-demo-video SCRIPT.md`, every line, in order
- Framing: show what AdaL builds, not how it builds it
- Cut: silent (Li narrates live), 1920x1080, 30 fps, 122 s total
- Build root: `~/adal/videos/jev-slop-detector/` (ROOT below)
- Machine readable twin: `ROOT/v3/beats.json`

## Beats

| # | Li line (verbatim) | Beat | On screen | Source clip or frames | In to out | Sec | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| b01 | You bring the idea. AdaL does the rest. | Empty prompt | White AdaL terminal at rest, cursor blinking, nothing typed | `ROOT/out/segs/abuild/frames/` | `00000` to `00018`, held | 5 | exists |
| b02 | We're not just bringing the capabilities on coding, we bring the entire loop for you starting from Idea, Build, Test, PR w/ screenshots as proof, demo video, launch post, track on the performance | The loop | Seven stations drawn one at a time around a closed ring, no labels beyond the station names | built graphic, `ROOT/v3/graphics/loop.html` | `0.0` to `8.0` | 8 | to build |
| b03 | Our current capabilities like software engineering workflow agent, browser use and video. Allow you to achieve the seamless experience as a builder, all you need is an ambitious idea. | Capabilities on | Real `/capabilities` menu, browser-use switched on, then video switched on | `ROOT/out/segs/bproof/frames/` then `ROOT/out/segs/bvideo/frames/` | `bproof 00000` to `00110`, `bvideo 00000` to `00095` | 8 | exists |
| b04 | Just on the last week, Jev is getting so viral and we found one project particularly interesting, the Twitter AI slop detector. | The proof it works | Robin Bilgil's X post, 761.6K views, 483 replies, read on screen by AdaL | `ROOT/v3/segs/prd/frames/` plus `ROOT/v3/assets/xpost/robin-bilgil-post.png` | `prd 00000` to `00150` | 7 | filming |
| b05 | So from scratch, just put your ideas in, provide the reference of X, and your ideal output - in less than one paragraph. | One paragraph in | The prompt typed into the terminal, whole paragraph visible, Enter | `ROOT/out/segs/abuild/frames/` | `00018` to `00165`, retimed to 8 s | 8 | exists |
| b06 | AdaL then spins up the Browser Use surf to the X post, interpret your requirements, generate the PRD and start building it | PRD written | Chrome opening the X post beside the terminal, then the PRD file filling | `ROOT/v3/segs/prd/frames/` | `00150` to `00560` | 9 | filming |
| b07 | One of our cheapest models, GLM5.3 Flash can handle all of the tasks very well still, it drives browser use capability for verification, understanding about the desirable outputs. | Flash tier | Model line `glm-5.3-flash` in the session header, first tool calls running | `ROOT/out/segs/abuild/frames/` | `00165` to `00335` | 7 | exists |
| b08 | You can see it drives your existing browser use, no setup required, as long as you approve it, | Your own browser | Split: terminal left, the real signed-in Chrome right, approval accepted | `ROOT/out/segs/bproof/frames/` | `00240` to `00430` | 8 | exists |
| b09 | The speed and the costs of the session are all recorded on the screen. | Clock and spend | Build clock and running spend climbing, both from the recorded session | `ROOT/out/segs/abuild/frames/` plus `ROOT/v2/metrics-take-a.json` spend curve | `00335` to `00460` | 8 | exists |
| b10 | [You can change the orders if you need] Since this is the typesafe Jev demo, it first researches on the TypeSafe Jev API doc [Show the Jev API where it knows the api method to be called]. And then it also, do its own deterministic testing etc.. | Docs then tests | The TypeSafe Jev API doc open on the `systemone` method, then the unit run landing 7 of 7 | `ROOT/v3/segs/jevdocs/frames/` then `ROOT/out/segs/bproof/frames/` | `jevdocs 00000` to `00180`, `bproof 00430` to `00620` | 9 | filming (docs), exists (tests) |
| b11 | so after XXX minutes, the product has been built. | Built | Final session line resting on 09:22 and $0.099 | `ROOT/out/segs/abuild/frames/` | `00460` to `00550`, last frame held | 5 | exists |
| b12 | In real actions, the user scrolls through a feed, the extension judges each visible card with one Jev question ("Does this look like AI Slop?"), it marks the card with the confidence level on the AI sloppiness | The product | Real X feed scrolling, badges land at 86 to 89 percent, human posts untouched, then the three tiers 0.92 / 0.62 / 0.08 with 205 to 271 ms per 3-card batch | `ROOT/v3/x-feed-after-fix.mp4`, `ROOT/out/segs/cfix/frames/`, tiers graphic `ROOT/v3/graphics/tiers.html` | `x-feed 00:00.0` to `00:09.5`, `cfix 00480` to `00578` | 14 | exists (tiers graphic to rebuild) |
| b13 | If the product looks good for you, the next step is to push to the github. We have the initial version of the github repo, before deploy, it designs the assets for landing page using our image and video model generator. It tests on the app itself again by driving the browser use as a user. | Repo, landing, retest | PR opening with tests green and screenshots attached, then the generated landing page, then AdaL driving it as a user | `ROOT/out/segs/bpr/frames/`, `ROOT/v2/assets/pr/conversation-full.png`, `ROOT/v3/segs/landing/frames/` | `bpr 00030` to `00300`, PR still 2 s, `landing 00000` to `00120` | 12 | exists (PR), filming (landing) |
| b14 | Once app being tested, it makes the high quality product demo in various size (reels, 16:9 videos) with the captions and ready for the launch and campaigns in LinkedIn, X, YouTube Shorts, Instagram. | The cuts | Video capability working, then the 16:9 and the 9:16 cut playing side by side with captions burned in | `ROOT/out/segs/bvideo/frames/`, `ROOT/v3/assets/launch/launch-16x9.mp4`, `ROOT/v3/assets/launch/launch-9x16.mp4` | `bvideo 00095` to `00400`, both launch cuts `00:00` to `00:04` | 10 | exists (terminal), filming (cuts) |
| b15 | (no line) | Close | AdaL mark alone on white | `ROOT/assets/adal1.svg` | static | 4 | exists |

Total: 122 s.

## What was cut to fit

- The standalone PR page scroll (5.2 s of its own scene in v02) is folded into b13 as a 2 s still.
- The launch post read-through scene (8.2 s in v02) is folded into b14; the post is a deliverable, not a beat.
- The badge stacking bug fix (19.3 s in v02, the whole `cfix` beat) drops to a 3 s glance inside b12, because the film shows what AdaL builds, not what it repairs.
- The animated decision loop (9.4 s standalone in v02) becomes the back half of b12 instead of its own scene.
- The build timelapse loses about 4 s: the clock and the spend read in one hold rather than across two camera moves.

## Gaps, with the file name each should arrive as

- `ROOT/v3/segs/prd/frames/NNNNN.png` plus `ROOT/v3/segs/prd/prd.mp4` (b04, b06): AdaL reading Robin Bilgil's X post and writing the PRD
- `ROOT/v3/assets/xpost/robin-bilgil-post.png` (b04): the post itself, 761.6K views and 483 replies legible
- `ROOT/v3/segs/jevdocs/frames/NNNNN.png` plus `ROOT/v3/segs/jevdocs/jevdocs.mp4` (b10): the TypeSafe Jev API doc with the `systemone` method on screen
- `ROOT/v3/segs/landing/frames/NNNNN.png` plus `ROOT/v3/segs/landing/landing.mp4` (b13): landing page built, then driven in the browser as a user
- `ROOT/v3/assets/launch/launch-16x9.mp4` and `ROOT/v3/assets/launch/launch-9x16.mp4` (b14)
- `ROOT/v3/graphics/loop.html` (b02): the seven station ring, to build
- `ROOT/v3/graphics/tiers.html` (b12): the three confidence tiers, rebuilt from the v02 loop scene
- `ROOT/v3/beats.json` timings need one pass against real frame counts once each incoming segment lands

## Numbers allowed on screen

- Build 9 min 22 s, spend $0.099, model GLM-5.3 Flash
- 7 of 7 unit tests, live tiers 0.92 / 0.62 / 0.08
- 205 to 271 ms per 3-card batch
- Real X flags 86 to 89 percent, nothing ever removed
- Wording is always "likely AI slop", never "is AI-generated"

## On-screen rules

- No chips or pills, no kicker above a headline, no explanatory sentence under a title
- No URL on the artwork
- AdaL mark appears only at b15

## Changelog

- v0 2026-09-22: beat sheet written from the script, footage inventoried across `out/segs/`, `v2/` and `v3/`, 122 s total
