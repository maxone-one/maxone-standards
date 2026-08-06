# 049 — CI Build Cache (Docker BuildKit + GitHub Actions Cache)

**Status:** active
**Seit:** 2026-05-18
**Gilt für:** alle Projekte mit Dockerfile + GitHub Actions Deploy-Workflow

## Regel

Jeder `docker build`-Step in GitHub Actions **muss** Docker BuildKit mit dem
GitHub-internen Cache-Backend verwenden:

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Build Docker image
  run: |
    docker buildx build \
      --cache-from type=gha \
      --cache-to   type=gha,mode=max \
      ... # bestehende --build-arg Zeilen bleiben unverändert
      -t <image>:latest \
      .
```

Kein `docker build` ohne `--cache-from type=gha`. Kein `docker buildx build`
ohne `--cache-to type=gha,mode=max`.

## Warum

GitHub Actions startet jeden CI-Run auf einer frischen Ubuntu-VM — kein
lokaler Docker-Layer-Cache, keine `node_modules`, kein Compiler-Cache.
Das bedeutet: `npm ci` (~2 Min.) und `next build` (~8 Min.) laufen bei
jedem Commit komplett neu, selbst wenn sich nur eine Zeile geändert hat.

Mit BuildKit + GHA-Cache-Backend werden Layer-Hashes in den GitHub-internen
Cache-Store serialisiert. Beim nächsten Run lädt BuildKit den Cache zurück
und überspringt unveränderte Layers. Bei reinen Content-Änderungen (Texte,
Bilder, CSS) springt der Build direkt zum letzten Webpack-Checkpoint.

**Erwartete Einsparungen pro Run (Next.js-Projekte):**

| Änderungstyp | Ohne Cache | Mit Cache |
|---|---|---|
| Nur Code/Content | ~12 Min. | ~5 Min. |
| Neue npm-Abhängigkeit | ~12 Min. | ~10 Min. |
| Erstes Run (kein Cache) | ~12 Min. | ~12 Min. |

## Voraussetzung: Dockerfile-Layer-Reihenfolge

Der Cache funktioniert nur, wenn die Layer-Reihenfolge im Dockerfile stimmt.
Dependency-Installation **muss** vor dem Code-Copy stehen:

```dockerfile
# Richtig — deps-Layer wird gecacht solange package.json unverändert:
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Falsch — jede Code-Änderung invalidiert auch npm ci:
COPY . .
RUN npm ci && npm run build
```

## Tech-Stack-Tabelle

Der Workflow-Snippet ist identisch für alle Stacks. Was sich unterscheidet
ist die Dockerfile-Struktur:

| Stack | Deps-Layer trennen mit | Build-Cache-Pfad |
|---|---|---|
| Next.js / Node | `COPY package*.json ./` + `RUN npm ci` | `.next/cache` (automatisch via BuildKit) |
| Python | `COPY requirements.txt ./` + `RUN pip install` | pip-Wheels (automatisch via BuildKit) |
| Go | `COPY go.mod go.sum ./` + `RUN go mod download` | Go-Module (automatisch via BuildKit) |
| Java / Maven | `COPY pom.xml ./` + `RUN mvn dependency:go-offline` | `.m2`-Repository |
| Ruby | `COPY Gemfile* ./` + `RUN bundle install` | Bundler-Cache |

Alle aktiven maxone-Projekte sind Node/Next.js — die Tabelle ist für
externe Übergaben gedacht.

## Minimales Beispiel (vollständig)

```yaml
name: Deploy App

on:
  push:
    branches: ['**']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - name: Set up Docker Buildx          # NEU gegenüber altem Standard
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        run: |
          docker buildx build \
            --cache-from type=gha \         # NEU
            --cache-to   type=gha,mode=max \ # NEU
            --build-arg NEXT_PUBLIC_SUPABASE_URL="${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}" \
            --build-arg BUILD_ID="${GITHUB_SHA::8}" \
            -t myapp:latest \
            .
```

Die drei neuen Zeilen sind die einzige Änderung gegenüber einer bestehenden
Pipeline, die Standard 027 bereits erfüllt.

## Audit-Check

`scripts/audit.mjs` prüft für jedes Repo mit `Dockerfile`:

1. Existiert ein `deploy-*.yml` oder `deploy.yml` in `.github/workflows/`?
2. Enthält der Workflow `setup-buildx-action`?
3. Enthält der Build-Step `--cache-from type=gha`?
4. Enthält der Build-Step `--cache-to type=gha`?
5. Steht im Dockerfile `COPY package*.json` (oder äquivalent für den
   jeweiligen Stack) **vor** `COPY . .`?

Alle fünf Checks müssen grün sein. Fehlende Checks = Audit-Fehler.

## Abgrenzung zu anderen Standards

- **002 (no-build-on-prod):** Unverändert. Der Build läuft weiterhin auf
  `ubuntu-latest`, nie auf dem Prod-Server.
- **027 (deploy-pipeline):** Dieser Standard ergänzt 027. Der
  `docker buildx build`-Step ersetzt `docker build`, der Rest der Pipeline
  bleibt identisch.
- **033 (post-deploy-warmup):** Unverändert. Warmup läuft nach dem Deploy,
  unabhängig vom Build-Mechanismus.

## Übergabe-Kurzfassung (für Dritte)

> **Problem:** Jeder CI-Run startet auf einer leeren VM. `npm ci` und
> `next build` laufen bei jedem Commit komplett neu, auch wenn sich nur
> eine Zeile geändert hat.
>
> **Lösung:** Zwei Steps im Workflow anpassen — `setup-buildx-action`
> hinzufügen und `docker build` durch `docker buildx build --cache-from
> type=gha --cache-to type=gha,mode=max` ersetzen. Kein Dockerfile-Umbau
> nötig, solange die Layer-Reihenfolge stimmt (deps vor Code-Copy).
>
> **Gilt für:** jedes Repo mit `Dockerfile` + GitHub Actions Deploy.
> Einmaliger Aufwand pro Projekt: ~5 Minuten.
