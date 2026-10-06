#!/bin/bash
# Off-camera rehearsal: full build in the dryrun clone, headless, Opus 5.
cd "$(dirname "$0")/dryrun"
export TYPESAFE_API_KEY="$(python3 - <<'PY'
import re,os
for l in open(os.path.expanduser('~/vault/Keys/typesafe.md'),encoding='utf-8'):
    m=re.match(r'\s*TYPESAFE_API_KEY\s*[=:]\s*(\S+)',l)
    if m: print(m.group(1)); break
PY
)"
unset ADAL_DEV_MODE
P="Turn this ad blocker into a real-time AI slop detector. Jev judges each feed card: high confidence gets a LIKELY AI SLOP badge with the score, medium gets a CHECK THIS outline, low stays untouched. Never remove content. Add a fixture feed with three cards (slop, ambiguous, clean), unit tests, and run the browser harness through the relay with the real Jev key (TYPESAFE_API_KEY is set). Then verify it in the browser, save before and after screenshots, and write the PR description with the screenshots, test output and measured latency and cost into PR.md (do not push). Then make a 15 second demo clip of it and draft a short launch post into LAUNCH.md."
time adal -q "$P" -m meta-muse-spark-1.3 --yolo -o stream-json > ../rehearsal.jsonl 2> ../rehearsal.err
echo "exit $?" >> ../rehearsal.err
