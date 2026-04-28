# HANDOFF — maxone-standards

**Stand:** 2026-04-28 (aktualisiert nach Standards-Sprint + GitHub-Recherche + Standard 028 + 029 + 030 + 031 + Bibel-Integration + Routine-Migration + Parallel-Session-Merge mit Standard 032)
**Übergeben an:** nächster KI-Mitarbeiter im `maxone-standards` Projektfenster
**Status:** 32 Standards aktiv, OWASP-LLM-IDs eingearbeitet, Templates da; Audit-Vergleich am 2026-05-11 läuft jetzt als GH-Action `schedule:` auf `voltfair-server`-Runner (heartbeat-platform statt User-NUC)

---

## Worum es geht

`maxone-standards` ist das Governance-Repo für inzwischen **32 Standards**
(Architektur, Deploy, Security, UI, Compliance, LLM-Härtung, Mail, Ops, Auth) über die
11 Max-Projekte. Es enthält:

- `standards/` — Standard-Dokumente 001–032 + `VULN-CATALOG.md`
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

**Coverage-Stand jetzt:** 21 hart / 4 teilweise / 11 manuell / 3 offen
(neu hart: B6 Container-Misconfig via 028; neu offen: ASI01 Memory Poisoning,
separat geführt).

**Neu in der Session: Standard 028 — Container-Misconfig-Audit**
- `standards/028-container-misconfig.md` — 7 Pflicht-Klassen pro Compose:
  3 FAIL (privileged ohne `# audit:`-Kommentar, inline-secrets, `:latest`-
  Pull) + 4 WARN (mem_limit, restart, docker.sock, env_file aus
  `/opt/secrets/`)
- Audit-Check als `analyzeCompose()`-Helper in `scripts/audit.mjs`,
  doppelt registriert: `028-container-misconfig-local` (Repo-Root-Fallback)
  und `028-container-misconfig` (SSH-authoritativ gegen
  `/opt/<projekt>/docker-compose.yml`)
- **Maxone-CI-Build-Pattern explizit als Ausnahme:** `image: <name>:latest`
  + `build:`-Block bleibt PASS (Image entsteht im CI/lokal, wird via
  `docker save | docker load` transferiert — kein Registry-Pull)
- Live-Verify-Findings: stadtlahnflow + katchi haben `image: <name>:latest`
  ohne `build:`-Block (CLAUDE.md global rule violation), vanfree pulled
  `ghcr.io/maxone-studio-org/planexo.io:latest` (echter Registry-Pull),
  plansey nutzt `minio/minio:latest` (3rd-party, sollte SHA-pinned sein)

### Empfohlene nächste Schritte (priorisiert)

Aus der Recherche, sortiert nach Impact/Aufwand — siehe `research/
2026-04-28-github-similar-projects.md` Sektion „Top-Empfehlungen".

**Sprint 2026-04-28 abgeschlossen:**
- ✅ Standard 029 (Indirect-Prompt-Injection-Test) — committed `2c6b323`
- ✅ `registry/exceptions.yml` formalisiert (`expires_until` Pflicht,
  6-Monats-Default, 3 Initial-Einträge) — committed `ce02a85`
- ✅ Audit-Score 0–10 pro Standard (Scorecard-Pattern, SKIP excluded) —
  committed `0a09e25`
- ✅ `audit.mjs --emit=issues` (Allstar-Pattern, JSON+MD, gh-CLI-Input,
  dedupliziert) — committed `b7edebe`
- ✅ Standard 030 (Mail-Architektur Outbound=Brevo / Inbound+Sent=Stalwart,
  destilliert aus 20 Bibel-Regeln + 4 Vorfällen) — committed in dieser
  Session

**Noch offen (touch Prod-State, brauchen explizite User-Freigabe):**
1. **028-Findings adressieren**: stadtlahnflow + katchi `build:`-Block
   nachreichen oder als bewusste Ausnahme dokumentieren; vanfree von
   `ghcr.io:latest`-Pull auf SHA/Versions-Tag oder maxone-CI-Pattern
   migrieren; plansey `minio/minio` auf SHA pinnen
2. **VECTOR-Prompt** mit dem 025-Härtungs-Snippet aktualisieren (live)
3. **031-Findings adressieren** (siehe nächster Block)

---

## Session-Update 2026-04-28b — Standard 031 + Routine-Sweep

### Standard 031 — Routine-Platform live (commit `e415274`)

- `standards/031-routine-platform.md` — Heartbeat ODER 24/7-Agent;
  niemals IDE-/User-NUC-/Claude-Sitzungs-abhängig
- Audit-Check `031-routine-platform` in `audit.mjs` (~115 Zeilen,
  scannt `.github/workflows/*.yml` für `schedule:`/`cron:`,
  systemd-Files, `pg_cron`, `vector-agent`, plus IDE-Trigger-
  Anti-Patterns wie `Register-ScheduledTask`/`schtasks /create`/
  `wsl crontab`/`*audit*.cmd`)
- `.github/workflows/scheduled-audit.yml` — monatliche `schedule:`
  am 11. um 08:00 UTC auf `voltfair-server` Self-Hosted Runner.
  Ersetzt obsolete HANDOFF-Optionen A/B/C/D
- `scripts/scheduled-audit.cmd` — bleibt als manueller Notfall-
  Trigger, im File-Header als Fallback markiert
- VULN-CATALOG: G4 + Coverage-Matrix-Row + Roadmap-Row;
  hart abgedeckte Lücken jetzt 24

**Audit-Score 031 über alle 11 Projekte: 8 PASS / 3 SKIP / 0 FAIL/WARN.**

### Routine-Sweep über alle Projekte + 4 Server (Explore-Agent 2026-04-28)

**Heartbeat-konforme Routinen (PASS, nichts zu tun):**
- 8× GH-Actions `schedule:` — maxone-standards (audit), SLF (news,
  booking-reminders), voltfair (news, emails, mailbox-AI 15min,
  crawlers, enricher 30min)
- 5× systemd-Timer auf maxone-prod + voltfair-cli — VECTOR
  Local-Watchdog (60s), Zentinel-Watchdog (2min),
  Edge-Function-Watchdog (5min), Manifest-Drift (täglich 04:00),
  Vector-Chat-Integrity (täglich 04:30), Brevo-Bounce-Watchdog
  (stündlich)
- 6× maxone-prod root-crontab — Stalwart Cert-Renew (täglich 03:00),
  VECTOR Backup→GDrive (täglich 04:00), Cloudprinter-Reminder
  (täglich 09:00), Paperclip Claude-Auth-Sync (alle 15min),
  SLF News-AI-Summarize (täglich 05:03), Swap-Guard (alle 5min)
- 1× pg_cron-Extension auf snapflow Supabase aktiviert (keine Jobs
  via SQL-Migration; evtl. via Studio konfiguriert — nachprüfen)

**Findings, abgearbeitet 2026-04-28:**

1. **✅ voltfair-cli root-crontab — migriert auf GH-Action (commit voltfair `0fc432f`)**
   Vier crontab-Einträge fired dieselben Endpunkte wie
   `voltfair.de/.github/workflows/cron-emails.yml` GH-Action mit
   höherer Cadence (lead-reminders alle 6h, email-sequences 6×/Tag,
   customer-feedback täglich 10:00, provider-stats täglich 01:00).
   Plus: Bearer-Token plaintext in `crontab -l`.

   Migration-Schritte:
   - GH-Action `cron-emails.yml` umstrukturiert: separate Job pro
     Schedule, Cadenzen entsprechen jetzt der Crontab-Wahrheit
     (die produktive seit 2026-02-20 lief)
   - Endpunkte sind alle idempotent (Dedup via `reminder_sent_*`-Flags
     und `email_queue` Upsert) → parallel-firing während Cutover
     ungefährlich
   - Crontab-Backup: `/root/cron-backups/root-crontab-2026-04-28-pre-031-migration.bak`
     (md5 `02a1a70d404d39118f10dba44dea6889`) auf voltfair-cli
   - `crontab -l` jetzt comment-only mit Hinweis auf neuen GH-Workflow
   - Smoke-Test: `gh workflow run cron-emails.yml --field job=lead-reminders`
     → SUCCESS (run `25049799268` 2026-04-28 11:19 UTC), CRON_SECRET
     authentifiziert wie erwartet

   **Folge-Hygiene (offen, kein 031-Block):** `CRON_SECRET` rotieren.
   Plaintext-Token war nur SSH-root-sichtbar, neue Standorte sind
   GH-Org-Secret (encrypted) + voltfair.de prod-env (root-only).
   Rotation per CLAUDE.md-Protokoll: Store → .env → Container restart
   → Endpoint-Test → Drive-Backup → VECTOR informieren.

2. **⚠️ maxone-prod root-crontab → systemd-Timer (optional)**
   Sechs Einträge funktionieren, sind 031-konform, aber systemd-Timer
   bietet bessere Observability (`systemctl list-timers`,
   `journalctl -u`, `OnFailure=`). Niedrige Priorität.

3. **✅ snapflow pg_cron-Extension — bereits Standard-031-konform**
   Migration `20260429_demo_reset_cron.sql` (dated tomorrow, im Repo)
   definiert `snapflow-demo-reset` Cron @ 01:00 UTC daily,
   `cron.schedule('snapflow-demo-reset', '0 1 * * *', SELECT snapflow.reset_demo_data())`.
   Wird beim nächsten Deploy aktiv, dann ein zweiter Heartbeat-Marker
   für snapflow neben `pg_cron`-Extension. Keine Aktion nötig.

**Keine Aktion nötig:**
- `scripts/scheduled-audit.cmd` (jetzt als Fallback dokumentiert)
- `vector/local-watchdog/*.timer` (lokale Devbox-Kopie der prod-systemd-Files)

---

## Session-Update 2026-04-28c — Standard 032 + Parallel-Session-Merge

Während dieser Session lief eine **parallele Sitzung** in einem anderen Fenster, die
unabhängig 5 Commits für „Standard 013 = Supabase SSR Auth Middleware-Matcher"
gepusht hat. Lokal war 013 aber bereits durch „Launch-Gate Review" belegt mit
~50 Cross-References in 014–031, daher Renumber der parallelen Arbeit auf **032**:

- `standards/032-supabase-ssr-auth.md` (Inhalt 1:1 von b9bc523..a8423b2 übernommen,
  Standard-Nummer im Titel + zwei interne 013-Referenzen → 032 ersetzt)
- Audit-Check `032-ssr-auth` (Logik identisch zur Remote-`013-ssr-auth`-Variante,
  inkl. lib/supabase/middleware.ts-Helper-Konkatenation und proxy.ts-Erkennung
  für Next.js 16). Smoke: 3 PASS (stadtlahnflow, vanfree, voltfair), Rest SKIP.
- Lokale `standards/013-launch-gate-review.md` bleibt unverändert auf 013.

**Bonus aus Remote-Session übernommen** (nicht von dieser Sitzung erfunden):
- 011-Check erweitert um env-basierte Widget-Einbindung (`<vector-chat>` +
  `NEXT_PUBLIC_VECTOR_WIDGET_URL`) → SLF von FAIL → PASS, 011-Score jetzt 10/10
- 009-Check erweitert um `impressum_local_intentional`-Registry-Flag → SLF
  bekommt PASS statt WARN (legitime Infra-Unabhängigkeits-Ausnahme dokumentiert)

**Bonus aus dieser Sitzung:**
- `scripts/audit.mjs --root=<dir>` swappt für jedes Projekt `path_local` durch
  `path_server` (mit Fallback `<root>/<name>`). Nötig damit `scheduled-audit.yml`
  am 11.05. auf `voltfair-server`-Linux-Runner gegen `/opt/<projekt>/` prüft
  und nicht ins Leere greift.

**Git-Topologie nach Merge** (commits `bfb2f51` + `b8627ad`):
```
*   b8627ad merge: 009-fix von Remote
|\
| * 4a2bec0 009: registry override
* | bfb2f51 merge: parallel-session 013 → 032
|\|
| * 5e0b330..b9bc523 (5 Remote-Commits)
* | 3fb0622 feat(032): renumber
* | 39ce283 feat(audit): --root flag
```

**Lehre für die Zukunft:** Bei `git pull` zu Sitzungsbeginn nicht voraussetzen,
dass der lokale Stand der einzige ist. Die Sandbox erlaubt parallele Sessions
am selben Repo, ohne dass eine die andere sieht. Nummern-Kollisionen können
auftreten — bei Standards-Renumber: derjenige mit weniger Cross-Refs muss weichen.

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

### 2. Audit-Trigger als GitHub-Action (Standard 031)
Datei: [`.github/workflows/scheduled-audit.yml`](.github/workflows/scheduled-audit.yml)

Läuft als `schedule:` (Heartbeat) auf dem `voltfair-server` Self-Hosted Runner
(`maxone-prod`, hat SSH-Keys zu allen 4 Servern). Erfüllt Standard 031:
keine User-NUC-/IDE-/Claude-Sitzungs-Abhängigkeit.

```yaml
on:
  schedule:
    - cron: '0 8 11 5 *'   # 2026-05-11 10:00 Europe/Berlin (08:00 UTC)
  workflow_dispatch:
jobs:
  audit:
    runs-on: [self-hosted, Linux, X64]
    steps:
      - uses: actions/checkout@v4
      - run: node scripts/audit.mjs --root=/opt > audits/audit-$(date -u +%Y-%m-%d).txt 2>&1
      - run: node scripts/audit.mjs --root=/opt --emit=issues
      - uses: actions/upload-artifact@v4
        with:
          name: audit-report
          path: audits/
```

### 3. Wrapper-Script bleibt als manueller Fallback
Datei: [`scripts/scheduled-audit.cmd`](scripts/scheduled-audit.cmd)

Funktioniert beim manuellen Doppelklick als Notfall-Backup, ist **nicht**
mehr der primäre Trigger (siehe Standard 031). Wird von Audit als „IDE-Trigger
ohne Heartbeat-Begleitfile" geWARNt, solange kein paralleles Workflow-File
existiert — sobald `.github/workflows/scheduled-audit.yml` da ist: PASS.

---

## ✅ Migration `path_local` → server-resident `--root` (erledigt 2026-04-28)

Variante A umgesetzt: `--root=<dir>` Flag in `audit.mjs` swappt für jedes
Projekt `path_local` durch `path_server` (mit Fallback `<root>/<name>`,
falls `path_server` null ist). Wenig invasiv, lokale Devbox bleibt
unverändert. GH-Action ruft `--root=/opt` auf — Linux-Audit-Lauf am 11.05.
greift damit jetzt auf `/opt/<projekt>/` zu, nicht mehr auf Windows-Pfade.

Lokal-getestet mit `--project=voltfair --standard=005 --root=/opt`: path_local
wird zu `/opt/voltfair`, existsSync-Check schlägt erwartungsgemäß fehl
(Windows-Devbox hat das Verzeichnis nicht) — auf Linux wird der Pfad
existieren. Fallback für SolarProof (`path_server: null`) → `/opt/solarproof`.

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
| `scripts/scheduled-audit.cmd` | ✅ existiert, manueller Fallback |
| `.github/workflows/scheduled-audit.yml` | ✅ existiert, läuft auf `voltfair-server` (Standard 031) |
| `audit.mjs --root=<dir>` | ✅ implementiert, swap path_local→path_server |
| `audits/audit-2026-05-11.txt` | wird vom GH-Action-Trigger erzeugt |
| Diff-Report | wird nach Lauf erstellt |

---

## Rollback / Cleanup (falls nicht mehr gewünscht)

- `audits/baseline-2026-04-27.txt` → behalten als historischer Snapshot
- `scripts/scheduled-audit.cmd` → behalten, ist generisch wiederverwendbar
- Falls Task-Scheduler-Eintrag erstellt wurde:
  `Unregister-ScheduledTask -TaskName "maxone-standards-audit-2026-05-11" -Confirm:$false`
