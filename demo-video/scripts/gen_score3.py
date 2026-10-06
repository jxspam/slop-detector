#!/usr/bin/env python3
"""Sound effects only score, built exactly the way gen_score.py builds its effects layer.

No music: ElevenLabs has no credits on this account, and the cut is narrated live, so the
track is the effects alone over silence. The effect files are the ones already generated and
approved (audio/sfx-*.mp3); nothing is fetched.

Usage: gen_score3.py timeline-v3.json audio/score-v3.wav
"""
import json, os, re, subprocess, sys

T = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio")

hits = [tuple(h) for h in T["sfx"]]
SHORT = {"key": .09, "click": .14}   # taps and clicks trimmed to the transient so they stay mild
end = T["end"] + .6

names = sorted({k for k, _, _ in hits})
fx = {n: os.path.join(A, f"sfx-{n}.mp3") for n in names}
for n, p in fx.items():
    assert os.path.exists(p), p

# a silent bed the effects sit on, so the track is exactly as long as the cut
inputs, filt = ["-f", "lavfi", "-t", f"{end:.3f}", "-i", "anullsrc=r=44100:cl=stereo"], ["[0:a]anull[m]"]
idx = {}
for n in names:
    inputs += ["-i", fx[n]]
    idx[n] = len(inputs) // 2  # the lavfi input is not an "-i file" pair, so count by hand below
# recount input indexes properly: input 0 is the lavfi bed, then one per effect file
idx = {n: i + 1 for i, n in enumerate(names)}

uses = {n: [h for h in hits if h[0] == n] for n in names}
for n in names:
    base = f"[{idx[n]}:a]" + (f"atrim=0:{SHORT[n]},afade=t=out:st={SHORT[n] - .04:.2f}:d=0.04," if n in SHORT else "") \
        + f"asplit={len(uses[n])}" + "".join(f"[{n}{i}]" for i in range(len(uses[n])))
    filt.append(base)
labels = []
for n in names:
    for i, (_, t, db) in enumerate(uses[n]):
        filt.append(f"[{n}{i}]volume={db}dB,adelay={int(t * 1000)}|{int(t * 1000)}[{n}o{i}]")
        labels.append(f"[{n}o{i}]")
filt.append("[m]" + "".join(labels) + f"amix=inputs={len(labels) + 1}:normalize=0:duration=first[out]")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", *inputs,
                "-filter_complex", ";".join(filt), "-map", "[out]", "-ar", "44100", OUT], check=True)

m = subprocess.run(["ffmpeg", "-hide_banner", "-i", OUT, "-af", "ebur128=peak=true", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
peak = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", m)[-1])
print("wrote", OUT, f"{end:.2f}s,", len(hits), f"sound effects, peak {peak:.1f} dBFS")
