# 050 — Bug Registry (BUGS.md)

**Status:** active
**Seit:** 2026-05-18
**Gilt für:** alle Projekte mit status `live` oder `dev`

## Problem

Claude verliert zwischen Sessions den Kontext über bereits untersuchte Bugs.
Das führt zu:
- Dieselben fehlgeschlagenen Ansätze werden erneut versucht
- Bereits identifizierte Root Causes werden erneut gesucht
- Fixe, die regressioniert sind, werden nicht als bekanntes Muster erkannt

Ohne persistente Wissensbasis dreht Claude immer wieder dieselben Korrekturschleifen.

## Regel

Jedes Projekt mit Status `live` oder `dev` bekommt eine `BUGS.md` im Repo-Root —
eine persistente Bug-Wissensbasis. Claude liest sie vor jeder Debugging-Session
und hält sie nach jedem Schritt aktuell.

## Format

```markdown
# BUGS — <projektname>

## Aktive Bugs

### BUG-001 — <kurzer Titel>
**Status:** open | investigating
**Erstellt:** YYYY-MM-DD
**Symptom:** Was der User sieht / was kaputt ist.
**Root Cause:** (leer bis geklärt)
**Fehlgeschlagene Ansätze:**
- YYYY-MM-DD — Ansatz: <was versucht wurde> → Warum gescheitert: <Grund>
**Fix:** (leer bis gelöst)

---

## Geschlossene Bugs

### BUG-000 — <Titel>
**Status:** fixed | wont-fix
**Geschlossen:** YYYY-MM-DD
**Fix:** Was letztendlich funktioniert hat und warum.
**Fehlgeschlagene Ansätze:**
- YYYY-MM-DD — Ansatz: <was versucht wurde> → Warum gescheitert: <Grund>
```

## Pflicht-Regeln

### 1. Lesen vor jeder Debugging-Session

`BUGS.md` steht neben `HANDOFF.md` in der Pflichtlektüre beim Session-Start.
Vor dem ersten Debugging-Schritt: `BUGS.md` lesen und prüfen ob der gemeldete
Bug bereits einen Eintrag hat.

### 2. Eintrag anlegen — spätestens beim ersten fehlgeschlagenen Ansatz

Ein neuer Eintrag wird angelegt, sobald:
- ein Ansatz fehlschlägt **oder**
- ein Bug mehr als eine Session benötigt

Nicht abwarten bis der Fix gefunden ist — der Eintrag entsteht während der
Untersuchung, nicht danach.

```markdown
### BUG-042 — Stripe-Webhook 400 bei deutschen Umlauten
**Status:** investigating
**Erstellt:** 2026-05-18
**Symptom:** POST /api/webhooks/stripe gibt 400 zurück wenn payload Umlaute enthält.
**Root Cause:**
**Fehlgeschlagene Ansätze:**
- 2026-05-18 — Ansatz: Content-Type Header auf utf-8 gesetzt →
  Warum gescheitert: Problem liegt upstream im raw-body-Parser, nicht im Header.
**Fix:**
```

### 3. Fehlgeschlagenen Ansatz sofort dokumentieren

Direkt nach dem Erkennen, dass ein Ansatz nicht funktioniert — nicht erst am
Session-Ende. Format:

```
- YYYY-MM-DD — Ansatz: <was versucht wurde> → Warum gescheitert: <Grund>
```

Der "Warum gescheitert"-Teil ist Pflicht. "Hat nicht funktioniert" reicht nicht —
die Ursache des Scheiterns ist die eigentliche Information.

### 4. Bug schließen

Sobald ein Fix verifiziert ist (nicht nur committed, sondern getestet):
- `**Status:**` auf `fixed` setzen
- `**Fix:**` mit vollständiger Erklärung füllen
- `**Geschlossen:** YYYY-MM-DD` ergänzen
- Eintrag in die `## Geschlossene Bugs`-Sektion verschieben

Fehlgeschlagene Ansätze bleiben im geschlossenen Eintrag — sie sind wertvoller
als der Fix selbst, weil sie Folgefehler verhindern.

### 5. BUGS.md wird committet

`BUGS.md` ist Projekt-Wissen, kein persönlicher Scratchpad. Jede Änderung
(neuer Eintrag, neuer fehlgeschlagener Ansatz, Bug geschlossen) wird committet.

Commit-Message-Konvention:

```
fix(bugs): close BUG-001 — <titel>
chore(bugs): add BUG-002 — <titel>
chore(bugs): update BUG-001 — fehlgeschlagener Ansatz ergänzt
```

### 6. IDs sind fortlaufend und eindeutig

`BUG-001`, `BUG-002`, ... — niemals eine ID wiederverwenden, auch nicht nach
Löschen eines Eintrags. Geschlossene Einträge bleiben in `BUGS.md`, werden
nicht gelöscht.

## Template

Ein leeres `BUGS.md` zum Kopieren liegt unter
`maxone-standards/templates/BUGS.md`.

## Was BUGS.md nicht ist

- **Kein Ticket-System** — keine Prioritäten, keine Assignees, keine Sprints.
  Dafür gibt es Linear/GitHub Issues.
- **Kein Changelog** — fixe Bugs gehören ins Commit, nicht hierher als einzige
  Dokumentation. BUGS.md ergänzt das Commit, es ersetzt es nicht.
- **Kein HANDOFF.md-Ersatz** — HANDOFF beschreibt den aktuellen Projektzustand.
  BUGS beschreibt die Debugging-Geschichte.

## Audit-Checks

1. Fehlt `BUGS.md` im Repo-Root? → WARN
2. Hat `BUGS.md` keine `## Aktive Bugs`-Sektion? → WARN
3. Hat `BUGS.md` keine `## Geschlossene Bugs`-Sektion? → WARN
4. Enthält ein aktiver Bug-Eintrag keinen Fehlgeschlagene-Ansätze-Block? → INFO

## Verwandte Standards

- **006** — HANDOFF.md (aktueller Projektzustand — Pflichtlektüre neben BUGS.md)
- **005** — Test-First (Tests verhindern Bug-Regression)
- **044** — SSoT & kein Hardcode (viele Bugs entstehen aus dupliziertem Zustand)
