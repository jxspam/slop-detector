#!/usr/bin/env python3
"""Write timeline-v4.json: the beat marks plus every sound effect hit for the v04 cut.

No music (no ElevenLabs credits) and no narration: Li speaks live over the cut, so the
track is sound effects only. Key taps while the one paragraph is typed, a toggle when a
capability switches on, a whoosh on each scene change, a pop when the badge lands on the
real feed, a ping when the score comes back and when the PR opens, clicks when the browser
is driven, a sparkle on the generated clips and on the close.
"""
import json, os, random

ROOT = os.path.dirname(os.path.abspath(__file__))
random.seed(23)

BEATS = [("b01", 0.0), ("b02", 4.0), ("b03", 11.0), ("b04", 17.0), ("b05", 22.0), ("b06", 28.0),
         ("b07", 33.5), ("b08", 38.5), ("b09", 44.5), ("b10", 50.0), ("b11", 60.0), ("b12", 68.0),
         ("b13", 76.5), ("b14", 84.5)]
END = 88.5
INNER = [53.6, 63.0, 71.0, 79.0]   # cuts inside a beat get the same whoosh as a beat change

hits = []
for _, t in BEATS[1:]:
    hits.append(("whoosh", round(t - 0.14, 3), -20))
for t in INNER:
    hits.append(("whoosh", round(t - 0.14, 3), -23))

# the two capabilities switched on, b01
hits.append(("toggle", 1.13, -18))
hits.append(("toggle", 3.16, -18))

# the one paragraph typed into the terminal, b02
t = 4.97
while t < 7.86:
    hits.append(("key", round(t, 3), -25 - random.randint(0, 2)))
    t += 0.070 + random.random() * 0.040
hits.append(("send", 8.10, -19))

# the browser being driven
for t in (34.2, 50.3):
    hits.append(("click", t, -22))
# badges landing on the real feed
for t in (53.62, 54.15, 54.75):
    hits.append(("pop", t, -21))
# the score coming back real, and the pull request opening
hits.append(("ping", 47.6, -19))
hits.append(("ping", 63.2, -19))
# the generated clips, and the close
hits.append(("sparkle", 79.2, -20))
hits.append(("sparkle", 85.1, -21))

hits.sort(key=lambda h: h[1])
T = {k: v for k, v in BEATS}
T["end"] = END
T["sfx"] = [list(h) for h in hits]
json.dump(T, open(os.path.join(ROOT, "timeline-v4.json"), "w"), indent=1)
print("wrote timeline-v4.json,", len(hits), "hits,", END, "s")
