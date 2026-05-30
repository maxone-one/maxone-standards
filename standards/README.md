# Standards

Jede Regel als eigene `NNN-name.md`, mit Versionsnummer und Begründung. Das
Format ist absichtlich nahe an den ADR-Stil (Architecture Decision Records),
damit nachvollziehbar bleibt **warum** eine Regel existiert.

## Index

**Infrastruktur & Deploy:**
- [001-deployment-blue-green.md](001-deployment-blue-green.md) — Blue/Green Deploy für alle Live-Projekte
- [002-no-build-on-prod.md](002-no-build-on-prod.md) — Niemals Docker-Builds auf Prod-Servern
- [003-secrets-store.md](003-secrets-store.md) — Zentraler Secrets-Store unter `/opt/secrets/`
- [004-tls-dns01.md](004-tls-dns01.md) — TLS-Certs immer per DNS-01, nie HTTP-01
- [047-disk-guard.md](047-disk-guard.md) — Docker-Disk-Management: `builder prune -af` ohne `--until=`, Cleanup alle 4h, disk-guard.sh alle 10min@80% (disk-full-Vorfall 2026-05-18)

**Tests & Doku:**
- [005-test-first.md](005-test-first.md) — Smoke + Unit Tests bevor "ist live" gemeldet wird
- [006-handoff-md.md](006-handoff-md.md) — Jedes Projekt hat HANDOFF.md auf dem Server
- [048-plan-tracker.md](048-plan-tracker.md) — PLAN.md mit "## Noch offen" + "## Erledigt" in jedem aktiven Projekt
- [050-bug-registry.md](050-bug-registry.md) — BUGS.md: persistente Bug-Wissensbasis, lesen vor jeder Debugging-Session
- [055-concept-reference.md](055-concept-reference.md) — CONCEPT.md: Produkt-Konzept als Single Source of Truth für Agenten und Copy

## Pflicht-Dateien pro Projekt (alle auf einmal anlegen/prüfen)

Für jedes Projekt mit `status: live` oder `status: dev` müssen diese Dateien
**gleichzeitig** vorhanden sein — nicht "eine anlegen wenn sie fehlt", sondern
immer alle vier gemeinsam prüfen und bei Fehlen sofort nachholen:

| Datei | Ort | Standard | Inhalt |
|-------|-----|----------|--------|
| `CONCEPT.md` | Repo-Root | 055 | Was das Produkt ist, Vision, Sprache |
| `PLAN.md` | Repo-Root | 048 | Offene + erledigte Pläne |
| `BUGS.md` | Repo-Root | 050 | Aktive + geschlossene Bugs |
| `HANDOFF.md` | `/opt/<projekt>/` auf Server | 006 | Infra-Zustand, letzter Deploy |

**Warum gleichzeitig:** Wenn nur eine Datei fehlt und man sie isoliert anlegt,
fehlen die anderen drei beim nächsten Session-Start trotzdem. Der einzige sichere
Ansatz ist der Voll-Check: alle vier auf einmal anlegen wenn eine davon fehlt.

**Naming & Domains:**
- [007-paths-naming.md](007-paths-naming.md) — Pfade und Container-Naming-Konventionen
- [008-domain-policy.md](008-domain-policy.md) — Neue Resourcen auf .one, nie .studio

**UI & Compliance:**
- [009-impressum-widget.md](009-impressum-widget.md) — Impressum aus zentraler API
- [010-credits-api.md](010-credits-api.md) — Credits aus zentraler API
- [011-vector-chat-widget.md](011-vector-chat-widget.md) — Vector-Chat-Widget in jedem Projekt
- [012-footer-standard.md](012-footer-standard.md) — Footer-Struktur über alle Projekte

**Verantwortung & Sicherheit:**
- [015-concept-gate.md](015-concept-gate.md) — Gate 1: CONCEPT.md vor erster Code-Zeile
- [016-stack-whitelist.md](016-stack-whitelist.md) — Stack-Whitelist + Plattform-Blacklist (Lovable/Bolt/Base44/v0/Replit raus)
- [013-launch-gate-review.md](013-launch-gate-review.md) — Gate 3: Security & Compliance Review mit Sign-Off vor `live`
- [014-sunset.md](014-sunset.md) — Sunset-Prozess: Daten exportieren, Drittdienste kündigen, Container/DNS abbauen, Repo archivieren
- [036-spec-archive.md](036-spec-archive.md) — PRD/TODO/DONE-Lifecycle: Drei-Datei-Schema pro Phase + Archiv-Pfad + Mirror-Repo + drei Kategorien für Arbeit ausserhalb Phasen
- [017-dsgvo-tracker-audit.md](017-dsgvo-tracker-audit.md) — Drittdienste/Tracker (Google Fonts, GA, Pixel, Embeds) erst nach Consent
- [041-avv-dpa-registry.md](041-avv-dpa-registry.md) — AVV-/DPA-Registry: Auftragsverarbeiter pro Projekt in `registry/projects.yml` dokumentieren und vor Live-Gang pruefen
- [018-bundle-drift-audit.md](018-bundle-drift-audit.md) — Live-Bundle ohne veraltete Hosts, Source-Maps, Plattform-Watermarks
- [019-cert-dns-reality.md](019-cert-dns-reality.md) — DNS auf eigenen Server + TLS-Cert gültig + LE-Issuer
- [020-pentest-light.md](020-pentest-light.md) — defensive Außensicht: exposed Files / Admin-Routen / Header-Hygiene (SPA-Catch-All-erkennend)
- [021-re-review-reminder.md](021-re-review-reminder.md) — alle 180 Tage Re-Audit pro Live-Projekt (Drift-Schutz)
- [022-secret-scan.md](022-secret-scan.md) — gitleaks-Pflicht vor `live`
- [023-static-analysis.md](023-static-analysis.md) — semgrep OWASP-Top-10 vor `live`
- [024-code-health-budget.md](024-code-health-budget.md) — Refactor-Anteil ≥ 15 %, Datei < 500 Zeilen, Funktion < 100 Zeilen
- [025-llm-app-spezial.md](025-llm-app-spezial.md) — Prompt-Härtung, Tool-Schema, Approval-Queue, Injection-Tests für LLM-Apps

**Philosophie & Pipeline:**
- [026-self-hosted-first.md](026-self-hosted-first.md) — Self-Hosted-First, keine Abos (Ausnahmen: Domain-Registrar, TLS-CA, VPS-Hosting, Payment)
- [027-deploy-pipeline.md](027-deploy-pipeline.md) — CI-Build → Image-Transfer → Health-Check → Traefik-Swap (formaler Pfad zu 001 + 002)
- [028-container-misconfig.md](028-container-misconfig.md) — Container-Misconfig-Audit: 7 Pflicht-Klassen pro `docker-compose.yml` (privileged, inline-secrets, `:latest`-Pull, mem_limit, restart, docker.sock, env_file aus `/opt/secrets/`); schließt 002+004-Compose-Blindspot
- [029-indirect-prompt-injection-test.md](029-indirect-prompt-injection-test.md) — Pflicht-Test-Suite mit ≥10 Indirect-Injection-Payloads (greshake/Giskard/garak) für LLM-Apps mit externer Content-Ingestion (Telegram/Email/RAG/Web/Upload)
- [030-mail-architecture.md](030-mail-architecture.md) — Mail-Architektur (Outbound=Brevo, Inbound+Sent=Stalwart JMAP); Pre-Flight Brevo-Domain-Auth; destilliert aus 23 Bibel-Regeln + 5 Vorfällen (03-24/04-05/04-10/04-27/05-16)
- [039-mailbox-password-sync.md](039-mailbox-password-sync.md) — Mailbox-Passwort-Sync: Stalwart-Passwortänderung muss alle abhängigen Stores synchronisieren (maxone email_accounts + SnappyMail); Vorfall 2026-05-16 Ban-Zyklus
- [031-routine-platform.md](031-routine-platform.md) — Routine-Platform: Cron/Reminder/Watchdog-Routinen NUR auf Heartbeat-Plattform (GH Actions schedule, systemd-Timer, pg_cron) oder via 24/7-Agent (VECTOR) — niemals IDE-/User-NUC-/Claude-Sitzungs-abhängig
- [032-supabase-ssr-auth.md](032-supabase-ssr-auth.md) — Supabase SSR Auth Middleware-Matcher: broad Negative-Lookahead-Pattern, niemals selektive Pfad-Liste — sonst sterben Sessions nach ~1h Idle / bei Deploys (SLF-Vorfall 2026-04-28)
- [033-post-deploy-warmup.md](033-post-deploy-warmup.md) — Post-Deploy-Warmup: Health-Check + erste Page-Renders gegen den NEUEN Container, BEVOR Traefik geswappt wird
- [042-version-marker.md](042-version-marker.md) — Version-Marker: `BUILD_ID` als ENV im Container + `/api/version` Endpoint + sichtbarer Banner im Footer (Drift-Check + Bug-Report-Begleiter)

**Kosten & Budget:**
- [034-cost-caps-and-budget-alerts.md](034-cost-caps-and-budget-alerts.md) — Drei Verteidigungslinien gegen API-Kostenüberraschungen (Provider-Cap + Code-Cap + Wiederholungs-Marker) + Privat-DM-Alert; SLF Places-API-Vorfall 2026-05-02 (715 EUR)

**Marken-Werte & Kommunikation:**
- [035-signature-truthful.md](035-signature-truthful.md) — Wahrhaftige Unterschrift: es unterzeichnet, wer wirklich verschickt — KI niemals als Max, Bot niemals als Person (Viktoria-From-Vorfall 2026-04-29)

**Produkt-Features:**
- [052-pioneer-system.md](052-pioneer-system.md) — Pioneer-System: limitierte Slots, endlicher Puls-Pool, Leaderboard-Wall; Konstanten aus server-sicheren Modulen; Singular „Puls" / Plural „Pulse" / „Puls-" in Komposita; ICU-Plural-Pattern für next-intl

**Projektübergreifende Koordination:**
- [038-cross-project-broadcast.md](038-cross-project-broadcast.md) — Cross-Project Incident Broadcast (CPIB): Fehler/Änderungen mit projektübergreifendem Effekt werden als Broadcast in `broadcasts/` dokumentiert — alle betroffenen Projekte fixieren, Audit prüft offene Einträge

- [VULN-CATALOG.md](VULN-CATALOG.md) — Sicherheitslücken-Katalog: Tools, Vorfälle, Coverage-Matrix (Referenz für 013/014/015/016/017/018/019/020/022/023/025/028/029/030/031/032); D-Block mit OWASP LLM01..LLM10:2025 + Agentic ASI01..ASI10:2026 IDs verknüpft

**Externe Recherche / Vergleichsprojekte:**
- [`../research/2026-04-28-github-similar-projects.md`](../research/2026-04-28-github-similar-projects.md) — Recherche zu ähnlichen GitHub-Projekten (ossf/scorecard, garak, promptfoo, trivy, OWASP-Top-10-LLM/Agentic) + priorisierte Anreicherungs-Vorschläge

## Format einer Regel

```markdown
# NNN — Titel

**Status:** active | deprecated | proposed
**Seit:** YYYY-MM-DD
**Gilt für:** alle Projekte | nur Kundenprojekte | ...

## Regel
Eine knappe Aussage, was Pflicht ist.

## Warum
Was passiert ist, das diese Regel nötig gemacht hat. Welcher Vorfall, welche
Konsequenz. Die Begründung ist wichtiger als die Regel selbst — wer sie kennt,
kann Edge-Cases selbst entscheiden.

## Wie anwenden
Konkrete Schritte, Befehle, Templates die diese Regel umsetzen.

## Audit
Wie `scripts/audit.mjs` die Einhaltung prüft (Datei-Existenz, Pattern, etc.).
```
