# 021 — Re-Review-Reminder (live-Projekte periodisch neu prüfen)

**Status:** active
**Seit:** 2026-04-28
**Gilt für:** alle Projekte mit `status: live`

## Regel

Jedes Live-Projekt durchläuft alle **180 Tage** einen verkürzten Gate-3-
Re-Review (Standard 013). Stichtag = `last_review_date` aus
`registry/projects.yml`. Nach 180 Tagen → WARN, nach 270 Tagen → FAIL.

Re-Review-Umfang:

1. **Audit-Lauf** — `node scripts/audit.mjs --project=<name>` muss PASSen
2. **Section J** des LAUNCH-REVIEW.md durchgehen (Vibe-Coding-Lücken-
   Check) — alle Punkte erneut bestätigen
3. **DSGVO-Diffs** — neue Tracker / Embeds / Drittdienste seit letztem
   Review? Wenn ja → 017-Audit + Consent-Anpassung
4. **Bundle-Drift-Check** — 018-Audit muss PASSen (kein
   `panel.maxone.studio`, keine Source-Maps, keine alten Watermarks)
5. **Cert-/DNS-Realität** — 019-Audit muss PASSen
6. **Pen-Test-Light** — 020-Audit muss PASSen
7. **Sign-Off** in LAUNCH-REVIEW.md mit neuem Datum + verantwortlicher
   Person

Aufwand pro Re-Review: ~30 min wenn alles grün, ~2 h wenn Findings.

## Warum

Drift ist das Schleichende. Code, der vor 6 Monaten sauber war, hat heute:

- **Veraltete Dependencies** mit zwischenzeitlich entdeckten CVEs
  (npm audit zeigt heute Findings, die letzten Monat noch keine waren)
- **Drittdienste, die "irgendwann reingerutscht" sind** — neuer Embed,
  neuer Tracker, neuer Webhook ohne Sig-Check
- **Bundle-Reste** von migrierten Domains
  (Beispiel: repivot lud `panel.maxone.studio` 2 Monate nach Domain-
  Migration noch live, gefunden 2026-04-27 durch 018-Audit)
- **Cert-Drift** — Renewals, die fehlschlagen, ohne dass jemand es merkt
  (Beispiel: vanfree TLS-Handshake-FAIL, gefunden 2026-04-27 durch 019)
- **Stack-Whitelist-Verletzungen** — eine schnelle Lovable-/Bolt-Code-
  Übernahme von einem Kunden, ohne dass 016 nachgezogen wurde

**Das eigentliche Problem:** ein Projekt, das einmal Gate-3 bestanden
hat, "ist live" — und niemand schaut mehr hin. Die ursprüngliche
Compliance war ein Snapshot, kein Dauerzustand. Standard 021 macht das
explizit zum Prozess.

**Nicht-rhetorische Frage:** wann hast du zuletzt
`stadtlahnflow.de` Section J Punkt für Punkt durchgegangen? Eben.

## Wie anwenden

### Bei Gate-3 (initial Live-Gang)

`registry/projects.yml` bekommt das Pflichtfeld `last_review_date:`
(YYYY-MM-DD). Wird auf das Sign-Off-Datum aus LAUNCH-REVIEW.md gesetzt.

```yaml
- name: stadtlahnflow
  status: live
  last_review_date: 2026-03-12
  ...
```

### Bei jedem Re-Review (alle 180 Tage)

1. **Audit-Lauf:** `node scripts/audit.mjs --project=<name>`
2. Bei Findings: fixen, neu auditen, bis PASS
3. **Section-J-Walkthrough:** LAUNCH-REVIEW.md öffnen, jede J-Zeile
   durchnicken (oder neu öffnen, wenn was kaputt)
4. **Sign-Off-Block** in LAUNCH-REVIEW.md erweitern:
   ```markdown
   ## Re-Reviews

   | Datum       | Auditor | Findings | Aktion |
   |-------------|---------|----------|--------|
   | 2026-09-15  | Max     | keine    | PASS  |
   | 2026-04-28  | Max     | Bundle-Drift bei repivot | gefixt + redeployed |
   ```
5. `registry/projects.yml`: `last_review_date:` auf heute aktualisieren

### Wenn ein Re-Review nicht durchgeführt werden kann

Optionen:

- **Re-Review verschieben** (max +30 Tage): in `registry` Feld
  `review_postponed_to: YYYY-MM-DD` mit Begründung in einem Kommentar.
  Audit warnt weiterhin, aber WARN statt FAIL bis zum neuen Datum.
- **Projekt auf `status: paused`** setzen: pausierte Projekte sind nicht
  re-review-pflichtig, aber auch nicht öffentlich erreichbar.
- **Projekt auf `status: sunset-pending`** setzen: löst Standard 014
  (Sunset-Prozess) aus.

### Cron / Erinnerung

VECTOR-Cron läuft `node scripts/audit.mjs --standard=021` wöchentlich
und alarmiert via Telegram bei:

- WARN: Re-Review fällig in < 14 Tagen
- WARN: Re-Review überfällig (> 180 Tage)
- FAIL: kritisch überfällig (> 270 Tage)

## Was diese Regel NICHT erzwingt

- **Keinen vollständigen Penetrationstest** alle 180 Tage — das wäre
  unverhältnismäßig. Manueller Tiefen-Pen-Test bleibt Standard 020 +
  013 Section J + bewusste Diskussion.
- **Kein Refactoring-Sprint** — Code-Health ist Standard 024 (geplant).
- **Kein Stakeholder-Approval** für Bestand-Projekte — der Re-Review
  ist technisch, nicht organisatorisch.

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live`:

1. **`last_review_date`** existiert in `registry/projects.yml`
   - Fehlt → FAIL (initialer Gate-3 nicht dokumentiert)
2. **Alter berechnen:** `(heute - last_review_date)` in Tagen
   - 0–179 Tage → PASS
   - 180–269 Tage → WARN (Re-Review fällig)
   - ≥ 270 Tage → FAIL (kritisch überfällig)
3. **`review_postponed_to`** falls gesetzt:
   - In Zukunft → WARN herabgestuft (Verschiebung anerkannt, aber
     trotzdem sichtbar)
   - In Vergangenheit → unwirksam, Audit ignoriert es

PASS = Re-Review < 180 Tage alt.
WARN = Re-Review fällig (180–269 Tage) oder verschoben.
FAIL = Re-Review fehlt komplett oder > 270 Tage alt.

## Cross-Reference

- 013 LAUNCH-REVIEW.md — Was beim Re-Review zu prüfen ist
- 014 Sunset — Wenn ein Projekt nicht mehr re-reviewt werden soll
- 018 Bundle-Drift / 019 Cert+DNS / 020 Pen-Test-Light — die
  automatischen Drift-Detektoren, die zwischen den Re-Reviews laufen
- VECTOR-Cron — Operativer Mechanismus für die Erinnerung
