import html, json, os, glob
B = os.path.dirname(os.path.abspath(__file__))
os.chdir(B)
M = open('takes/MAIN').read().strip()
L = open('takes/LATEST').read().strip()
def snap(p):
    try: return html.escape(open(p, encoding='utf-8').read().rstrip())
    except FileNotFoundError: return ''
launch = html.escape(open('workspace/LAUNCH.md', encoding='utf-8').read())
bframes = sorted(glob.glob(f'{L}/browser/*.jpg'))
brow = ''.join(f'<img src="{f}" loading="lazy">' for f in bframes[::max(1, len(bframes)//6)][:6]) or '<p class="muted">Recording</p>'
rows = [
 ('Model', 'Muse Spark 1.3'), ('Tests', '6 / 6 pass, live Jev'),
 ('Slop card', '0.97, LIKELY AI SLOP'), ('Ambiguous card', '0.63, CHECK THIS'), ('Clean card', '0.03, untouched'),
 ('Jev batch latency', '220 to 285 ms'), ('Tokens per batch', '~1,160 in, 61 out'),
 ('Cost per feed (rehearsal)', '$0.00008'), ('Build time (prompt 1)', '13 min 27 s'),
 ('Proof + PR (prompt 2)', '10 min 34 s'), ('Clip + post (prompt 3)', '4 min 36 s'),
]
table = ''.join(f'<tr><td>{a}</td><td>{b}</td></tr>' for a, b in rows)
page = f'''<!doctype html><html><head><meta charset="utf-8"><title>Jev Slop Detector Footage</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{{--bg:#fff;--ink:#16070D;--pink:#FF5898;--deep:#E84D87;--line:#f1d3df;--muted:#8a6f7a;--term:#fff}}
@media (prefers-color-scheme:dark){{:root:not([data-theme=light]){{--bg:#16070D;--ink:#FFE4EE;--line:#3a2530;--muted:#b89aa6;--term:#21131A}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,Inter,sans-serif}}
main{{max-width:1180px;margin:0 auto;padding:32px 16px 80px}}
h1{{font-size:30px;margin:0 0 28px}}h2{{font-size:20px;margin:48px 0 14px;padding-top:14px;border-top:1px solid var(--line)}}
h3{{font-size:15px;margin:18px 0 8px;color:var(--deep)}}
a{{color:var(--deep)}}.muted{{color:var(--muted)}}
table{{border-collapse:collapse;width:100%;max-width:560px}}td{{padding:7px 0;border-bottom:1px solid var(--line)}}td:last-child{{text-align:right;font-variant-numeric:tabular-nums}}
pre{{background:var(--term);border:1px solid var(--line);border-radius:10px;padding:14px;overflow:auto;font:12px/1.35 "JetBrains Mono",Menlo,monospace;max-height:520px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}}
img,video{{width:100%;border:1px solid var(--line);border-radius:10px;display:block}}
.tall{{max-height:900px;overflow:auto;border:1px solid var(--line);border-radius:10px}}.tall img{{border:0;border-radius:0}}
.post{{white-space:pre-wrap;background:var(--term);border:1px solid var(--line);border-radius:10px;padding:16px;max-width:720px}}
ol{{padding-left:20px}}
</style></head><body><main>
<h1>Jev Slop Detector Footage</h1>

<h2>Numbers</h2>
<table>{table}</table>

<h2>Recorded take</h2>
<h3>Prompt 1 · build + tests</h3><pre>{snap(M+'/take.cast.p1-done.txt')}</pre>
<h3>Prompt 2 · proof + PR</h3><pre>{snap(M+'/take.cast.p2-done.txt')}</pre>
<h3>Prompt 3 · demo clip + launch post</h3><pre>{snap(M+'/take.cast.p3-done.txt')}</pre>

<h2>PR #1</h2>
<p><a href="https://github.com/jxspam/jev-slop-detector/pull/1">github.com/jxspam/jev-slop-detector/pull/1</a></p>
<div class="tall"><img src="assets/pr/conversation-full.png"></div>

<h2>AdaL's own demo clip</h2>
<video src="workspace/assets/demo.mp4" controls muted loop playsinline style="max-width:820px"></video>

<h2>AdaL's launch post</h2>
<div class="post">{launch}</div>

<h2>Browser take</h2>
<div class="grid">{brow}</div>

<h2>Rehearsal</h2>
<div class="grid"><img src="dryrun/assets/after.png"><img src="rehearsals/demo-sheet.png"></div>

<h2>Next</h2>
<ol><li>Browser take with AdaL's visible Chrome</li><li>Hook capture</li><li>2:00 cut, music, sound effects</li><li>Your review, then Li's thread</li></ol>
</main></body></html>'''
open('review.html', 'w', encoding='utf-8').write(page)
print('ok', len(bframes), 'browser frames')
