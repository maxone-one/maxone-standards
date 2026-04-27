# 005 — Test-First: Smoke + Unit vor "ist live"

**Status:** active
**Seit:** 2026-04-17 (User-Direktive)
**Gilt für:** alle Projekte mit User-Traffic

## Regel

Bevor jemand "ist live" / "funktioniert" / "fertig deployed" sagt, muss die
Teststrecke selbst durchlaufen sein. Nicht den User testen lassen. Mindest­
abdeckung pro Projekt: Smoke-Tests (HTTP-Checks aller kritischen Endpoints)
+ Unit-Tests (Business-Logik mit Golden-Reference-Daten).

## Warum

Mehrfach wurde "live" gemeldet, während etwas kaputt war (Vector-Chat weg,
Widget alte URLs, 12.196-kWh-Bug bei SolarProof). Jeder dieser Fälle wäre
durch einen 30-Sekunden-Smoke-Test sofort aufgefallen. User hat das explizit
angemahnt.

## Wie anwenden

**Pattern (`test/smoke.mjs` + `test/units.mjs` + `npm test`):**
- Smoke: Post-deploy HTTP-Checks. Native `fetch`, keine Dependencies.
  Endpoints: Site, Widget, Chat, CORS, Supabase, Health.
- Unit: Business-Logik mit echten User-Szenarien als Golden-Reference
  (z.B. Roberts SENEC-CSV bei SolarProof).
- `TESTING.md` im Projekt: was abgedeckt ist, was NICHT (Grenzen klar
  benennen).
- ENV-Overrides für Staging: `SITE=...` etc.

**Erweiterung:** Jeder User-gemeldete Bug → Test, der ihn reproduziert,
VOR dem Fix. Sonst Regression-Garantie verloren.

## Status pro Projekt

| Projekt | Smoke | Unit | TESTING.md |
|---------|-------|------|------------|
| pv-analyse-pro / SolarProof | ✅ 11 | ✅ 13 | ✅ |
| zync / Growee | ✅ 4 | behavior | ✅ |
| maxone.one | ❌ | ❌ | ❌ |
| stadtlahnflow.de | ❌ | ❌ | ❌ |
| snapflow.one | ❌ | ❌ | ❌ |
| vanfree | ❌ | ❌ | ❌ |
| repivot.me | ❌ | ❌ | ❌ |
| katchi | ❌ | ❌ | ❌ |
| kitchen-station | ❌ | ❌ | ❌ |
| plansey | ❌ | ❌ | ❌ |
| vector-chat | (über SolarProof) | – | – |
| vector | health-internal | – | ❌ |

→ Bei nächster Deploy-Arbeit am Projekt: Teststrecke nachholen.

## Audit

`scripts/audit.mjs` prüft pro Projekt:
- Existenz `test/smoke.mjs` und `TESTING.md`
- `package.json`: `scripts.test` definiert
