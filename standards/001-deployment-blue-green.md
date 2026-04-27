# 001 — Blue/Green Deployment

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle Live-Projekte (eigene + Kunden)

## Regel

Jedes Live-Projekt deployed im Blue/Green-Pattern. Der alte Slot bleibt aktiv,
bis der neue Slot vom Health-Check als healthy erkannt wird. Erst dann swappt
Traefik. Kein Single-Container-Restart in Produktion.

## Warum

Bei Single-Container-Deploys gibt es einen Downtime-Spike beim Restart, und
wenn der neue Container einen Bootfehler hat, ist die Site komplett offline
bis ein Mensch reagiert. Bei 11+ Projekten ist das mehrfach vorgekommen —
darum ist der Standard ab sofort Blue/Green.

## Wie anwenden

- `templates/docker-compose.blue-green.yml` als Skelett kopieren
- Container-Naming: `<projekt>-app-blue`, `<projekt>-app-green`
- Traefik-Labels mit dynamischem Service-Switch (siehe Template)
- Health-Check in `docker-compose.yml` mit `start_period: 30s`
- Deploy-Workflow swappt nur, wenn neuer Slot healthy

## Audit

`scripts/audit.mjs` prüft:
- `registry/projects.yml`: `deploy: blue-green` für alle `status: live`
- Auf dem Server: existieren beide Container `<projekt>-app-blue` UND `-green`?
- `docker-compose.yml` enthält `healthcheck:`-Block

## Ausnahmen

`deploy: single` ist nur erlaubt für:
- Interne Tools ohne externen Traffic
- Projekte mit `status: dev`

Aktuell als Ausnahme dokumentiert in `registry/projects.yml`:
- `vanfree` (Phase-2 pending), `plansey`, `kitchen-station`, `voltfair`
