# 029: Konzept-Referenz (CONCEPT.md)

**Status:** active
**Seit:** 2026-05-30
**Gilt für:** alle Projekte mit `status: live` oder `status: dev`

## Regel

Jedes Projekt führt eine `CONCEPT.md` im Repo-Root. Sie dokumentiert das
vollständige Produkt-Konzept: Vision, Positionierung, Produkttiers,
Zielgruppen, Geschäftsmodell, Sprache.

**Zweck:** Ein Agent (Claude, Codex, Vybora) der in das Projekt einsteigt, soll
das Konzept aus dieser Datei verstehen, ohne Code zu lesen, ohne zu raten,
ohne zu fragen. `CONCEPT.md` ist die einzige Wahrheit über *was* das Produkt ist
und *wie* darüber gesprochen wird.

**Timing:** Die Datei wird angelegt bevor Code oder Copy für ein neues Projekt
entsteht. Sie wird aktualisiert sobald sich Positionierung, Produkttiers,
Geschäftsmodell oder Zielgruppen ändern, nicht nachträglich, sondern als
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

Die Basis-Regel oben beschreibt CONCEPT.md als statische Konzept- und Sprach-Referenz.
Für Projekte mit echtem Code (viele Routen, Features, lib-Module) reicht das nicht: Dort
kommt die Frage "wo liegt Funktion X" und "wie mache ich Y" laufend auf, und ein Agent
der sie nicht aus einer Datei beantworten kann, scannt jedes Mal aufs Neue den Code,
liest PRDs und verbrennt Token. Die folgende Ausbaustufe macht CONCEPT.md zum lebenden,
code-verankerten Projekt-Brain, das zusätzlich *wo* und *wie* beantwortet, ohne je zu
veralten.

## Ausbaustufe: Das lebende Projekt-Brain (code-verankert)

**Gilt für:** empfohlen für jedes Projekt mit `status: live`, dessen Feature- und
Routen-Fläche groß genug ist, dass Code-Scannen pro Frage spürbar Token kostet.
Referenz-Implementierung: stadt-lahn-flow.

### Das Prinzip in einem Satz

Eine Einstiegsdatei beantwortet vier Fragen (was, wo, wie, warum), wobei jede Antwort
entweder **aus Code generiert** ist (kann nicht driften) oder **bewusst kuratiert**
(braucht Urteilsvermögen), und Mechanismen verhindern, dass sie verrottet.

Der Kern-Trick: **Verankere die Wahrheit dort, wo sie ohnehin gepflegt werden muss.**
SLFs Feature-Liste (`src/lib/features-registry.ts`) ist nicht bloß Doku, sie rendert
`/roadmap`, `/preise` und `/features`. Sie kann gar nicht veralten, ohne dass das Produkt
selbst kaputtgeht. Eine Doku, die niemand zum Funktionieren braucht, verrottet. Eine, die
das Produkt zum Laufen braucht, nicht.

### Drei Eimer: jede Information gehört in genau einen

| Eimer | Inhalt | Wer pflegt | Driftet |
|---|---|---|---|
| **Generiert** (Maschinen-Wahrheit) | Feature-/Routen-/Endpoint-/Env-Katalog, "wo liegt was" | Generator aus dem Code-Anker | nein, aus Code abgeleitet |
| **Kuratiert** (Urteil) | Was ist das Produkt, Architektur-Karte, Rezepte ("wie mache ich X"), bekannte Lücken | Agent von Hand, selten | nur bei Architektur-Änderung |
| **Protokolliert** (append-only) | Entscheidungen `D-NNN` mit Datum und Begründung, das "warum" | Agent ergänzt, nie umschreiben | nein, nur Anhängen (Standard 031) |

Die drei wiederkehrenden Fragen landen damit sauber: "wie mache ich X" in den Rezepten
(kuratiert), "was haben wir uns gedacht" im Entscheidungs-Log (protokolliert, Standard
031), "wo finde ich Y" im generierten Katalog, dessen Code-Pointer zur **einen** Datei
führt, ohne Tree-Scan.

### Verankerungs-Strategien (je nach Projekttyp)

Nicht jedes Projekt hat eine Produkt-Registry, auf der man huckepack reitet. Der Anker
richtet sich danach, was im Projekt schon die Wahrheit ist:

1. **Produkt-getrieben** (SLF-Fall): Es gibt bereits eine typisierte Liste, die das
   Produkt nutzt. Generiere den Katalog daraus.
2. **Konvention-getrieben:** Keine Registry, aber das Dateisystem ist die Wahrheit
   (Next.js-`app/`-Router gleich Routen, ein `commands/`-Ordner gleich CLI-Befehle,
   `.env.example` gleich Konfig-Fläche). Der Generator scannt das Dateisystem und listet
   auf. Kein Pflegeaufwand, weil das Dateisystem sich beim Programmieren von selbst
   aktualisiert.
3. **Hand-Anker mit Drift-Check:** Wo nichts ableitbar ist (Architektur-Karte, Rezepte),
   schreibt der Agent von Hand, aber ein Test prüft, dass jeder genannte Pfad noch
   existiert. So kann der kuratierte Teil unvollständig sein, aber nie auf Totes zeigen.

### Selbsterhaltung (vier Mechanismen, einander absichernd)

Damit "der Agent dokumentiert sich selbst" nicht von seiner Disziplin abhängt (die mit
langer Session nachlässt), erzwingen mehrere Schichten die Pflege:

1. **Generator mit `--check`:** kompiliert Anker zu Katalog, idempotent ohne Zeitstempel
   (zweimal laufen erzeugt keinen Diff), `--check` meldet read-only bei Abweichung und
   schreibt nichts, taugt also für Drift-Läufe.
2. **Definition of Done in der Projekt-CLAUDE.md:** Eine Feature-/Routen-/lib-Änderung
   ist erst fertig, wenn Registry, Code-Karte, ggf. `D-NNN` mitgezogen und der Generator
   gelaufen ist.
3. **Drift-Achse im `/drift`-Command:** read-only Statusanzeige über `--check`.
4. **Stop-Hook:** stupst, wenn Feature-Code geändert wurde, aber das Brain nicht. Der
   einzige Mechanismus, den die Harness erzwingt statt des Agenten, deshalb der wichtigste
   gegen Vergesslichkeit.

Härteste Schicht obendrauf: das **CI-Gate**. Der `--check`-Lauf im Deploy lässt den Build
fehlschlagen, wenn das Brain verrottet ist. Ein veraltetes Brain wird so nie deployt.

### Konsum-Regel (der eigentliche Token-Spareffekt)

Das Brain spart nur, wenn der Agent es zuerst liest statt zu scannen. Deshalb fest in die
Projekt-CLAUDE.md:

1. Bei Produktfragen zuerst CONCEPT.md.
2. Bei "wo liegt X" die Registry plus Code-Karte (der Pointer führt zur einen Datei).
3. Code nur lesen, wenn das Brain schweigt oder gerade etwas geändert wird.

Kein Tree-Scan, kein erneutes Durchforsten von PRDs.

### Verhältnis zur Basis-Regel und zu Nachbar-Standards

Die Basis oben sagt, CONCEPT.md spreche "ausschließlich über Inhalt und Bedeutung". Das
Brain erweitert das bewusst um eine technische, aber **generierte** Schicht: Der "wo liegt
was"-Teil ist kein von Hand gepflegter Tech-Text, sondern aus Code abgeleitet, verletzt
den Geist der Basis-Regel also nicht. Einzige hand-kuratierte technische Ergänzung sind
Architektur-Karte und Rezepte, gerechtfertigt, weil das "wie" aus reinem Code-Lesen teuer
zu rekonstruieren ist.

- **031 (DECISIONS.md):** liefert den "warum"-Eimer. Das Brain verlinkt dorthin, dupliziert nicht.
- **008 (Gate 1):** CONCEPT.md entsteht vor Code. Der stabile Gate-1-Konzeptteil bleibt
  am Ende der Datei, der Brain-Teil ist das laufend gepflegte Davor.
- **024 (PLAN.md), 025 (BUGS.md), 032 (docs/INDEX.md):** Das Brain verlinkt auf sie,
  ersetzt sie nicht.

### Referenz-Implementierung (stadt-lahn-flow)

- `CONCEPT.md`: Brain mit Index, "Was ist", Architektur-Karte, generiertem Katalog
  (zwischen `BEGIN/END GENERATED FEATURES`), Rezepten und stabilem Gate-1-Teil.
- `src/lib/features-registry.ts`: das "was" (typisierte Liste, vom Produkt selbst genutzt).
- `src/lib/feature-code.ts`: das "wo" (Feature-ID auf page/api/lib/decision).
- `scripts/gen-product-brain.mjs`: Generator plus `--check`.
- `docs/DECISIONS.md`: das "warum".
- `scripts/brain-reminder.mjs` plus Stop-Hook: der Stupser.

## Audit

```bash
# Prüft ob CONCEPT.md existiert und Pflicht-Abschnitte enthält
for section in "## Vision" "## Positionierung" "## Produkttiers" \
               "## Zielgruppen" "## Geschäftsmodell" "## Sprache"; do
  grep -q "$section" CONCEPT.md || echo "FEHLT: $section"
done

# Brain-Ausbaustufe: wenn ein Generator vorhanden ist, muss der Katalog frisch sein
if [ -f scripts/gen-product-brain.mjs ]; then
  npm run gen:brain -- --check || echo "BRAIN VERALTET: Generator laufen lassen und committen"
fi
```

## Warum diese Regel

Ein Agent der das Konzept nicht kennt, rät. Raten führt zu:
- Copy die das Produkt reduziert ("Schnellkalkulation" statt vollem Wert)
- Falschem Framing (Barrier statt Enticement)
- Inkonsistenter Kommunikation über Sessions hinweg
- Fehlern die Max korrigieren muss, statt vorwärts zu kommen

Die Datei kostet einmal 20 Minuten. Sie spart pro Session Korrekturrunden.
