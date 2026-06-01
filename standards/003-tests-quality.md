# 003: Tests & Code-Qualität (Test-First · Code-Health-Budget)

**Status:** active
**Seit:** 2026-04-17 (Test-First), 2026-04-28 (Code-Health)
**Gilt für:** alle Projekte mit User-Traffic und eigenem Code-Repo

## Inhalt

- [A] Test-First: Smoke + Unit vor "ist live"
- [B] Code-Health-Budget: Refactoring + Duplikations-Kontrolle

---

## A: Test-First

Bevor jemand "ist live" / "funktioniert" / "fertig deployed" sagt, muss die Teststrecke selbst durchlaufen sein. **Nicht den User testen lassen.**

**Hartes Stop-Kriterium:** Abschluss erst nach erfolgreichem Smoke-Test auf Production. Kein "lokal grün = fertig".

**Mindest-Abdeckung pro Projekt:**
- **Smoke-Tests** (`test/smoke.mjs`): HTTP-Checks aller kritischen Endpoints. Native `fetch`, keine Dependencies.
- **Unit-Tests** (`test/units.mjs`): Business-Logik mit Golden-Reference-Daten.
- **TESTING.md**: was abgedeckt ist, was NICHT (Grenzen klar benennen).

**Reihenfolge:** 1. Deploy → 2. Smoke gegen Production-URL → 3. erst dann "live" melden.

**Bug-Regression:** Jeder User-gemeldete Bug → Test der ihn reproduziert, VOR dem Fix. Sonst keine Regression-Garantie.

**Playwright** (Pflicht bei UI/Layout/Optik): `mcp__playwright__browser_*`. Nach jeder Session `browser_close` aufrufen, sonst blockiert der Browser andere Projekte.

---

## B: Code-Health-Budget

Pro Quartal pro Projekt: **mindestens 15 % der Commits** sind Refactoring oder Duplikations-Reduktion (`refactor:`/`test:`-Präfix in Conventional Commits).

**Limits:**
- Duplikation < 5 % (gemessen mit `jscpd`, 10-Token-Mindestlänge, JS/TS/Python)
- Keine Funktion > 100 Zeilen ohne `// HEALTH-EXEMPT: <Begründung>`
- Keine Quelldatei > 500 Zeilen ohne Split-Plan in HANDOFF.md

**Warum:** GitClear-Studie 2024-2026: KI-Codebases haben Refactoring-Anteil von < 10 % (war 25 % ohne KI) und 4× mehr Duplikation. CodeRabbit: KI-co-authored Code hat 2,74× mehr Security-Findings. Tech-Debt ist Security-Debt mit Verzögerung.

**Quartalsauswertung:**

```bash
# Refactoring-Anteil
git log --since="3 months ago" --pretty=format:"%s" | wc -l > total.txt
git log --since="3 months ago" --pretty=format:"%s" | \
  grep -E "^refactor(\(|:)|^test(\(|:)|^chore.*rename" | wc -l > refactor.txt

# Duplikations-Scan
npx jscpd --min-tokens 50 --reporters json --output ./jscpd-report ./src
```

**Bei Verstoß:** Refactoring-Sprint in HANDOFF.md einplanen, jscpd-Top-3-Hotspots priorisieren, überlange Dateien/Funktionen aufteilen oder `HEALTH-EXEMPT` setzen.

**HANDOFF.md Code-Health-Sektion** (Best-Practice):
```markdown
## Code-Health (Standard 003-B)
- Black-Box-Anteil (KI-generiert): ~25 %
- Refactoring-Anteil letztes Quartal: 18 %
- Duplikations-Score (jscpd): 3,4 %
- Längste Funktion: 87 Zeilen
- Größte Datei: 412 Zeilen
```

---

## Audit

`scripts/audit.mjs` prüft pro Projekt:

**Test-First:**
- Existenz `test/smoke.mjs` und `TESTING.md`
- `package.json`: `scripts.test` definiert

**Code-Health:**
- Refactoring-Anteil letztes Quartal via `git log`: < 15 % → WARN, < 8 % → FAIL
- Datei-Längen-Scan über `src/`: > 500 Zeilen → WARN, > 1000 Zeilen → FAIL
- Funktions-Längen-Scan (JS/TS Regex): > 100 Zeilen → WARN, > 200 Zeilen → FAIL
- `// HEALTH-EXEMPT:`-Kommentar in vorausgehenden 3 Zeilen → SKIP

`jscpd`-Lauf als separater Cron, Audit prüft nur ob aktueller Report unter `audits/jscpd-<projekt>-<quartal>.json` existiert.

**Ausnahmen** (`code_health: exempt`): reine Konfig-/Doku-Repos, generierter Code (Protobuf, OpenAPI-Clients), Vendor-Code-Re-Hosting.
