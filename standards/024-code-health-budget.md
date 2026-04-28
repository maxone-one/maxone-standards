# 024 — Code-Health-Budget (Refactoring + Duplikation)

**Status:** active
**Seit:** 2026-04-28
**Gilt für:** alle Projekte mit `status: live` UND eigenem Code-Repo

## Regel

Pro Quartal pro Projekt sind **mindestens 15 % der Commits** Refactoring-
oder Duplikations-Reduktion. Refactoring-Commits werden via Conventional-
Commit-Präfix `refactor:` oder Pfad-Pattern (Tests + Renames) erkannt.

Zusätzlich:

- **Code-Duplikations-Anteil < 5 %** (gemessen mit `jscpd`,
  10-Token-Mindestlänge, JS/TS/Python)
- **Funktions-Längen-Limit:** keine Funktion > 100 Zeilen ohne expliziten
  `// HEALTH-EXEMPT: <Begründung>`-Kommentar
- **Datei-Längen-Limit:** keine Quelldatei > 500 Zeilen ohne expliziten
  Split-Plan in HANDOFF.md

## Warum

GitClear Longitudinal Study 2024–2026 zeigt zwei harte Trends bei
KI-augmentierten Codebases:

- **Refactoring-Anteil an Commits ist von 25 % (2021) auf < 10 % (2024)
  gefallen.** KI generiert lieber neuen Code, als bestehenden zu
  konsolidieren. Reviewer winken durch, weil die Diffs grün aussehen.
- **Code-Duplikation hat sich seit 2021 vervierfacht (4×).** KI-Tools
  generieren bevorzugt Copy-Paste statt Abstraktion — das ist
  statistisch der billigere Pfad fürs Modell.

**Die Sicherheits-Konsequenz:** Tech-Debt ist Security-Debt mit
Verzögerung. Konkret:

- **Bugfix in einer Kopie** verfehlt die anderen 3 Kopien — Lücke
  bleibt in 75 % der Fälle bestehen
- **500-Zeilen-Funktionen** sind unreviewbar — neue Sicherheits-Regression
  fällt nicht auf
- **Refactoring-Mangel** lässt Architektur erodieren — jeder neue Bugfix
  passiert in einer komplexeren Umgebung als der vorhergehende, mit
  exponentiell wachsendem Risiko

CodeRabbit-Analyse 2026: AI-co-authored Code hat **2,74× mehr Security-
Findings** als rein menschlicher Code. Standard 024 attackiert die
strukturellen Verstärker (Duplikation, Funktions-Länge), nicht die
einzelnen Findings.

**Konkrete Vorhersage:** ein Projekt, das diese Schwellen 2 Quartale
in Folge reißt, produziert im 3. Quartal einen Live-Bug aus dieser
Klasse. Das ist nicht abstrakt — das ist die Lehre aus den eigenen
Vorfällen 2026.

## Wie anwenden

### Quartalsweise Auswertung

```bash
# Refactoring-Anteil
git log --since="3 months ago" --pretty=format:"%s" | wc -l > total.txt
git log --since="3 months ago" --pretty=format:"%s" | grep -E "^refactor(\(|:)|^test(\(|:)|^chore.*rename" | wc -l > refactor.txt
echo "scale=2; $(cat refactor.txt) / $(cat total.txt) * 100" | bc

# Duplikations-Scan
npx jscpd --min-tokens 50 --reporters json --output ./jscpd-report ./src
# Anteil duplizierter Zeilen aus jscpd-report/jscpd-report.json
```

### Funktions-/Datei-Längen-Limits

`scripts/audit.mjs` scannt das Repo-Root nach JS/TS/Py-Dateien:

- Datei-Länge gemessen in `effective lines` (kein Whitespace, keine
  Comments)
- Funktions-Länge per Pattern: zwischen `function name(` / `const name =
  (` / `def name(` und passender schließender Klammer

### Bei Verstoß

1. **Refactoring-Sprint einplanen** für das nächste Quartal —
   konkret in HANDOFF.md mit Datum + Umfang
2. **Duplikations-Hotspots:** jscpd-Report öffnet, Top-3-Cluster
   priorisiert
3. **Über-langes:** Funktion/Datei aufteilen ODER bewusste Ausnahme
   mit `// HEALTH-EXEMPT: <Begründung>` markieren

### KI-spezifisch: Black-Box-Code-Anteil dokumentieren

Bei jedem Re-Review (Standard 021) in HANDOFF.md aktualisieren:

```markdown
## Code-Health (Standard 024)

- Black-Box-Anteil (KI-generiert, ungelesen): ~25 %
- Refactoring-Anteil letztes Quartal: 18 %
- Duplikations-Score (jscpd): 3,4 %
- Längste Funktion: 87 Zeilen (`generateInvoicePDF` in `lib/pdf.ts`)
- Größte Datei: 412 Zeilen (`routes/api/orders/+server.ts`)
```

## Was diese Regel NICHT erzwingt

- **Kein Refactoring um des Refactorings willen** — Kosmetik-Renames
  zählen nicht. Echte Konsolidierung (Helper extrahieren, Duplikat
  entfernen, Modul aufspalten) zählt.
- **Kein Coverage-Ziel** — separate Disziplin, gehört zu Standard 005
  (Test-First).
- **Keine harte Style-Linie** — Linter (`eslint`, `ruff`, etc.) sind
  Projekt-Sache, kein Audit-Gegenstand hier.

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live` + lokalem Repo:

1. **Refactoring-Anteil letztes Quartal** via `git log` — < 15 % → WARN,
   < 8 % → FAIL
2. **Datei-Längen-Scan** über `src/` (oder Repo-Root, wenn kein `src/`):
   - Files > 500 Zeilen (effective lines, ohne Comments/Blanks) →
     WARN pro Datei
   - Files > 1000 Zeilen → FAIL pro Datei
3. **Funktions-Längen-Scan** (best-effort Regex, JS/TS):
   - Funktionen > 100 Zeilen → WARN
   - Funktionen > 200 Zeilen → FAIL
   - `// HEALTH-EXEMPT:`-Kommentar in vorausgehenden 3 Zeilen → SKIP
4. **`HANDOFF.md`** enthält Sektion `## Code-Health` mit den 5 Werten
   oben → INFO wenn fehlt (nicht WARN, ist Best-Practice)

PASS = Refactoring ≥ 15 % UND keine Über-Längen.
WARN = Refactoring 8–14 % ODER 1–N Über-Längen.
FAIL = Refactoring < 8 % ODER ≥ 1 Datei > 1000 Zeilen ODER ≥ 1
Funktion > 200 Zeilen.

`jscpd`-Lauf wird **nicht im Audit selbst** ausgeführt (zu langsam),
sondern als separater Cron empfohlen — Audit prüft nur das Vorhandensein
eines aktuellen Reports unter `audits/jscpd-<projekt>-<quartal>.json`.

## Ausnahmen

`code_health: exempt` in `registry/projects.yml` für:

- Reine Konfig-/Dokumentations-Repos (kein Code)
- Stark generierten Code (Protobuf, OpenAPI-Clients) — der Generator-
  Output zählt nicht
- Vendor-Code-Re-Hosting (z.B. self-hosted Forks von OSS-Tools)

## Cross-Reference

- 005 Test-First — Coverage-Disziplin (orthogonal)
- 013 LAUNCH-REVIEW Section A — Black-Box-Anteil-Schätzung pro Launch
- 021 Re-Review-Reminder — alle 180 Tage werden die Health-Werte
  in HANDOFF.md aktualisiert
- VULN-CATALOG G1/G2/G3 — die Daten-Begründung dieser Regel
