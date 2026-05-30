# 021 — Projekt-Koordination (Spec-Archiv · Dep-Currency · Cross-Project-Broadcast)

**Status:** active
**Seit:** 2026-05-04 (Spec-Archiv), 2026-05-11 (Dep-Currency + Broadcast)
**Gilt für:** alle Projekte mit Phasen/Sprints und allen aktiven Projekten im maxone-Universum

## Inhalt

- [A] Spec-Archiv: PRD/TODO/DONE-Lifecycle
- [B] Tech-Stack-Currency: Dependencies aktuell halten
- [C] Cross-Project Incident Broadcast (CPIB)

---

## A — Spec-Archiv

Jede Phase besteht aus drei Dateien, nie einer:
- `PRD.md` — Spezifikation (was/warum/wie)
- `TODO.md` — offene Items (kontinuierlich → DONE.md)
- `DONE.md` — append-only Log mit Sign-Off

**Pfad:** `docs/phases/<phase-name>/` oder `briefings/<phase-name>/`

**Abschluss:** wenn TODO.md leer + Sign-Off in DONE.md → alles nach `docs/archive/<phase>/`, Stub `DEPRECATED.md` mit Forward-Pointer am ursprünglichen Pfad.

**Drei Kategorien für Arbeit außerhalb aktiver Phasen:**
- **A** — Mid-Phase Scope-Add (in TODO.md mit Tag `[scope-add — YYYY-MM-DD]`)
- **B** — Post-Completion Feature (eigene Mini-Phase, wenn > 1h oder Sign-Off nötig)
- **C** — Micro-Maintenance (< 1h, in `LIVING.md` im Repo-Root, append-only, jährlich rotieren)

**Cross-Repo Mirror:** `maxone-one/specs-archive` synct alle `docs/archive/**` via systemd-timer auf maxone-prod alle 60s. Schreibrichtung nur Projekt → Mirror.

**Warum:** Token-Ökonomie (eine wachsende PRD = 500+ Zeilen, Claude lädt alles; drei Dateien = Claude lädt nur TODO.md ~50 Zeilen), Repo-Verwahrlosung, lebenslange Projekte ohne Schema.

---

## B — Tech-Stack-Currency

Dependency-Drift wird proaktiv gepflegt. Pflicht-Kadenz:

- **Patch + Minor: alle 4–6 Wochen** — `npm update` in einem PR. Bei grünem `tsc` + Build + Tests → merge + deploy ohne Rückfrage.
- **Major-Bumps: einzeln** — pro Paket eigener PR, CHANGELOG lesen, Reihenfolge: Build-Tools (vite, typescript) vor Lint-Tools vor App-Libraries.
- **Security-Fix (npm audit high/critical):** separater PR, nicht im Feature-Branch parken.

**Sweep starten:**
```bash
git pull --rebase
npm outdated        # was ist Drift?
npm audit           # was ist sicherheitsrelevant?
```

Wenn `npm outdated` > 5 Patch/Minor oder Repo > 6 Wochen ohne Sweep: **erst Sweep, dann Feature**.

**Unfixbare Pakete** (vom Registry entfernt): Migration planen — `xlsx` → `exceljs`/papaparse, `request` → native `fetch`, `moment` → `date-fns`.

**Pausierte Projekte:** mindestens 1× pro Quartal `npm outdated` + `npm audit` Snapshot. Bei Vulns: Sweep auch im pausierten State.

**Skip-Bedingungen:** `status: sunset`, archive-only Mirror, kein Lockfile.

**Warum:** Erzwungener Notfall-Major (Sicherheitslücke in v3, Fix in v5, wer sweept war auf v5), unfixbare Pakete (xlsx 2024 vom Registry entfernt), Stack-Whitelist-Drift.

---

## C — Cross-Project Incident Broadcast (CPIB)

Sobald ein Fehler oder eine Änderung mehr als ein Projekt betrifft, MUSS innerhalb der laufenden Session eine Broadcast-Datei angelegt werden:

```
maxone-standards/broadcasts/BCAST-YYYY-MM-DD-<slug>.md
```

**Zwei Typen:** Incident Broadcast (reaktiv) · Change Notice (proaktiv, vor Deployment).

**Format:**
```markdown
# BCAST-YYYY-MM-DD-<slug>

**Typ:** incident | change-notice
**Status:** open
**Verursachend:** <projektname>

## Was ist passiert / Was ändert sich
## Fehlermuster (reproduzierbar)
## Betroffene Projekte
| Projekt | Status | Fix-Commit | Gelöst am |
|---|---|---|---|

## Fix-Muster
## Audit-Grep-Pattern (Pflicht)
**Fail-Grep:** <regex>
```

**Abschluss:** alle Projekte in Tabelle auf `resolved` → Status → `closed` (Datei bleibt als Archiv).

**Auflösung pro Projekt:**
```
fix(<projekt>): resolve BCAST-YYYY-MM-DD-<slug>
```

**Warum:** Drift entsteht wenn Änderung in A still B–N bricht. Vorfall 2026-04-22: `maxone.studio`→`maxone.one`-Wechsel, hardkodierte Studio-URLs in mehreren Projekten, Entdeckung Wochen später.

---

## Audit

**Spec-Archiv:** Orphan-PRDs (`*.md` mit `PRD-` im Namen außerhalb Archive-Pfaden) → WARN; drei-Datei-Konsistenz in Phasen-Ordnern → fehlt eine → WARN; DEPRECATED-Forward-Pointer → fehlt → WARN.

**Dep-Currency:** `npm outdated` > 20 Patch/Minor → WARN; > 50 → FAIL; `npm audit` high/critical mit Fix → WARN; letzter Sweep > 90 Tage → WARN.

**CPIB:** offener Broadcast mit Projekt in Tabelle als `open` → **FAIL**; Broadcast > 30 Tage offen → FAIL; Fail-Grep-Pattern trifft auf Projekt-Code → FAIL.
