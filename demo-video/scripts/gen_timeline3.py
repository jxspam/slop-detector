#!/usr/bin/env python3
"""Write timeline-v3.json: the beat marks plus every sound effect hit for the v03 cut.

The v03 cut carries no music and no narration (Li speaks live over it), so the track is
sound effects only: key taps while the paragraph is typed, a toggle when a capability
switches on, a whoosh on each scene change, a pop when a badge lands, clicks when the
browser is driven. Levels stay low, about -18 to -25 dB.
"""
import json, os, random

ROOT = os.path.dirname(os.path.abspath(__file__))
random.seed(21)

# beat starts, in the order of the script
BEATS = [("b01", 0.0), ("b02", 5.0), ("b03", 13.0), ("b04", 21.0), ("b05", 28.0), ("b06", 36.0),
         ("b07", 45.0), ("b08", 52.0), ("b09", 60.0), ("b10", 68.0), ("b11", 77.0), ("b12", 82.0),
         ("b13", 96.0), ("b14", 110.0), ("b15", 120.0)]
END = 124.0
# cuts inside a beat get the same whoosh as a beat change
INNER = [73.0, 87.5, 90.0, 100.0, 102.6, 105.6, 115.1]

hits = []
for _, t in BEATS[1:]:
    hits.append(("whoosh", round(t - 0.14, 3), -20))
for t in INNER:
    hits.append(("whoosh", round(t - 0.14, 3), -23))

# the paragraph being typed into the terminal, b05
t = 28.85
while t < 34.55:
    hits.append(("key", round(t, 3), -25 - random.randint(0, 2)))
    t += 0.075 + random.random() * 0.045
hits.append(("send", 35.45, -19))

# a capability switching on: video, in b03
hits.append(("click", 13.35, -23))
hits.append(("toggle", 17.62, -18))

# badges landing on the real feed and on the three card fixture
for t in (55.25, 56.45, 57.6):
    hits.append(("pop", t, -21))
for t in (83.4, 84.65, 85.9, 87.0):
    hits.append(("pop", t, -20))
for t in (92.55, 93.0, 93.45):
    hits.append(("pop", t, -21))

# the browser being driven, and the page opened as a user
for t in (52.55, 105.95, 107.3):
    hits.append(("click", t, -22))
# assets generated, and the close
hits.append(("sparkle", 103.3, -20))
hits.append(("sparkle", 120.75, -21))
# the PR opening
hits.append(("ping", 100.25, -19))

hits.sort(key=lambda h: h[1])
T = {k: v for k, v in BEATS}
T["end"] = END
T["sfx"] = [list(h) for h in hits]
json.dump(T, open(os.path.join(ROOT, "timeline-v3.json"), "w"), indent=1)
print("wrote timeline-v3.json,", len(hits), "hits,", END, "s")
