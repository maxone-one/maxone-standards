# 016 — Stack-Whitelist & Plattform-Blacklist

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle neuen Projekte ab heute, sowie Migrations-Pflicht für Bestand bei nächster grösserer Änderung

## Regel

Der Stack jedes Projekts MUSS aus der **Whitelist** stammen. Komponenten
auf der **Blacklist** sind verboten — Ausnahmen nur mit dokumentiertem
Migrations-Pfad in der `CONCEPT.md` (Standard 015) und Sign-Off, dass
die Migration vor Gate 3 (Standard 013) abgeschlossen ist.

Kein Stack-Eintrag ohne Begründung. Keine Blacklist-Komponente ohne
Migrations-Pfad. Kein Live-Status mit Blacklist-Komponente im Bundle. Kein
PII-verarbeitender externer Dienst ohne geklaerten AVV-/DPA-Status nach
Standard 041.

## Warum

Vibe-Coding-Plattformen (Lovable, Bolt.new, Base44, v0, Replit-Agent)
machen Code in Stunden lauffähig — und teilen sich gleichzeitig drei
strukturelle Probleme:

1. **Plattform als gemeinsame Angriffsfläche.** Eine Lücke in der
   Plattform öffnet ALLE Apps, die darauf laufen. Eigener Code-Review
   schützt nicht.
   - **Base44 Juli 2025** — Plattform-Lücke gab Angreifern Zugriff auf
     beliebige fremde private Apps. User-Code irrelevant.
   - **Lovable 2026** — drei dokumentierte Security-Incidents binnen
     12 Monaten, jüngster (BOLA) 48 Tage offen nach Bug-Bounty-Report.
   - **CVE-2025-48757** — 170+ Lovable-Apps ohne RLS exposed.

2. **Lock-in durch proprietäre Konventionen.** Plattform-spezifische
   Build-Pipelines, Konfig-Formate, Edge-Function-Wrapper, „Magic"-Imports.
   Migration auf eigene Infra wird zur Komplett-Re-Implementation.
   - **Escape.tech März 2026** — Scan von 5.600 produktiv deployten
     Lovable/Bolt/Base44-Apps: 2.000 hochkritische Lücken, 400
     exponierte Secrets, 175 PII-Leaks. Niemand migriert weg, weil zu teuer.

3. **AVV-/DSGVO-Lücke.** Plattformen sind Auftragsverarbeiter mit
   eigenen Subprozessoren in den USA. Bei sensiblen Daten muss explizit
   geprüft werden — viele Vibe-Plattformen haben kein abschliessbares AVV.

Eigene Infra (Hetzner + Docker + Traefik + Supabase self-hosted) ist
weniger bequem, aber:
- Lücken sind im eigenen Verantwortungsbereich → fixbar
- Keine Plattform-CVE betrifft mich gleichzeitig
- AVV nur mit Hetzner (deutscher Anbieter, Standard-AVV)
- Code ist portabel zwischen Servern

## Whitelist

### Hosting

| Komponente | Status | Begründung |
|---|---|---|
| **Hetzner Cloud (EU)** | ✅ Default | DSGVO, Standard-AVV, eigene Kontrolle |
| **Coolify (auf eigenem VPS)** | ✅ erlaubt | self-host Orchestrierung, kein Lock-in |
| **Vercel** | ⚠️ nur Marketing-Sites ohne PII | US-Cloud, AVV-Lücke bei personenbezogenen Daten |
| **Cloudflare Pages** | ⚠️ nur statische Inhalte | US-Cloud-Edge, AVV nur mit Pro-Plan |
| **Hetzner Storage Box** | ✅ erlaubt | für Backups |
| **AWS / Azure / GCP** | ❌ nicht ohne explizite DSFA | US-Cloud, Schrems-II |

### Datenbank

| Komponente | Status | Begründung |
|---|---|---|
| **Supabase self-hosted (EU-VPS)** | ✅ Default | Default für maxone-Stack |
| **Supabase Cloud EU** | ✅ erlaubt mit AVV (Pro-Plan) | EU-Region prüfen |
| **PostgreSQL (eigener Container)** | ✅ erlaubt | maximal portabel |
| **SQLite** | ✅ erlaubt für Tools / Single-User | embedded, kein Service |
| **Firebase / Firestore** | ❌ verboten | Google US, AVV-Lücke, Vendor-Lock |
| **PlanetScale / Neon serverless** | ⚠️ nur mit DSFA | US-Cloud |

### Frontend Framework

| Komponente | Status | Begründung |
|---|---|---|
| **SvelteKit** | ✅ Default | Max' Erfahrung, eigene Infra-portabel |
| **Next.js (self-host)** | ✅ erlaubt | wenn nicht auf Vercel deployed |
| **Astro** | ✅ erlaubt | für Marketing-Sites |
| **Vite + React/Solid/Vue** | ✅ erlaubt | SPA-Bedarf |
| **Plain HTML + Vanilla JS** | ✅ erlaubt | für statische Mini-Tools |
| **Next.js auf Vercel** | ⚠️ nur ohne PII | siehe Hosting-Tabelle |

### AI-Coding-Tools (lokal, mein Editor)

| Komponente | Status | Begründung |
|---|---|---|
| **Claude Code (CLI + IDE)** | ✅ Default | Anthropic, eigenes Abo, CLI-only |
| **Cursor** | ✅ erlaubt | lokaler Editor, Code bleibt lokal |
| **Vybora** (eigene Multi-Agent-Suite) | ✅ erlaubt | self-hosted |
| **GitHub Copilot** | ⚠️ nur Public-Repos | Code → MSFT-Cloud zur Inferenz |
| **Codeium / Tabnine** | ⚠️ self-host-Modus only | Cloud-Modus = Code-Leak |

### KI-Modelle (Inferenz für Anwendung selbst, nicht Editor)

| Komponente | Status | Begründung |
|---|---|---|
| **Claude (via CLI / `claude -p`)** | ✅ Default | siehe globale CLAUDE.md-Regel |
| **OpenAI / Anthropic API direkt** | ❌ verboten ausser explizite Ausnahme | siehe globale CLAUDE.md — nur Claude CLI |
| **Self-hosted LLMs (Ollama, vLLM)** | ✅ erlaubt | für embedded Use-Cases |
| **OpenRouter** | ⚠️ nur falls keine Alternative | US-Proxy |

### Reverse Proxy / TLS

| Komponente | Status | Begründung |
|---|---|---|
| **Traefik (eigene Inst.)** | ✅ Default maxone-prod | siehe globale Regel TLS DNS-01 |
| **Caddy** | ✅ erlaubt | vybora-prod |
| **Nginx** | ✅ erlaubt | wenn Team das bevorzugt |

### Mail-Versand

| Komponente | Status | Begründung |
|---|---|---|
| **Brevo (Sendinblue)** | ✅ Default Transaktional | EU, AVV im Account, siehe Zentinel-Bibel |
| **Stalwart (eigener Mail-Server)** | ✅ Default Inbound + Sent | eigene Domain-Identität |
| **Mailchimp / SendGrid / Postmark** | ❌ nicht ohne DSFA | US-Cloud |

## Blacklist — verboten ohne Migrations-Pfad

Diese Plattformen sind **nicht erlaubt** als Production-Stack. Falls
ein Projekt initial dort gebaut wurde: Migration vor Gate 3 (Standard 013)
verpflichtend.

| Plattform | Verboten weil | Dokumentierte Vorfälle |
|---|---|---|
| **Lovable.dev** | ❌ Multi-Tenant-Lücken, Lock-in | CVE-2025-48757 (170+ Apps), BOLA 48d offen 2026, 3 Incidents in 12 Monaten |
| **Bolt.new (StackBlitz)** | ❌ Lock-in, Bundle-Konvention proprietär | Teil des Escape.tech-2.000-Findings-Scans |
| **Base44** | ❌ Plattform-Lücke historisch belegt | Juli 2025: Cross-Tenant-Zugriff |
| **v0 (Vercel)** | ❌ Vercel-Lock-in + US-Cloud | siehe Vercel-Hosting-Bewertung |
| **Replit-Agent** | ❌ autonomer Agent ignorierte Anweisungen, löschte Prod-DB | 2025-Vorfall, Kaspersky-Analyse |

**Migrations-Pfad-Pflicht:** wenn eine dieser Plattformen für Prototypen
genutzt wurde, MUSS in `CONCEPT.md` (Section Stack-Wahl) vermerkt sein:
- Welche Plattform initial
- Bis wann auf eigene Infra migriert
- Wer hat den Code nach Migration ZeilenWeise re-reviewed
- Dieser Review ersetzt nicht Standard 013 Section J Punkt 8

## Wie anwenden

**1. Bei Gate 1 (Standard 015 CONCEPT.md):**
   - Section „Stack-Wahl" listet pro Schicht die Komponente
   - Pro Komponente: Whitelist-Status (✅/⚠️/❌) + Begründung
   - ⚠️-Komponenten: explizit begründen, warum kein Default
   - ❌-Komponenten: Migrations-Pfad eintragen

**2. Bei Gate 3 (Standard 013 LAUNCH-REVIEW.md):**
   - Section J Punkt 8 (Plattform-Lock-in) prüft, ob Blacklist-Migration
     wirklich vollzogen wurde
   - Bundle-Scan auf Blacklist-Marker (siehe Audit unten)

**3. Bei Stack-Wechsel im Bestand:**
   - Re-Review im CONCEPT.md mit neuem Datum
   - Re-Review im LAUNCH-REVIEW.md (Standard 013)

**4. Ausnahmen:**
   - „Marketing-Site ohne Login" auf Vercel/Cloudflare Pages OK, aber in
     CONCEPT.md vermerken
   - Forschungs-/Wegwerf-Prototyp: ❌-Plattform OK, aber `status: dev`
     bleibt — kein Live-Übergang ohne Migration

## Audit

`scripts/audit.mjs` prüft pro Projekt:

- **Lockfiles** (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) auf
  Blacklist-Pakete: `@lovable/*`, `@stackblitz/sdk`, `@base44/*`, `v0` als
  Komponente, `@replit/agent` → **FAIL** wenn `status: live`, **WARN** wenn `dev`
- **Plattform-Marker-Files** (`.lovable`, `.bolt`, `lovable.config.*`,
  `.stackblitz`, `replit.nix`, `.replit`) im Repo-Root → **WARN**
  („Migration nicht abgeschlossen?")
- **Vercel/Cloudflare-Konfig** (`vercel.json`, `wrangler.toml`):
  - existiert + `tags: customer` ohne CONCEPT.md-Erwähnung → **WARN**
  - existiert + Projekt mit Auth/PII → **WARN** („Vercel/CF mit PII —
    DSFA-Pflicht?")
- **CONCEPT.md** (sofern vorhanden, Standard 015) hat Section „Stack" →
  geprüft via 015-Audit, hier nur Cross-Reference
- Falls keiner der Marker gefunden + kein CONCEPT.md → **SKIP**
  (kann ohne Konzept nicht beurteilen)

Internes Tool (`tags: internal`) und Infra (`tags: infra`):
WARN statt FAIL für Blacklist — Risikoprofil ist anders.
