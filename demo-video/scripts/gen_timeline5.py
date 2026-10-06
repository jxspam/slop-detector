#!/usr/bin/env python3
"""Write timeline-v5.json: the beat marks plus every sound effect hit for the v05 cut.

No music. Li narrates the film live, so the track is sound effects only, built by
gen_score3.py from the effect files already generated and approved. Key taps while the one
paragraph is typed, a toggle when browser use is switched on, a whoosh on every scene change
and on the two cuts inside a scene, clicks where the browser is driven, pops as cards are
judged on the live feed, a ping when the score comes back and when the pull request opens,
a sparkle on the generated launch cuts and on the close.

The beat times are the scene table in stage5.html and the stage map in v5/stages.json.
"""
import json, os, random

ROOT = os.path.dirname(os.path.abspath(__file__))
random.seed(23)

BEATS = [("b01", 0.0), ("b02", 4.0), ("b03", 10.0), ("b04", 15.0),
         ("b05", 21.0), ("b06", 26.5),
         ("b07", 31.5), ("b08", 36.0), ("b09", 41.0), ("b10", 46.0), ("b11", 51.5), ("b12", 56.5),
         ("b13", 64.0), ("b14", 71.0), ("b15", 77.5), ("b16", 82.0)]
END = 86.0
INNER = [54.1, 59.5]   # the zoom onto the badge, and the cut from the terminal to the pull request

hits = []
for _, t in BEATS[1:]:
    hits.append(("whoosh", round(t - 0.14, 3), -20))
for t in INNER:
    hits.append(("whoosh", round(t - 0.14, 3), -23))

# browser use switched on at the capabilities menu, b01
hits.append(("toggle", 2.90, -18))

# the one paragraph typed into the terminal, b02
t = 4.70
while t < 9.10:
    hits.append(("key", round(t, 3), -25 - random.randint(0, 2)))
    t += 0.070 + random.random() * 0.040
hits.append(("send", 9.25, -19))

# the browser being driven: the docs, the extension reload, the live feed
for t in (10.30, 37.00, 46.40):
    hits.append(("click", t, -22))
# cards judged as the Latest feed scrolls, b11
for t in (51.95, 52.55, 53.15):
    hits.append(("pop", t, -21))
# the score coming back real, and the pull request opening
hits.append(("ping", 54.60, -19))
hits.append(("ping", 59.75, -19))
# the deployed page answering
hits.append(("ping", 77.95, -21))
# the generated launch cuts, and the close
hits.append(("sparkle", 71.60, -20))
hits.append(("sparkle", 82.90, -21))

hits.sort(key=lambda h: h[1])
T = {k: v for k, v in BEATS}
T["end"] = END
T["sfx"] = [list(h) for h in hits]
json.dump(T, open(os.path.join(ROOT, "timeline-v5.json"), "w"), indent=1)
print("wrote timeline-v5.json,", len(hits), "hits,", END, "s")
