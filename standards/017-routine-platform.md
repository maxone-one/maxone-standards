# 017: Routine-Platform: keine Cron-Logik in IDE/Claude-Sitzungen

**Status:** active
**Seit:** 2026-04-28
**Gilt für:** alle Projekte mit wiederkehrenden Aufgaben (Audits,
Backups, Health-Checks, Reminders, Re-Review-Cron, Mail-Watchdogs,
Bundle-Drift-Scans, …), egal ob Code-Repo, Server-Service oder
Standalone-Skript.

## Regel

Jede Routine, die wiederkehrend laufen muss, **MUSS** auf einer
Plattform laufen, die **unabhängig** von Claude-Sitzungen, IDE-Instanzen
und User-Login-Zustand ist.

**Erlaubte Plattformen (Pflicht-Auswahl):**

1. **Heartbeats, server-seitig, idle-fähig:**
   - GitHub Actions `schedule:`-Trigger (vorzugsweise auf `self-hosted`
     Runner `voltfair-server`)
   - `systemd`-Timer auf `maxone-prod`/`voltfair-cli`/`voltfair-db`/
     `vybora-prod`
   - Hetzner-`crontab` (root oder service-User)
   - Supabase `pg_cron` (für DB-nahe Routinen)
   - Brevo „Marketing-Automation" (nur für Mail-Versand-Trigger)
2. **Agenten, 24/7-Container mit Scheduler-Loop:**
   - **VECTOR** (`vector-blue`/`vector-green` auf maxone-prod), siehe
     `/opt/vector/IDENTITY.md`. VECTOR hat eine `cron`-Loop und kann
     Telegram-/Mail-Reminders, Health-Checks, `ops_tasks`-Drainer
     fahren.
   - Eigene Watchdog-Container (z.B. `zentinel-watchdog`,
     `brevo-bounce-watchdog`)

**Verbotene Plattformen für produktiv-relevante Routinen:**

- Windows Task Scheduler auf User-NUC (`Register-ScheduledTask`,
  `schtasks /create`)
- WSL-`crontab` auf User-NUC (läuft nur, wenn WSL läuft)
- Claude Code `/schedule` für Datendienste, Backups, Audits,
  Compliance-Cron, OK ist es nur für **persönliche** Reminder, die
  nichts kaputt machen können wenn sie aussetzen
- IDE-Tasks (Cursor, Vybora, Antigravity, VS Code Tasks-Pane) für
  wiederkehrende Jobs
- „Doppelklick beim nächsten Login"-Trigger (`*.cmd`/`*.ps1` ohne
  Scheduler-Anbindung)
- Manuelle Erinnerungen via Kalender, Mail, Sticky-Notes als
  alleiniger Trigger

## Warum

**Konkreter Fall, der diese Regel ausgelöst hat:** `maxone-standards`
HANDOFF.md hatte bis 2026-04-28 vier Optionen für den Drift-Audit am
2026-05-11:

- Option A, Windows Task Scheduler auf User-NUC
- Option B, WSL crontab auf User-NUC
- Option C, manueller Doppelklick auf `scheduled-audit.cmd`
- Option D, Audit fallen lassen, „läuft eh bei Session-Start"

**Alle vier sind kaputt.** A und B sterben, sobald der NUC aus ist
oder die WSL-Distro nicht startet. C ist ein User-Reminder ohne
Garantie. D ist „Hoffen statt Audit". In Summe: das Audit hängt am
User-Bewusstsein, nicht an der Infrastruktur. Genau das ist Drift-
Erzeugung statt Drift-Schutz.

**Gemeinsame Failure-Modes von IDE-/Claude-abhängigen Routinen:**

1. **Stille Aussetzer**, User merkt erst nach Wochen, dass der
   tägliche Drift-Scan nicht mehr läuft. Standards 018 (Bundle-Drift),
   019 (Cert/DNS), 030 (Mail-Architektur) verlieren ihre Wirkung,
   weil sie keine Heartbeats haben.
2. **Single Point of Failure**, User-Maschine = der einzige Knoten.
   Hardware-Defekt, OS-Update, IDE-Crash, NVMe-Tausch → Routine weg.
3. **Keine Audit-Spur**, Wenn die Routine nichts geloggt hat, weil
   sie nicht lief, ist der Failure unsichtbar. Ein systemd-Timer
   schreibt mindestens `journalctl` rein; eine GH-Actions-Run hat
   eine permanente URL.
4. **Verlust beim Tool-Wechsel**, Max wechselt zwischen Claude
   Code / Cursor / Vybora / Antigravity (siehe globale Multi-
   Umgebung-Regel). Eine Routine, die in der `.vscode/tasks.json`
   einer Umgebung steckt, ist in der nächsten Umgebung verloren.

**Maxone-Pattern, das funktioniert:**

- **VECTOR** lebt in `vector-blue`/`vector-green`-Containern und hat
  eine eigene Scheduler-Loop (siehe `/opt/vector/IDENTITY.md`).
  Telegram-Reminders, Health-Checks, `ops_tasks`-Bearbeitung laufen
  unabhängig vom User.
- **`brevo-bounce-watchdog.timer`** (systemd auf maxone-prod), fängt
  jede stillschweigend abgewiesene Sender-Domain (Standard 016 /
  Bibel Regel 12+20).
- **`zentinel-watchdog`** (systemd auf maxone-prod), `unban-stalwart.sh`
  + `circuit-breaker-drill.sh`.
- **`zync-healthcheck`**, VECTOR fährt alle 30 min Healthcheck für
  Growee Instagram Bot, alarmiert via Telegram (siehe globale
  CLAUDE.md, Test-First-Block).

Diese laufen auch dann, wenn Max im Urlaub ist, der NUC aus ist, oder
ein anderes Projekt-Fenster gerade offen hat.

## Wie anwenden

### A. Welche Routinen sind betroffen?

Eine Routine ist „wiederkehrend" und damit dieser Regel unterworfen,
wenn sie:

- regelmäßig laufen soll (täglich / wöchentlich / monatlich /
  Intervall-X)
- ihr Ergebnis Persistent-State berührt (DB, Files, Logs, Mail,
  Container-Restart)
- ihr Ausfall innerhalb von 7 Tagen nicht bemerkbar ist

Beispiele: Drift-Audits, Backups, Cert-Renewal-Watcher, RLS-Linter-
Cron, npm-audit-Cron, Mail-Watchdogs, Re-Review-Reminder (021),
Container-Health-Probes, Daten-Export für DSGVO-Sunset (014).

**Nicht betroffen (Plattform egal):**

- Einmalige Dev-Aufgaben („baue Image lokal", „lösche temp-File")
- Reaktive User-Trigger (Form-Submit löst Backend-Job aus)
- CI/CD-Trigger (Push → Build), die nicht zeitlich wiederkehrend
  sind, sondern Event-getrieben

### B. Plattform-Wahl-Heuristik

| Routine-Typ | Platform | Begründung |
|---|---|---|
| Code-Audit, Drift-Scan | GH Actions `schedule:` auf `self-hosted` Runner | Logs, Permalink, Cron-Syntax |
| Server-State-Check (Disk, RAM, Container-Health) | systemd-Timer + Telegram via VECTOR | direkt am Host, keine SSH-Hops |
| DB-Wartung (Vacuum, Analyze, RLS-Linter-Cron) | Supabase `pg_cron` | läuft im DB-Cluster, Transaktional |
| User-Reminders (Re-Review-Datum, Sunset-Frist) | VECTOR Telegram-Send | Max liest Telegram, nicht Mail-Inbox |
| Cert-Renewal | Traefik built-in (DNS-01-Loop, Standard 002) | bereits idempotent + idle-fähig |
| Mail-Watchdog (Brevo-Bounce, Stalwart-Unban) | systemd-Timer auf maxone-prod | nahe an Mail-Stack |
| LLM-Quota-Check, Token-Status | VECTOR Background-Task | hat OAuth-Token, kann selbst korrigieren |

### C. Migration-Pattern für IDE-abhängige Routinen

1. **Inventar machen:** suche im Repo nach `Register-ScheduledTask`,
   `schtasks`, `*.cmd`-Dateien mit `audit`/`cron`/`backup` im Namen,
   WSL-`crontab`-Snippets in Doku.
2. **Pro Eintrag:** Zielplattform aus Tabelle B wählen.
3. **Workflow oder Timer-Datei anlegen:**
   ```yaml
   # .github/workflows/scheduled-audit.yml
   name: Scheduled Audit
   on:
     schedule:
       - cron: '0 8 * * 1'   # Mo 08:00 UTC
     workflow_dispatch:        # erlaubt manuelles Re-Run
   jobs:
     audit:
       runs-on: self-hosted
       steps:
         - uses: actions/checkout@v4
         - run: node scripts/audit.mjs --emit=issues
         - uses: actions/upload-artifact@v4
           with: { name: audit-output, path: audits/ }
   ```
4. **Alten IDE-Trigger entfernen** (`scheduled-audit.cmd` löschen,
   PowerShell-Snippet aus Doku streichen).
5. **Dry-Run beobachten:** ein Lauf in der Plattform der Wahl,
   dann erst alten Pfad killen.

### D. Workflow für `maxone-standards` selbst

Konkrete Migration für dieses Repo (war der Trigger-Vorfall):

- **Vorher:** `scripts/scheduled-audit.cmd` + Windows-Task-Scheduler-
  Anleitung in HANDOFF.md („Option A/B/C/D")
- **Nachher:** `.github/workflows/audit.yml` mit `schedule: cron`,
  läuft auf `self-hosted` Runner `voltfair-server` (hat SSH-Keys
  zu allen 4 Servern für die SSH-Checks). HANDOFF aktualisiert,
  Option A/B/C entfernt.
- **Stolperstein:** `registry/projects.yml` hat `path_local` mit
  Windows-Pfaden, auf einem Linux-Runner muss das Audit entweder
  die Projekt-Repos selbst klonen (neuer `repo:`-Schlüssel pro
  Projekt) oder das `path_local` per `--root`-Flag überschreibbar
  machen. Folge-Task; ohne ihn läuft das Audit nicht ohne
  manuelle Anpassung auf dem Runner.

### E. Verbotene Patterns (Code/Repo)

- `Register-ScheduledTask -TaskName ...` als Setup-Anleitung in
  Repo-Doku
- `schtasks /create /sc DAILY ...` in Setup-Skripten
- `*.cmd` / `*.bat` / `*.ps1` mit Namen-Pattern `*audit*`,
  `*cron*`, `*backup*`, `*scheduled*`, ohne dass sie nur als
  manuelle Wrapper für eine Heartbeat-Plattform dienen
- `crontab -e` als Setup-Schritt für eine User-Maschine (statt
  Server-Crontab)
- `/schedule <task>` mit Cadence > „einmalig" für Routinen, die in
  6 Monaten noch laufen sollen

## Audit

Audit-ID: `017-routine-platform`. Heuristik pro Projekt:

1. **Hat das Projekt überhaupt Routinen?** Suche im Repo nach
   Heartbeat-Markern (PASS-Indikator) oder IDE-Trigger-Markern
   (FAIL-Indikator):

   **Heartbeat-Marker (positiv):**
   - `.github/workflows/*.yml` mit `schedule:`-Trigger (PASS)
   - `*.timer` / `*.service` Files (systemd) im Repo (PASS)
   - `pg_cron` / `cron.schedule` in SQL-Migrations oder Edge-Funktionen
     (PASS)
   - VECTOR-Container-Verweis in `docker-compose.yml` mit Scheduler-
     Loop oder `ops_tasks`-Polling (PASS)
   - explizit erwähnte Cron-Jobs in `/etc/cron.*` / Hetzner-Cron via
     Doku (PASS)

   **IDE-/User-Trigger-Marker (negativ):**
   - `Register-ScheduledTask` in `*.md` oder `*.ps1` (FAIL)
   - `schtasks /create` (FAIL)
   - `*.cmd`/`*.bat`/`*.ps1` mit Namen-Pattern `*audit*|*scheduled*|
     *cron*|*backup*` ohne Heartbeat-Begleitfile (WARN)
   - `wsl crontab` als Setup-Schritt (FAIL)
   - `/schedule` mit Cadence-Hinweis (`alle X Tage`, `wöchentlich`)
     in Repo-Doku als alleinige Trigger-Quelle (WARN)

2. **Kein Routinen-Marker irgendeiner Art:** SKIP („keine wiederkehrende
   Routine erkannt").

3. **Mindestens ein Heartbeat-Marker, keine IDE-Marker:** PASS.

4. **Heartbeat-Marker UND IDE-Marker:** WARN („IDE-Trigger-Reste
   Migration nicht abgeschlossen, alten Pfad entfernen").

5. **Nur IDE-Marker, kein Heartbeat:** FAIL („Routine läuft auf User-
   Maschine, auf GH Actions / systemd / VECTOR migrieren").

## Cross-Reference

- 021 Re-Review-Reminder, der ursprüngliche Anwendungsfall (Cron
  alle 180 Tage)
- VULN-CATALOG F (Drift-Klassen), alle F-Punkte (DNS, Bundle, Cert,
  Mail) brauchen Detection-Routinen, deren Plattform durch 031
  geregelt ist
- Globale CLAUDE.md „Multi-Umgebung-Koexistenz", IDE-Wechsel macht
  IDE-gebundene Routinen besonders fragil
- VECTOR `/opt/vector/IDENTITY.md`, die zentrale 24/7-Agent-
  Plattform, an die viele Routinen abgegeben werden können
- Standard 001 Deploy-Pipeline, definiert den Self-Hosted-Runner
  `voltfair-server` als Build-Plattform; derselbe Runner kann
  GH-Actions-Cron aufnehmen
- HANDOFF.md, der konkrete Trigger-Vorfall, der diese Regel
  motiviert hat

## Externe Quellen

- GitHub Actions `schedule:`-Trigger Doku
  docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule
- systemd.timer(5) man-page
- Supabase `pg_cron` Doku, supabase.com/docs/guides/database/extensions/pg_cron
- 12-factor app §VIII („Concurrency: scale out via the process model")
  Hintergrund-Prinzip: Routinen sind eigene Prozesse, nicht IDE-
  Subprozesse
