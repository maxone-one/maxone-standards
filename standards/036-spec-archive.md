# 036 — Spec-Archiv: PRD/TODO/DONE-Lifecycle

**Status:** active
**Seit:** 2026-05-04
**Gilt für:** alle Projekte mit Phasen / Sprints / Stages — sowohl Live-Code als auch Konzepte. Greift, sobald eine Phase als abgeschlossen markiert wird.

## Regel

Jede Phase / jeder Sprint / jede Stage besteht aus **drei Dateien** im Repo, niemals einer:

- `PRD.md` — die Spezifikation (was wird gebaut, warum, wie)
- `TODO.md` — offene Items (wird kontinuierlich abgehakt → in DONE.md verschoben)
- `DONE.md` — append-only Log (was tatsächlich erledigt wurde, mit Datum)

Sobald `TODO.md` leer ist UND ein Sign-Off-Block in `DONE.md` steht, wird die Phase **archiviert**: alle drei Dateien wandern nach `docs/archive/<phase>/` (oder `briefings/archive/<phase>/`), und am Ursprungspfad bleibt eine `DEPRECATED.md`-Stub mit Forward-Pointer.

Arbeit, die ausserhalb einer aktiven Phase entsteht, wird **kategorisiert** (siehe drei Kategorien unten) — niemals einfach in eine alte PRD nachträglich reingeschrieben.

## Warum

Drei Probleme, die diese Regel löst:

**1. Token-Ökonomie.** Eine einzige `PRD.md`, die kontinuierlich editiert wird, wächst auf 500+ Zeilen mit historischem Ballast (erledigte Items, Diskussionen, alte Designs). Jede Claude-Session lädt das vollständig in den Context. Drei kleine Dateien sind günstiger: Claude lädt nur `TODO.md` (~50 Zeilen, was JETZT zu tun ist), nicht `DONE.md` (~500 Zeilen historisch). Spart ~80 % Context pro PRD-Frage.

**2. Repo-Verwahrlosung.** Bisher: PRDs, HANDOFFs, Sprint-Notes liegen verstreut in `docs/`, `briefings/`, Repo-Root. Niemand weiss welche aktuell ist, welche abgeschlossen, welche obsolet. Resultat: User stellt mehrfach die gleiche Frage, weil die Antwort in einem PRD-v3 steht, das 2 Monate alt ist und keiner mehr findet. Mit klaren Archive-Pfaden + INDEX.md ist Auffindbarkeit garantiert.

**3. Lebenslange Projekte.** Keinmaxone-Projekt wird je „fertig" — es gibt immer Mid-Flight-Scope-Adds, Post-Launch-Features und Micro-Maintenance. Ohne Schema landet das alles entweder in einer wachsenden monolithischen PRD (verstopft) oder in nirgendwo (verloren). Drei Kategorien (Scope-Add / Post-Launch-Feature / Maintenance) mit klaren Schwellen geben jedem Item einen vorhersagbaren Ort.

Empirie 2026-05-04: User-Direktive nach Frust mit `PRD-2026-04-XX-feature.md`-Drift in mehreren Projekten ("Ich möchte nie wieder Repos löschen müssen, aber die sollen definitiv auch nicht verstreut und verwahrlost herumliegen"). Sign-Off auf das Drei-Datei-Modell explizit eingeholt.

## Wie anwenden

### 1. Neue Phase starten

Im Projekt-Repo unter `docs/phases/<phase-name>/` oder `briefings/<phase-name>/` (je nach Repo-Konvention) drei Dateien anlegen:

```
<projekt>/docs/phases/2026-05-onboarding-v2/
├── PRD.md       # Spec — was wird gebaut, warum, akzeptanz-kriterien
├── TODO.md      # offene Items, Checkbox-Liste
└── DONE.md      # leer beim Start; append-only ab erstem Done
```

`PRD.md` Pflicht-Sektionen:
- **Ziel:** ein Satz, was die Phase liefert
- **Akzeptanz-Kriterien:** wann ist die Phase „done"
- **Out of Scope:** was wird in dieser Phase explizit NICHT gebaut
- **Abhängigkeiten:** andere Phasen / Tickets / externe Blocker

### 2. Items abhaken

Wenn ein Item aus `TODO.md` erledigt ist:

1. Zeile aus `TODO.md` entfernen
2. In `DONE.md` anhängen (oben, neueste zuerst):
   ```markdown
   ## 2026-05-04 — <Item-Titel>
   - Commit: <SHA oder Link>
   - Notiz: kurzer Satz wenn nicht-trivial (sonst leer)
   ```

`DONE.md` ist **append-only**. Zeilen werden nie editiert oder gelöscht. Wenn ein Done-Eintrag falsch war: neuen Eintrag mit `## 2026-MM-DD — Korrektur: <Original-Titel>` anhängen.

### 3. Phase abschliessen + archivieren

Bedingungen für Phase-Abschluss:
- `TODO.md` enthält keine offenen Checkboxes mehr
- Alle Akzeptanz-Kriterien aus `PRD.md` sind in `DONE.md` referenziert
- Sign-Off-Block in `DONE.md`:
  ```markdown
  ## Phase-Abschluss

  - Abgeschlossen am: 2026-MM-DD
  - Sign-Off von: Vor- Nachname (@github-user)
  - Akzeptanz-Kriterien geprüft: ja
  - Live seit: 2026-MM-DD (oder „nicht live, intern" / „Konzept-Phase")
  ```

Dann **archivieren**:

```bash
mkdir -p docs/archive/2026-05-onboarding-v2
mv docs/phases/2026-05-onboarding-v2/{PRD,TODO,DONE}.md docs/archive/2026-05-onboarding-v2/
```

Am ursprünglichen Pfad bleibt eine **DEPRECATED-Stub** (zrow-style):

```markdown
<!-- docs/phases/2026-05-onboarding-v2/DEPRECATED.md -->
# DEPRECATED — Phase 2026-05-onboarding-v2

Diese Phase ist abgeschlossen und archiviert.

→ [docs/archive/2026-05-onboarding-v2/](../../archive/2026-05-onboarding-v2/)

Abgeschlossen am: 2026-MM-DD
```

Eintrag in `docs/archive/INDEX.md`:

```markdown
- [2026-05-onboarding-v2](2026-05-onboarding-v2/) — Onboarding-Flow v2, abgeschlossen 2026-MM-DD
```

### 4. Drei Kategorien für Arbeit ausserhalb aktiver Phasen

**Kategorie A — Mid-Phase Scope-Add (während eine Phase läuft):**

Wenn während einer aktiven Phase ein neues Item dazukommt, das in den Scope passt:
- Eintrag in `TODO.md` mit Tag `[scope-add — 2026-MM-DD]` voranstellen
- Bei Phase-Abschluss steht das Tag auch im `DONE.md`-Eintrag, damit nachvollziehbar bleibt: das war nicht ursprüngliche Spec, kam später dazu

Wenn das Add-Item zu gross wird (>1 Tag Aufwand ODER eigener Sign-Off nötig): keine Mid-Phase-Erweiterung, sondern eigene Mini-PRD (Kategorie B).

**Kategorie B — Post-Completion Feature (nach Phase-Abschluss):**

Neues Feature nach Phase-Archivierung → eigene Mini-Phase mit allen drei Dateien:

```
<projekt>/post-launch/2026-06-04-payment-stripe/
├── PRD.md
├── TODO.md
└── DONE.md
```

Schwelle: Wenn Sign-Off nötig ODER >1 Tag Aufwand → Mini-Phase. Sonst Kategorie C.

**Kategorie C — Micro-Maintenance (<1h Arbeit, kein eigenes Konzept):**

Bugfixes, Typo-Korrekturen, kleine Tweaks → `LIVING.md` im Repo-Root:

```markdown
# LIVING.md — Micro-Maintenance

## 2026-05-04
- Footer-Link korrigiert (commit abc123)
- Tippfehler in Onboarding-Schritt 2 (commit def456)

## 2026-05-03
- Cache-TTL von 60s auf 300s erhöht (commit ghi789)
```

Append-only, neueste oben. Jährlich rotieren: am 1. Januar wird `LIVING.md` zu `LIVING-2025.md` umbenannt, neue leere `LIVING.md` angelegt. Alte LIVING-Dateien wandern nach `docs/archive/living/`.

### 5. Schwellen-Entscheidung (Kategorie A/B/C)

| Bedingung                                      | Kategorie                |
|------------------------------------------------|--------------------------|
| Während aktiver Phase, passt in Scope          | A (TODO-Tag)             |
| Während aktiver Phase, >1 Tag oder eigener Sign-Off | B (Mini-Phase, parallel) |
| Nach Phase-Abschluss, >1h Arbeit oder Sign-Off | B (Mini-Phase)           |
| Nach Phase-Abschluss, <1h, kein Sign-Off       | C (LIVING.md)            |

### 6. Cross-Repo Mirror (`maxone-studio-org/specs-archive`)

Damit alle archivierten PRDs an einem Ort durchsuchbar sind, ohne dass die primäre Quelle aus dem Projekt-Repo verschwindet:

- **Primär:** PRDs leben im Projekt-Repo (verhindert Drift, Spec liegt nah am Code)
- **Mirror:** Read-only Repo `maxone-studio-org/specs-archive` synct via GitHub Action stündlich/täglich alle `docs/archive/**` und `post-launch/**` aus allen Projekt-Repos
- Mirror-Repo hat Top-Level-`INDEX.md` mit Liste aller archivierten Phasen über alle Projekte
- **Schreibrichtung nur Projekt → Mirror, nie zurück.** Edits am Mirror werden vom nächsten Sync überschrieben.

Setup folgt separat (Action-YAML im Mirror-Repo, Cron-Trigger, GitHub-Token mit Read-Access auf alle maxone-Repos). Bis Setup steht: Archivierung läuft trotzdem im Projekt-Repo (Mirror ist Convenience, nicht Voraussetzung).

### 7. Verhältnis zu anderen Standards

- **015 (CONCEPT.md / Gate 1):** `CONCEPT.md` ist projekt-weit (eine pro Repo, beschreibt das Gesamtprodukt). PRDs sind phasen-spezifisch (eine pro Sprint/Stage). Konzept-Änderungen werden NICHT in PRDs gemacht — sondern in einer neuen Version der `CONCEPT.md` (siehe Standard 015 Punkt 4).
- **013 (Launch-Gate / Gate 3):** `LAUNCH-REVIEW.md` ist die Sign-Off-Doku vor `status: live`. Eine PRD-Phase, die zu einem Launch führt, referenziert die LAUNCH-REVIEW im DONE.md-Sign-Off-Block.
- **014 (Sunset):** Wenn ein Projekt sunsettet, wandern auch alle archivierten PRDs mit ins Sunset-Archiv. Sie werden nicht gelöscht.
- **006 (HANDOFF.md):** HANDOFF.md ist Server-Doku für Ops (Pfade, Restart-Befehle). PRDs sind Repo-Doku für Bau-Entscheidungen. Keine Überschneidung.

## Audit

`scripts/audit.mjs` prüft pro Projekt:

- **Orphan-PRDs:** `*.md`-Dateien, die `PRD-` oder `prd-` im Namen haben und NICHT in `docs/archive/`, `briefings/archive/`, `docs/phases/`, oder `post-launch/` liegen → **WARN** („PRD verstreut, archivieren oder verschieben")
- **Drei-Datei-Konsistenz:** in jedem `docs/phases/*/` und `post-launch/*/` müssen alle drei Dateien existieren (`PRD.md`, `TODO.md`, `DONE.md`) → fehlt eine → **WARN**
- **Archive-Stub:** in `docs/phases/<name>/` mit ausschliesslich `DEPRECATED.md` (kein PRD/TODO/DONE) → **PASS** (korrekt archiviert)
- **DEPRECATED-Forward-Pointer:** `DEPRECATED.md` muss eine Markdown-Link-Zeile auf `docs/archive/<name>/` enthalten → fehlt → **WARN**
- **Archive-INDEX:** `docs/archive/INDEX.md` muss existieren wenn `docs/archive/` mindestens eine Phase enthält → fehlt → **WARN**
- **LIVING.md Format:** wenn `LIVING.md` existiert, prüfen dass Einträge mit `## YYYY-MM-DD` beginnen → sonst **WARN** („LIVING.md ohne Datums-Anker")
- **LIVING-Rotation:** am 1. Februar prüfen dass `LIVING-<vorjahr>.md` existiert → fehlt → **INFO** („Vorjahr nicht rotiert")
- **DONE.md Sign-Off:** archivierte Phase ohne `## Phase-Abschluss`-Sektion in `DONE.md` → **WARN** („Phase archiviert ohne Sign-Off-Block")

## Was das Audit NICHT findet

- Ob `DONE.md` die Wahrheit sagt (ob das Item wirklich erledigt ist) → manuelles Review nötig
- Ob ein Item korrekt kategorisiert wurde (A/B/C) → menschliche Beurteilung
- Ob die Mirror-Sync läuft → eigener Cron-Check im Mirror-Repo
- Ob die zugrunde liegende Spec sinnvoll war (PRD-Qualität) → Gate-1/Gate-3-Sache, nicht 036
- Drift zwischen `DONE.md` und tatsächlichem Code (Item als done markiert, aber Code rebased weg) → Code-Review-Sache

## Bestehende Projekte (Stand 2026-05-04)

Existierende `PRD-*.md` / `HANDOFF-*.md` / Briefings in laufenden Projekten werden NICHT rückwirkend ins Drei-Datei-Schema migriert. Sie bleiben wo sie sind, gelten als Legacy. Ab dieser Regel gilt: **jede neue Phase** in jedem Projekt nutzt das Schema. Bei nächster grösserer Aufräum-Aktion pro Projekt: Legacy-PRDs prüfen, in `docs/archive/legacy/` verschieben, in `INDEX.md` aufnehmen.
