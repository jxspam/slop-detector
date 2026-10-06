#!/usr/bin/env python3
"""Write timeline-v6.json: the beat marks plus every sound effect hit for the v06 cut.

No music. Li narrates the film live, so the track is sound effects only, built by
gen_score3.py from the effect files already generated and approved.

Beat times are the scene table in stage6.html; the stage map is v6/stages.json. Effect
placement is read off the real footage: the badge and outline runs measured in
v6/captures/INDEX.md give the pops, the settings clip's own save confirmation gives its
click and ping, and the terminal typing window comes from the idea segment.
"""
import json, os, random

ROOT = os.path.dirname(os.path.abspath(__file__))
random.seed(6)

BEATS = [("b01", 0.0), ("b02", 4.5), ("b03", 11.0),
         ("b04", 20.0), ("b05", 26.0),
         ("b06", 31.5), ("b07", 36.5), ("b08", 41.0), ("b09", 62.0), ("b10", 66.0), ("b11", 74.0),
         ("b12", 81.5), ("b13", 88.0)]
END = 92.0
INNER = [77.0]   # the one cut inside a beat: the terminal gives way to the pull request page

hits = []
for _, t in BEATS[1:]:
    hits.append(("whoosh", round(t - 0.14, 3), -20))
for t in INNER:
    hits.append(("whoosh", round(t - 0.14, 3), -23))

# browser use switched on at the capabilities menu, b01
hits.append(("toggle", 3.20, -18))

# the one paragraph typed into the terminal, b02
t = 5.20
while t < 9.80:
    hits.append(("key", round(t, 3), -25 - random.randint(0, 2)))
    t += 0.070 + random.random() * 0.040
hits.append(("send", 10.10, -19))

# the browser being driven: the docs, the extension load, the feed, the options page, the feed again
for t in (11.30, 37.20, 41.30, 62.30, 66.30):
    hits.append(("click", t, -22))

# the threshold retyped in the options page, b09, then saved
t = 62.60
while t < 63.30:
    hits.append(("key", round(t, 3), -26 - random.randint(0, 2)))
    t += 0.075 + random.random() * 0.035
hits.append(("click", 64.20, -21))
hits.append(("ping", 64.50, -21))

# cards judged on the real feed. Each pop sits on a measured badge or outline run entering
# frame: b08 starts at source frame 100, b10 at 1100, both played 1:1 at 30 fps.
for f in (119, 225, 404, 493, 572, 654, 730):          # b08, source frames
    hits.append(("pop", round(41.0 + (f - 100) / 30.0, 3), -21))
for f in (1188, 1234, 1300):                            # b10, source frames
    hits.append(("pop", round(66.0 + (f - 1100) / 30.0, 3), -21))

# the pull request opening, and the deployed page answering
hits.append(("ping", 77.25, -19))
hits.append(("ping", 82.05, -21))
# the close
hits.append(("sparkle", 88.90, -20))

hits.sort(key=lambda h: h[1])
T = {k: v for k, v in BEATS}
T["end"] = END
T["sfx"] = [list(h) for h in hits]
json.dump(T, open(os.path.join(ROOT, "timeline-v6.json"), "w"), indent=1)
print("wrote timeline-v6.json,", len(hits), "hits,", END, "s")
