# Demo video materials

Everything used to make the slop detector demo video shown at WeAreDevelopers World Congress (Sep 2026), so the video can be remade.

## Final cuts

- `video/v19-2026-09-29-jev-script-no-hook.mp4`: latest full cut (171 s), opens on Prompt 1, made for a live intro on camera
- `video/v18-2026-09-25-jev-script-v2-cut.mp4`: same cut with the 9 s hook cards
- `present/versions/v04-2026-09-29-present-16x9-logo.mp4`: 16:9 presenter version (talking head plus screen), latest of v01 to v04
- `video/v01-2026-09-22-slop-launch.mp4`: 15 s vertical launch clip

## Folders

- `docs/`: producer brief, script, beat sheet
- `scripts/`: recording and render pipeline (`rehearse.sh` and `record-take.sh` run AdaL, `take*.json` and `seg-*.json` drive the recorder, `gen_timeline*.py` and `timeline-v*.json` lay out the cut, `stage*.html` plus `render*.mjs` render it, `gen_score*.py` and `gen_music.py` make the score). Highest number = latest. `rehearsal.jsonl` is the full AdaL run log.
- `assets/`: fonts (all OFL), AdaL logo SVGs, PR screenshots, scene stills, SFX
- `audio/`: final score (`score-v6.wav`), music beds, SFX
- `present/`: presenter build (`build.py`, `timeline.py`, `words.json` captions), voice take (`raw/take16k.wav`), screen recording (`build/screen.mp4`), hook animation (`hook/`)
- `launch-clip/`: 15 s clip captions (`.ass`), segments and sources

## Not included

Raw recorded take frames and intermediate segments (about 3.5 GB). Ask Jax if you need them.

Scripts were written for Jax's Mac, so absolute paths (`~/adal/videos/jev-slop-detector`) need changing before a rerun. The Jev key is read from an env var (`TYPESAFE_API_KEY`), never stored here.
