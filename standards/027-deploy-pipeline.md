# 027 — Deploy-Pipeline (CI-Build → Image-Transfer → swap)

**Status:** active
**Seit:** 2026-04-28 (User-Direktive — ergänzt 001 + 002 um den positiven Pfad)
**Geschärft:** 2026-04-28 (Vorfall SLF/Viktoria From — `runs-on: self-hosted`
+ `docker build` = Build auf maxone-prod, weil der Runner dort lebt)
**Gilt für:** alle Projekte mit `status: live`

## Regel

Deploy folgt einem festen, dokumentierten Pfad. Manuelle SSH-Bauten oder
Ad-hoc-Rsync sind verboten. Der Pfad ist:

```
git push  →  GitHub-hosted Runner (ubuntu-latest) baut Image  →
docker save | gzip | ssh maxone-prod "docker load"  →
docker compose up -d (ohne --build)  →
Health-Check  →  Traefik-Swap (Blue/Green)  →
alter Slot bleibt 5 min als Rollback-Reserve
```

Vier Pflicht-Eigenschaften:

1. **Build läuft NICHT auf dem Prod-Server.** (siehe 002) — das schließt
   den self-hosted Runner `voltfair-server` ein, denn der lebt physisch auf
   maxone-prod (`/opt/github-runner/`). `runs-on: self-hosted` + `docker
   build` in derselben Pipeline = Build auf Prod = **FAIL**.
2. **Artefakt ist ein vollständiges Docker-Image** mit `image:`-Tag. Nicht
   nur Code-Pull + Restart.
3. **Deploy ist Zero-Downtime via Blue/Green** (siehe 001).
4. **Pipeline ist als GitHub-Actions-Workflow versioniert** unter
   `.github/workflows/deploy.yml` — keine handgekreuzten Bash-Skripte
   außerhalb des Repos.

## Warum

Vor dieser Regel passierten in den letzten 12 Monaten mehrfach
Down-Spikes durch:

- **Server-OOM beim `docker compose build` auf maxone-prod** — Next.js-
  Build verbrauchte 6 GB, Server fror ein, alle 11 Projekte 8 min offline.
  Lehre → Standard 002.
- **Single-Container-Restart ohne Health-Check** — neuer Container hatte
  Bootfehler, alter war schon weg, Site 12 min offline. Lehre → Standard 001.
- **Rsync von `dist/` ohne Image-Build** — Mismatch zwischen lokalen
  `node_modules` und Server-`node_modules`, npm-native-Modules brachen.
- **Manuelles `git pull && docker compose up -d --build` per SSH** —
  unreproduzierbar, kein Audit-Trail, kein Rollback.
- **`runs-on: self-hosted` + `docker build` (SLF, Viktoria From, weitere
  2026-04-28)** — sah aus wie eine korrekte CI-Pipeline, weil der Build im
  Workflow lief und nicht per SSH ausgelöst wurde. Tatsächlich lebt unser
  einziger self-hosted Runner `voltfair-server` aber auf maxone-prod
  (`/opt/github-runner/`), d.h. jeder `docker build`-Step zog 80–180 s
  RAM/CPU vom Prod-Server und konkurrierte mit den Live-Containern.
  User-erlebter Effekt: 8–30 s "Site lädt langsam"-Spike pro Deploy.
  Lehre → Premium-Pattern erzwingt `runs-on: ubuntu-latest` und
  Image-Transfer per SSH.

Standard 027 fügt diese Lehren zu **einem festen Pipeline-Pfad** zusammen.
Wenn der Pfad eingehalten wird, sind 001 + 002 + 003 (Secrets) + 004 (TLS)
automatisch erfüllt.

## Wie anwenden

### Komponenten

- **GitHub Actions Workflow** (`.github/workflows/deploy.yml`) — der
  Orchestrator
- **GitHub-hosted Runner** (`ubuntu-latest`) — baut die Images.
  **Nicht** der self-hosted Runner `voltfair-server`, weil der auf
  maxone-prod lebt (= Build auf Prod = verboten, siehe oben). Der
  self-hosted Runner darf in Workflows verwendet werden, die nichts
  Build-Schweres tun (z.B. `pr-validate-audit.yml`, `scheduled-audit.yml`).
- **Image-Transfer** via SSH (kein Container-Registry-Subscription
  notwendig — siehe Standard 026)
- **Org-Level GitHub Secret** `MAXONE_PROD_DEPLOY_SSH_KEY` für den SSH-
  Key, der `ubuntu-latest` → maxone-prod verbindet. Restricted in
  `~/.ssh/authorized_keys` per `command="docker load"`/`from="…"`.
- **`docker-compose.yml`** auf dem Server unter `/opt/<projekt>/` —
  hat `image: <projekt>-app:latest` und `build:`-Block für lokale
  Entwicklung
- **Health-Check** in `docker-compose.yml` mit `start_period: 30s`
- **Traefik-Service-Switch** via Label-Update (siehe `templates/docker-
  compose.blue-green.yml`)

### Workflow-Skelett (`.github/workflows/deploy.yml`)

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    # Pflicht: ubuntu-latest. self-hosted = Build auf maxone-prod.
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v5

      - uses: docker/setup-buildx-action@v3

      - name: Configure SSH
        run: |
          mkdir -p ~/.ssh && chmod 700 ~/.ssh
          echo "${{ secrets.MAXONE_PROD_DEPLOY_SSH_KEY }}" > ~/.ssh/maxone-prod
          chmod 600 ~/.ssh/maxone-prod
          ssh-keyscan -H 128.140.40.235 >> ~/.ssh/known_hosts 2>/dev/null

      - name: Determine inactive slot
        id: slot
        run: |
          ACTIVE=$(ssh -i ~/.ssh/maxone-prod root@128.140.40.235 \
            "cat /opt/<projekt>/.active-slot 2>/dev/null || echo blue")
          if [ "$ACTIVE" = "blue" ]; then echo "target=green" >> $GITHUB_OUTPUT; else echo "target=blue" >> $GITHUB_OUTPUT; fi

      - name: Build image
        run: |
          docker build -t <projekt>-app:${{ github.sha }} .
          docker tag <projekt>-app:${{ github.sha }} <projekt>-app:latest

      - name: Transfer image to maxone-prod
        run: |
          docker save <projekt>-app:latest | gzip | \
            ssh -i ~/.ssh/maxone-prod root@128.140.40.235 "gunzip | docker load"

      - name: Deploy inactive slot (no build on prod)
        run: |
          ssh -i ~/.ssh/maxone-prod root@128.140.40.235 \
            "cd /opt/<projekt> && COMPOSE_PROFILES=${{ steps.slot.outputs.target }} docker compose up -d --no-build"

      - name: Wait for healthy
        run: |
          for i in {1..30}; do
            STATUS=$(ssh -i ~/.ssh/maxone-prod root@128.140.40.235 \
              "docker inspect --format '{{.State.Health.Status}}' <projekt>-app-${{ steps.slot.outputs.target }}" || echo starting)
            [ "$STATUS" = "healthy" ] && exit 0
            sleep 5
          done
          echo "Health-Check failed" && exit 1

      - name: Swap Traefik to new slot
        run: |
          ssh -i ~/.ssh/maxone-prod root@128.140.40.235 \
            "cd /opt/<projekt> && ./swap.sh ${{ steps.slot.outputs.target }}"

      - name: Cleanup old image (after 72h)
        run: |
          ssh -i ~/.ssh/maxone-prod root@128.140.40.235 \
            "docker image prune -f --filter 'until=72h'"
```

> **Antipattern (zur Abschreckung):** `runs-on: self-hosted` + `docker
> build`. Sieht harmlos aus, aber jeder Build zieht 80–180 s RAM/CPU vom
> Prod-Server. Audit (Standard 027) fängt diese Kombination als FAIL.

### docker-compose.yml Pflichtfelder

```yaml
services:
  app-blue: &app
    image: <projekt>-app:latest    # Server nutzt vorgebautes Image
    build:                          # Nur lokal/CI
      context: .
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 30s
    mem_limit: 2g
    restart: unless-stopped
    env_file: /opt/secrets/<projekt>/keys.env

  app-green:
    <<: *app
```

### Manuelle Deploys (nur für Hotfixes)

Sind erlaubt, wenn:

- der GitHub-Actions-Runner nicht erreichbar ist und ein Sicherheits-Fix
  in der nächsten Stunde live muss
- vorher in Telegram an Max angekündigt wurde
- danach ein Issue im Repo angelegt wird, warum die Pipeline nicht ging

Manuelle Deploys laufen **trotzdem** über `docker save | ssh ... | docker
load` von Max' Lokalmaschine — niemals `docker build` auf dem Prod-Server.

### Rollback

Im Fehlerfall:

```bash
ssh root@maxone-prod "cd /opt/<projekt> && \
  docker label update <projekt>-app-<previous-slot> traefik.enable=true && \
  docker label update <projekt>-app-<new-broken-slot> traefik.enable=false"
```

Der alte Slot bleibt 5 min nach Swap stehen — innerhalb dieser Frist ist
Rollback ein Label-Switch ohne neuen Deploy.

## Was diese Regel NICHT erzwingt

- **Welche Sprache / welches Framework** — Next.js, SvelteKit, FastAPI,
  Go-Binary, alles erlaubt, solange das Build-Output ein Docker-Image
  ist.
- **Welcher Image-Optimizer** — Distroless, Alpine, Debian-Slim:
  Projekt-Entscheidung. Empfohlen: Multi-Stage-Build für < 200 MB.
- **Welche Image-Registry** — wir nutzen keine (image-transfer via SSH,
  siehe Standard 026 — keine Docker-Hub-Subscription). Bei Bedarf wäre
  GHCR (kostenlos für Public, paid für Private) der Fallback.

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live`:

1. **`.github/workflows/deploy.yml` existiert** — FAIL wenn nicht
2. **Workflow-Antipattern** — FAIL wenn `runs-on: self-hosted` UND
   `docker build` (oder `docker compose build`) im selben Workflow.
   Begründung siehe oben: voltfair-server lebt auf maxone-prod, das
   ist ein verkappter Build auf Prod.
3. **Workflow-Pflicht** — `runs-on: ubuntu-latest` + `docker save` +
   SSH-Image-Transfer (`docker load`). Fehlt eines: WARN.
4. **`docker-compose.yml` auf dem Server** (per SSH unter
   `/opt/<projekt>/docker-compose.yml`) enthält:
   - `image:` Feld (nicht nur `build:`) — FAIL wenn fehlt
   - `healthcheck:`-Block — WARN wenn fehlt
   - `mem_limit:`-Feld — INFO wenn fehlt
   - `env_file:`-Feld zeigt auf `/opt/secrets/<projekt>/keys.env`
     (ergänzt 003) — WARN wenn anders
5. **Beide Slots existieren** für Blue/Green-Projekte (`<projekt>-app-
   blue` UND `-green`) — siehe 001-Audit, hier nur Cross-Reference
6. **Kein Build-Output** in `.gitignore` fehlend (`dist/`, `.next/`,
   `node_modules/`) — INFO wenn fehlt

PASS = Workflow vorhanden + `ubuntu-latest` + Image-Transfer + Server-
Compose hat `image:` + Health-Check.
WARN = Pipeline existiert aber unvollständig (z.B. `docker save` fehlt,
oder `runs-on:` nicht explizit auf `ubuntu-latest`).
FAIL = Workflow fehlt **ODER** Antipattern `runs-on: self-hosted` +
`docker build` **ODER** `ssh maxone-prod ... docker build` (alter
manueller Pfad).

## Ausnahmen

`deploy_pipeline: manual` ist nur erlaubt für:

- Internes Tooling ohne externe Domain (`status: dev`)
- Einmal-Skripte (Cron-Jobs, die kein Container-Image brauchen)

Aktuell als Ausnahme dokumentiert in `registry/projects.yml`:

- `kitchen-station` (intern), `vector` (eigene Pipeline via
  `/opt/vector/deploy.sh` — VECTOR ist Infra, nicht Produkt)
