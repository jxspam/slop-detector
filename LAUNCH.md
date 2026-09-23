# Slop Detector: launch post

## The one liner

Marks likely AI slop in your X feed as you scroll. Confidence only, never a verdict, and it never hides a post.

## The post

Your feed is full of posts that were written to farm you, not to tell you anything. I got tired of guessing which ones, so I built Slop Detector.

As you scroll, every post goes to a confidence model with a single question: how likely is this low-effort AI generated slop, 0 to 100. The answer paints the card in place.

At 80 and up, the card gets a LIKELY AI SLOP badge with the score on it. From 40 to 79 it gets a quiet CHECK THIS outline. Below 40 you see nothing at all, because most of your feed is still written by humans who had something to say.

It never hides anything. It never collapses, blurs or filters. A post that fails to judge cleanly stays exactly as it was. The product reports a confidence, it does not accuse anyone of anything.

It is a small unpacked browser extension. The model key stays on your own machine in a one file relay. Load it, open x.com, scroll.

Repo and install: https://github.com/jxspam/slop-detector
Landing page: https://slop-detector-sigma.vercel.app

## Where everything lives

- 16:9 clip: launch/launch_16x9.mp4 (X, LinkedIn, YouTube)
- 9:16 clip: launch/launch_9x16.mp4 (Reels, Shorts, TikTok)
- PR: https://github.com/jxspam/slop-detector/pull/3
- Landing page: https://slop-detector-sigma.vercel.app

## Copy notes

- Always "likely AI slop", never "is AI-generated".
- No claims of detection accuracy, only confidence bands.
- The screenshot in the hero is a real feed, not a mock.