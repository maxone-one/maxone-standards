# 033 — Post-Deploy Warm-Up (Pre-Hit der Routes vor Traefik-Swap)

**Status:** active
**Seit:** 2026-04-29 (User-Direktive nach SLF/Viktoria-From-Vorbild)
**Gilt für:** alle Projekte mit `deploy: blue-green` und (sekundär) alle
SSR-Container mit Cold-Start-Latenz > 1 s.

## Regel

Zwischen "neuer Slot ist healthy" und "Traefik swappt Traffic" MUSS ein
expliziter Warm-Up-Schritt laufen, der die wichtigsten öffentlichen
Routen des neuen Containers ein Mal vor-rendert. Ziel: der **erste echte
User-Request** trifft niemals einen kalten SSR-Cache.

```
build → ship → start NEXT slot → healthcheck OK
   → ★ WARM-UP (pre-hit alle Public-Routes intern) ★
   → Traefik-Swap → alter Slot wartet 5 min als Rollback
```

Drei Pflicht-Eigenschaften:

1. **Vor dem Swap, nicht danach.** Warm-Up läuft, solange Traffic noch
   auf dem alten Slot liegt — sonst sieht der erste User die Cold-Start-
   Latenz.
2. **Intern, nicht extern.** Warm-Up trifft den Container über sein
   internes Netzwerk (`docker exec ... fetch http://localhost:<port>/...`
   oder `wget` aus einem Sidecar) — nicht über die öffentliche Domain.
   Sonst läuft der Request über Traefik und landet wieder auf dem alten
   Slot.
3. **Vollständige Liste der heißen Routen.** Mindestens: `/`, alle
   Top-Level-Marketing-Pfade, alle Auth-Gates (`/login`, `/registrierung`).
   Nice-to-have: API-Health, Sitemap-Top-10. Faustregel: jede Route, die
   im ersten Klick eines neuen Users vorkommen kann.

## Warum

Next.js (und SvelteKit, Remix, Nuxt) bauen pro Route beim ersten Treffer
einen On-Demand-SSR-Cache auf. Beim Erstrender einer Route in einem
frischen Container braucht Node:

- ~ 200–800 ms für einfache Marketing-Pages
- ~ 1–3 s für Routen mit Datenbank-Hydration (Supabase, Prisma)
- ~ 3–8 s für Routen mit externer API-Aggregation (Stripe, Brevo)

Ohne Warm-Up trifft genau dieser Erst-Request einen echten User direkt
nach dem Traefik-Swap. Effekt: Dashboard-User erlebt 5 s "weiße Seite",
der Marketing-Visitor bricht ab. Das passierte vor diesem Standard
mehrfach bei SLF (Mitglieder-Dashboard nach Deploy), Viktoria From
(Galerie-Cold-Start) und maxone.one (Brand-Page).

Die SLF-Lehre vom 2026-04-15: Health-Check sagt "200 auf /api/health"
— das beweist nur, dass der Node-Prozess läuft. Es beweist NICHT, dass
die App-Routen kompiliert und gerendert sind. Health-Check + Warm-Up
gemeinsam liefern das Versprechen "User merkt nichts vom Deploy".

## Wie anwenden

### Pattern 1 — Bash-Loop in `deploy.sh` (Empfohlen, SLF-Vorbild)

```bash
# Nach Health-Check OK, vor Traefik-Swap:
echo "▸ Prewarming $NEXT (alle Public-Routen)..."
PREWARM_PATHS=(
  "/" "/login" "/registrierung" "/preise" "/features"
  "/impressum" "/datenschutz" "/api/health"
  # ... projektspezifische Routes
)
PREWARM_COUNT=0
for path in "${PREWARM_PATHS[@]}"; do
  docker exec "$CONTAINER" node -e \
    "fetch('http://localhost:3000${path}').catch(()=>{})" 2>/dev/null &
  PREWARM_COUNT=$((PREWARM_COUNT + 1))
  # 10 parallele Requests, dann warten
  if [ $((PREWARM_COUNT % 10)) -eq 0 ]; then wait; fi
done
wait
echo "  ✓ Prewarm complete ($PREWARM_COUNT pages)"

# Erst JETZT: Traefik-Swap
```

Vorteile:
- Lebt neben den anderen Deploy-Steps in `deploy.sh`
- Kein Extra-Tool, nur `docker exec` + `node fetch` (in Node-Image vorhanden)
- Parallel-Batch von 10 → kompletter Warm-Up in < 5 s

### Pattern 2 — Workflow-Step (Wenn `deploy.sh` nicht existiert)

Wenn der Workflow direkt `docker compose up -d` macht ohne deploy.sh-
Wrapper, dann den Warm-Up als eigenen Workflow-Step:

```yaml
- name: Warm-up new slot before swap
  run: |
    PATHS=(/ /login /api/health)
    for p in "${PATHS[@]}"; do
      ssh -i ~/.ssh/maxone-prod root@128.140.40.235 \
        "docker exec <projekt>-app-${{ steps.slot.outputs.target }} \
         node -e \"fetch('http://localhost:3000${p}').catch(()=>{})\"" &
    done
    wait
```

### Pattern 3 — Sidecar-Warmer (für nicht-Node-Images)

Falls das App-Image kein Node mitbringt (z.B. Go, Python ohne curl):

```bash
docker run --rm --network <projekt>_default curlimages/curl:8.10.0 \
  sh -c 'for p in / /api/health; do curl -s -o /dev/null \
   "http://<projekt>-app-NEXT:3000$p"; done'
```

### Routenliste pflegen

Eine Datei im Repo, z.B. `deploy/prewarm-routes.txt` oder ein Block im
`deploy.sh` selbst. Pflege im PR-Review: neue öffentliche Route → Eintrag
in der Liste hinzufügen. Audit-Hook (siehe unten) prüft NICHT die
Vollständigkeit — das bleibt Code-Review-Verantwortung.

### Single-Container-Projekte

Standard 033 ist **nicht** Pflicht für `deploy: single` (vanfree, plansey,
voltfair, kitchen-station). Bei Single-Container ist Cold-Start sowieso
unvermeidbar (Container restartet → kurze Downtime). Dort ist die richtige
Antwort: Migration auf Blue/Green (Standard 001), nicht Warm-Up auf
Single-Slot.

## Was diese Regel NICHT erzwingt

- **Welche konkreten Routen** — Projekt-Entscheidung (siehe oben)
- **Welcher HTTP-Client** (`fetch` in Node, `curl`, `wget`) — egal,
  Hauptsache intern
- **Sequenziell vs. parallel** — beides OK, parallel ist schneller
- **Antwort-Validierung** — Warm-Up ist Cache-Aufwärmen, keine
  funktionale Prüfung. Healthcheck ist die funktionale Prüfung.

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `deploy: blue-green`:

1. **`deploy.sh` auf dem Server** (`<path_server>/deploy.sh`) existiert
   — FAIL wenn nicht (Blue/Green ohne Deploy-Skript = manueller Swap =
   kein Warm-Up).
2. **Warm-Up-Pattern in `deploy.sh`** — Heuristik: Datei enthält eines
   von `prewarm`, `warm-up`, `warmup` ODER eine Schleife `for ... in
   PREWARM_PATHS` ODER `docker exec ... fetch`/`curl http://localhost`
   in einer Schleife. WARN wenn keines davon erkennbar.
3. **Warm-Up läuft VOR dem Traefik-Swap** — Heuristik: das Warm-Up-
   Pattern erscheint im Skript zeilenmäßig vor `traefik.enable=true`,
   `swap.sh`, oder `.active-slot`-Update. WARN wenn umgekehrt.

PASS = `deploy.sh` vorhanden + Warm-Up-Pattern erkennbar + vor Swap.
WARN = `deploy.sh` vorhanden, aber Pattern fehlt oder ist nach dem Swap.
FAIL = `deploy: blue-green` aber kein `deploy.sh` auf dem Server.

## Ausnahmen

- **`deploy: single`** — Standard nicht relevant (siehe oben).
- **Static-Site-Projekte** (z.B. ein reines Next-static-export) — Warm-
  Up unnötig, weil keine SSR. In `registry/projects.yml` als
  `warmup_required: false` markieren.
- **Infrastruktur-Container** (`tags: infra` UND `deploy: blue-green`)
  — z.B. `vector`. Warm-Up wäre sinnvoll, ist aber nicht
  user-experience-kritisch (kein End-User-Frontend). WARN, nicht FAIL,
  wenn Pattern fehlt.
