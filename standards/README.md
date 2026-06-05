# Standards

Jede Regel als eigene `NNN-name.md`, mit Versionsnummer und Begründung. Format nahe am ADR-Stil (Architecture Decision Records), nachvollziehbar WARUM eine Regel existiert.

## Cap-Regel: maximal 33 Standards

Neue Regeln werden als **Abschnitt in bestehende Dateien** eingefügt, nicht als neue Nummer.
Nur wenn ein Thema genuinely orthogonal zu allen bestehenden ist, darf eine neue Datei entstehen.
Ziel: auch nach weiteren Erweiterungen nie mehr als 33 Nummern.

Aktuell: **31 Standards** (2 freie Slots).

## Propagations-Regel (2026-05-30)

Wenn in einem Projekt eine neue Regel entsteht (Vorfall, Direktive, Erfahrung):

1. **Standard anlegen oder erweitern**, hier in maxone-standards (Cap beachten)
2. **Alle anderen Projekte nachrüsten**, sofort, nicht "beim nächsten Touch"
3. **Broadcast anlegen** wenn Drift-Risiko besteht (Standard 021-C)

Projektlokal = temporär. In Standards = permanent und projektübergreifend.

---

## Pflicht-Dateien pro Projekt (alle auf einmal anlegen/prüfen)

Für jedes Projekt mit `status: live` oder `status: dev` müssen diese Dateien **gleichzeitig** vorhanden sein:

| Datei | Ort | Standard | Inhalt |
|---|---|---|---|
| `CONCEPT.md` | Repo-Root | 029 | Was das Produkt ist, Vision, Sprache |
| `PLAN.md` | Repo-Root | 024 | Offene + erledigte Pläne |
| `BUGS.md` | Repo-Root | 025 | Aktive + geschlossene Bugs |
| `HANDOFF.md` | `/opt/<projekt>/` auf Server | 004 | Infra-Zustand, letzter Deploy |
| `docs/DECISIONS.md` | `docs/` | 031 | Strategische Entscheidungen, die PRD/Konzept überschreiben (nur wenn PRD vorhanden) |

Wenn eine Datei fehlt, alle vier auf einmal anlegen, nicht nur die fehlende.

---

## Index

**Infrastruktur & Deploy:**
- [001-deploy.md](001-deploy.md), Blue/Green + kein Prod-Build + Deploy-Pipeline + Post-Deploy-Warmup
- [002-secrets-tls.md](002-secrets-tls.md), Zentraler Secrets-Store + TLS via DNS-01
- [004-handoff-md.md](004-handoff-md.md), HANDOFF.md auf dem Server vor jeder Arbeit lesen
- [005-paths-naming.md](005-paths-naming.md), Pfade und Container-Naming-Konventionen
- [006-domain-policy.md](006-domain-policy.md), Neue Infrastruktur auf `.one`, nie `.studio`
- [012-cert-dns-reality.md](012-cert-dns-reality.md), DNS auf eigenen Server + TLS-Cert gültig + LE-Issuer
- [015-container-safety.md](015-container-safety.md), Container-Misconfig-Audit + Disk-Guard (builder prune, 4h-Cron, 80%-Bremse)
- [017-routine-platform.md](017-routine-platform.md), Cron/Watchdog-Routinen nur auf Heartbeat-Plattform (GitHub Actions schedule, systemd-Timer, VECTOR)
- [019-cost-caps-and-budget-alerts.md](019-cost-caps-and-budget-alerts.md), Drei Verteidigungslinien gegen API-Kostenüberraschungen

**Tests & Dokumentation:**
- [003-tests-quality.md](003-tests-quality.md), Test-First (Smoke + Unit vor "live") + Code-Health-Budget (Refactoring ≥ 15 %, Duplikation < 5 %)
- [024-plan-tracker.md](024-plan-tracker.md), PLAN.md mit "## Noch offen" + "## Erledigt" in jedem aktiven Projekt
- [025-bug-registry.md](025-bug-registry.md), BUGS.md: persistente Bug-Wissensbasis vor jeder Debugging-Session lesen
- [029-concept-reference.md](029-concept-reference.md), CONCEPT.md: Produkt-Konzept als SSoT für Agenten und Copy + Ausbaustufe lebendes Projekt-Brain (code-verankerter Feature-Katalog, Selbsterhaltung, Konsum-Regel)
- [031-decisions-md.md](031-decisions-md.md), DECISIONS.md: Strategische Entscheidungen die PRD/Konzept überschreiben + Drei-Quellen-Hierarchie

**UI & Produkt:**
- [007-required-ui.md](007-required-ui.md), Impressum-API + Credits-API + Vector-Chat-Widget + Footer (alle Customer-facing Pflichten)
- [022-ssot-version.md](022-ssot-version.md), Version-Marker (ENV + /api/version + Footer) + Cron-E-Mail-Dedup + SSoT/kein Hardcode
- [023-admin-ui.md](023-admin-ui.md), Dashboard-Layout + DevPanel + App-Launcher
- [026-pioneer-system.md](026-pioneer-system.md), Pioneer-System: limitierte Slots, Puls-Pool, Leaderboard
- [027-image-pipeline.md](027-image-pipeline.md), Bild-Pipeline (EXIF, Format, Optimierung)
- [028-brevo-api-outreach.md](028-brevo-api-outreach.md), Brevo API Outreach-Campaigns
- [030-manufacturer-assets.md](030-manufacturer-assets.md), Hersteller-Logos + Produktbilder: Bezugsreihenfolge (Pressematerial → Website-Inspektion → Playwright), Speicherort, URL-Muster KNX-Hersteller, Audit-Query

**Sicherheit & Gates:**
- [008-gates-review.md](008-gates-review.md), Gate 1 (Konzept) + Gate 3 (Launch-Review) + Pentest-Light + Re-Review alle 180 Tage
- [009-compliance.md](009-compliance.md), Sunset-Prozess + AVV/DPA-Registry (beide DSGVO-Art.-28-Richtungen)
- [010-stack-platform.md](010-stack-platform.md), Stack-Whitelist + Plattform-Blacklist (Lovable/Bolt/Base44 raus) + Self-Hosted-First
- [011-live-domain-audit.md](011-live-domain-audit.md), DSGVO-Tracker-Audit + Bundle-Drift-Audit (beide Live-Domain-Probes)
- [013-security-scanning.md](013-security-scanning.md), Secret-Scan (gitleaks) + Static-Analysis (Semgrep OWASP)
- [014-llm-security.md](014-llm-security.md), Direct Injection (System-Prompt-Härtung, Tool-Rechte, Approval-Queue) + Indirect Injection (RAG/Mail/Telegram)

**Infrastruktur-Services:**
- [016-mail.md](016-mail.md), Mail-Architektur (Outbound=Brevo, Inbound=Stalwart JMAP) + Passwort-Sync
- [018-auth-db.md](018-auth-db.md), Supabase SSR Auth (broad Middleware-Matcher) + DB-Isolation (ein Projekt, eine DB)
- [021-project-coordination.md](021-project-coordination.md), Spec-Archiv (PRD/TODO/DONE) + Dep-Currency (Sweep-Kadenz) + Cross-Project-Broadcast

**Marke & Kommunikation:**
- [020-brand-communication.md](020-brand-communication.md), Wahrhaftige Unterschrift (KI nie als Max) + Echte Umlaute (niemals ASCII-Ersatz)

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

## Cross-Links: Wiki & Standards

Standards und Wiki sind bidirektional verknüpft. Die Pfeile:

| Standard | Wiki-Topic |
|---|---|
| 016-mail | `~/.claude/wiki/maxone-mail-pilot/INDEX.md` |
| 026-pioneer-system | `~/.claude/wiki/pioneers/INDEX.md` |
| 027-image-pipeline | `~/.claude/wiki/brand/visual-style.md` |

**Regel:** Wenn ein Standard ein komplexes narratives Thema hat (Vorfalls-Geschichte, Betriebswissen, Sprach-Konzepte), gehört der Kontext ins Wiki, der Standard verlinkt dorthin. Das Wiki verlinkt zurück zum Standard als Pflicht-Spec.

Wiki-Index-Datei (Eintrittspunkt): `c:/Users/max/.claude/INDEX.md`

## Externe Recherche

- [`../research/2026-04-28-github-similar-projects.md`](../research/2026-04-28-github-similar-projects.md), ossf/scorecard, garak, promptfoo, trivy, OWASP-Top-10-LLM
