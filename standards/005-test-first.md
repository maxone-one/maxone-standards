# 005 â€” Test-First: Smoke + Unit vor "ist live"

**Status:** active
**Seit:** 2026-04-17 (User-Direktive)
**Gilt fÃ¼r:** alle Projekte mit User-Traffic

## Regel

Bevor jemand "ist live" / "funktioniert" / "fertig deployed" sagt, muss die
Teststrecke selbst durchlaufen sein. Nicht den User testen lassen. MindestÂ­
abdeckung pro Projekt: Smoke-Tests (HTTP-Checks aller kritischen Endpoints)
+ Unit-Tests (Business-Logik mit Golden-Reference-Daten).


**Hartes Stop-Kriterium (verbindlich):**
- Nicht bei lokal gruenem Build/Test stoppen.
- Abschluss erst nach erfolgreichem Smoke-Test auf **Production**.
- Ohne erfolgreichen Production-Smoke-Test darf kein Status als
  "live", "fertig deployed" oder "done" kommuniziert werden.
## Warum

Mehrfach wurde "live" gemeldet, wÃ¤hrend etwas kaputt war (Vector-Chat weg,
Widget alte URLs, 12.196-kWh-Bug bei SolarProof). Jeder dieser FÃ¤lle wÃ¤re
durch einen 30-Sekunden-Smoke-Test sofort aufgefallen. User hat das explizit
angemahnt.

## Wie anwenden

**Pattern (`test/smoke.mjs` + `test/units.mjs` + `npm test`):**
- Smoke: Post-deploy HTTP-Checks. Native `fetch`, keine Dependencies.
  Endpoints: Site, Widget, Chat, CORS, Supabase, Health.
- Unit: Business-Logik mit echten User-Szenarien als Golden-Reference
  (z.B. Roberts SENEC-CSV bei SolarProof).
- Production-Smoke ist Pflicht-Gate fuer Abschlusskommunikation:
  1. Deploy
  2. Smoke gegen Production-URL(s)
  3. Erst dann "live"/"fertig" melden
- `TESTING.md` im Projekt: was abgedeckt ist, was NICHT (Grenzen klar
  benennen).
- ENV-Overrides fÃ¼r Staging: `SITE=...` etc.

**Erweiterung:** Jeder User-gemeldete Bug â†’ Test, der ihn reproduziert,
VOR dem Fix. Sonst Regression-Garantie verloren.

## Status pro Projekt

| Projekt | Smoke | Unit | TESTING.md |
|---------|-------|------|------------|
| pv-analyse-pro / SolarProof | âœ… 11 | âœ… 13 | âœ… |
| zync / Growee | âœ… 4 | behavior | âœ… |
| maxone.one | âŒ | âŒ | âŒ |
| stadtlahnflow.de | âŒ | âŒ | âŒ |
| snapflow.one | âŒ | âŒ | âŒ |
| vanfree | âŒ | âŒ | âŒ |
| repivot.me | âŒ | âŒ | âŒ |
| katchi | âŒ | âŒ | âŒ |
| kitchen-station | âŒ | âŒ | âŒ |
| plansey | âŒ | âŒ | âŒ |
| vector-chat | (Ã¼ber SolarProof) | â€“ | â€“ |
| vector | health-internal | â€“ | âŒ |

â†’ Bei nÃ¤chster Deploy-Arbeit am Projekt: Teststrecke nachholen.

## Audit

`scripts/audit.mjs` prÃ¼ft pro Projekt:
- Existenz `test/smoke.mjs` und `TESTING.md`
- `package.json`: `scripts.test` definiert
