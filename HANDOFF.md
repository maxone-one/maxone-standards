# HANDOFF — maxone-standards

**Stand:** 2026-05-11 (Standard 038 + CPIB-Mechanismus hinzugefügt)
**Übergeben an:** nächster KI-Mitarbeiter im `maxone-standards` Projektfenster
**Status:** 33 Standards aktiv, OWASP-LLM-IDs eingearbeitet, Templates da; Audit-Vergleich am 2026-05-11 läuft jetzt als GH-Action `schedule:` auf `voltfair-server`-Runner (heartbeat-platform statt User-NUC)

---

## Session-Update 2026-05-11 — Standard 038 Cross-Project Incident Broadcast

Max hat festgestellt, dass Fehler in einem Projekt unentdeckt in anderen
weiterschlafen — Beispiele: Route-Rename, Domain-Wechsel, Auth-Token-Umbenennung.
Umsetzung:

- Neuer Standard: `standards/038-cross-project-broadcast.md`
- Neues Verzeichnis: `broadcasts/` (Kommunikations-Schnittstelle zwischen Projekten)
- Broadcast-Format: `BCAST-YYYY-MM-DD-<slug>.md` mit Typ/Status/Betroffene-Tabelle/Fix-Muster/Audit-Grep
- Erster retroaktiver Broadcast: `BCAST-2026-04-22-domain-studio-to-one.md` (closed)
- Audit-Check `038-cross-project-broadcast` in `scripts/audit.mjs`
- `standards/README.md` um Kategorie "Projektübergreifende Koordination" erweitert

Verifikation: `node scripts/audit.mjs --standard=038 --local-only` → 13/13 PASS

---

## Session-Update 2026-05-08 — Standard 041 AVV-/DPA-Registry

Max hat angefordert, das Thema AVV in das Maxone-Standards-Regelwerk
aufzunehmen. Umsetzung:

- Neuer Standard: `standards/041-avv-dpa-registry.md`
- Neuer Audit-Check: `041-avv-dpa-registry` in `scripts/audit.mjs`
- Neues Registry-Feld dokumentiert: `data_processors` in `registry/projects.yml`
- Gate-/Template-Verknuepfung nachgezogen:
  `standards/013-launch-gate-review.md`,
  `standards/015-concept-gate.md`,
  `standards/016-stack-whitelist.md`,
  `standards/017-dsgvo-tracker-audit.md`,
  `templates/CONCEPT.md`,
  `templates/LAUNCH-REVIEW.md`,
  `checklists/013-launch-gate.md`
- `standards/VULN-CATALOG.md` Coverage fuer C4 (fehlender AVV/DPA) auf
  Standard 041 umgestellt; `standards/README.md` und Root-README verlinkt.

Verifikation:

- `node scripts/audit.mjs --standard=041 --local-only`
- Ergebnis: 13 Projekte, 12 WARN, 0 FAIL, 1 SKIP; Score 5.0.
- WARNs sind erwartbar, weil `data_processors` pro Projekt noch nicht
  befuellt ist.

Offen:

- Registry-Backfill pro Projekt: echte Auftragsverarbeiter, AVV-/DPA-Status,
  Evidence-Ort und `reviewed_at` eintragen. Keine Anbieter-Fakten raten; wenn
  Account-/Vertragsstatus nicht sichtbar ist, als `unknown` markieren und Max
  entscheiden lassen.

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
  `ghcr.io/maxone-one/vanfree.de:latest` (echter Registry-Pull),
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

## Session-Update 2026-04-28d — Workflow End-to-End validiert + Baseline aktualisiert

Beide Codepfade des `scheduled-audit.yml` jetzt manuell durchgelaufen
(`workflow_dispatch`), bevor der erste echte `schedule:` am 11.05. trifft.

**Validierte Runs:**
- `25057397742` (`emit_issues=false`, 9 s) — minimaler Pfad, nur Audit + commit-back
- `25057591747` (`emit_issues=false`, 27 s, nach `npm ci`-Fix) — voller Audit
- `25057692232` (`emit_issues=true`, 48 s) — inkl. issues-`{json,md}`-Generierung

**Drei Bugs gefunden + gefixt** (jeweils im selben Run-Cycle):
1. `actions/upload-artifact@v4` failte mit *Org Artifact Storage Quota hit*
   (Quota ist org-shared, von anderen Repos leergesaugt). Fix: commit-back
   nach `audits/` statt Artifact-Upload (Plain-Text, ~17 KB, diffbar via
   `git log audits/`). Workflow hat jetzt `permissions: contents: write`.
2. `js-yaml` ERR_MODULE_NOT_FOUND — Workflow hatte keinen `npm ci` Step.
   Fix: `npm ci --omit=dev --no-audit --no-fund` vor dem Audit-Step.
3. Crash unsichtbar wegen `set +e` — Workflow meldete success obwohl Audit
   einen 17-Zeilen-Stack-Trace produziert hatte. Fix: Heuristik
   `grep -q '^--- Summary ---'` failt den Step wenn Summary fehlt.

**Authoritative Baseline jetzt** (committed als `audits/audit-2026-04-28.txt`):
- 396 Total / 105 Passed / 75 Warning / 78 Failed / 138 Skipped
- 106 deduplizierte Issues (53 FAIL + 53 WARN) als `audits/issues-2026-04-28.{json,md}`
- Vorherige Baseline 2026-04-27 (154/104/17/14/19) war noch ohne `--root=/opt`,
  hatte also nur die Repo-internen Checks gesehen, nicht die Server-Pfade.
  Die heutige Run misst gegen die echten `/opt/<projekt>/`-Verzeichnisse →
  vollständigeres Bild, auch deshalb höhere Findings-Zahlen.

**Patterns aus den 106 Findings** (Issue-Triage-Material):
- 6 Standards failen für *alle 11 Projekte* (je 11× Findings):
  013-launch-gate, 015-concept-gate, 021-re-review-reminder,
  024-code-health-budget, 026-self-hosted-first, 027-deploy-pipeline
- Davon sind **021 + 026 reine Registry-Einträge** (`last_review_date`,
  `external_subscriptions`) — niedrig hängende Frucht, 22 Findings auf
  einen Schlag wegfegbar wenn die Daten vom User bereitstehen
- 027 (`.github/workflows/` fehlt) ist projekt-Code, nicht Registry —
  betrifft alle Projekte, weil das CI-Build-Pattern aus Standard 027 noch
  nicht ausgerollt ist
- 005 (Smoke-Tests) für 8 von 11 Projekten — siehe globaler CLAUDE.md-
  Block „Projekte OHNE Teststrecke (nachholen bei nächstem Deploy-Arbeit)"

**Nicht akut, aber notiert:** GH-Annotation warnt
`actions/checkout@v4` läuft auf Node.js 20 (deprecated, zwangs-Migration auf
Node.js 24 ab 2026-06-02). Beim nächsten Workflow-Touch updaten. ✅ erledigt
(`d4fcebb`): bump auf `actions/checkout@v5`, validiert via Run `25064109263`.

**Defense-in-Depth ergänzt** (`a2481e3`): neuer Workflow
[`.github/workflows/pr-validate-audit.yml`](.github/workflows/pr-validate-audit.yml)
läuft auf jeden PR/Push zu main, der `audit.mjs` / `package*.json` /
`registry/**` / `standards/**` ändert. Macht in <10 s: Syntax-Check, Smoke-
Audit (1 Projekt × 1 Standard), Registry-Parse-Check. Faengt damit die
Klasse Bug ab, die am 2026-04-28 erst beim scheduled run sichtbar wurde
(`js-yaml` fehlt). Initialer Run `25064731831`: 7 s, alle Steps ✅.
Läuft auf `ubuntu-latest` statt self-hosted, damit ein down-`voltfair-server`
keinen PR blockt.

---

## Session-Update 2026-04-28e — Deploy-Downtime-Sprint (Viktoria + SLF)

User hatte beobachtet, dass *Stadtlahnfluss* und *Viktoria From* während Deploys
manchmal langsam laden / 503 zurückgeben. Sprint-Ziel: Ursachen finden + fixen.

### Viktoria From — fertig

- **Vorher:** kein `deploy.sh`, kein Traefik-Backend-Healthcheck → bei jedem
  `docker compose up -d --force-recreate` 5-30 s Downtime.
- **Jetzt:**
  - [`/opt/viktoria-from/deploy.sh`](https://github.com/maxone-one/viktoria-from/blob/main/deploy.sh)
    geschrieben (modelliert nach SLF-Vorlage): Slot-Detect → start NEXT →
    Health-Wait → Prewarm 11 Routen → Traefik-Confirm → stop OLD → save state.
  - Traefik-Backend-Healthcheck-Labels in `docker-compose.yml` ergänzt:
    `loadbalancer.healthcheck.path=/`, `interval=5s`, `timeout=3s`.
  - 2× End-to-End validiert:
    - Run 1: 184/186 (99.5 %) HTTP 200 während ~90 s Deploy, 1 Timeout (5 s).
    - Run 2: 157/162 (96.9 %) HTTP 200, 5 schnelle 503s (~30 ms each) im
      ~2 s Swap-Fenster, **kein Timeout** mehr — die neuen Healthcheck-Labels
      lassen Traefik schnell auf Status-Änderung reagieren.
- **„Auto-Recreate-Mystery" geklärt:** keine Mystery. Tracker hat 180 s nach
  einem sauberen Deploy beobachtet — der gestoppte Slot kommt nicht zurück.
  Das `local-watchdog.sh` (1× pro Minute) skippt korrekt
  `state=exited && restart_count==0` (intentionaler Stop). Vorherige Beobachtung
  war Folge von .active-slot/Container-Mismatch durch ineinander verschachtelte
  Test-Runs, kein echter Daemon.

### SLF — kein Bypass, dafür systemisches Build-on-Prod

- **Hypothese vorher:** jemand bypassed `/opt/stadtlahnfluss/deploy.sh` mit
  bare `docker compose up -d`.
- **Hypothese widerlegt:** `last`-Login zeigt: kein manueller SSH seit März.
  Alle SLF-Deploys laufen über GH-Actions `deploy.yml`, das deploy.sh korrekt
  ruft (auch der „Update crawler"-Step ist mit `--no-deps crawler` safe).
- **Echte Ursache der Deploy-Downtime:** der Build passiert auf dem
  Prod-Server. Self-hosted Runner `voltfair-server` läuft auf
  `maxone-prod` selbst — d.h. `docker build --no-cache` für App + Crawler
  belegt 1-2 GB RAM und CPU für 80-180 s, während Supabase, Traefik und der
  alte App-Container weiterlaufen müssen. Aktuell freier RAM auf maxone-prod:
  **1.5 GB von 7.6 GB**. Build-Spike trifft genau die Bottleneck-Zone.
- **Das ist eine OBERSTE-REGEL-Verletzung** (CLAUDE.md):
  > „NIEMALS Docker Images auf Produktions-Servern bauen!"
- **Systemweit:** 13 von 14 Projekten machen das gleiche
  (`grep 'docker build' .github/workflows/*.yml | grep self-hosted` →
  getsnapflow, katchi, kitchen-station, vanfree.de, stadtlahnfluss, trader,
  vector, viktoria-from, visual-engine, voltfair, vox, zrow, zync). Nicht
  ein einzelnes SLF-Problem.
- **SLF-spezifisch:** im Letzten Build-Run (`Worker_20260428-172541-utc.log`)
  hat „Build App image" 86 s gebraucht, „Build Crawler image" 41 s. Während
  dieser ~2 Min hat alles andere auf maxone-prod konkurriert.

### Drei Fix-Optionen (Strategieentscheidung von User nötig)

| Option | Was | Mensch ohne KI | Mit Claude | Blocker |
|---|---|---|---|---|
| **A** Build auf GH-hosted Runner + Image-Transfer | matcht CLAUDE.md-Pattern exakt; jeder Workflow von `runs-on: self-hosted` auf `ubuntu-latest` umstellen, am Ende `docker save | gzip | ssh maxone-prod | docker load`. | ~6-8 h pro Projekt × 13 = grosse Migration | M-Tier pro Projekt, ~30 Min Sprint von mir je `deploy.yml`, ~5 Min Sign-Off pro Projekt | GitHub-Hosted-Minutes-Quota (Org-Level prüfen) |
| **B** Mem-Limit auf prod-Build | quick fix: `docker build --memory=1500m --memory-swap=3g --cpu-shares=512 ...` in jedem Workflow. Build dauert länger, frisst aber nicht mehr alles. | ~2 h gesamt | S-Tier, ~15 Min Sprint von mir + ~2 Min Sign-Off | keine |
| **C** Separate Runner-VM (Hetzner Cloud, ~5 €/Monat) | Runner runter von maxone-prod, eine kleine Build-VM bei Hetzner; `voltfair-server` Label bleibt, Builds isoliert. | ~4 h | M-Tier, ~30 Min VM-Provision + Runner-Re-Register, ~10 Min Sign-Off | Hetzner-VM-Bestellung (~5 Min Max manuell), läuft gegen Standard 026 (kein Abo? — fällt unter VPS-Hosting-Ausnahme) |

Empfehlung: **B als Sofort-Fix (heute machbar), A als Migration über die nächsten Wochen** (oder direkt zu A, wenn GH-Minutes nicht knapp sind).
**C** nur falls A teuer wird durch Image-Transfer-Latenz.

### Standard 027 — fällig zu schärfen

Aktuell sagt 027 nur „CI baut, dann Image-Transfer", aber nicht explizit
„CI darf NICHT auf dem Prod-Server laufen". Beim nächsten Edit von 027:
- Hartcodieren: „runs-on: self-hosted nur erlaubt, wenn der Runner physisch
  NICHT auf einem Server mit live-Containern läuft."
- Audit-Hook: `audit.mjs` parst `.github/workflows/*.yml` und failt, wenn
  ein Workflow `runs-on: self-hosted` UND `docker build` enthält UND der
  Self-hosted-Runner laut Registry auf einem Prod-Server läuft.

---

## Session-Update 2026-04-29 — Standard 027 geschärft + Standard 033 (Warm-Up)

User-Direktive: „setze Warm-Up nach einem Blue/Green Deploy als Standard
in jedem Projekt". Plus die offene Schärfung von 027 aus dem letzten
Sprint.

### Standard 027 — geschärft

`standards/027-deploy-pipeline.md`:
- **Pflicht-Eigenschaft 1** explizit erweitert: `runs-on: self-hosted`
  + `docker build` = Build auf maxone-prod (Runner lebt dort) = FAIL.
- Beispiel-Workflow auf `runs-on: ubuntu-latest` umgestellt, inkl.
  Org-Secret `MAXONE_PROD_DEPLOY_SSH_KEY` und vollem `docker save | gzip
  | ssh ... gunzip | docker load`-Pfad.
- Audit-Hook (`scripts/audit.mjs`, Funktion `'027-deploy-pipeline'`)
  - **NEU FAIL:** `runs-on: self-hosted` + `docker build` (oder
    `docker compose build`) im selben Workflow. Pro Workflow-Datei
    geprüft — `pr-validate-audit.yml` u.ä. werden NICHT geflaggt,
    weil sie nichts bauen.
  - **NEU FAIL:** Klassisches `ssh root@maxone-prod "...docker
    build..."` (alter manueller Pfad).
  - **NEU WARN:** Workflow ohne `runs-on: ubuntu-latest`, ohne
    `docker save`, oder ohne SSH-Image-Transfer-Pipe.
- `registry/projects.yml`: `kitchen-station` und `vector` haben jetzt
  `deploy_pipeline: manual` — beide sind im 027-Doku als Ausnahme
  notiert, aber das Flag fehlte im Registry → false-positive FAIL.

**027-Run-Ergebnis:** 5 echte FAILs (`stadtlahnflow`, `katchi`,
`voltfair`, `snapflow`, plus `plansey` mit fehlendem Workflow), 4 WARN
(`maxone.one`, `repivot`, `vanfree`, `solarproof`). Diese sind die
Migrationsliste für Option A (build auf `ubuntu-latest` + SSH-Image-
Transfer) — der eigentliche Roll-out wartet auf Org-Secret-Setup
(`MAXONE_PROD_DEPLOY_SSH_KEY`) und ist im Plan Phase 1+2.

### Standard 033 — Post-Deploy Warm-Up (NEU)

`standards/033-post-deploy-warmup.md`. Regel:

> Zwischen „neuer Slot ist healthy" und „Traefik swappt Traffic" MUSS
> ein expliziter Warm-Up-Schritt laufen, der die wichtigsten Public-
> Routen des neuen Containers ein Mal vor-rendert.

Drei Pflichten: vor dem Swap (nicht danach), intern (nicht über die
Public-Domain via Traefik), vollständige Routenliste.

Drei Patterns dokumentiert:
1. Bash-Loop in `deploy.sh` (SLF-Vorbild, empfohlen)
2. Workflow-Step (wenn kein deploy.sh)
3. Sidecar-Warmer (für Non-Node-Images)

Audit-Hook (`scripts/audit.mjs`, Funktion `'033-post-deploy-warmup'`,
SSH-Check):
- Liest `<path_server>/deploy.sh` per SSH.
- Heuristik: Inhalt enthält `prewarm`/`warm-up`/`warmup` ODER
  `docker exec ... fetch http://localhost`.
- Reihenfolge-Check: Warm-Up-Zeile muss VOR echten Swap-Aktionen
  stehen (Label-Update, `swap.sh`, `echo > .active-slot`,
  `$COMPOSE stop ...$ACTIVE`). Variablen-Zuweisungen wie
  `SLOT_FILE=".active-slot"` zählen NICHT als Swap.

**033-Run-Ergebnis (2026-04-29, NACH Self-Loop-Sprint):**

| Status | Projekt | Befund |
|---|---|---|
| ✅ PASS | stadtlahnflow | deploy.sh + Warm-Up vor Swap (39 Routen) — Vorlage |
| ✅ PASS | maxone.one | NEU `/opt/maxone-v2/deploy.sh` (101 Zeilen, 21 Routen, SvelteKit Marketing+Bio) |
| ✅ PASS | repivot | Warm-Up in `/opt/repivot/deploy.sh` (1 FE + 9 BE-Routen) |
| ✅ PASS | vanfree | Warm-Up in `/opt/vanfree/deploy.sh` (10 Next-Routen) |
| ✅ PASS | plansey | Warm-Up in `/opt/plansey-2026/deploy.sh` (10 Routen, de+en) |
| skip | katchi | `warmup_required: false` (Vue SPA via nginx, kein SSR) |
| skip | snapflow | `warmup_required: false` (Static SPA via nginx, kein SSR) |
| skip | vector | exception bis 2026-10-29 (Stop-OLD-first wegen Telegram 409) — Warm-Up trotzdem im Skript (11 Routen), aber nach Stop-OLD |
| skip | kitchen-station, voltfair, solarproof | nicht blue-green |

**Score: 033 = 10.0/10** (5 PASS, 0 WARN, 0 FAIL, 6 SKIP). Baseline:
[`audits/baseline-2026-04-29-warmup-sprint.txt`](audits/baseline-2026-04-29-warmup-sprint.txt).

### Sprint-Lieferung (Server-Files, nicht live deployt)

Alle deploy.shs wurden auf dem Server geschrieben (nicht live deployt —
warten auf nächsten regulären Push pro Projekt). Backups liegen als
`deploy.sh.bak.<timestamp>` neben jeder neuen Version.

| Projekt | Server-Pfad | Patches |
|---|---|---|
| maxone.one | `/opt/maxone-v2/deploy.sh` | NEU (101 Zeilen) |
| repivot | `/opt/repivot/deploy.sh` | +Warm-Up (97 Zeilen) |
| vanfree | `/opt/vanfree/deploy.sh` | +Warm-Up (73 Zeilen) |
| plansey | `/opt/plansey-2026/deploy.sh` | +Warm-Up (81 Zeilen, +027-Violation-Header) |
| vector | `/opt/vector/deploy.sh` | +Warm-Up (77 Zeilen) |

### Registry-Korrekturen (2026-04-29)

`registry/projects.yml`:
- `repivot.path_server`: `/opt/repivot.me` → `/opt/repivot` (Ghost-Dir-Bug)
- `snapflow.path_server`: `/opt/snapflow.one` → `/opt/snapflow` (Ghost-Dir-Bug)
- `katchi.warmup_required: false` (Vue SPA)
- `snapflow.warmup_required: false` (Static SPA)
- Header-Doku um `warmup_required`-Feld ergänzt

`registry/exceptions.yml`:
- NEU: `vector` × `033` bis 2026-10-29 (Telegram-Conflict-Spezialfall)

### Offene Folge-Tickets (separat)

- **plansey**: deploy.sh hat `docker compose build` auf Prod (027-Violation,
  im Skript-Header markiert). Sollte zu CI-Image-Transfer migrieren.
- **vector + vanfree**: Lokale `deploy.sh` (im Repo) drift'en vom Server-
  Stand ab — Server ist authoritative, Repo-Versionen sollten beim
  nächsten Touch-Punkt synchronisiert werden.
- **Plansey 2026Auth UntrustedHost**: Auth-Routen werfen `UntrustedHost: Host
  must be trusted. URL was: https://plansey.app/api/auth/session` beim
  internen Warm-Up — Auth.js versucht die Live-Domain im SSR zu re-fetchen.
  Routen sind aus PREWARM_PATHS entfernt (5 statt 10), aber Bug bleibt für
  echte User-Sessions relevant. Separate Session.

### Quick-Win-Cleanup 2026-04-29 (erledigt)

- **maxone.one Workflow refactored**: `.github/workflows/deploy-maxone-one.yml`
  ruft jetzt `bash /opt/maxone-v2/deploy.sh` mit `BUILD_TARBALL` env auf
  (Inline-Heredoc raus, Standard 033 Warm-Up jetzt automatisch im Deploy-Pfad).
- **stadtlahnflow × 009 Ausnahme entfernt**: Audit hatte sie als
  REMOVAL-KANDIDAT geflaggt (009-Check liefert nativ PASS), Eintrag aus
  `registry/exceptions.yml` raus. Score 009 jetzt 4 PASS statt 3 PASS+1 SKIP.

### Sponsored-Customer Mail-Footer (separate Implementation)

Nicht-entfernbare Mail-Footer für Kunden mit kostenloser Domain+Mailbox+
Client (Pilot: Viktoria From). Regel ist in `~/.claude/CLAUDE.md`
(OBERSTE PRIORITÄT 2026-04-29) + Memory gespeichert. Code-side noch NICHT
umgesetzt — Implementation gehört in `email-client` Edge Function
(`maxone.one/supabase/functions/email-client/handlers/send.ts`) +
Supabase-Migration für `sponsored_customers`-Tabelle. Separate Session.

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
- `vanfree` 003-secrets-store — `/opt/secrets/vanfree/keys.env` fehlt (Phase-2-Migration ausstehend)
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
- **`vanfree`** ist die ehemalige `vanfree.de`. Code ist umbenannt, aber
  Server-Container heißen noch `vanfree-*` und `/opt/secrets/vanfree/` —
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
