# HANDOFF — maxone-standards

**Stand:** 2026-04-27
**Übergeben von:** Vorgänger-Session (nuc-optimizer Projektfenster)
**Übergeben an:** nächster KI-Mitarbeiter im `maxone-standards` Projektfenster
**Status:** offene Aufgabe — Audit-Vergleich am 2026-05-11 vorbereitet, aber Trigger noch nicht scharf

---

## Worum es geht

`maxone-standards` ist das Governance-Repo für alle 12 Standards (Architektur,
Deploy, Security, UI) über die 11 Max-Projekte. Es enthält:

- `standards/` — die 12 Standard-Dokumente (001–012)
- `registry/projects.yml` — Registry der 11 Projekte (mit `path_local`, Deploy-Pattern, Standards-Status)
- `scripts/audit.mjs` — Compliance-Audit (lokal grep + SSH-Checks gegen 4 Server)
- `scripts/apply-template.mjs` — Template-Generator
- `templates/`, `checklists/`, `texts/` — Boilerplate

Letzter Stand der Sitzung: User hat per `/schedule` einen einmaligen
Audit-Lauf am **2026-05-11 um 10:00 Europe/Berlin** angefordert, um Drift
gegen die heutige Baseline zu prüfen.

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
