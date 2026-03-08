#!/bin/bash
set -euo pipefail

SUP_PID=/tmp/proof_ops_watch_supervisor.pid
LOOP_PID=/tmp/proof_ops_watch_loop.pid
LOG=/tmp/proof_ops_watch.log
STATE=/tmp/watch_issue_state.txt
ISSUES_JSON=/tmp/watch_issues.json
TRACKED_ISSUES="371 563 581"
REPO="rsdouglas/proof"

write_loop() {
  cat > /tmp/proof_ops_watch_loop.sh <<'LOOPEOF'
#!/bin/bash
set -euo pipefail
echo $$ > /tmp/proof_ops_watch_loop.pid
LAST=$(curl -fsSL "https://api.github.com/repos/rsdouglas/proof/commits/main" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("sha","")[:7])' 2>/dev/null || true)
while sleep 300; do
  SHA=$(curl -fsSL "https://api.github.com/repos/rsdouglas/proof/commits/main" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("sha","")[:7])' 2>/dev/null || true)
  if [ -n "$SHA" ] && [ "$SHA" != "$LAST" ]; then
    wakeup "New commit on main: $SHA"
    LAST="$SHA"
  fi

  if curl -fsSL "https://api.github.com/repos/rsdouglas/proof/issues?state=open&per_page=100" -o /tmp/watch_issues.json 2>/dev/null; then
    python3 - <<'PY' </tmp/watch_issues.json >/tmp/watch_issue_state.txt.new
import json,sys
want={371,563,581}
items=json.load(sys.stdin)
for it in items:
    n=it.get('number')
    if n in want:
        print(f"{n}|{it.get('updated_at','')}|{it.get('state','')}")
PY
    if [ -f /tmp/watch_issue_state.txt ] && ! cmp -s /tmp/watch_issue_state.txt /tmp/watch_issue_state.txt.new; then
      mv /tmp/watch_issue_state.txt.new /tmp/watch_issue_state.txt
      wakeup "Tracked ops issue changed (#371/#563/#581)"
    elif [ ! -f /tmp/watch_issue_state.txt ]; then
      mv /tmp/watch_issue_state.txt.new /tmp/watch_issue_state.txt
    else
      rm -f /tmp/watch_issue_state.txt.new
    fi
  fi
done
LOOPEOF
  chmod +x /tmp/proof_ops_watch_loop.sh
}

write_supervisor() {
  cat > /tmp/proof_ops_watch_supervisor.sh <<'SUPEOF'
#!/bin/bash
set -euo pipefail
echo $$ > /tmp/proof_ops_watch_supervisor.pid
while sleep 30; do
  if [ ! -f /tmp/proof_ops_watch_loop.pid ] || ! kill -0 "$(cat /tmp/proof_ops_watch_loop.pid 2>/dev/null)" 2>/dev/null; then
    nohup /tmp/proof_ops_watch_loop.sh >> /tmp/proof_ops_watch.log 2>&1 &
  fi
done
SUPEOF
  chmod +x /tmp/proof_ops_watch_supervisor.sh
}

start_watch() {
  write_loop
  write_supervisor
  if [ -f "$LOOP_PID" ]; then kill "$(cat "$LOOP_PID")" 2>/dev/null || true; rm -f "$LOOP_PID"; fi
  if [ -f "$SUP_PID" ]; then kill "$(cat "$SUP_PID")" 2>/dev/null || true; rm -f "$SUP_PID"; fi
  : > "$LOG"
  nohup /tmp/proof_ops_watch_loop.sh >> "$LOG" 2>&1 &
  nohup /tmp/proof_ops_watch_supervisor.sh >> "$LOG" 2>&1 &
  sleep 1
  status_watch
}

stop_watch() {
  if [ -f "$LOOP_PID" ]; then kill "$(cat "$LOOP_PID")" 2>/dev/null || true; rm -f "$LOOP_PID"; fi
  if [ -f "$SUP_PID" ]; then kill "$(cat "$SUP_PID")" 2>/dev/null || true; rm -f "$SUP_PID"; fi
}

status_watch() {
  echo "repo=$REPO tracked_issues=$TRACKED_ISSUES"
  echo "log=$LOG"
  for f in "$SUP_PID" "$LOOP_PID"; do
    echo "[$f]"
    [ -f "$f" ] && cat "$f" || echo missing
  done
  [ -f "$SUP_PID" ] && ps -p "$(cat "$SUP_PID")" -o pid=,etime=,cmd= || true
  [ -f "$LOOP_PID" ] && ps -p "$(cat "$LOOP_PID")" -o pid=,etime=,cmd= || true
  tail -20 "$LOG" 2>/dev/null || true
}

case "${1:-start}" in
  start) start_watch ;;
  restart) stop_watch; start_watch ;;
  stop) stop_watch ;;
  status) status_watch ;;
  *) echo "usage: $0 [start|restart|stop|status]"; exit 1 ;;
esac
