# 016 — Stack & Platform Policy (Whitelist · Self-Hosted-First)

**Status:** active
**Seit:** 2026-04-27 (Whitelist), 2026-04-28 (Self-Hosted-First)
**Gilt für:** alle Projekte und Infrastruktur

## Inhalt

- [A] Stack-Whitelist & Plattform-Blacklist
- [B] Self-Hosted-First (keine Abos)

---

## A — Stack-Whitelist & Plattform-Blacklist

Der Stack jedes Projekts MUSS aus der Whitelist stammen. Blacklist-Komponenten sind verboten — Ausnahmen nur mit dokumentiertem Migrations-Pfad in CONCEPT.md und Sign-Off, dass die Migration vor Gate 3 abgeschlossen ist.

### Whitelist

**Hosting:** Hetzner Cloud EU ✅ Default · Coolify self-host ✅ · Vercel ⚠️ nur Marketing ohne PII · AWS/Azure/GCP ❌ ohne DSFA

**Datenbank:** Supabase self-hosted ✅ Default · PostgreSQL eigener Container ✅ · SQLite ✅ für Tools · Firebase ❌ · PlanetScale/Neon ⚠️ nur mit DSFA

**Frontend:** SvelteKit ✅ Default · Next.js self-host ✅ · Astro ✅ · Vite+React/Solid/Vue ✅ · Next.js auf Vercel ⚠️ nur ohne PII

**AI-Coding (lokal):** Claude Code CLI ✅ Default · Cursor ✅ · GitHub Copilot ⚠️ nur Public-Repos

**KI-Inferenz (in App):** Claude via CLI (`claude -p`) ✅ Default · Anthropic API direkt ❌ (globale CLAUDE.md-Regel) · Self-hosted LLMs ✅

**Mail:** Brevo ✅ Default Outbound · Stalwart self-hosted ✅ Default Inbound · Mailchimp/SendGrid ❌ ohne DSFA

**Reverse Proxy:** Traefik ✅ Default · Caddy ✅ · Nginx ✅

### Blacklist — verboten ohne Migrations-Pfad

| Plattform | Warum verboten | Vorfälle |
|---|---|---|
| **Lovable.dev** | Multi-Tenant-Lücken, Lock-in | CVE-2025-48757 (170+ Apps), 3 Incidents/12 Monate |
| **Bolt.new** | Lock-in, proprietäre Konventionen | Teil des Escape.tech-2.000-Findings-Scans |
| **Base44** | Plattform-Lücke belegt | Juli 2025: Cross-Tenant-Zugriff |
| **v0 (Vercel)** | Vercel-Lock-in + US-Cloud | |
| **Replit-Agent** | löschte Prod-DB trotz Anweisung | 2025-Vorfall |

**Migrations-Pfad in CONCEPT.md:** welche Plattform initial, bis wann auf eigene Infra, wer hat Code Zeile für Zeile re-reviewed (ersetzt nicht Gate 3 Section J).

### Wie anwenden

- Bei Gate 1: Stack-Wahl pro Schicht mit Whitelist-Status in CONCEPT.md
- Bei Gate 3: Bundle auf Blacklist-Marker scannen
- PII-verarbeitende externe Dienste: AVV-Status prüfen (→ Standard 014)

---

## B — Self-Hosted-First (keine Abos)

Jede Komponente wird in dieser Reihenfolge ausgewählt:

1. **Existierendes self-hostbares Paket nutzen** (Docker-Image, OSS-Binary)
2. **Selbst bauen** (nur wenn nichts Passendes vorhanden)
3. **Niemals Abo / SaaS / Cloud-Subscription** — keine wiederkehrenden Zahlungen, keine API-Keys mit monatlicher Quote

**Einzige Ausnahmen:** Domain-Registry/DNS-Provider (Naturmonopol), TLS-CA (Let's Encrypt, kostenlos), VPS-Hoster (Hardware-Miete).

**Bestehende self-hosted Komponenten:** Stalwart (Mail), Umami (Analytics), Supabase self-hosted, Claude CLI (Abo per User, deckt alle Projekte), Traefik (Reverse Proxy), self-hosted GitHub-Runner.

**Bei SaaS-Anfrage:** stop — diese Regel ist nicht verhandelbar. Einfachheit ist nicht der Maßstab, Souveränität und Kostenkontrolle sind es.

**Warum:** 10 € × 8 Services × 12 Monate = 960 € Fixkosten vs. 12 € monatlich für einen Hetzner-VPS der alle 8 Services hostet. Datensouveränität: Kunden-Daten verlassen unsere Hetzner-Server nicht.

---

## Audit

`scripts/audit.mjs` prüft pro Projekt:

**Blacklist:**
- Lockfiles auf `@lovable/*`, `@stackblitz/sdk`, `@base44/*`, `@replit/agent` → FAIL wenn `status: live`, WARN wenn `dev`
- Plattform-Marker-Files (`.lovable`, `.bolt`, `replit.nix`) → WARN
- `vercel.json` + `tags: customer` ohne CONCEPT.md-Erwähnung → WARN

**Self-Hosted:**
- `registry/projects.yml → external_subscriptions:` mit erlaubten `reason`-Werten (`payment-processor`, `domain-registrar`, `tls-ca`, `vps-hosting`) → andere Werte → WARN
- Bekannte SaaS-Indikatoren in `docker-compose.yml` (Elastic, Datadog) → WARN
- SDK-Dependencies bekannter Abo-Dienste in `package.json` → INFO
