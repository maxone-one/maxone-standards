# 024 — Plan-Tracker (PLAN.md)

**Status:** active
**Seit:** 2026-05-18
**Gilt für:** alle Projekte mit `status: live` oder `status: dev`

## Regel

Jedes Projekt führt eine `PLAN.md` im Repo-Root mit zwei Pflicht-Abschnitten:

1. **`## Noch offen`** — alle freigegebenen, noch nicht umgesetzten Pläne
2. **`## Erledigt`** — abgeschlossene Pläne mit Datum

**Timing-Regel:** Wenn ein Plan in einer Session freigegeben wird (Max sagt "ja,
mach das"), wird `PLAN.md` aktualisiert **bevor** der erste Code geändert wird.
Das ist der explizite Startschuss — nicht das Commit, nicht das Deploy.

**Kein PRD nötig:** PLAN.md ist das Planungsdokument, wenn kein CONCEPT.md
vorhanden ist. Auch ein Einzeiler ("Fix Login-Bug") ist ein gültiger Eintrag.

## Format

```markdown
# PLAN — <ProjektName>

## Noch offen

- [ ] **<Titel>** — <Kurzbeschreibung>
  - Freigegeben: YYYY-MM-DD
  - Details: <was genau, welche Dateien, welche Entscheidungen>

## Erledigt

- [x] **<Titel>** — <Kurzbeschreibung> — <Datum>
```

Checkboxen sind nicht zwingend (`- [ ]` / `- [x]`), aber empfohlen — sie sind
schnell scanbar und von Werkzeugen lesbar.

Leere Abschnitte sind gültig:

```markdown
## Noch offen

_(kein aktiver Plan)_

## Erledigt

_(noch nichts abgeschlossen)_
```

## Verhältnis zu anderen Standards

| Standard | Was es abdeckt | PLAN.md vs. |
|---|---|---|
| **006 — HANDOFF.md** | Server-seitig: Infra-Zustand, letzte Deploys, Ops-TODOs | PLAN.md ist Repo-seitig: Feature- und Fix-Pläne |
| **015 — CONCEPT.md** | Konzeptionell: Problem, Datenmodell, Auth, Threats | PLAN.md ist operativ: Was tun wir diese Session / diesen Sprint? |
| **013 — LAUNCH-REVIEW** | Einmaliges Pre-Live-Gate | PLAN.md ist laufend — überlebt den Launch |

Wenn CONCEPT.md vorhanden: PLAN.md kann darauf verweisen (`Details: siehe CONCEPT.md §3`).
Wenn kein CONCEPT.md: PLAN.md ist das einzige Planungsdokument — `## Noch offen`
darf dann ausführlicher sein.

## Warum

Zwischen Sessions geht Kontext verloren. Ohne persistierten, freigegebenen Plan
beginnt Claude beim nächsten Öffnen des Projekts von vorne — und kann beginnen,
Dinge zu "erinnern", die nie vereinbart wurden (Halluzination durch
Kontextverlust). PLAN.md ist die einzige Wahrheit darüber, was vereinbart ist.

**Drei Garantien:**

| Garantie | Ohne PLAN.md | Mit PLAN.md |
|---|---|---|
| Session-Kontinuität | Kontext in CLAUDE.md oder nirgends | Explizite Done/Open-Liste im Repo |
| Freigabe-Nachweis | "Haben wir das besprochen?" unklar | Datum + Beschreibung im `## Noch offen` |
| Kein Scope-Creep | Claude baut was es "denkt" | Nur was in PLAN.md steht, wird gebaut |

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live` oder `status: dev`:

1. **PLAN.md existiert** im Repo-Root — `FAIL` wenn nicht.
2. **`## Noch offen` Abschnitt** vorhanden — `FAIL` wenn nicht.
3. **`## Erledigt` Abschnitt** vorhanden — `FAIL` wenn nicht.

Der Inhalt der Abschnitte wird nicht geprüft — ein leerer Abschnitt ist gültig.
Der Audit prüft nur die Struktur, nicht die Qualität.

## Migration

- **Neue Projekte:** PLAN.md vor Gate 1 (Standard 008) anlegen.
- **Bestand:** Sofort anlegen — auch leer. Inhalt kommt beim nächsten
  echten Plan-Sprint.
- Keine Ausnahmen für `status: live` — PLAN.md ist eine leere Datei,
  das Anlegen dauert 30 Sekunden.
