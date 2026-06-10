# BCAST-2026-06-10-code-erhalt-einmotten

**Typ:** change-notice
**Status:** closed
**Verursachend:** vanfree (venfree)

## Was ändert sich

Neue Go-Forward-Regel (Standard 003-C, 2026-06-10): Quellcode für eine fertige Oberfläche oder einen Flow wird niemals gelöscht oder entfernt, auch wenn er gerade ersetzt, abgelöst oder nicht mehr eingebunden ist. Stattdessen einmotten: in einen Archiv-/Legacy-Pfad verschieben, auskommentieren oder hinter ein Feature-Flag parken, aber im Repo erhalten. Community-Feedback kann genau diese Möglichkeit zurückverlangen, dann wird der Flow aus dem Keller geholt statt komplett neu geschrieben.

Abgrenzung: Refactoring und Duplikations-Reduktion (Standard 003-B) bleiben Pflicht, dürfen aber nie als Begründung dienen, einen ganzen nutzererlebbaren UI-Flow, eine Linse oder ein Feature ersatzlos zu streichen. Interner Dead-Code ist nicht gemeint.

Es gibt keinen retroaktiven Fix: die Regel constraint ausschließlich künftiges Verhalten. Darum ist dieser Broadcast eine Change-Notice und direkt geschlossen, alle Projekte sind per Default konform.

## Fehlermuster (reproduzierbar)

Ein Commit entfernt eine ausgelieferte UI-Komponente oder einen Flow ersatzlos (Datei gelöscht statt in einen Archiv-Pfad verschoben oder hinter ein Flag geparkt), mit der Begründung "wird nicht mehr benutzt" / "durch X ersetzt" / "Duplikat".

## Betroffene Projekte

| Projekt | Status | Fix-Commit | Gelöst am |
|---|---|---|---|
| maxone.one | resolved | go-forward policy (003-C) | 2026-06-10 |
| stadtlahnflow | resolved | go-forward policy (003-C) | 2026-06-10 |
| katchi | resolved | go-forward policy (003-C) | 2026-06-10 |
| repivot | resolved | go-forward policy (003-C) | 2026-06-10 |
| vanfree | resolved | Standard 003-C + ~/.claude/CLAUDE.md + memory | 2026-06-10 |
| plansey-2026 | resolved | go-forward policy (003-C) | 2026-06-10 |
| stadtpunkt | resolved | go-forward policy (003-C) | 2026-06-10 |
| kitchen-station | resolved | go-forward policy (003-C) | 2026-06-10 |
| voltfair | resolved | go-forward policy (003-C) | 2026-06-10 |
| solarproof | resolved | go-forward policy (003-C) | 2026-06-10 |
| vector | resolved | go-forward policy (003-C) | 2026-06-10 |
| snapflow | resolved | go-forward policy (003-C) | 2026-06-10 |
| gs-lohra | resolved | go-forward policy (003-C) | 2026-06-10 |
| zentinel | resolved | go-forward policy (003-C) | 2026-06-10 |
| plansey-engaged | resolved | go-forward policy (003-C) | 2026-06-10 |

## Fix-Muster

Bei Ablösung oder Umbau einer UI-Komponente, eines Flows, einer Linse oder eines Features den Altcode in einen klar benannten Archiv-Pfad (z.B. `legacy/` oder `_archive/`) verschieben oder hinter ein Flag parken, nie per `rm` oder Edit-Löschung entfernen. Im Commit dokumentieren, was eingemottet wurde und warum. Ausnahme nur auf ausdrückliche Eigentümer-Ansage.

## Audit-Grep-Pattern (Pflicht)

Nicht als positiver Code-Grep prüfbar (eine Löschung hinterlässt keine Spur im aktuellen Code). Detektion ist review-gated über die Versionsgeschichte:

```bash
# Verdacht: ersatzlos gelöschte Oberflächen-Komponente seit dem Stichtag
git log --since="2026-06-10" --diff-filter=D --name-only --pretty=format: -- 'components/**' 'app/**' | sort -u
```

**Fail-Grep:** `git log --diff-filter=D -- components/ app/` listet eine gelöschte ausgelieferte UI-Datei ohne korrespondierende Verschiebung in einen Archiv-Pfad → Review-Stopp (manuell/Gate-3, siehe Standard 003-C und 008).
