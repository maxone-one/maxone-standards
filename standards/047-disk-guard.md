# 047 — Disk-Guard: Docker-Cleanup-Frequenz und Notfall-Bremse

**Status:** active
**Seit:** 2026-05-18 (Vorfall-Direktive nach disk-full 2026-05-18 02:52 UTC)
**Gilt für:** maxone-prod (self-hosted Docker-Server mit lokalem GitHub-Runner)

## Regel

Drei Pflichten gleichzeitig aktiv:

1. **`docker builder prune -af` ohne `--until=`-Filter** — der Build-Cache wird vollständig geleert.
   Der alte `--until=24h`-Filter übersprang frischen Cache und war die direkte Ursache des disk-full-Vorfalls.

2. **Cleanup-Cron alle 4 Stunden** (`0 */4 * * *`) — vorher einmal täglich um 01:30.
   Lokale Docker-Builds (SLF self-hosted Runner) akkumulieren BuildKit-Cache in Stunden, nicht Tagen.

3. **`/opt/disk-guard.sh` alle 10 Minuten** — Notfall-Bremse: wenn Disk > 80 %, sofort
   `docker builder prune -af` + `docker image prune -f` + Telegram-Alert.

## Warum

2026-05-18 02:52 UTC: maxone-prod disk-full. Ursache: SLF-Deploy-Workflow lief auf
`voltfair-server` (self-hosted Runner auf maxone-prod). `docker build` akkumuliert
BuildKit-Cache; der tägliche Cleanup löschte nur Cache älter 24h — frische Builds
blieben, bis das Filesystem voll war.

Kein Monitoring, das früh genug anschlug. Erst als Stalwart, VECTOR und alle
Blue/Green-Container aufhörten zu antworten, wurde der Zustand sichtbar.

## Wie anwenden

**Script:** `/opt/_ops/docker-cleanup.sh` auf maxone-prod.

```bash
#!/usr/bin/env bash
# Wichtig: KEIN --until= — immer alles leeren.
docker builder prune -af
docker image prune -a --filter "until=72h" --force
```

**Cron-Schedule:** `/etc/cron.d/docker-cleanup`

```
0 */4 * * * root /opt/_ops/docker-cleanup.sh
```

**disk-guard:** `/opt/disk-guard.sh` (ausführbar, 700)

```bash
#!/bin/bash
DISK_PCT=$(df --output=pcent / | tail -1 | tr -dc '0-9')
THRESHOLD=80
if [ "$DISK_PCT" -gt "$THRESHOLD" ]; then
  docker builder prune -af 2>/dev/null || true
  docker image prune -f 2>/dev/null || true
  # Telegram-Alert (lädt aus /opt/secrets/global/sentinel.env)
fi
```

**Crontab (root):**

```
*/10 * * * * /opt/disk-guard.sh
```

## Audit

`scripts/audit.mjs`, Check `047-disk-guard` (SSH, einmalig via `vector`-Projekt auf maxone-prod):

1. `/opt/_ops/docker-cleanup.sh` existiert UND enthält `builder prune -af` UND enthält KEIN `--until=` → FAIL wenn einer fehlt
2. `/etc/cron.d/docker-cleanup` existiert UND Schedule ist `*/4` (4-Stunden-Intervall) → FAIL wenn Daily-Schedule
3. `/opt/disk-guard.sh` existiert UND enthält 80%-Schwellwert → FAIL wenn fehlt
4. `crontab -l` enthält `disk-guard.sh` mit `*/10`-Schedule → WARN wenn Schedule abweicht
