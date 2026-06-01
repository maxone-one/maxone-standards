# Checkliste: 021: Re-Review-Reminder

Alle 180 Tage pro Live-Projekt. Stichtag aus `last_review_date` in
`registry/projects.yml`.

---

## A. Vorbereitung

- [ ] `last_review_date` aus Registry lesen
- [ ] LAUNCH-REVIEW.md des Projekts öffnen (Standard 013)
- [ ] Diff seit letztem Review: `git log --since=<last_review_date> --oneline`

## B. Audit-Lauf

- [ ] `node scripts/audit.mjs --project=<name>` läuft komplett durch
- [ ] Alle FAILs gefixt
- [ ] Alle WARNs entweder gefixt oder mit Begründung dokumentiert
- [ ] PASS-Stand erreicht oder bewusst akzeptiert

## C. Section J Re-Walkthrough (Vibe-Coding-Lücken)

Aus Standard 013 Section J, jeder Punkt erneut bestätigen:

- [ ] J1, XSS / DOM-Sanitization
- [ ] J2, Log-Injection / strukturiertes Logging
- [ ] J3, SSRF (Allowlist für externe Fetches)
- [ ] J4, keine Hardcoded Secrets im Bundle
- [ ] J5, Hallucination-Check (existieren alle referenzierten Libs?)
- [ ] J6, Unauth-Routes-Liste aktuell
- [ ] J7, BOLA-Test (User-A vs User-B curl) erneut durchgeführt
- [ ] J8, Plattform-Lock-in: noch immer kein Lovable/Bolt/Base44 drin?

## D. DSGVO-Diffs (Standard 017)

- [ ] HTML-Pattern-Scan: neue Tracker / Embeds seit letztem Review?
- [ ] Wenn ja: Consent-Banner + AVV-Liste aktualisiert?
- [ ] Webbkoll-Scan auf der Live-Domain: keine neuen US-Hosts

## E. Drift-Detektoren

- [ ] 018 Bundle-Drift PASS
- [ ] 019 Cert + DNS-Realität PASS
- [ ] 020 Pen-Test-Light PASS

## F. Sign-Off + Registry-Update

- [ ] LAUNCH-REVIEW.md → Re-Reviews-Tabelle erweitert mit:
      Datum, Auditor, Findings, Aktion
- [ ] `registry/projects.yml`: `last_review_date:` auf heute gesetzt
- [ ] Falls Verschiebung nötig: `review_postponed_to:` mit Begründung

## G. Wenn Re-Review nicht durchgeführt werden kann

Eine der drei Optionen wählen:

- [ ] **Verschoben** (max +30 Tage): `review_postponed_to: YYYY-MM-DD`
      mit Kommentar in der Registry
- [ ] **Pausiert**: `status: paused` (DNS off / Container off)
- [ ] **Sunset eingeleitet**: `status: sunset-pending` →
      Standard 014 (Sunset-Prozess) anstoßen

---

## Zeitbudget

- Audit grün, keine Findings: **~30 min** pro Projekt
- 1-3 kleine Findings: **~1 h** pro Projekt
- Größere Findings (Bundle-Drift, Cert ab, Tracker neu): **~2-3 h**

## Trigger für sofortigen Re-Review (auch vor 180 Tagen)

- Major-Release / großes Feature live
- DSGVO-relevanter Vorfall (Drittanbieter, Consent, Datenpanne irgendwo)
- Stack-Change (z.B. Auth-System getauscht, neue DB-Library)
- Externer Pen-Test-Bericht mit Findings
