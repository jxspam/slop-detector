#!/bin/bash
cd "$(dirname "$0")"
export TYPESAFE_API_KEY="$(python3 - <<'PY'
import re,os
for l in open(os.path.expanduser('~/vault/Keys/typesafe.md'),encoding='utf-8'):
    m=re.match(r'\s*TYPESAFE_API_KEY\s*[=:]\s*(\S+)',l)
    if m: print(m.group(1)); break
PY
)"
TS=$(date +%Y%m%d-%H%M%S); O=hook/$TS; mkdir -p $O
(cd workspace && node test/relay.mjs > ../$O/relay.log 2>&1 &) ; sleep 1.5
node hook-x.mjs $O
pkill -f "node test/relay.mjs"
echo $O > hook/LATEST
