# -*- coding: utf-8 -*-
"""Presented cut: Jax on camera (Tella take) over the v19 screen cut.

Every time lives here. Take times come from mlx-whisper word stamps (words.json),
never from Tella's auto captions (their VTT runs at ~0.44x real time).
Caption TEXT is the vault script, not the transcript.
"""
VERSION = 4
TOTAL = 108.8

# (name, take_start, take_end, v19_start or None for camera only, v19_end)
BEATS = [
    ("open",   0.0,   6.5,  None,  None),   # In AdaL, To start ... one prompt for each
    ("prompt", 6.5,  14.4,   0.0,  13.5),   # So from scratch ...
    ("xpost", 14.4,  26.1,  13.5,  22.8),   # drives your browser / surf to the X post
    ("docs",  26.1,  34.7,  22.8,  29.9),   # TypeSafe Jev API doc
    ("tests", 34.7,  41.8,  29.9,  47.6),   # unit testing, real scenario
    ("pr",    41.8,  56.4,  47.6,  69.6),   # PR proof
    ("demo",  56.4,  65.4,  69.6,  89.3),   # live demo on the real feed
    ("assets",65.4,  80.8,  89.3, 111.0),   # design assets, both formats
    ("gtm",   80.8,  89.1, 111.0, 131.5),   # research
    ("posts", 89.1,  98.6, 131.5, 157.5),   # X then LinkedIn posts
    ("harness",98.6, 101.9,  None,  None),  # AdaL is your automation-first agent harness
    ("close", 101.9, TOTAL, 157.5, 162.5),  # end card: Every coding agent can build ...
]

# (script text, start). Each card holds until the next start, or its own end.
CAPS = [
    ("In AdaL, To start from build,", 0.90),
    ("demo to GTM,", 3.20),
    ("you just need one prompt for each", 4.66, 6.30),
    ("So from scratch,", 6.82),
    ("just put your ideas in,", 7.96),
    ("provide the reference of Twitter post,", 9.52),
    ("and your ideal output", 11.64),
    ("in less than one paragraph.", 12.72, 14.20),
    ("You can see it drives", 14.56),
    ("your existing browser use,", 15.96),
    ("no setup required.", 17.56, 18.70),
    ("AdaL then spins up the Browser Use", 19.46),
    ("surf to the X post,", 21.52),
    ("interpret your requirements", 23.24),
    ("and start building it", 24.54, 25.90),
    ("Since this is the TypeSafe Jev demo,", 26.52),
    ("it also researches on", 29.12),
    ("the current TypeSafe Jev API doc,", 30.46),
    ("ensure no hallucination.", 32.74, 34.30),
    ("After some time on building,", 35.18),
    ("it does the unit testing", 37.16),
    ("then verifies on the real scenario", 38.60),
    ("using Browser Use.", 40.48, 41.70),
    ("You can see the product feature snapshots,", 41.98),
    ("all the test results and outputs", 44.60),
    ("inside the PR.", 46.74),
    ("No matter you are a founder,", 48.30),
    ("PM, or engineer,", 50.18),
    ("your PR is super high quality", 51.96),
    ("and human/agent readable", 53.94, 56.00),
    ("Next stage,", 57.06),
    ("ask AdaL to make a live demo", 58.36),
    ("it runs the browser use,", 60.36),
    ("do the screen recording", 62.06),
    ("on actual product demo", 63.44, 65.10),
    ("while generate some design assets", 65.82),
    ("to show the product features", 68.00),
    ("using our video editing capabilities", 69.46),
    ("in vertical and horizontal versions", 71.88),
    ("to make sure it is postable", 73.96),
    ("across LinkedIn, X,", 75.70),
    ("Instagram, TikTok etc.", 77.84, 80.20),
    ("Our last stage, Go to market.", 81.32),
    ("It's time to activate", 83.62),
    ("the markets' interests", 84.94),
    ("by researching what's working well", 85.92),
    ("on your social media platform", 87.78),
    ("and prepare the posts", 89.60),
    ("with our AdaL agent.", 90.82, 91.95),
    ("In this demo,", 92.26),
    ("AdaL uses LinkedIn and X", 93.50),
    ("to help you GTM", 95.28),
    ("by connecting with the Browser Use.", 96.38, 98.30),
    ("AdaL is your", 99.02),
    ("automation-first agent harness.", 100.06, 101.70),
    ("Every coding agent can build,", 102.02),
    ("but only AdaL does GTM", 103.88),
    ("directly from your codebase.", 105.98, 107.70),
]

# The cut starts LEAD s into the take, on the breath before "In AdaL":
# frame one is the hook already in motion, never dead air.
LEAD = 0.75
TOTAL -= LEAD
BEATS = [(n, max(0.0, a - LEAD), b - LEAD, s0, s1) for n, a, b, s0, s1 in BEATS]
CAPS = [tuple([c[0]] + [x - LEAD for x in c[1:]]) for c in CAPS]
CAPS[0] = (CAPS[0][0], 0.0)   # first caption is on frame one too

PINK_WORDS = {"AdaL", "GTM", "TypeSafe", "Jev", "PR", "API"}


def spans():
    """Caption list as (text, start, end)."""
    out = []
    for i, c in enumerate(CAPS):
        end = c[2] if len(c) > 2 else CAPS[i + 1][1]
        out.append((c[0], c[1], end))
    return out
