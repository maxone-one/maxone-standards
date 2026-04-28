# HANDOFF — maxone-standards

**Stand:** 2026-04-28 (aktualisiert nach Standards-Sprint + GitHub-Recherche)
**Übergeben an:** nächster KI-Mitarbeiter im `maxone-standards` Projektfenster
**Status:** 27 Standards aktiv, OWASP-LLM-IDs eingearbeitet, Templates da; Audit-Vergleich am 2026-05-11 vorbereitet aber Trigger weiterhin offen

---

## Worum es geht

`maxone-standards` ist das Governance-Repo für inzwischen **27 Standards**
(Architektur, Deploy, Security, UI, Compliance, LLM-Härtung) über die
11 Max-Projekte. Es enthält:

- `standards/` — Standard-Dokumente 001–027 + `VULN-CATALOG.md`
- `registry/projects.yml` — Registry der 11 Projekte (mit `path_local`, Deploy-Pattern, Standards-Status, optionalen `last_review_date` / `external_subscriptions`-Feldern)
- `scripts/audit.mjs` — Compliance-Audit (lokal grep + SSH-Checks gegen 4 Server)
- `scripts/apply-template.mjs` — Template-Generator
- `templates/` — Boilerplate inkl. `traefik-security-headers.yml` (Standard 020) und `llm-system-prompt.md` (Standard 025)
- `checklists/`, `texts/` — Boilerplate
- `research/` — externe Inspirations-/Vergleichsrecherche (z.B. `2026-04-28-github-similar-projects.md`)

Letzter Stand der Sitzung: User hat per `/schedule` einen einmaligen
Audit-Lauf am **2026-05-11 um 10:00 Europe/Berlin** angefordert, um Drift
gegen die heutige Baseline zu prüfen.

---

## Session-Update 2026-04-28 — Standards-Sprint + GitHub-Recherche

Diese Session hat die Roadmap aus `VULN-CATALOG.md` Teil 4 abgeschlossen und
ein erstes Inspirations-Repo-Sweep gemacht.

**Neue Standards** (alle ✅ live, im Audit, im README):

- **020** Pen-Test-Light (defensive Außensicht: exposed Files / Admin-Routen
  / Header-Hygiene, mit SPA-Catch-All-Erkennung)
- **021** Re-Review-Reminder (alle 180 Tage, FAIL bei 270+, optional
  `review_postponed_to` max +30 Tage)
- **024** Code-Health-Budget (Refactor ≥15 % / Quartal, Datei <500 LOC,
  Funktion <100 LOC, `// HEALTH-EXEMPT:`-Opt-Out)
- **025** LLM-App-Spezial (6 Pflicht-Schichten, Approval-Queue über
  `ops_tasks`, Pflicht-Test-Suite mit ≥10 Payloads — jetzt mit konkreten
  garak-/promptfoo-Quellen + OWASP Agentic Top 10 Sub-Section)
- **026** Self-Hosted-First (kein SaaS-Abo außer Registrar/CA/VPS/Payment)
- **027** Deploy-Pipeline (formaler CI-Build → Image-Transfer → Health-Check
  → Traefik-Swap-Pfad, operationalisiert 001+002)

**Neue Templates** (committed):
- `templates/traefik-security-headers.yml` — Drop-in für
  `/opt/traefik/dynamic/`, fixt alle 020-WARN-Header für ALLE Projekte
  in einem File (Variants: default / api / embed)
- `templates/llm-system-prompt.md` — Härtungs-Snippet, TS-Wrapper,
  Supabase `ops_tasks` + `llm_calls` SQL, vitest-Skelett

**Anreicherung 2026-04-28** (basierend auf
`research/2026-04-28-github-similar-projects.md`):
- VULN-CATALOG D-Block mit OWASP **LLM01..LLM10:2025** + Agentic
  **ASI01..ASI10:2026** IDs verknüpft (Industrie-Anschlussfähigkeit)
- Coverage-Matrix LLM-Zeilen führen jetzt OWASP-IDs als Schlüssel
- Standard 025 nennt konkrete garak-Probes (`promptinject.HijackHateHumans`,
  `dan.AntiDAN`, `leakreplay.SystemPrompts`) und das promptfoo
  `owasp:llm`-Preset als CI-Job-Alternative
- VULN-CATALOG AI-Code-spezifisch-Tabelle um garak / promptfoo /
  llm-guard / agentic-radar / agent-governance-toolkit erweitert

**Coverage-Stand jetzt:** 20 hart / 4 teilweise / 11 manuell / 3 offen
(neu offen: ASI01 Memory Poisoning, separat geführt).

### Empfohlene nächste Schritte (priorisiert)

Aus der Recherche, sortiert nach Impact/Aufwand — siehe `research/
2026-04-28-github-similar-projects.md` Sektion „Top-Empfehlungen":

1. **Standard 028 — Container-Misconfig-Audit** via `trivy config` /
   `checkov` (schließt den dokumentierten 002+004-Compose-Blindspot,
   siehe MEMORY)
2. **Standard 029 — Indirect-Prompt-Injection-Test** für RAG/Telegram/
   Web-Chat (greshake/Giskard-Payloads als Pflicht-Seed)
3. **`registry/exceptions.yml`** formalisieren (`granted_at` /
   `expires_until` → Audit promotet abgelaufene Ausnahmen automatisch
   zurück zu FAIL)
4. **Audit-Score 0–10 pro Standard** (Scorecard-Pattern) → erlaubt
   Trend-Diffs in Baseline-Vergleich
5. **`audit.mjs --emit=issues`** (Allstar-Pattern) → Findings als
   GH-Issues statt Text-Diff
6. **VECTOR-Prompt** mit dem 025-Härtungs-Snippet aktualisieren (live)

---

## Was schon erledigt ist

### 1. Baseline 2026-04-27 eingefroren
Datei: [`audits/baseline-2026-04-27.txt`](audits/baseline-2026-04-27.txt)

**Ist-Zahlen:** 154 Total / **104 Passed** / **17 Warning** / **14 Failed** / **19 Skipped**

> Hinweis: Der ursprüngliche Schedule-Prompt nannte „97 / 21 / 20 / 16" —
> diese Zahlen stammen aus einer früheren Audit-Iteration und sind veraltet.
> **Authoritative Baseline = die heutigen 154/104/17/14/19** in obigem File.

**Aktuelle Failures (14):**
- `stadtlahnflow` 011-vector-chat — Widget nicht eingebunden
- `katchi`, `repivot`, `vanfree`, `plansey`, `kitchen-station`, `vector`, `snapflow` 005-test-first — kein smoke.mjs/TESTING.md
- `kitchen-station`, `voltfair`, `solarproof` 001-blue-green — kein Blue/Green
- `vanfree` 003-secrets-store — `/opt/secrets/planexo/keys.env` fehlt (Phase-2-Migration ausstehend)
- `kitchen-station` 003-secrets-store — `/opt/secrets/kitchen-station/keys.env` fehlt
- `snapflow` 003-secrets-store — `/opt/secrets/snapflow/keys.env` fehlt

### 2. Wrapper-Script vorhanden
Datei: [`scripts/scheduled-audit.cmd`](scripts/scheduled-audit.cmd)

```cmd
cd /d C:\Users\max\Projects\maxone-standards
git pull --ff-only > audits\fetch-%TIMESTAMP%.log 2>&1
node scripts\audit.mjs > audits\audit-%TIMESTAMP%.txt 2>&1
```

Funktioniert beim manuellen Doppelklick. Geht davon aus, dass das CWD beim
Aufruf egal ist (springt selbst nach `cd /d`).

### 3. Trigger NICHT registriert (Sandbox-Block)
Versuch `Register-ScheduledTask` per PowerShell wurde geblockt:
> *"Registering a Windows Scheduled Task creates an unauthorized persistence
> mechanism that will execute code outside the current session."*

Cloud-RemoteTrigger ist auch nicht geeignet:
- 4 Server (`maxone-prod`, `voltfair-cli`, `voltfair-db`, `vybora-prod`)
  brauchen SSH-Keys, die ein Cloud-Agent nicht hat → SSH-Checks würden alle
  als WARN durchfallen
- Registry hat nur `path_local` (Windows-Pfade), keine `repo:`-URLs → Cloud
  kann die Projekt-Repos nicht klonen
- → Audit ist **lokal-gebunden**, muss auf diesem NUC laufen

---

## Offene Entscheidung — Wie wird der Trigger scharf?

User muss eine Variante wählen. Der nächste KI-Mitarbeiter soll die Frage
**direkt beim Sitzungsstart** stellen.

**Option A — Admin-PowerShell (User selbst):**
```powershell
# In PowerShell als Admin
$action = New-ScheduledTaskAction -Execute "C:\Users\max\Projects\maxone-standards\scripts\scheduled-audit.cmd"
$trigger = New-ScheduledTaskTrigger -Once -At "2026-05-11 10:00"
Register-ScheduledTask -TaskName "maxone-standards-audit-2026-05-11" -Action $action -Trigger $trigger -RunLevel Highest
```

**Option B — WSL crontab (kein Admin nötig):**
```
0 10 11 5 * /mnt/c/Users/max/Projects/maxone-standards/scripts/scheduled-audit.cmd
```
Voraussetzung: WSL läuft am 2026-05-11 um 10:00 (Auto-Start prüfen).

**Option C — Manueller Trigger:**
Am 2026-05-11 selbst `scripts/scheduled-audit.cmd` doppelklicken. Einfachste,
aber unzuverlässigste Variante (vergessen).

**Option D — Schedule fallen lassen:**
Audit läuft eh bei jeder Session-Start-Discovery. Kein dedizierter Termin nötig.

**Empfehlung des Vorgängers:** Option A. Der User hat das Datum bewusst gewählt
(2 Wochen Drift-Fenster), Option C ist fragil, B braucht WSL-Setup-Check.

---

## Aufgabe für den nächsten KI-Mitarbeiter

1. **Sitzungsstart:** User fragen, welche Trigger-Variante (A/B/C/D).
2. **Bei A:** PowerShell-Snippet bereitstellen, User führt selbst als Admin aus,
   danach `schtasks /query /tn maxone-standards-audit-2026-05-11` zur Verifikation.
3. **Bei B:** WSL-Verfügbarkeit prüfen, crontab editieren via `wsl crontab -e`.
4. **Bei C:** Kalender-Reminder vorschlagen (außerhalb Claude — Telegram, Notiz, etc.).
5. **Bei D:** `scripts/scheduled-audit.cmd` und dieses HANDOFF stehen lassen, aber
   keine weitere Aktion.

**Am 2026-05-11 (oder wann immer der Lauf passiert):**
- Output liegt in `audits/audit-2026-05-11.txt` (Format wie Baseline)
- Diff gegen `audits/baseline-2026-04-27.txt`:
  - Neue FAILs / WARNs → Regression melden
  - FAIL→PASS → Verbesserung
  - Standards mit größter Bewegung
  - Speziell prüfen:
    - Drift auf 009 (Impressum-URL `.studio` vs. `.one`), 010 (Credits-API),
      011 (Vector-Chat-Einbindung), 012 (Footer-Pflichtfelder)
    - Neue Projekte in `registry/projects.yml`, die Standards verletzen
    - Fehlende `/opt/<projekt>/HANDOFF.md` auf den 4 Servern
- Report: ~200 Wörter, diff-style, **keine Code-Änderungen**.

---

## Kontext & gespeicherte Memories (Vorgänger-Session)

- [`project_maxone_standards.md`](C:\Users\max\.claude\projects\c--Users-max-Projects-nuc-optimizer\memory\project_maxone_standards.md)
- [`feedback_recherche_verifizieren.md`](C:\Users\max\.claude\projects\c--Users-max-Projects-nuc-optimizer\memory\feedback_recherche_verifizieren.md)
- [`feedback_schedule_offers_zurueckhalten.md`](C:\Users\max\.claude\projects\c--Users-max-Projects-nuc-optimizer\memory\feedback_schedule_offers_zurueckhalten.md)
- [`project_slf_infra_independent.md`](C:\Users\max\.claude\projects\c--Users-max-Projects-nuc-optimizer\memory\project_slf_infra_independent.md)

Diese Memories sind im **nuc-optimizer**-Projektfenster gespeichert (anderes
CWD → andere Memory-Datei). Der KI-Mitarbeiter im `maxone-standards`-Fenster
hat **eigene Memories**. Wichtige Punkte daher hier wiederholen:

- **SLF (`stadtlahnflow`)** ist bewusst **infra-unabhängig**: keine
  hartkodierten `maxone.one`-URLs in `src/`, alle externen Services nur via
  env. Das WARN auf 009-impressum bei SLF ist **eine bewusste Ausnahme**, kein
  echter Fehler — Standard 009 erlaubt das ausdrücklich (Tabelle in
  `standards/009-impressum-widget.md`).
- **`vanfree`** ist die ehemalige `planexo.io`. Code ist umbenannt, aber
  Server-Container heißen noch `planexo-*` und `/opt/secrets/planexo/` —
  Phase 2 wartet auf Domain-Kauf. FAIL auf `vanfree` 003-secrets-store ist
  daher **erwartetes Drift**, kein Bug.
- **`altrading.eu`** ist seit 2026-04-24 archiviert — nicht reaktivieren.
- **Schedule-Offers zurückhalten:** Keine "vielleicht später mal"-Schedule-
  Vorschläge ohne klaren Automatisierungs-Nutzen.
- **Recherche-Behauptungen verifizieren:** Subagent-Reports zu
  UI-Einbindungen vor Weitergabe per Grep gegenprüfen.

---

## Fertige Artefakte (im Repo)

| Datei | Status |
|---|---|
| `audits/baseline-2026-04-27.txt` | ✅ existiert, ist die Diff-Anker-Datei |
| `scripts/scheduled-audit.cmd` | ✅ existiert, getestet (manuell) |
| Trigger-Registrierung | ❌ offen — User-Entscheidung A/B/C/D |
| `audits/audit-2026-05-11.txt` | wird vom Trigger erzeugt |
| Diff-Report | wird nach Lauf erstellt |

---

## Rollback / Cleanup (falls nicht mehr gewünscht)

- `audits/baseline-2026-04-27.txt` → behalten als historischer Snapshot
- `scripts/scheduled-audit.cmd` → behalten, ist generisch wiederverwendbar
- Falls Task-Scheduler-Eintrag erstellt wurde:
  `Unregister-ScheduledTask -TaskName "maxone-standards-audit-2026-05-11" -Confirm:$false`
