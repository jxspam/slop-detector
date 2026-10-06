#!/usr/bin/env python3
"""Generate the background bed with ElevenLabs Music, matched to the video length.

Usage: gen_music.py <seconds> [out.mp3]

The key is read from the vault Keys note and never printed. ElevenLabs returns
binary audio from POST /v1/music, so anything that is not audio is an error and
is surfaced as text rather than written to the file.
"""
import io, json, os, re, subprocess, sys, urllib.request

KEYS = os.path.expanduser("~/vault/Keys/jxkohspam@gmail.com.md")
ENDPOINT = "https://api.elevenlabs.io/v1/music"

# No drums and no repeating riff: the cut is 18 seconds and a loop that states a
# figure twice reads as a jingle. Warm and unresolved sits under the renders
# instead of competing with them.
PROMPT = (
    "Warm, optimistic modern product film underscore at 105 BPM for a story about AI agents helping a small team in Slack. "
    "0 to 10 seconds: light and rhythmic, soft plucked marimba, muted electric piano, gentle pulse; "
    "10 to 44 seconds: brighter and busier with glassy arpeggios and light percussion while two agents work in terminals; "
    "44 to 63 seconds: thins to a warm melodic bass line and sparse keys, reflective, as two documents are read closely; "
    "63 to 80 seconds: lifts into a bright, happy, celebratory swell with claps and shimmer as reactions pour in; "
    "ends at 81 seconds on a clean resolved final chord with a hard stop, no fade tail. "
    "Even dynamics, clean mix, no vocals, no heavy drums, no catchy jingle riff."
)


def api_key() -> str:
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"].strip()
    for line in io.open(KEYS, encoding="utf-8", errors="replace"):
        if re.match(r"^\s*ELEVENLABS\b", line, re.I):
            v = re.split(r"\s*[-:=]\s*", line.strip(), maxsplit=1)
            if len(v) == 2 and v[1].strip():
                return v[1].strip()
    sys.exit("no ELEVENLABS key found (set ELEVENLABS_API_KEY or add it to the Keys note)")


def main() -> None:
    secs = float(sys.argv[1]) if len(sys.argv) > 1 else 18.0
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "audio", "bed.mp3")
    os.makedirs(os.path.dirname(out), exist_ok=True)

    ms = int(round(secs * 1000))
    if not (3000 <= ms <= 600000):
        sys.exit(f"music_length_ms {ms} outside the 3000..600000 the API accepts")

    body = json.dumps({
        "prompt": PROMPT,
        "music_length_ms": ms,
        "force_instrumental": True,
        "model_id": "music_v2",
        "output_format": "mp3_44100_128",
    }).encode()

    req = urllib.request.Request(ENDPOINT, data=body, method="POST", headers={
        "xi-api-key": api_key(),
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    })
    print(f"requesting {ms} ms ...")
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            ctype = r.headers.get("Content-Type", "")
            data = r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}: {e.read()[:600].decode('utf-8', 'replace')}")

    if "audio" not in ctype and not data[:3] in (b"ID3", b"\xff\xfb\x00"):
        sys.exit(f"expected audio, got {ctype}: {data[:400].decode('utf-8', 'replace')}")

    io.open(out, "wb").write(data)
    dur = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", out], capture_output=True, text=True).stdout.strip()
    print(f"wrote {out}  {len(data)/1024:.0f} KB  {dur}s  ({ctype})")


if __name__ == "__main__":
    main()
