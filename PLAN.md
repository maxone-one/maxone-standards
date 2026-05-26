# PLAN — maxone-standards

## Noch offen


### 024-code-health-budget: verbleibende FAILs (Score: 3.6/10)
Projekte noch auf FAIL- oder unterer WARN-Schwelle:
- vanfree (7% — unter WARN-Schwelle 8%)
- stadtpunkt (>1000-Zeilen-Dateien, 8% — Größen-FAIL überlagert Refactor-WARN)
- kitchen-station (7% — unter WARN-Schwelle)
- solarproof (6% — unter WARN-Schwelle)

Nur durch echte `refactor:`-Commits in den jeweiligen Projekten behebbar. Wächst organisch, kein Konfigurations-Fix.

### 051-db-isolation: offene Migrations
- **DRINGEND (bis 2026-08-18):** plansey-2026 — verbindet direkt auf `supabase-db:5432` (maxone.one DB-Container). Kritische Verletzung.
- **bis 2026-11-18:** repivot — teilt `panel.maxone.one` mit maxone.one; eigene Supabase-Instanz aufsetzen.
- **zu klären:** snapflow — `supabase_url` verifizieren (VITE_SUPABASE_URL baked-in, nicht aus .env lesbar).
- **zu klären:** stadtpunkt — DB-Situation unklar.
- **nach Split:** zentinel — nach Monorepo-Entkopplung (Option A) eigene Instanz planen.

### 011 One-Liner-Migration in Projekten
11 Projekte noch auf altem 3-Zeilen-Pattern — inkrementell bei Diff-Touch pro Projekt auf One-Liner (`embed.js`) umstellen. Beide Patterns funktionieren; 3-Zeilen ist anfällig für stillen Fehlschlag bei vergessenem `<vector-chat>`-Tag.

### vector `010_reply_status.sql` auf Server einspielen
Migration liegt im vector-Repo (`migrations/010_reply_status.sql`), noch nicht auf maxone-prod eingespielt. → VAULT-Task delegieren.

### vanfree path_local in Registry: Audit verifikation
`path_local` wurde von `vanfree` auf `venfree` korrigiert (699bd89). Beim nächsten vollen Audit prüfen ob alle vanfree-Standards jetzt grün laufen.

### 041-avv-dpa-registry: Backfill
`data_processors`-Feld in `registry/projects.yml` für alle Projekte befüllen — aktuell 12 WARNs. Keine Anbieter-Fakten raten; wenn unklar → `unknown` und Max entscheiden lassen.

### Uptime-Kuma Probes für Widget-Bundles
Zwei neue Probes in `watchdog.maxone.one`:
- `https://agent.maxone.one/widget/embed.js` — HTTP 200, alle 60 s
- `https://agent.maxone.one/widget/vector-chat.js` — HTTP 200, alle 60 s

Offen aus Standard 011 (2026-05-20, TODO-Block im Standard dokumentiert).

### CRON_SECRET voltfair rotieren
Voltfair-crontab hatte CRON_SECRET plaintext (vor GH-Action-Migration). Neue Standorte: GH-Org-Secret (encrypted) + voltfair.de prod-env (root-only). Rotation per CLAUDE.md-Credentials-Protokoll noch ausstehend.

---

## Erledigt

- 2026-05-26 — plansey-engaged in Registry + vanfree path_local korrigiert (699bd89)
- 2026-05-26 — 048/050/006 Treatment: alle 15 Projekte abgeschlossen — plansey-engaged (.gitignore-Fix), gs-lohra (alles OK), venfree (alles OK, vor Session erledigt)
- 2026-05-26 — 048/050/006 Treatment: repivot, plansey-2026, stadtpunkt, kitchen-station, solarproof — PLAN.md befüllt, BUGS.md normalisiert, HANDOFF.md auf Server geschrieben
- 2026-05-26 — 048/050/006 Treatment: maxone.one, vector, stadtlahnflow, voltfair, snapflow, zentinel — PLAN.md befüllt, HANDOFF.md auf Server aktualisiert
- 2026-05-26 — 052: E6 (drei Tiers A/B/C) + E8 (first_slot #1/#10/#25/#50) entschieden + finalisiert
- 2026-05-26 — 011, 052, audit-vector-embed.mjs, briefings/ committet
- 2026-05-26 — maxone-standards PLAN.md + BUGS.md angelegt (Standard 048/050/006 Treatment)
- 2026-05-26 — CLAUDE.md aktualisiert: 53 Standards / 14 Projekte + PLAN/BUGS-Pointer
- 2026-05-26 — HANDOFF.md: Session-Update 2026-05-26 ergänzt
- 2026-05-26 — 009-impressum-widget: Pseudonym/Brand-Line-Feld + Website-Hinweis ergänzt (da13372)
- 2026-05-23 — Standard 053-image-pipeline erstellt (623e850)
- 2026-05-20 — Standard 011: One-Liner-Pattern + Auto-Loader dokumentiert (staged, ausstehend E6/E8-Commit)
- 2026-05-20 — Standard 052: Achievement-Celebration-Abschnitt als Entwurf (unstaged, E6+E8 offen)
- 2026-05-20 — briefings/pioneer-achievement-convergence.md erstellt (untracked)
- 2026-05-19 — Standard 052-pioneer-system erstellt (0b572fe), Pulse-Werte + Tier-Logik korrigiert (6b605b3)
- 2026-05-19 — registry/projects.yml: compose_file für maxone.one ergänzt (3f027f6)
- 2026-05-18o — 024: stadtlahnflow FAIL→WARN (OutreachTabs-Split + HEALTH-EXEMPT) — OVERALL 9.6/10
- 2026-05-18n — Standard 051-db-isolation erstellt; registry + exceptions + audit.mjs nachgezogen
- 2026-05-18m — 024 Sprint: alle Projekte ≥ WARN, kein Projekt mehr auf reinem FAIL (024 = 3.6/10)
- 2026-05-18e — gs-lohra als 14. Projekt in Registry aufgenommen (10.0/10 Audit-Score)
- 2026-05-18d — Standard 048-plan-tracker erstellt + PLAN.md in alle 12 aktiven Projekte eingespielt
- 2026-05-18c — 027 Migrations-Sprint: 7 Projekte kein Build-on-Prod mehr (027 = 10.0/10)
- 2026-05-18b — Standard 047-disk-guard erstellt + Rollout auf alle 4 Server
- 2026-05-18 — Disk-Full-Incident behoben (3 Fixes kodifiziert, docker-cleanup alle 4h, disk-guard alle 10 min)
- 2026-05-12d — 025 auf 10.0 + HEALTH-EXEMPT in audit.mjs implementiert — OVERALL 9.5/10
- 2026-05-12c — 027 Sprint (5.6→10.0) + maxone-staging (178.105.124.92) provisioniert
- 2026-05-12b — 030: vector Brevo-Domain-Pre-Flight (8.6→10.0)
- 2026-05-12 — Compliance-Sprint (8.6→9.4): YAML-Bug-Fix, 30+ formale Ausnahmen, compose_file-Fixes
- 2026-05-11 — Standard 038-cross-project-broadcast + broadcasts/-Verzeichnis
- 2026-05-08 — Standard 041-avv-dpa-registry + Audit-Check
- 2026-04-29 — Standard 033-post-deploy-warmup + deploy.sh Warm-Up in 5 Projekten (Sprint)
- 2026-04-29 — Standard 027 geschärft: Build-on-Prod via self-hosted Runner = FAIL
- 2026-04-28 ff. — Standards 020–032, Registry-Infrastruktur, Audit-CI (scheduled-audit.yml), Baseline
