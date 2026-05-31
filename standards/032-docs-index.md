# 032 — docs/INDEX.md: Dokumentations-Einstiegspunkt

**Status:** active
**Seit:** 2026-05-31
**Gilt für:** alle Projekte mit mehr als 5 Dokumentationsdateien in `docs/`

## Regel

Jedes Projekt mit mehr als 5 Dateien in `docs/` MUSS eine `docs/INDEX.md` haben.
Sie ist der einzige Einstiegspunkt für alle Dokumentation — kein Agent und kein
Mensch steigt direkt in Einzeldateien ein, ohne zuerst den INDEX gelesen zu haben.

**`docs/INDEX.md` enthält:**
- Tabellarische Übersicht aller Dateien unter `docs/` (Pfad, Inhalt, Lesen-wenn)
- Kategorisierung nach Themenbereich (Produktstrategie, Features, Technik, etc.)
- Markierung veralteter Dateien (`⚠️ veraltet`)
- Session-Start-Reihenfolge als erste Sektion

**CLAUDE.md Session-Start-Protokoll** verweist auf `docs/INDEX.md` als dritten
Pflicht-Schritt (nach PLAN.md und DECISIONS.md).

## Warum

Projekte akkumulieren Dokumentation über Zeit. Ohne zentralen Index werden
Dateien in Unterverzeichnissen (`prd/`, `modules/`, `vision/`) systematisch
übersehen — auch von KI-Agenten, die nur PLAN.md + DECISIONS.md lesen und
davon ausgehen, alle relevanten Quellen zu kennen.

**Konkreter Vorfall (2026-05-31, venfree):** 46 Doku-Dateien im Projekt.
Session-Start-Protokoll nannte nur 3. Builder-Spec (`modules/15-PROJECT-EDITOR.md`),
AI-Engine-Deferral (`modules/12-AI-ENGINE.md`), Hardware-Vision (`prd/06`),
Marketplace (`modules/13`) und GTM-Strategie (`prd/09`) wurden in jeder Session
übersehen. Statusberichte waren daher systematisch unvollständig.

## Format

```markdown
# docs/INDEX.md — <Projektname> Dokumentations-Einstieg

Einstiegspunkt für alle Doku-Dateien. Jede Session liest diese Datei zuerst,
dann den relevanten Zweig.

**Pflicht-Reihenfolge beim Session-Start:**
1. `../PLAN.md`
2. `DECISIONS.md`
3. Diese Datei, dann den passenden Zweig

---

## <Kategorie>
| Datei | Inhalt | Lesen wenn |
|-------|--------|------------|
| `prd/01-PROBLEM.md` | ... | ... |
```

## Wartung

- Bei jeder neuen Datei in `docs/`: sofort eine Zeile in `INDEX.md` ergänzen.
- Bei veralteten Dateien: `⚠️ veraltet` markieren, nicht löschen.
- INDEX.md selbst ist nie veraltet — sie zeigt aktuellen Stand.

## Audit

`scripts/audit.mjs` für jedes Projekt mit `docs/`-Verzeichnis:

1. `docs/INDEX.md` existiert → PASS; fehlt bei >5 Dateien in `docs/` → **FAIL**
2. Jede `.md`-Datei unter `docs/` ist im INDEX erwähnt → PASS; fehlt eine → WARN
3. `CLAUDE.md` enthält `docs/INDEX.md` im Session-Start-Block → PASS; fehlt → WARN

## Beziehung zu anderen Standards

- **024-plan-tracker:** PLAN.md + DECISIONS.md bleiben Pflicht-Schritt 1+2.
  INDEX.md ist Schritt 3, nicht Ersatz.
- **029-concept-reference:** CONCEPT.md ist ein Gate vor Code — INDEX.md ist
  Navigation im laufenden Projekt. Beide koexistieren.
- **031-decisions-md:** DECISIONS.md hat Vorrang. INDEX.md verweist auf sie,
  ersetzt sie nicht.
