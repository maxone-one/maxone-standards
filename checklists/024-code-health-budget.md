# Checkliste: 024 — Code-Health-Budget

Quartalsweise pro Projekt mit `status: live` + eigenem Code-Repo.

---

## A. Refactoring-Anteil messen

```bash
TOTAL=$(git log --since="3 months ago" --pretty=format:"%s" | wc -l)
REFACTOR=$(git log --since="3 months ago" --pretty=format:"%s" \
  | grep -E "^refactor(\(|:)|^test(\(|:)|^chore.*rename" | wc -l)
echo "Refactoring-Anteil: $((REFACTOR * 100 / TOTAL))%"
```

- [ ] Anteil ≥ 15 % → PASS
- [ ] Anteil 8–14 % → Refactor-Sprint nächstes Quartal planen
- [ ] Anteil < 8 % → sofort handeln, größere Refactoring-Phase
      einlegen

## B. Duplikations-Scan (jscpd)

```bash
npx jscpd --min-tokens 50 --reporters json,html \
  --output ./audits/jscpd-<projekt>-Q<n> ./src
```

- [ ] Duplikations-Anteil < 5 % → PASS
- [ ] 5–10 % → Top-3-Cluster im nächsten Sprint konsolidieren
- [ ] > 10 % → kritisch, Refactoring vor neuen Features

## C. Datei-Längen-Limits

- [ ] Audit-Lauf: keine Datei > 500 Zeilen (effective)
- [ ] Über-langes splitten ODER `## Split-Plan` in HANDOFF.md
      mit konkretem Zerlege-Vorschlag
- [ ] Keine Datei > 1000 Zeilen → harte Grenze

## D. Funktions-Längen-Limits

- [ ] Audit-Lauf: keine Funktion > 100 Zeilen
- [ ] Über-langes refactoren ODER `// HEALTH-EXEMPT: <Begründung>`
      direkt vor der Funktion
- [ ] Keine Funktion > 200 Zeilen → harte Grenze

## E. Black-Box-Anteil dokumentieren

In `HANDOFF.md`, Abschnitt `## Code-Health`:

- [ ] Black-Box-Anteil (KI-generiert, ungelesen) geschätzt
- [ ] Refactoring-Anteil letztes Quartal dokumentiert
- [ ] jscpd-Score dokumentiert
- [ ] Längste Funktion + Pfad
- [ ] Größte Datei + Pfad

## F. Quartals-Budget-Buchung

Falls die Werte gerissen werden:

- [ ] Refactor-Sprint im nächsten Quartal mit Datum + Umfang in
      HANDOFF.md eingeplant
- [ ] Mind. 1 PR pro Sprint mit `refactor:`-Präfix
- [ ] Beim nächsten Re-Review (Standard 021) Verbesserung verifizieren

---

## Wann Hard-Pause sinnvoll ist

Wenn 2 Quartale in Folge:

- Refactoring-Anteil < 8 %
- Duplikation > 10 %
- ≥ 1 Funktion > 200 Zeilen ohne EXEMPT

→ **Feature-Freeze für 2 Wochen**, nur Refactoring-Commits, dann
re-evaluieren. Statistik aus VULN-CATALOG G1/G2/G3 sagt: ohne
diese Pause kommt der Live-Bug aus der Klasse mit hoher
Wahrscheinlichkeit im 3. Quartal.

## Cross-Reference

- 005 Test-First — Coverage ist orthogonal
- 013 Section A — Black-Box-% beim Initial-Launch
- 021 Re-Review — quartalsweise auch HANDOFF-Update
