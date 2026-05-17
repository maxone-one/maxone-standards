# 028 — Container-Misconfig-Audit

**Status:** active
**Seit:** 2026-04-28
**Gilt für:** alle Live-Projekte mit `docker-compose.yml` (lokal oder auf
dem Server unter `/opt/<projekt>/`)

## Regel

Jede `docker-compose.yml` für einen Live-Container hält die folgenden
Misconfig-Klassen frei. **Hard-Fails:**

1. **Kein `privileged: true`** — außer mit `# audit: privileged-required`
   und Begründung in der Folgezeile. Privilegierte Container haben
   Host-Root-Äquivalenz; ein Compromise ist game-over.
2. **Keine Inline-Secrets** in `environment:` — `PASSWORD=...`,
   `SECRET=...`, `*_KEY=hardcoded-value` etc. müssen aus `env_file:`
   kommen, nicht als Klartext im Compose. Variablen-Refs (`${VAR_NAME}`)
   ohne Default sind OK.
3. **Kein `:latest`-Tag (oder fehlender Tag) in `image:` bei Registry-
   Pulls** — z.B. `minio/minio:latest`, `ghcr.io/foo:latest` ohne
   gleichzeitiges `build:`. Pull-Tags driften silent zwischen Deploys.
   Pin auf SHA-Digest oder Versions-Tag.

   **Maxone-CI-Build-Pattern ist Ausnahme:** `image: <projekt>-app:latest`
   **mit** `build:`-Block ist OK — das Image entsteht im CI/lokal und wird
   via `docker save | docker load` transferiert (Standard 027), nicht
   gepulled. Der `:latest`-Tag ist dann nur ein lokales Cache-Label, der
   tarball ist die Wahrheit. Rollback erfolgt via Blue/Green-Slot
   (Standard 001).

**Warnings (sollte gefixt werden, blockiert nicht):**

4. **`mem_limit:` Pflicht** — OOM-Schutz auf shared Hosts (Standard 002).
5. **`restart:` Pflicht** — Auto-Recovery (`unless-stopped` als sicherer
   Default).
6. **Kein Bind-Mount auf `/var/run/docker.sock`** — außer mit
   `# audit: docker-socket-required` (Traefik, VECTOR, Watchtower haben
   das legitim, alle anderen nicht).
7. **`env_file:` muss auf `/opt/secrets/<projekt>/keys.env` zeigen** —
   nicht auf `.env` im Repo (Standard 003), nicht inline.
8. **Healthcheck-Endpoint darf kein SSR-Pfad sein** — Root `/` oder
   andere vollständig gerenderte Seiten als Healthcheck-URL sind verboten.
   Next.js SSR kann 5–7 s dauern und übersteigt den Standard-Timeout von
   5 s → CI-Rollback, obwohl der Container gesund ist. Erlaubte Endpunkte:
   `/api/version`, `/api/health`, `/health`, `/healthz` oder ein
   vergleichbarer statischer Endpunkt (kein SSR, kein DB-Query).

## Warum

**Vorfälle 2025/26:**

- **Replit-Agent 2025** — Agent löschte Prod-DB, weil Test/Prod-Trennung
  fehlte. Hätte ein `mem_limit:` und `restart:` allein nicht verhindert,
  aber strukturelle Compose-Hygiene reduziert die Klasse: ein Container
  mit `privileged: true` und docker.sock-Mount + LLM-Agent-Zugriff hätte
  den Schaden über alle Container ausgedehnt, nicht nur über die DB.
- **Stalwart-Orphan 2026-03-24** (CLAUDE.md) — `docker run` ohne
  `restart:`, ohne aufräumen → Orphan-Container, gelockte DB, Brevo-Key
  exponiert. Die Lehre kostete eine Key-Rotation und Downtime über alle
  Mail-Projekte.
- **Lovable/Bolt-Apps 2026** (Escape.tech) — 400 von 5.600 Apps mit
  Inline-Secrets in `environment:`-Block des Compose / Cloud-Run-YAMLs.
- **OOM-Klasse** (CLAUDE.md, mehrfach) — Build auf Prod-Server killt
  alle anderen Container; `mem_limit:` ist die letzte Linie davor.
- **vanfree Healthcheck-Timeout 2026-05-17** — Healthcheck gegen `/`
  (Next.js SSR) brauchte 6,3 s im Container; Timeout war 5 s. CI rollte
  mehrere Deploys zurück, obwohl der Container tatsächlich gesund war.
  Fix: `/api/version` (0,3 s). Lehre → Warning #8.

**Schließt einen dokumentierten Blindspot:** das Memory
`project_audit_compose_blindspot.md` weist explizit darauf hin, dass
Standards 002 + 004 lokal nicht voll prüfbar sind, weil Compose nur auf
dem Server liegt. Standard 028 macht den Audit **SSH-first mit
Local-Fallback** und schließt damit die Lücke ohne weitere Tools.

**Externe Studienlage:**

- OWASP **A05 Security Misconfiguration** (Top 10 2021) ist nach BOLA die
  häufigste Klasse — Container-Misconfigs sind ein Hauptträger.
- Aqua Trivy hat ~30 Compose-spezifische Built-in-Rules; Bridgecrew
  Checkov ~40. Das Subset oben ist die Schnittmenge der „PASS-blockend"-
  Klassifizierungen beider Tools.

## Wie anwenden

### A. Server-Pfad (Default)

`docker-compose.yml` liegt unter `/opt/<projekt>/docker-compose.yml`
(Standard 007). Der Audit zieht sie via SSH und prüft die 7 Punkte.

### B. Lokal-Pfad (Fallback)

Wenn `path_local/docker-compose.yml` (oder `compose.yml` /
`compose.yaml`) existiert, läuft die Prüfung auch lokal — relevant für
Projekte, die noch nicht deployed sind oder bei denen Server-Pfad
unbekannt ist.

### C. Beispiel — saubere Compose

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
    environment:
      NODE_ENV: production
      PORT: 3000
    labels:
      - traefik.enable=true
      - traefik.http.routers.<projekt>.rule=Host(`<domain>`)
      - traefik.http.routers.<projekt>.tls.certresolver=letsencrypt
```

Was fehlt vs. eine typische "vibe-coded" Compose:
- Kein `:latest`, kein `build: .` (Standard 002), kein `privileged`,
  keine `environment: API_KEY=sk_live_...`, kein
  `volumes: - /var/run/docker.sock:/var/run/docker.sock`.

### D. Bewusste Ausnahmen

Wenn `privileged: true` oder docker.sock-Mount **wirklich** nötig ist
(Traefik braucht docker.sock, VECTOR auch, Watchtower auch) —
explizite Audit-Annotation in der Zeile darüber:

```yaml
    volumes:
      # audit: docker-socket-required — Traefik braucht Container-Discovery
      - /var/run/docker.sock:/var/run/docker.sock:ro
```

```yaml
    # audit: privileged-required — nur für Lynis Host-Audit, monatlich
    privileged: true
```

Der Audit erkennt diese Annotationen und reklassifiziert von FAIL → PASS
mit dem Reason im Output.

### E. Tiefen-Scan (optional, empfohlen monatlich)

Für tiefere Compose-/Image-Misconfigs zusätzlich `trivy config`
auf jedem Server laufen lassen:

```bash
# auf maxone-prod (einmalig installieren)
apt install trivy

# alle Compose-Files scannen
for d in /opt/*/; do
  echo "=== $d ==="
  trivy config "$d" --format table --severity HIGH,CRITICAL --skip-dirs node_modules
done
```

Outputs HIGH/CRITICAL Misconfigs gemäß Aqua's Built-in-Ruleset (~30
Regeln über AVD-DS-XXXX-IDs). Standard 028 deckt die 7 wichtigsten
hart ab; trivy ist die "weiche" Tiefenprüfung.

## Audit

`scripts/audit.mjs` für jedes Projekt:

1. **Compose finden:**
   - SSH-First: `cat /opt/<projekt>/docker-compose.yml` (auch
     `compose.yml`, `compose.yaml`)
   - Local-Fallback: `<path_local>/docker-compose.yml`
   - Beides nicht da → SKIP
2. **YAML parsen** — bei Parse-Fehler FAIL.
3. **Pro Service** (`services.<name>`) prüfen:
   - `privileged: true` ohne `# audit: privileged-required`
     → **FAIL**
   - `environment:` mit Inline-Secret-Pattern
     (`(PASSWORD|SECRET|TOKEN|API_?KEY|PRIVATE_KEY)\s*[:=]\s*[A-Za-z0-9+/_-]{12,}`,
     ohne `${...}`-Ref) → **FAIL**
   - `image:` endet auf `:latest` oder hat keinen Tag → **FAIL**
   - `mem_limit:` fehlt → **WARN**
   - `restart:` fehlt → **WARN**
   - `volumes:` enthält `/var/run/docker.sock` ohne
     `# audit: docker-socket-required` → **WARN**
   - `env_file:` zeigt nicht auf `/opt/secrets/<projekt>/keys.env`
     → **WARN** (Pattern wird gegen `secrets_dir` aus Registry geprüft)
   - `healthcheck.test` enthält `localhost:\d+/'` oder `localhost:\d+/"` 
     (Root-Pfad ohne Sub-Pfad) → **WARN**
4. **Aggregat:**
   - PASS = keine FAIL, keine WARN
   - WARN = nur WARN
   - FAIL = mindestens ein FAIL

## Cross-Reference

- 002 No-Build-on-Prod — `image:` Pflicht, kein `build:`
- 003 Secrets-Store — `env_file:` aus `/opt/secrets/`
- 007 Paths-Naming — `/opt/<projekt>/docker-compose.yml`
- 027 Deploy-Pipeline — Compose-Pflichtfelder (image, healthcheck,
  env_file) sind hier Teilmenge
- VULN-CATALOG B6 (OWASP A05) — Security Misconfiguration
- MEMORY `project_audit_compose_blindspot.md` — geschlossen durch 028

## Externe Quellen

- aquasecurity/trivy — `trivy config` Ruleset (AVD-DS-XXXX)
- bridgecrewio/checkov — `CKV_DOCKER_*` Ruleset
- OWASP A05:2021 — Security Misconfiguration
- Docker Bench for Security — github.com/docker/docker-bench-security
