# 002 — Niemals Docker-Builds auf Produktions-Servern

**Status:** active
**Seit:** 2026-04-22 (User-Direktive)
**Gilt für:** alle Server, ausnahmslos

## Regel

Docker-Images werden NIE auf Produktions-Servern gebaut. Build erfolgt
entweder lokal (Max' 32-GB-Maschine) oder im GitHub-Actions-Runner. Der
Server bekommt nur fertige Images via `docker save | gzip | ssh ... | docker load`.

## Warum

Next.js-/Vite-Builds verbrauchen 4–8 GB RAM. Auf einem Prod-Server, der
gleichzeitig 10+ andere Container betreibt, führt das zu OOM und friert die
ganze Maschine ein → Downtime für ALLE Projekte. Genau das ist mehrfach
passiert, darum ist die Regel hart und ausnahmslos.

## Wie anwenden

**Erlaubte Befehle auf Prod:**
- `docker compose up -d` (ohne `--build`!)
- `docker load < image.tar`
- `docker compose restart`
- `docker image prune -f`

**Verbotene Befehle auf Prod:**
- `docker compose up --build` ❌
- `docker build .` ❌
- `npm run build` / `next build` ❌ (außer in Container mit `mem_limit`)
- `docker compose build` ❌

**docker-compose.yml Pflichtfelder:**
```yaml
services:
  app:
    image: <projektname>-app:latest   # Server nutzt vorgebautes Image
    build:                             # Nur lokal/CI
      context: .
```

## Audit

`scripts/audit.mjs` prüft:
- `docker-compose.yml`: `image:` ist gesetzt (nicht nur `build:`)
- `.github/workflows/`: Build läuft auf GitHub-Runner, nicht via SSH-Build-Step
