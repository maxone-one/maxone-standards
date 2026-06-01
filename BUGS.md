# BUGS: maxone-standards

## Aktive Bugs

<!-- Neue Einträge hier einfügen. Format: BUG-NNN mit fortlaufender Nummer. -->
<!-- Eintrag anlegen sobald ein Ansatz fehlschlägt oder ein Bug > 1 Session braucht. -->

---

## Geschlossene Bugs

<!-- Fixe Bugs hierher verschieben. Fehlgeschlagene Ansätze stehen lassen, -->
<!-- sie verhindern dass dieselben Wege erneut probiert werden. -->

### BUG-001: YAML-Parse-Fehler in registry/exceptions.yml (GESCHLOSSEN)
**Status:** fixed
**Erstellt:** 2026-05-12
**Geschlossen:** 2026-05-12 (Commit in Compliance-Sprint)
**Muster:** `yaml-unquoted-colon-in-value`
**Symptom:** `registry/exceptions.yml` verursachte Parse-Fehler → alle Ausnahmen wurden ignoriert → Audit zeigt false-positive FAILs.
**Root Cause:** `build:` im `reason`-Feld ohne Anführungszeichen, YAML interpretiert den Doppelpunkt als Mapping-Start.
**Fix:** Quotes um den `reason`-String in allen betroffenen Einträgen.

### BUG-002: audit.mjs Artifact-Upload überschreitet Org-Quota (GESCHLOSSEN)
**Status:** fixed
**Erstellt:** 2026-04-28
**Geschlossen:** 2026-04-28 (Commit `d4fcebb`)
**Muster:** `gh-actions-artifact-quota`
**Symptom:** `actions/upload-artifact@v4` schlägt mit „Org Artifact Storage Quota hit" fehl, scheduled-audit.yml bricht ab.
**Root Cause:** Org-Artifact-Storage ist shared, von anderen Repos leergesaugt.
**Fix:** Kein Artifact-Upload mehr; Audit-Output wird stattdessen per `git commit` nach `audits/` gepusht (~17 KB, diffbar via `git log audits/`). Workflow braucht `permissions: contents: write`.

### BUG-003: audit.mjs Crash unsichtbar durch `set +e` (GESCHLOSSEN)
**Status:** fixed
**Erstellt:** 2026-04-28
**Geschlossen:** 2026-04-28 (Commit `d4fcebb`)
**Muster:** `shell-set-plus-e-swallows-error`
**Symptom:** scheduled-audit.yml meldete Success obwohl audit.mjs einen 17-Zeilen-Stack-Trace produziert hatte.
**Root Cause:** `set +e` unterdrückt Exit-Codes; Workflow-Step sah `0` auch bei Crash.
**Fix:** Heuristik `grep -q '^--- Summary ---'` nach dem Audit-Step, failt den Step wenn die Summary-Sektion fehlt.

### BUG-004: audit.mjs Comment-Zeilen-Filter false positive auf `--until=` (GESCHLOSSEN)
**Status:** fixed
**Erstellt:** 2026-05-18b
**Geschlossen:** 2026-05-18b (Commit in 047-Sprint)
**Muster:** `audit-comment-line-false-positive`
**Symptom:** `047-disk-guard` check flaggte `--until=` in Code-Kommentaren als valide `--until=24h`-Option und zählte fälschlicherweise.
**Root Cause:** Regex prüfte auf `--until=` ohne Kontext-Check, ob es sich um einen Kommentar handelt.
**Fix:** Comment-line-Filter im audit.mjs-Check ergänzt.

---
