#!/usr/bin/env python3
"""Score for the cut: ElevenLabs music composed section by section from the timeline, plus sound effects on the beats.

Usage: gen_score.py timeline-vN.json audio/score-vN.wav   (music cached per version; sound effects shared, Jax approved them 17 Sep 2026)
Section durations come from the timeline, so the music changes when the story does. Generated
files are cached in audio/ by name; delete one to regenerate it. Keys are read, never printed.
"""
import json, os, subprocess, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_music import api_key

T = json.load(open(sys.argv[1])); OUT = sys.argv[2]
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio")
os.makedirs(A, exist_ok=True)


def post(url, body, out):
    if os.path.exists(out):
        return out
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"xi-api-key": api_key(), "Content-Type": "application/json", "Accept": "audio/mpeg"})
    with urllib.request.urlopen(req, timeout=600) as r:
        data = r.read()
        if not r.headers.get("Content-Type", "").startswith("audio"):
            sys.exit(data[:500].decode(errors="replace"))
    open(out, "wb").write(data)
    print("wrote", out, len(data) // 1024, "KB")
    return out


ms = lambda a, b: int(round((T[b] - T[a] if isinstance(a, str) else T[b] - a) * 1000))
SECTIONS = [
    ("Hook", "hook", "loop", ["bright curious plucked synth motif", "light confident pulse", "clean modern tech opening", "a small lift on the reveal"], ["vocals", "heavy drums"]),
    ("Decision loop", "loop", "build", ["precise minimal ticking percussion", "soft marimba pattern", "clockwork focus", "each phrase lands with a small accent"], ["vocals", "big build"]),
    ("AdaL builds it", "build", "browser", ["driving glassy synth arpeggios", "steady 110 bpm pulse", "busy focused momentum", "layers stack up"], ["vocals", "aggressive drums"]),
    ("Browser proof", "browser", "pr", ["brighter lift", "shimmering pads over the pulse", "curious then confident", "sparkle accent"], ["vocals", "dark"]),
    ("Pull request", "pr", "bonus", ["confident full groove", "claps enter", "warm bass line", "forward and assured"], ["vocals"]),
    ("Bonus outputs", "bonus", "close", ["bright celebratory full band", "claps and shimmer", "joyful uplifting chords"], ["vocals", "dark"]),
    ("Resolve", "close", "logo", ["warm resolved final chord", "chord rings and sustains right to the end of the section", "gentle ending"], ["drums", "silence", "early ending"]),
]
# the API needs every section to be at least 3s: fold a short beat into its neighbour, styles combined
merged = []
for n, a, b, p_, q in SECTIONS:
    dur = ms(a, b)
    if merged and (dur < 3000 or merged[-1][5] < 3000):
        m = merged[-1]; merged[-1] = (m[0] + " into " + n, m[1], b, m[3] + p_, sorted(set(m[4] + q)), ms(m[1], b))
    else:
        merged.append((n, a, b, p_, q, dur))
if merged[-1][5] < 3000 and len(merged) > 1:
    m, k = merged[-2], merged.pop()
    merged[-1] = (m[0] + " into " + k[0], m[1], k[2], m[3] + k[3], sorted(set(m[4] + k[4])), ms(m[1], k[2]))
SECTIONS = [(n, a, b, p_, q) for n, a, b, p_, q, _ in merged]
print("sections:", [(n, round(ms(a, b) / 1000, 1)) for n, a, b, _, _ in SECTIONS])
plan = {"positive_global_styles": ["modern optimistic product film underscore", "instrumental", "clean mix", "110 bpm", "warm and human", "continuous music with seamless transitions between sections"],
        "negative_global_styles": ["vocals", "lyrics", "jingle", "lo-fi hiss", "harsh distortion", "silence", "long pauses", "dropouts", "stops between sections"],
        "sections": [{"section_name": n, "positive_local_styles": p, "negative_local_styles": q, "duration_ms": ms(a, b), "lines": []} for n, a, b, p, q in SECTIONS]}
for s in plan["sections"]:
    assert 3000 <= s["duration_ms"] <= 120000, s
music = post("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
             {"composition_plan": plan, "model_id": "music_v1", "respect_sections_durations": True}, f"{A}/" + os.path.basename(OUT).replace("score-", "score-music-").rsplit(".", 1)[0] + ".mp3")

SFX = {
    "ping": ("soft modern chat app notification, two gentle bright notes", 1.0),
    "pop": ("tiny soft bubble pop, UI emoji reaction, clean", 0.5),
    "whoosh": ("soft airy whoosh transition, short, clean", 1.0),
    "toggle": ("satisfying soft UI toggle switch click with a tiny chime", 0.6),
    "sparkle": ("gentle magical sparkle shimmer, short and light", 1.2),
    "send": ("soft message sent swoosh, modern app", 0.7),
    "key": ("single soft quiet laptop keyboard key tap, close and gentle", 0.5),
    "click": ("single soft subtle mouse click", 0.5),
}
fx = {k: post("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
              {"text": t, "duration_seconds": d, "prompt_influence": 0.5}, f"{A}/sfx-{k}.mp3") for k, (t, d) in SFX.items()}

hits = [tuple(h) for h in T["sfx"]] if "sfx" in T else [("ping", .6, -4), ("pop", T["eyes"], -3), ("whoosh", T["title"] - .3, -6), ("whoosh", T["term"] - .2, -9), ("toggle", T["capOn"], -2),
        ("whoosh", T["desk"] - .35, -5), ("sparkle", T["pick"] + 1.0, -6), ("send", T["send"], -3)] + [("pop", T["flood"] + i * .22, -6 - (i % 3)) for i in range(12)]
SHORT = {"key": .09, "click": .14}   # taps and clicks trimmed to the transient so they stay mild
end = T["end"] + .6
# per-section music level (dB), ramped over 0.3s at each cut, so energy follows the story
LEVELS = [(0, -3), ("loop", -5), ("build", -3), ("browser", -2), ("pr", -1), ("bonus", 0), ("close", -2)]
pts = [(T[k] if isinstance(k, str) else k, 10 ** (db / 20)) for k, db in LEVELS]
expr = f"{pts[0][1]:.4f}" + "".join(f"+({g - pg:.4f})*clip((t-{t0:.3f})/0.3,0,1)" for (t0, g), (_, pg) in zip(pts[1:], pts[:-1]))
inputs, filt = ["-i", music], [f"[0:a]atrim=0:{T['logo']:.3f},volume='{expr}':eval=frame,afade=t=out:st={T['logo'] - .25:.3f}:d=0.25,apad=whole_dur={end:.3f}[m]"]
# one input per sound file, split into as many copies as it is used (hundreds of taps)
names = sorted({k for k, _, _ in hits}); idx = {}
for n in names:
    inputs += ["-i", fx[n]]; idx[n] = len(inputs) // 2 - 1
uses = {n: [h for h in hits if h[0] == n] for n in names}
for n in names:
    base = f"[{idx[n]}:a]" + (f"atrim=0:{SHORT[n]},afade=t=out:st={SHORT[n] - .04:.2f}:d=0.04," if n in SHORT else "") + f"asplit={len(uses[n])}" + "".join(f"[{n}{i}]" for i in range(len(uses[n])))
    filt.append(base)
labels = []
for n in names:
    for i, (_, t, db) in enumerate(uses[n]):
        filt.append(f"[{n}{i}]volume={db}dB,adelay={int(t * 1000)}|{int(t * 1000)}[{n}o{i}]"); labels.append(f"[{n}o{i}]")
filt.append("[m]" + "".join(labels) + f"amix=inputs={len(labels) + 1}:normalize=0:duration=first[out]")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]", "-ar", "44100", OUT], check=True)
# one static gain to about -16 LUFS: loudnorm's dynamic mode flattened every section to the same level (v03 check)
import re
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", OUT, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", m)[-1]); gain = min(-16 - I, -1.0 - float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", subprocess.run(["ffmpeg", "-hide_banner", "-i", OUT, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr)[-1]))
tmp = OUT + ".tmp.wav"; os.replace(OUT, tmp)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"volume={gain:.2f}dB", OUT], check=True); os.remove(tmp)
print("wrote", OUT, f"{end:.2f}s,", len(hits), f"sound effects, integrated {I:.1f} LUFS, gain {gain:+.1f} dB")
