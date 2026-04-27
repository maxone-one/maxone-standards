# Checkliste: 027 — Deploy-Pipeline

Vor jedem neuen Projekt-Setup UND vor jedem Pipeline-Refactor.

---

## A. Workflow-Datei (`.github/workflows/deploy.yml`)

- [ ] Datei existiert
- [ ] `runs-on: self-hosted` (Runner `voltfair-server`)
- [ ] Trigger ist `push: branches: [main]` (oder bewusste Erweiterung)
- [ ] Build-Step: `docker build -t <projekt>-app:${{ github.sha }} .`
- [ ] Tag-Step: `docker tag ... :latest`
- [ ] Transfer-Step: `docker save | gzip | ssh ... gunzip | docker load`
- [ ] **Kein** `docker compose build` auf dem Prod-Server irgendwo
- [ ] Inactive-Slot-Detect via `docker inspect`
- [ ] Health-Check-Loop mit Timeout (max 30 × 5s = 150s)
- [ ] Traefik-Swap nur wenn Health-Check grün
- [ ] Cleanup: `docker image prune -f --filter 'until=72h'`

## B. docker-compose.yml auf dem Server (`/opt/<projekt>/`)

- [ ] `image: <projekt>-app:latest` ist gesetzt (nicht nur `build:`)
- [ ] `build:`-Block existiert ZUSÄTZLICH (für lokale Entwicklung)
- [ ] `healthcheck:`-Block:
  - [ ] `test:` zeigt auf `/api/health` oder vergleichbaren Endpunkt
  - [ ] `interval: 10s`
  - [ ] `start_period: 30s` (Boot-Zeit)
  - [ ] `retries: 3`
- [ ] `mem_limit: 2g` (oder projekt-spezifisch passend)
- [ ] `restart: unless-stopped`
- [ ] `env_file: /opt/secrets/<projekt>/keys.env` (Standard 003-konform)
- [ ] Beide Slots (`-blue` UND `-green`) definiert (Standard 001)

## C. `/api/health`-Endpunkt im Projekt

- [ ] Endpunkt liefert `200 OK` mit JSON `{ "status": "healthy", "ts": ... }`
- [ ] **Nicht nur statisch** — prüft DB-Connection + KV-Connection wenn
      vorhanden
- [ ] **Kein PII** im Response-Body
- [ ] Response < 100 ms (sonst fragmentiert Health-Check)

## D. Self-Hosted Runner

- [ ] Runner `voltfair-server` ist online (`gh api orgs/maxone-studio-org/actions/runners`)
- [ ] Service läuft: `actions.runner.maxone-studio-org.voltfair-server.service`
- [ ] Runner-Version aktuell (≥ 2.331.0)
- [ ] Runner hat SSH-Key für Deploy-Ziel (`maxone-prod`)
- [ ] Runner hat Docker-Daemon-Zugriff lokal

## E. Rollback-Test (einmalig pro Projekt)

- [ ] Bewusst defekten Image-Tag deployt
- [ ] Health-Check-Failure korrekt erkannt → kein Swap
- [ ] Manueller Label-Switch zurück auf alten Slot getestet
- [ ] Site bleibt während des Tests live (Zero-Downtime verifiziert)

## F. Manuelle Hotfix-Pipeline (nur Notfall)

- [ ] Lokal bauen: `docker build -t <projekt>-app:hotfix-<timestamp> .`
- [ ] Lokal transferieren: `docker save | gzip | ssh ... | docker load`
- [ ] Auf Server: Slot ermitteln, `docker compose up -d --no-build <slot>`
- [ ] Health-Check abwarten, dann Label-Swap
- [ ] **Nach dem Hotfix:** Issue im Repo „Pipeline-Bypass <Datum>"
      mit Begründung
- [ ] **Nach dem Hotfix:** Pipeline-Fehler debuggen + fixen, sonst wird
      die Bypass-Praxis Gewohnheit

---

## Manueller Pipeline-Test (10 min, einmal pro Projekt)

```bash
# 1. Trigger einen leeren Deploy
git commit --allow-empty -m "test: pipeline trigger" && git push

# 2. Workflow beobachten
gh run watch

# 3. Auf maxone-prod prüfen, welcher Slot aktiv ist
ssh root@maxone-prod "docker ps --filter name=<projekt>-app --format '{{.Names}} {{.Status}}'"

# 4. Traefik-Routing prüfen
curl -sI https://<domain>/ | grep -i 'x-active-slot'  # falls Header gesetzt

# 5. Image-Cleanup verifizieren
ssh root@maxone-prod "docker images | grep <projekt>-app"
# Erwartung: <projekt>-app:latest + <projekt>-app:<sha>, alle anderen weg
```

## Cross-Reference

- 001 — Blue/Green-Pattern (architektonisches Was)
- 002 — Niemals Build auf Prod (negative Invariante)
- 003 — Secrets Store (`env_file:`-Pflichtfeld kommt von dort)
- 004 — TLS DNS-01 (Traefik-Resolver-Label)
- **027 = das positive Wie** — die konkrete Pipeline, die 001+002+003+004
  als Eigenschaften erfüllt
