#!/bin/bash
cd "$(dirname "$0")"
export TYPESAFE_API_KEY="$(python3 - <<'PY'
import re,os
for l in open(os.path.expanduser('~/vault/Keys/typesafe.md'),encoding='utf-8'):
    m=re.match(r'\s*TYPESAFE_API_KEY\s*[=:]\s*(\S+)',l)
    if m: print(m.group(1)); break
PY
)"
pkill -f "chrome-profiles/adal-browser-use"; sleep 3
EXT="${EXT:-}" nohup node shared-chrome.mjs > shared-chrome.log 2>&1 &
for i in $(seq 1 40); do grep -q "^ready" shared-chrome.log && break; sleep 1; done
cat shared-chrome.log
