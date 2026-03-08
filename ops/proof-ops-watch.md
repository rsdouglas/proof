# proof-ops local wakeup watcher

Tracks lightweight external changes while proof-ops sleeps.

## What it watches
- GitHub `rsdouglas/proof` main branch HEAD SHA
- Open issue state changes for tracked ops blockers: `#371`, `#563`, `#581`

## Bootstrap
From repo root:

```bash
./scripts/proof-ops-watch.sh start
```

## Verify status
```bash
./scripts/proof-ops-watch.sh status
```

Expected artifacts:
- supervisor pid: `/tmp/proof_ops_watch_supervisor.pid`
- loop pid: `/tmp/proof_ops_watch_loop.pid`
- shared log: `/tmp/proof_ops_watch.log`
- issue state cache: `/tmp/watch_issue_state.txt`

## Clean restart
```bash
./scripts/proof-ops-watch.sh restart
```

## Stop
```bash
./scripts/proof-ops-watch.sh stop
```

## Notes
- Uses only public GitHub API endpoints, so it stays independent of auth quirks.
- PID-file based; avoids fragile `pkill -f` patterns.
- Shared log path is `/tmp/proof_ops_watch.log`.
