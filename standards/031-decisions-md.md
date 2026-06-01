# 031: DECISIONS.md: Strategische Entscheidungen als SSoT

**Status:** active
**Seit:** 2026-05-31
**Gilt für:** alle Projekte mit `status: live` oder `status: dev` die ein PRD, CONCEPT.md oder andere Visionsdokumente führen

## Das Problem

In lang laufenden Projekten entsteht Drift: Das PRD beschreibt Desktop-First, die Plattform ist längst Web-only. Das Konzept verspricht Paid-Tiers, das Geschäftsmodell ist inzwischen anders. Ein Agent der zu spät in ein Projekt einsteigt, liest das PRD und baut in die falsche Richtung, ohne es zu wissen.

Dieses Drift-Muster ist unvermeidlich: Konzepte und PRDs werden zu Beginn geschrieben, Entscheidungen fallen aber laufend. Dokumente nachzuziehen kostet Zeit die niemand hat.

**DECISIONS.md ist die Lösung:** Eine einzige Datei dokumentiert alle strategischen Pivots, Abweichungen und bewussten "Nicht-mehr-gültig"-Entscheidungen. Wer DECISIONS.md liest, weiß was noch gilt und was nicht, ohne PRD und Konzept komplett zu lesen.

## Regel

Jedes Projekt mit einem PRD, CONCEPT.md oder Visionsdokument führt eine `docs/DECISIONS.md`.

**Wann einen Eintrag schreiben:**
- Eine Aussage im PRD oder Konzept ist nicht mehr gültig
- Eine strategische Weichenstellung fällt (Geschäftsmodell, Zielgruppe, Tech-Stack)
- Max sagt explizit "das haben wir so entschieden" zu etwas Nicht-Offensichtlichem
- Eine frühere Annahme hat sich als falsch erwiesen

**Timing:** Sofort wenn die Entscheidung fällt, nicht im nächsten Sprint, nicht "später". Wer die Entscheidung trifft, schreibt den Eintrag. Das ist der erste Schritt, bevor Code oder Copy geändert wird.

## Format

```markdown
# Strategische Entscheidungen — <ProjektName>

Dieser Datei hat Vorrang vor PRD und Konzept. Jede Entscheidung hier überschreibt
Aussagen in den anderen Dokumenten. Immer mit Datum und Begründung dokumentieren.

---

## <Kurztitel der Entscheidung> (entschieden <YYYY-MM-DD>)

<Was wurde entschieden — ein Satz.>

<Warum: Begründung, was die Alternative gewesen wäre, welcher Vorfall oder welche
Erkenntnis dazu geführt hat.>

**Konsequenz für PRD/Konzept:** <Welche Abschnitte sind jetzt überholt oder falsch?>
```

## Drei-Quellen-Hierarchie

Projekte mit PRD + CONCEPT.md + PLAN.md folgen dieser Lese-Reihenfolge beim Session-Start:

1. **DECISIONS.md**, was ist anders als in PRD/Konzept beschrieben?
2. **CONCEPT.md**, was ist das Produkt, welches Problem löst es?
3. **PRD**, wie wird ein Feature konkret spezifiziert?
4. **PLAN.md**, was wird gerade gebaut, in welcher Reihenfolge?

**Widersprüche:** DECISIONS.md gewinnt immer. PLAN.md gewinnt bei der Reihenfolge.

## Verhältnis zu anderen Standards

| Datei | Inhalt | DECISIONS.md vs. |
|---|---|---|
| `CONCEPT.md` (029) | Was das Produkt ist, Vision, Positionierung, Zielgruppen | DECISIONS.md dokumentiert Änderungen an der Positionierung |
| `PLAN.md` (024) | Was gebaut wird, offene + erledigte Tasks | DECISIONS.md dokumentiert warum bestimmte Richtungen nicht mehr verfolgt werden |
| PRD | Feature-Spezifikation für die Entwicklung | DECISIONS.md markiert welche PRD-Abschnitte überholt sind |

## Audit

```bash
# Prüft ob DECISIONS.md existiert wenn ein PRD vorhanden ist
if ls docs/prd/ docs/PRD*.md 2>/dev/null | grep -q .; then
  test -f docs/DECISIONS.md || echo "FEHLT: docs/DECISIONS.md (PRD vorhanden aber keine Entscheidungs-Übersicht)"
fi
```

## Warum diese Regel

Ohne DECISIONS.md passiert folgendes: Ein Agent liest am Session-Start das PRD, findet "Desktop-First" als zentrale Strategie, und beginnt Tauri-Code zu planen. Die Entscheidung gegen Desktop wurde nirgends festgehalten. Zwei Stunden später ist ein Plan für etwas entstanden, was nie gebaut wird.

DECISIONS.md kostet pro Eintrag 5 Minuten. Sie spart pro Session, in der ein Agent in die falsche Richtung läuft, Stunden.
