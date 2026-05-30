# Standards

Jede Regel als eigene `NNN-name.md`, mit Versionsnummer und Begründung. Format nahe am ADR-Stil (Architecture Decision Records) — nachvollziehbar WARUM eine Regel existiert.

## Cap-Regel: maximal 33 Standards

Neue Regeln werden als **Abschnitt in bestehende Dateien** eingefügt, nicht als neue Nummer.
Nur wenn ein Thema genuinely orthogonal zu allen bestehenden ist, darf eine neue Datei entstehen.
Ziel: auch nach weiteren Erweiterungen nie mehr als 33 Nummern.

Aktuell: **29 Standards** (4 freie Slots).

## Propagations-Regel (2026-05-30)

Wenn in einem Projekt eine neue Regel entsteht (Vorfall, Direktive, Erfahrung):

1. **Standard anlegen oder erweitern** — hier in maxone-standards (Cap beachten)
2. **Alle anderen Projekte nachrüsten** — sofort, nicht "beim nächsten Touch"
3. **Broadcast anlegen** wenn Drift-Risiko besteht (Standard 036-C)

Projektlokal = temporär. In Standards = permanent und projektübergreifend.

---

## Pflicht-Dateien pro Projekt (alle auf einmal anlegen/prüfen)

Für jedes Projekt mit `status: live` oder `status: dev` müssen diese Dateien **gleichzeitig** vorhanden sein:

| Datei | Ort | Standard | Inhalt |
|---|---|---|---|
| `CONCEPT.md` | Repo-Root | 013-A | Was das Produkt ist, Vision, Sprache |
| `PLAN.md` | Repo-Root | 048 | Offene + erledigte Pläne |
| `BUGS.md` | Repo-Root | 050 | Aktive + geschlossene Bugs |
| `HANDOFF.md` | `/opt/<projekt>/` auf Server | 006 | Infra-Zustand, letzter Deploy |

Wenn eine Datei fehlt, alle vier auf einmal anlegen — nicht nur die fehlende.

---

## Index

**Infrastruktur & Deploy:**
- [001-deploy.md](001-deploy.md) — Blue/Green + kein Prod-Build + Deploy-Pipeline + Post-Deploy-Warmup
- [003-secrets-tls.md](003-secrets-tls.md) — Zentraler Secrets-Store + TLS via DNS-01
- [006-handoff-md.md](006-handoff-md.md) — HANDOFF.md auf dem Server vor jeder Arbeit lesen
- [007-paths-naming.md](007-paths-naming.md) — Pfade und Container-Naming-Konventionen
- [008-domain-policy.md](008-domain-policy.md) — Neue Infrastruktur auf `.one`, nie `.studio`
- [019-cert-dns-reality.md](019-cert-dns-reality.md) — DNS auf eigenen Server + TLS-Cert gültig + LE-Issuer
- [028-container-safety.md](028-container-safety.md) — Container-Misconfig-Audit + Disk-Guard (builder prune, 4h-Cron, 80%-Bremse)
- [031-routine-platform.md](031-routine-platform.md) — Cron/Watchdog-Routinen nur auf Heartbeat-Plattform (GitHub Actions schedule, systemd-Timer, VECTOR)
- [034-cost-caps-and-budget-alerts.md](034-cost-caps-and-budget-alerts.md) — Drei Verteidigungslinien gegen API-Kostenüberraschungen

**Tests & Dokumentation:**
- [005-tests-quality.md](005-tests-quality.md) — Test-First (Smoke + Unit vor "live") + Code-Health-Budget (Refactoring ≥ 15 %, Duplikation < 5 %)
- [048-plan-tracker.md](048-plan-tracker.md) — PLAN.md mit "## Noch offen" + "## Erledigt" in jedem aktiven Projekt
- [050-bug-registry.md](050-bug-registry.md) — BUGS.md: persistente Bug-Wissensbasis vor jeder Debugging-Session lesen
- [055-concept-reference.md](055-concept-reference.md) — CONCEPT.md: Produkt-Konzept als SSoT für Agenten und Copy

**UI & Produkt:**
- [009-required-ui.md](009-required-ui.md) — Impressum-API + Credits-API + Vector-Chat-Widget + Footer (alle Customer-facing Pflichten)
- [042-ssot-version.md](042-ssot-version.md) — Version-Marker (ENV + /api/version + Footer) + Cron-E-Mail-Dedup + SSoT/kein Hardcode
- [045-admin-ui.md](045-admin-ui.md) — Dashboard-Layout + DevPanel + App-Launcher
- [052-pioneer-system.md](052-pioneer-system.md) — Pioneer-System: limitierte Slots, Puls-Pool, Leaderboard
- [053-image-pipeline.md](053-image-pipeline.md) — Bild-Pipeline (EXIF, Format, Optimierung)
- [054-brevo-api-outreach.md](054-brevo-api-outreach.md) — Brevo API Outreach-Campaigns

**Sicherheit & Gates:**
- [013-gates-review.md](013-gates-review.md) — Gate 1 (Konzept) + Gate 3 (Launch-Review) + Pentest-Light + Re-Review alle 180 Tage
- [014-compliance.md](014-compliance.md) — Sunset-Prozess + AVV/DPA-Registry (beide DSGVO-Art.-28-Richtungen)
- [016-stack-platform.md](016-stack-platform.md) — Stack-Whitelist + Plattform-Blacklist (Lovable/Bolt/Base44 raus) + Self-Hosted-First
- [017-live-domain-audit.md](017-live-domain-audit.md) — DSGVO-Tracker-Audit + Bundle-Drift-Audit (beide Live-Domain-Probes)
- [022-security-scanning.md](022-security-scanning.md) — Secret-Scan (gitleaks) + Static-Analysis (Semgrep OWASP)
- [025-llm-security.md](025-llm-security.md) — Direct Injection (System-Prompt-Härtung, Tool-Rechte, Approval-Queue) + Indirect Injection (RAG/Mail/Telegram)

**Infrastruktur-Services:**
- [030-mail.md](030-mail.md) — Mail-Architektur (Outbound=Brevo, Inbound=Stalwart JMAP) + Passwort-Sync
- [032-auth-db.md](032-auth-db.md) — Supabase SSR Auth (broad Middleware-Matcher) + DB-Isolation (ein Projekt, eine DB)
- [036-project-coordination.md](036-project-coordination.md) — Spec-Archiv (PRD/TODO/DONE) + Dep-Currency (Sweep-Kadenz) + Cross-Project-Broadcast

**Marke & Kommunikation:**
- [035-brand-communication.md](035-brand-communication.md) — Wahrhaftige Unterschrift (KI nie als Max) + Echte Umlaute (niemals ASCII-Ersatz)

---

## Format einer Regel

```markdown
# NNN — Titel

**Status:** active | deprecated | proposed
**Seit:** YYYY-MM-DD
**Gilt für:** alle Projekte | nur Kundenprojekte | ...

## Regel / Inhalt
Knappe Aussage, was Pflicht ist.

## Warum
Was passiert ist, das diese Regel nötig gemacht hat.

## Wie anwenden
Konkrete Schritte, Befehle, Templates.

## Audit
Wie `scripts/audit.mjs` die Einhaltung prüft.
```

Bei zusammengeführten Standards (mehrere Themen in einer Datei): Inhalt-Übersicht als erstes, dann Abschnitte `## A —`, `## B —` etc.

---

## Externe Recherche

- [`../research/2026-04-28-github-similar-projects.md`](../research/2026-04-28-github-similar-projects.md) — ossf/scorecard, garak, promptfoo, trivy, OWASP-Top-10-LLM
