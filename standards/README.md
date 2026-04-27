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

**Tests & Doku:**
- [005-test-first.md](005-test-first.md) — Smoke + Unit Tests bevor "ist live" gemeldet wird
- [006-handoff-md.md](006-handoff-md.md) — Jedes Projekt hat HANDOFF.md auf dem Server

**Naming & Domains:**
- [007-paths-naming.md](007-paths-naming.md) — Pfade und Container-Naming-Konventionen
- [008-domain-policy.md](008-domain-policy.md) — Neue Resourcen auf .one, nie .studio

**UI & Compliance:**
- [009-impressum-widget.md](009-impressum-widget.md) — Impressum aus zentraler API
- [010-credits-api.md](010-credits-api.md) — Credits aus zentraler API
- [011-vector-chat-widget.md](011-vector-chat-widget.md) — Vector-Chat-Widget in jedem Projekt
- [012-footer-standard.md](012-footer-standard.md) — Footer-Struktur über alle Projekte

**Verantwortung & Sicherheit:**
- [013-launch-gate-review.md](013-launch-gate-review.md) — Launch-Gate: Security & Compliance Review mit Sign-Off vor `live`
- [022-secret-scan.md](022-secret-scan.md) — gitleaks-Pflicht vor `live`
- [023-static-analysis.md](023-static-analysis.md) — semgrep OWASP-Top-10 vor `live`
- [VULN-CATALOG.md](VULN-CATALOG.md) — Sicherheitslücken-Katalog: Tools, Vorfälle, Coverage-Matrix (Referenz für 013/022/023)

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
