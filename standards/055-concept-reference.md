# 055 — Konzept-Referenz (CONCEPT.md)

**Status:** active
**Seit:** 2026-05-30
**Gilt für:** alle Projekte mit `status: live` oder `status: dev`

## Regel

Jedes Projekt führt eine `CONCEPT.md` im Repo-Root. Sie dokumentiert das
vollständige Produkt-Konzept: Vision, Positionierung, Produkttiers,
Zielgruppen, Geschäftsmodell, Sprache.

**Zweck:** Ein Agent (Claude, Codex, Vybora) der in das Projekt einsteigt, soll
das Konzept aus dieser Datei verstehen — ohne Code zu lesen, ohne zu raten,
ohne zu fragen. `CONCEPT.md` ist die einzige Wahrheit über *was* das Produkt ist
und *wie* darüber gesprochen wird.

**Timing:** Die Datei wird angelegt bevor Code oder Copy für ein neues Projekt
entsteht. Sie wird aktualisiert sobald sich Positionierung, Produkttiers,
Geschäftsmodell oder Zielgruppen ändern — nicht nachträglich, sondern als
erster Schritt bei richtungsverändernden Entscheidungen.

## Pflicht-Abschnitte

```markdown
# CONCEPT — <ProjektName>

## Vision
Ein Satz: was das Produkt ist und welches Problem es löst.
Konkret, nicht generisch. Nicht "ein Tool für X", sondern was es wirklich tut.

## Positionierung
Warum dieses Produkt? Warum jetzt? Was macht es einzigartig (Moat)?
Was kann kein Wettbewerber einfach kopieren?

## Produkttiers
| Tier | Zugang | Kosten | Was es tut |
|------|--------|--------|-----------|
| ... | ...    | ...    | ...       |

## Zielgruppen
Pro Gruppe: Wer sind sie? Was ist ihr Problem? Was ist der venfree-Wert für sie?

## Geschäftsmodell
Wer zahlt? Wer nicht? Warum funktioniert das?

## Sprache
### Sagen
- Formulierungen die das Produkt auf dem richtigen Niveau beschreiben

### NICHT sagen
- Formulierungen die das Produkt reduzieren, falsches Framing erzeugen,
  oder die Zielgruppe verfehlen
```

Optionale Abschnitte: Roadmap-Richtung, Wettbewerbs-Kontext, Markt-Kontext.

## Was CONCEPT.md ist und was nicht

**Ist:** Konzept-Referenz für Agenten, Copy-Anker, Sprach-Leitfaden, Produkt-Wahrheit.

**Ist nicht:** PLAN.md (offene Tasks), CLAUDE.md (technische Regeln),
HANDOFF.md (Server-Zustand), BUGS.md (bekannte Fehler).

Alle vier Dateien koexistieren. CONCEPT.md ist die einzige die ausschließlich
über *Inhalt und Bedeutung* des Produkts spricht.

## Audit

```bash
# Prüft ob CONCEPT.md existiert und Pflicht-Abschnitte enthält
for section in "## Vision" "## Positionierung" "## Produkttiers" \
               "## Zielgruppen" "## Geschäftsmodell" "## Sprache"; do
  grep -q "$section" CONCEPT.md || echo "FEHLT: $section"
done
```

## Warum diese Regel

Ein Agent der das Konzept nicht kennt, rät. Raten führt zu:
- Copy die das Produkt reduziert ("Schnellkalkulation" statt vollem Wert)
- Falschem Framing (Barrier statt Enticement)
- Inkonsistenter Kommunikation über Sessions hinweg
- Fehlern die Max korrigieren muss, statt vorwärts zu kommen

Die Datei kostet einmal 20 Minuten. Sie spart pro Session Korrekturrunden.
