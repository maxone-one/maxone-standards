# 042 — Version-Marker (ENV + /api/version + Footer-Banner)

**Status:** active
**Seit:** 2026-05-17
**Gilt für:** alle Customer-facing Projekte mit `deploy: blue-green` oder
`deploy: single` (also alle Web-Apps — nicht Infra-Container)

## Regel

Jedes deploybare Web-Projekt MUSS seinen aktuellen Build an drei Stellen
ausweisen:

1. **`BUILD_ID` als ENV im Container** — Short-SHA (7–8 Zeichen) des
   Commits, aus dem das Image gebaut wurde. Lesbar per
   `docker inspect <container> --format '{{range .Config.Env}}{{println .}}{{end}}' | grep BUILD_ID=`.
2. **`/api/version` Endpoint** — HTTP-Endpunkt, JSON-Antwort:
   ```json
   { "build_id": "abc1234", "deployed_at": "2026-05-17T12:34:56Z" }
   ```
3. **Sichtbarer Banner im Footer** — am Ende der Bottom-Bar (siehe
   Standard 012), z.B. `v: abc1234`. Klein, dezent, aber lesbar.
   Klick öffnet `https://github.com/maxone-one/<repo>/commit/<sha>`.

Alle drei MÜSSEN denselben Wert tragen. Drift zwischen ENV / Endpoint /
Banner heißt: Build wurde manuell überschrieben — Audit-FAIL.

## Warum

Der `Drift`-Check (Local ↔ GitHub ↔ Prod) braucht eine **maschinen-
lesbare Wahrheit** auf der Prod-Seite. Bisher gemischt: vanfree und SLF
setzen `BUILD_ID` als build-arg, maxone.one nutzt `version.json` aus
SvelteKit, andere haben gar nichts. Drift via SSH kann nicht zuverlässig
prüfen, was draußen läuft, wenn `docker inspect` mal leer kommt.

**Drei Use-Cases, drei Tiers:**

| Tier | Zweck | Konsument |
|---|---|---|
| ENV | Drift-Check via SSH | Claude, VECTOR, Cron |
| `/api/version` | Drift-Check ohne SSH, externer Probe | maxone-watchdog (Kuma), Uptime-Boards |
| Footer-Banner | Bug-Report-Begleiter | Max, Kunden, Tester |

Vorfall-Antrieb: am 2026-05-06 lief auf maxone.one ein Deploy-Bug,
bei dem Traefik beide Slots gleichzeitig routete — User sahen random
50/50 alten vs. neuen Stand. Ohne sichtbaren Banner war "welche Version
siehst du gerade?" beim Bug-Report nicht beantwortbar.

## Wie anwenden

### Build-Pipeline — BUILD_ID setzen

```yaml
# .github/workflows/deploy.yml
- name: Build image
  run: |
    docker build \
      --build-arg BUILD_ID="${GITHUB_SHA::8}" \
      -t myproj-app:latest .
```

```dockerfile
# Dockerfile
ARG BUILD_ID=dev
ENV BUILD_ID=${BUILD_ID}
# ggf. zusätzlich als Frontend-build-arg, je nach Framework (siehe unten)
```

### Per-Framework Cheat-Sheet — Endpoint + Banner

**Next.js (App Router):**
```ts
// app/api/version/route.ts
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({
    build_id: process.env.BUILD_ID ?? "dev",
    deployed_at: process.env.DEPLOYED_AT ?? new Date().toISOString(),
  });
}
```
Frontend (Client-Component oder Server-Komponente im Footer):
```tsx
<a href={`https://github.com/maxone-one/${REPO}/commit/${BUILD_ID}`}
   className="text-[11px] text-ondark/40 hover:text-ondark/70">
  v: {BUILD_ID}
</a>
```
Wenn `NEXT_PUBLIC_BUILD_ID` benötigt: zusätzlich als build-arg in
Dockerfile reichen (`ARG NEXT_PUBLIC_BUILD_ID; ENV NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}`).

**SvelteKit:**
```ts
// src/routes/api/version/+server.ts
import { json } from "@sveltejs/kit";
import { BUILD_ID } from "$env/static/private";
export const GET = () => json({
  build_id: BUILD_ID ?? "dev",
  deployed_at: new Date().toISOString(),
});
```
Footer: `{import.meta.env.PUBLIC_BUILD_ID}` (set via build-arg).

**Vite/React SPA (static nginx):**
```ts
// vite.config.ts
define: { __BUILD_ID__: JSON.stringify(process.env.BUILD_ID ?? "dev") }
```
`/version.json` wird beim Build erzeugt (kein API-Endpoint möglich — nginx
serviert nur static): `dist/version.json` → `{ "build_id": "...", "deployed_at": "..." }`.
Footer: `<span>v: {__BUILD_ID__}</span>`.

### Footer-Banner — Hide-Logik wie Standard 012

Banner wird **mit** dem Footer ausgeblendet (Admin, Dashboard, Onboarding,
Print). Der `Drift`-Check via `/api/version` funktioniert weiter — der
Banner ist nur User-Sichtbarkeit, nicht Maschinen-Wahrheit.

### Werte synchron halten

`BUILD_ID` MUSS in **einem** CI-Step gesetzt werden und an alle drei
Konsumenten weitergereicht werden:

```
${GITHUB_SHA::8}
   ├── --build-arg BUILD_ID=...        → ENV im Container
   ├── --build-arg NEXT_PUBLIC_BUILD_ID=... → Frontend-Bundle / Footer
   └── (Endpoint liest aus ENV)
```

Niemals einen Wert "manuell pflegen" — immer aus `GITHUB_SHA` ableiten.

## Was diese Regel NICHT erzwingt

- **Semantic Versioning** — Short-SHA reicht. Wer SemVer braucht
  (`v1.4.2`), kann es zusätzlich rendern, aber nicht statt SHA.
- **Banner-Position** — irgendwo im Footer, dezent, aber sichtbar. Kein
  pixel-genaues Layout-Diktat.
- **Endpoint-Pfad** — `/api/version` ist Empfehlung. Wer einen Grund
  hat, `/version`, `/__version` oder `/healthz?details=true` zu nehmen,
  darf — solange der Pfad in `registry/projects.yml` als
  `version_endpoint:` eingetragen ist, damit Watchdog/Audit ihn findet.

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `deploy: blue-green` oder
`deploy: single`:

1. **Build-Pipeline setzt `BUILD_ID`** — grep in
   `.github/workflows/*.yml` nach `BUILD_ID=` als build-arg.
   WARN wenn fehlt.

2. **Dockerfile übernimmt `BUILD_ID`** — grep nach `ARG BUILD_ID` und
   `ENV BUILD_ID`. WARN wenn fehlt.

3. **`/api/version` Endpoint liefert JSON mit `build_id`** (Live-Check) —
   `curl https://<domain>/api/version` → erwartet 200 + JSON mit Feld
   `build_id`. FAIL wenn 404, WARN wenn anders strukturiert.
   Pfad aus `registry/projects.yml:version_endpoint`, Default `/api/version`.

4. **Footer-Banner enthält `BUILD_ID`** (Live-Check) — HTML der
   Startseite enthält Pattern `v:\s*[a-f0-9]{7,8}` oder
   `Build:\s*[a-f0-9]{7,8}` oder `version:\s*[a-f0-9]{7,8}` (case-i).
   WARN wenn fehlt.

5. **Drift-Sanity** — `build_id` aus `/api/version` MUSS gleich dem
   `BUILD_ID` aus `docker inspect <container>` MUSS gleich dem Banner-
   Wert sein. FAIL bei Drift (= manueller Server-Build oder zwei Slots
   live).

## Migration

- Neue Projekte: vor `live`-Gate (Standard 013) erfüllen.
- Bestand: **bei nächstem Touch** mitziehen, nicht als Big-Bang. Reihenfolge:
  vanfree, SLF, snapflow, repivot, maxone.one (maxone.one hat schon
  `version.json` — nur Banner + Endpoint nachrüsten).
- Static-SPA-Projekte (snapflow) bekommen `/version.json` statt
  `/api/version` — Audit-Schritt 3 akzeptiert beide Pfade.

## Ausnahmen

- **Infra-Container** (`tags: infra`, z.B. `vector`, `traefik`) — kein
  Footer, daher kein Banner. ENV + Endpoint trotzdem Pflicht.
- **Admin-only Tools** (`kitchen-station`) — kein End-User-Footer, Banner
  entfällt. ENV + Endpoint trotzdem.
- **Sunset-Projekte** (`status: paused` in Registry) — Standard schläft mit.
