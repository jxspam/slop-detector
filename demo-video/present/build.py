# -*- coding: utf-8 -*-
"""16:9 presented cut: v19 screen card + Jax camera panel + script captions.

    ./.venv/bin/python build.py      -> out/present-16x9-v<VERSION>.mp4
"""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import timeline as T

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
FONTS = os.path.expanduser("~/adal/videos/skills-gtm-video-build/fonts")
V19 = "../out/versions/v19-2026-09-29-jev-script-no-hook.mp4"
TAKE = "raw/tella-take.mp4"
BED = "../audio/score-music-v2.mp3"
W, H, FPS = 1920, 1080, 30
PINK = (255, 88, 152)

# geometry (skill: 16:9 card left, camera panel right, caption band at the foot)
FACE = (1584, 744, 300)       # square face, bottom right, 36 px margin
LOGO_XY = (40, 1008)          # adal2 lockup 156x36, bottom left, bottom-aligned with the face
CAP_Y, CAP_X, CAP_W = 962, 880, 1300   # caption band clear of the face
SLIDES = {"open": "hook/hook-lead.mp4", "harness": "hook/harness.mp4"}
# camera crops inside the Tella frame (camera window is x 92-1826, y 52-1028)
CROP_F = (964, 964, 478, 56)
RADIUS = 28


def run(cmd):
    print("+", " ".join(cmd)[:160])
    subprocess.run(cmd, check=True)


def font(size):
    return ImageFont.truetype(os.path.join(FONTS, "Poppins-Bold.ttf"), size)


def stage():
    edge, centre = (16, 8, 12), (46, 18, 32)
    s = 96
    g = Image.new("RGB", (s, s))
    px = g.load()
    c = (s - 1) / 2.0
    for y in range(s):
        for x in range(s):
            dx, dy = (x - c) / c, (y - c) / c
            t = 1.0 - min(1.0, (dx * dx * 0.75 + dy * dy) ** 0.5) ** 1.35
            px[x, y] = tuple(int(edge[i] + (centre[i] - edge[i]) * t) for i in range(3))
    return g.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(6))


def mask(w, h, name):
    m = Image.new("L", (w * 4, h * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), RADIUS * 4, fill=255)
    m.resize((w, h), Image.LANCZOS).save("build/%s.png" % name)


def ring():
    """Soft shadow plus a thin pink edge behind the face square."""
    s = FACE[2] + 6
    im = Image.new("RGBA", (s * 4, s * 4), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, s * 4 - 1, s * 4 - 1), (RADIUS + 3) * 4,
                                          fill=(255, 88, 152, 200))
    im.resize((s, s), Image.LANCZOS).save("build/ring.png")


def caption_png(text, path):
    size = 60
    f = font(size)
    while f.getlength(text) > CAP_W and size > 40:
        size -= 2
        f = font(size)
    words = text.split(" ")
    space = f.getlength(" ")
    total = sum(f.getlength(w) for w in words) + space * (len(words) - 1)
    asc, desc = f.getmetrics()
    pad = 50
    lay = Image.new("RGBA", (W, asc + desc + pad * 2), (0, 0, 0, 0))
    x0 = CAP_X - total / 2.0

    def draw(d, shadow):
        x = x0
        for w in words:
            core = w.strip(",.'")
            pink = core in T.PINK_WORDS or core.rstrip("s") in T.PINK_WORDS
            if shadow:
                d.text((x, pad), w, font=f, fill=(0, 0, 0, 230), stroke_width=10,
                       stroke_fill=(0, 0, 0, 230))
            else:
                d.text((x, pad), w, font=f, fill=(PINK if pink else (255, 255, 255)) + (255,),
                       stroke_width=5, stroke_fill=(8, 4, 6, 255))
            x += f.getlength(w) + space

    draw(ImageDraw.Draw(lay), True)
    lay = lay.filter(ImageFilter.GaussianBlur(9))
    draw(ImageDraw.Draw(lay), False)
    full = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    full.alpha_composite(lay, (0, int(CAP_Y - lay.height / 2)))
    full.save(path)


def captions_track():
    os.makedirs("build/caps", exist_ok=True)
    Image.new("RGBA", (W, H), (0, 0, 0, 0)).save("build/caps/blank.png")
    lines, t = [], 0.0
    for i, (text, a, b) in enumerate(T.spans()):
        p = "build/caps/c%02d.png" % i
        caption_png(text, p)
        if a > t:
            lines += ["file 'caps/blank.png'", "duration %.3f" % (a - t)]
        lines += ["file '%s'" % p[6:], "duration %.3f" % (b - a)]
        t = b
    lines += ["file 'caps/blank.png'", "duration %.3f" % (T.TOTAL - t), "file 'caps/blank.png'"]
    open("build/caps.txt", "w").write("\n".join(lines) + "\n")
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "build/caps.txt",
         "-vf", "fps=%d,format=rgba" % FPS, "-t", str(T.TOTAL), "-c:v", "qtrle", "build/caps.mov"])


def screen_track():
    """v19 retimed beat by beat so each stretch lasts exactly as long as its line."""
    parts, filt, srcs = [], [], ["-i", V19]
    for i, (name, a, b, s0, s1) in enumerate(T.BEATS):
        d = b - a
        if s0 is None:
            k = len(srcs) // 2
            srcs += ["-i", SLIDES[name]]
            filt.append("[%d:v]fps=%d,tpad=stop_mode=clone:stop_duration=1,trim=0:%.3f,"
                        "setpts=PTS-STARTPTS[p%d]" % (k, FPS, d, i))
        else:
            k = d / (s1 - s0)
            filt.append("[0:v]trim=%.3f:%.3f,setpts=(PTS-STARTPTS)*%.5f,fps=%d,trim=0:%.3f,"
                        "setpts=PTS-STARTPTS[p%d]" % (s0, s1, k, FPS, d, i))
            print("  %-8s %5.1f s of screen in %5.1f s  (x%.2f)" % (name, s1 - s0, d, 1 / k))
        parts.append("[p%d]" % i)
    filt.append("".join(parts) + "concat=n=%d:v=1:a=0[out]" % len(parts))
    run(["ffmpeg", "-v", "error", "-y"] + srcs + ["-filter_complex", ";".join(filt),
         "-map", "[out]", "-c:v", "libx264", "-crf", "16", "-preset", "fast", "-pix_fmt", "yuv420p",
         "build/screen.mp4"])


def master():
    fx, fy, fs = FACE
    fc = ";".join([
        "[1:v]trim=start=%.3f,setpts=PTS-STARTPTS,crop=%d:%d:%d:%d,scale=%d:%d,format=rgba[f0];[f0][2:v]alphamerge[face]"
        % ((T.LEAD,) + CROP_F + (fs, fs)),
        "[0:v][3:v]overlay=%d:%d[v0]" % (fx - 3, fy - 3),
        "[v0][face]overlay=%d:%d[v1]" % (fx, fy),
        "[v1][4:v]overlay=0:0:format=auto[v2]",
        "[v2][6:v]overlay=%d:%d,format=yuv420p[v]" % LOGO_XY,
        "[1:a]atrim=%.3f:%.3f,asetpts=PTS-STARTPTS,highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11,"
        "aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,"
        "afade=t=out:st=%.3f:d=0.6,asplit=2[vo][key]" % (T.LEAD, T.LEAD + T.TOTAL, T.TOTAL - 0.6),
        "[5:a]atrim=0:%.3f,asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:channel_layouts=stereo,"
        "volume=0.35,afade=t=in:st=0:d=1.0,afade=t=out:st=%.3f:d=2.0[mus]" % (T.TOTAL, T.TOTAL - 2.0),
        "[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=400[musd]",
        "[vo][musd]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]",
    ])
    out = "out/present-16x9-v%d.mp4" % T.VERSION
    os.makedirs("out", exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y",
         "-i", "build/screen.mp4", "-i", TAKE,
         "-loop", "1", "-i", "build/m_face.png",
         "-loop", "1", "-i", "build/ring.png",
         "-i", "build/caps.mov", "-i", BED,
         "-loop", "1", "-i", "build/logo.png",
         "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", str(T.TOTAL),
         "-r", str(FPS), "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out])
    return out


if __name__ == "__main__":
    os.makedirs("build", exist_ok=True)
    mask(FACE[2], FACE[2], "m_face")
    ring()
    step = sys.argv[1] if len(sys.argv) > 1 else "all"
    if step in ("all", "caps"):
        captions_track()
    if step in ("all", "screen"):
        screen_track()
    print(master())
