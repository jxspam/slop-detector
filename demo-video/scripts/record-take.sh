#!/bin/bash
# Recorded take: interactive AdaL (Muse Spark 1.3 pinned for workspace), browser capture on 9222.
cd "$(dirname "$0")"
export TYPESAFE_API_KEY="$(python3 - <<'PY'
import re,os
for l in open(os.path.expanduser('~/vault/Keys/typesafe.md'),encoding='utf-8'):
    m=re.match(r'\s*TYPESAFE_API_KEY\s*[=:]\s*(\S+)',l)
    if m: print(m.group(1)); break
PY
)"
TS=$(date +%Y%m%d-%H%M%S); mkdir -p takes/$TS
echo "takes/$TS" > takes/LATEST
node ~/.claude/skills/adal-demo-terminal/scripts/record.mjs ${TAKE:-take.json} takes/$TS/take.cast > takes/$TS/record.log 2>&1
echo "exit $?" >> takes/$TS/record.log
