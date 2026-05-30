# 001 — Deploy (Blue/Green · Kein Prod-Build · Pipeline · Warmup)

**Status:** active
**Seit:** 2026-04-22 (erweitert 2026-04-29)
**Gilt für:** alle Projekte mit `status: live`

## Inhalt

- [A] Blue/Green Deployment
- [B] Kein Docker-Build auf Produktions-Servern
- [C] Deploy-Pipeline (CI-Build → Image-Transfer → Swap)
- [D] Post-Deploy Warmup

---

## A — Blue/Green Deployment

Jedes Live-Projekt deployed im Blue/Green-Pattern. Der alte Slot bleibt aktiv bis der neue Slot vom Health-Check als healthy erkannt wird. Erst dann swappt Traefik.

- Container-Naming: `<projekt>-app-blue`, `<projekt>-app-green`
- Health-Check mit `start_period: 30s` in `docker-compose.yml`
- Deploy-Workflow swappt nur wenn neuer Slot healthy

Ausnahmen (`deploy: single` erlaubt für): interne Tools ohne externen Traffic, Projekte mit `status: dev`. Dokumentiert in `registry/projects.yml`.

---

## B — Kein Docker-Build auf Produktions-Servern

Docker-Images werden NIE auf Produktions-Servern gebaut. Build erfolgt lokal oder im GitHub-Runner. Der Server bekommt nur fertige Images via `docker save | gzip | ssh ... | docker load`.

**Erlaubt auf Prod:** `docker compose up -d` (ohne `--build`), `docker load`, `docker compose restart`, `docker image prune -f`

**Verboten auf Prod:** `docker compose up --build`, `docker build .`, `npm run build` / `next build`, `docker compose build`

**Warum:** Next.js/Vite-Builds verbrauchen 4–8 GB RAM. Bei 10+ parallelen Containern → OOM → Downtime für alle Projekte. Mehrfach passiert.

---

## C — Deploy-Pipeline

Fester Pfad — manuelle SSH-Bauten und Ad-hoc-Rsync sind verboten:

```
git push → GitHub-Runner (ubuntu-latest) baut Image →
docker save | gzip | ssh maxone-prod "docker load" →
docker compose up -d (ohne --build) →
Health-Check → Traefik-Swap (Blue/Green) →
alter Slot bleibt 5 min als Rollback-Reserve
```

**Vier Pflicht-Eigenschaften:**
1. Build läuft NICHT auf Prod-Server. Das schließt den self-hosted Runner `voltfair-server` ein (lebt auf maxone-prod) — `runs-on: self-hosted` + `docker build` = Build auf Prod = **FAIL**.
2. Artefakt ist ein vollständiges Docker-Image mit `image:`-Tag.
3. Zero-Downtime via Blue/Green.
4. Pipeline als GitHub-Actions-Workflow versioniert unter `.github/workflows/deploy.yml`.

**Workflow-Skelett** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest   # PFLICHT: nie self-hosted für Build-Jobs
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v5
      - uses: docker/setup-buildx-action@v3
      - name: Build image
        run: |
          docker build --build-arg BUILD_ID="${GITHUB_SHA::8}" \
            -t <projekt>-app:${{ github.sha }} .
          docker tag <projekt>-app:${{ github.sha }} <projekt>-app:latest
      - name: Transfer to maxone-prod
        run: |
          docker save <projekt>-app:latest | gzip | \
            ssh -i ~/.ssh/maxone-prod root@128.140.40.235 "gunzip | docker load"
      - name: Deploy inactive slot
        run: ssh ... "cd /opt/<projekt> && COMPOSE_PROFILES=$TARGET docker compose up -d --no-build"
      - name: Wait for healthy + Warmup + Swap
        run: ssh ... "./deploy.sh $TARGET"
```

**Rollback:** der alte Slot bleibt 5 min nach Swap — Label-Switch ohne neuen Deploy.

**Manuelle Deploys** nur bei CI-Ausfall + Sicherheits-Fix + Vorab-Ankündigung an Max. Laufen ebenfalls via `docker save | ssh | docker load` vom Lokalrechner — niemals `docker build` auf Prod.

---

## D — Post-Deploy Warmup

Zwischen "neuer Slot ist healthy" und "Traefik swappt Traffic" MUSS ein Warmup-Schritt laufen, der die wichtigsten öffentlichen Routen einmal pre-rendert.

**Pflicht-Muster in `deploy.sh`:**

```bash
# Sofort nach docker compose up -d: vom Traefik-Netz trennen
docker network disconnect coolify "${PROJEKT}-app-$NEXT" 2>/dev/null || true

# Nach Health-Check OK: Prewarm intern
PREWARM_PATHS=("/" "/login" "/registrierung" "/impressum" "/api/health")
for path in "${PREWARM_PATHS[@]}"; do
  docker exec "$CONTAINER" node -e \
    "fetch('http://localhost:3000${path}').catch(()=>{})" 2>/dev/null &
done
wait

# Erst JETZT: Traefik verbinden
docker network connect coolify "${PROJEKT}-app-$NEXT"
sleep 3
```

**Warum Traefik-Trennung:** ohne `disconnect` routet Traefik automatisch sobald der Health-Check positiv ist — vor dem Prewarm. Der erste User sieht Cold-Start (1–8 s "weiße Seite"). Vorfall: stadtlahnflow.de 2026-05-12.

**Nicht Pflicht für:** `deploy: single` (Cold-Start unvermeidbar → Migration auf Blue/Green ist die richtige Antwort), Static-Sites ohne SSR (`warmup_required: false` in Registry), Infra-Container (`tags: infra`): WARN statt FAIL.

---

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live`:

1. **Blue/Green:** `registry/projects.yml` → `deploy: blue-green`; beide Container `<projekt>-app-blue` + `-green` existieren; `healthcheck:`-Block in Compose
2. **Kein Prod-Build:** `image:` gesetzt (nicht nur `build:`); `.github/workflows/` kein `runs-on: self-hosted` + `docker build` im selben Job
3. **Pipeline:** `.github/workflows/deploy.yml` existiert; `runs-on: ubuntu-latest` + `docker save` + SSH-Image-Transfer; `docker-compose.yml` hat `image:`, `healthcheck:`, `mem_limit:`, `env_file:`
4. **Warmup:** `deploy.sh` existiert; Warmup-Pattern erkennbar (`prewarm`, `warmup`, `docker exec ... fetch`) vor Traefik-Swap

FAIL = Workflow fehlt / Antipattern `runs-on: self-hosted` + `docker build` / kein `deploy.sh` bei Blue/Green-Projekt.
