# 028 — Container Safety (Misconfig-Audit · Disk-Guard)

**Status:** active
**Seit:** 2026-04-28 (Misconfig), 2026-05-18 (Disk-Guard)
**Gilt für:** alle Live-Projekte mit `docker-compose.yml` und maxone-prod

## Inhalt

- [A] Container-Misconfig-Audit
- [B] Disk-Guard: Cleanup-Frequenz und Notfall-Bremse

---

## A — Container-Misconfig-Audit

### Hard-Fails

1. **Kein `privileged: true`** — außer mit `# audit: privileged-required` + Begründung in Folgezeile
2. **Keine Inline-Secrets** in `environment:` — `PASSWORD=...`, `API_KEY=hardcoded` etc. müssen aus `env_file:` kommen. Variablen-Refs (`${VAR_NAME}`) ohne Default sind OK.
3. **Kein `:latest`-Tag bei Registry-Pulls** ohne gleichzeitiges `build:`. Maxone-CI-Build-Pattern (`image: <projekt>-app:latest` + `build:`) ist Ausnahme — das Image kommt via `docker save | docker load`, nicht per Pull.

### Warnings

4. **`mem_limit:` Pflicht** — OOM-Schutz auf shared Hosts
5. **`restart:` Pflicht** — Auto-Recovery (`unless-stopped`)
6. **Kein Bind-Mount auf `/var/run/docker.sock`** — außer mit `# audit: docker-socket-required` (Traefik, VECTOR, Watchtower haben es legitim)
7. **`env_file:` muss auf `/opt/secrets/<projekt>/keys.env` zeigen** — nicht auf `.env` im Repo
8. **Healthcheck-Endpoint kein SSR-Pfad** — Root `/` oder vollständig gerenderte Seiten verboten (Next.js SSR kann 5–7 s dauern, überschreitet 5s-Timeout). Erlaubt: `/api/version`, `/api/health`, `/healthz`

**Bewusste Ausnahmen per Annotation:**
```yaml
    volumes:
      # audit: docker-socket-required — Traefik braucht Container-Discovery
      - /var/run/docker.sock:/var/run/docker.sock:ro
```

**Saubere Compose-Referenz:**
```yaml
services:
  app:
    image: ghcr.io/maxone-one/<projekt>:2026-04-28-abc1234
    restart: unless-stopped
    mem_limit: 2g
    healthcheck:
      test: ['CMD-SHELL', 'curl -fsS http://localhost:3000/health || exit 1']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
    env_file: /opt/secrets/<projekt>/keys.env
    labels:
      - traefik.enable=true
      - traefik.http.routers.<projekt>.tls.certresolver=letsencrypt
```

**Warum:** Stalwart-Orphan 2026-03-24 (`docker run` ohne `restart:`), Lovable/Bolt-Apps mit Inline-Secrets (400 von 5.600 Apps), vanfree Healthcheck-Timeout 2026-05-17 (Route `/` → 6,3 s → 5 s Timeout → CI rollte gesunden Container zurück).

---

## B — Disk-Guard (maxone-prod)

**Drei Pflichten gleichzeitig:**

1. **`docker builder prune -af` ohne `--until=`-Filter** — Build-Cache vollständig leeren. Der alte `--until=24h`-Filter war direkte Ursache des disk-full-Vorfalls 2026-05-18.

2. **Cleanup-Cron alle 4 Stunden** (`0 */4 * * *`) — vorher täglich, aber lokale Docker-Builds akkumulieren BuildKit-Cache in Stunden, nicht Tagen.

3. **`/opt/disk-guard.sh` alle 10 Minuten** — wenn Disk > 80 %: sofort `docker builder prune -af` + `docker image prune -f` + Telegram-Alert.

**Script `/opt/_ops/docker-cleanup.sh`:**
```bash
#!/usr/bin/env bash
docker builder prune -af                              # KEIN --until=
docker image prune -a --filter "until=72h" --force
```

**Cron `/etc/cron.d/docker-cleanup`:**
```
0 */4 * * * root /opt/_ops/docker-cleanup.sh
```

**Disk-Guard `/opt/disk-guard.sh`:**
```bash
#!/bin/bash
DISK_PCT=$(df --output=pcent / | tail -1 | tr -dc '0-9')
[ "$DISK_PCT" -gt 80 ] && docker builder prune -af && docker image prune -f
```
Crontab root: `*/10 * * * * /opt/disk-guard.sh`

**Warum:** 2026-05-18 02:52 UTC: maxone-prod disk-full. SLF-Workflow auf `voltfair-server` (self-hosted Runner auf maxone-prod). `docker build` akkumulierte BuildKit-Cache. Täglicher Cleanup löschte nur Cache älter 24h. Stalwart, VECTOR und alle Blue/Green-Container antworteten nicht mehr.

---

## Audit

**Misconfig:** Compose via SSH-First, dann Local-Fallback. Pro Service YAML parsen:
- `privileged: true` ohne Annotation → FAIL
- Inline-Secret-Pattern → FAIL
- `image:` endet auf `:latest` ohne `build:` → FAIL
- `mem_limit:` fehlt → WARN
- `restart:` fehlt → WARN
- docker.sock ohne Annotation → WARN
- `env_file:` zeigt nicht auf `/opt/secrets/<projekt>/keys.env` → WARN
- Healthcheck auf Root-Pfad → WARN

**Disk-Guard (SSH, via vector-Projekt auf maxone-prod):**
- `/opt/_ops/docker-cleanup.sh` existiert + enthält `builder prune -af` + kein `--until=` → fehlt = FAIL
- `/etc/cron.d/docker-cleanup` mit `*/4`-Schedule → FAIL wenn Daily
- `/opt/disk-guard.sh` mit 80%-Schwellwert → FAIL wenn fehlt
- `crontab -l` enthält `disk-guard.sh` mit `*/10`-Schedule → WARN wenn abweicht
