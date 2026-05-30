# Sicherheitslücken-Katalog

**Stand:** 2026-04-27 (erweitert mit User-Material 2026-04-27)
**Zweck:** Single-Point-of-Reference für jede Lücken-Klasse, die wir in unseren
Projekten gegen halten. Quellen, Real-World-Vorfälle, Coverage-Mapping.
**Pflege:** bei jedem neuen Vorfall / jeder neuen Studie ergänzen.

> Dieses Dokument ist die Begründung für Standard 008, 022, 023 und die
> noch geplanten 014–021. Es ersetzt sie nicht — es zeigt, **was sie
> abdecken und was nicht**.

---

## Teil 1: Scanning-Services & -Tools

Eine Übersicht aller Werkzeuge, die wir einsetzen oder einsetzen könnten.
Spalte „EU-OK" bewertet Datensouveränität (wichtig für Code-Audits, da
Dritte den Code sehen).

### SAST — Static Application Security Testing

| Tool | Lizenz | EU-OK | Findet | Bei uns im Einsatz |
|---|---|---|---|---|
| **Semgrep** | OSS + paid | ✅ self-host | XSS, SSRF, Injection, Path-Traversal | ✅ Standard 013 |
| **CodeQL** | GitHub-frei für Public, paid für Private | ⚠️ Cloud | Tiefe semantische Analyse | optional via GitHub Advanced Security |
| **SonarQube** | OSS Community + paid | ✅ self-host | Quality + Security gemischt | nicht im Einsatz |
| **Snyk Code** | Free-Tier + paid | ⚠️ US-Cloud | AI-augmented SAST, IDE-Integration, Auto-Fix | nicht im Einsatz |
| **Bearer** | OSS + paid | ✅ FR-Firma, self-host | PII-Handling, DSGVO-Fokus | empfohlen für DSGVO-Pass |
| **Aikido Security** | Free-Tier + paid | ⚠️ NL-Cloud | AutoTriage, Noise-Filter, dev-friendly | optional für IDE-Feedback |
| **DryRun Security** | paid | ⚠️ US-Cloud | PR-native, AI-aware, Policy-Enforcement | optional |
| **Mend SAST** | Enterprise | ⚠️ US-Cloud | MCP-Integration mit Cursor/Claude Code, Pre-Commit | optional bei Cursor-Workflows |
| **Plexicus Community** | OSS | ✅ self-host | All-in-One: SAST + SCA + IaC + Secrets | optional als Konsolidierung |
| **DeepSource** | Free + paid | ⚠️ US-Cloud | Auto-PR-Review | nicht im Einsatz |
| **Checkmarx** | $15.000+/Jahr | ⚠️ US-Cloud | Enterprise, Compliance-Reports | ❌ zu teuer für Solo/Solo-Studio |

### Secret Scanning

| Tool | Lizenz | EU-OK | Findet | Bei uns im Einsatz |
|---|---|---|---|---|
| **gitleaks** | OSS | ✅ self-host | Secrets in Code + Git-Historie | ✅ Standard 013 |
| **trufflehog** | OSS + paid (Verifizierung) | ✅ OSS lokal | Secrets + verifiziert ob "live" | optional ergänzend zu gitleaks |
| **GitHub Secret Scanning** | Free für Public, paid Private | ⚠️ Cloud aber GitHub-nativ | Push-Protection (blockt vor Push) | empfohlen aktivieren |
| **GitGuardian** | Free-Tier (25 Devs) + paid | ⚠️ FR-Cloud | Live-Monitoring, Pre-Commit, History | optional |
| **git-secrets** (AWS Labs) | OSS | ✅ self-host | Pre-Commit-Hook für Secret-Patterns | Alternative zu gitleaks |

### SCA — Dependency / Supply-Chain Scanning

| Tool | Lizenz | EU-OK | Findet | Bei uns im Einsatz |
|---|---|---|---|---|
| **npm audit / pnpm audit** | built-in | ✅ lokal | CVEs in Dependencies | ✅ Standard 008-A |
| **Dependabot** | GitHub-frei | ⚠️ Cloud | Auto-PRs für Vuln-Deps | empfohlen aktivieren |
| **Snyk Open Source** | Free-Tier + paid | ⚠️ US-Cloud | CVEs + License | optional |
| **Socket.dev** | Free + paid | ⚠️ US-Cloud | Bösartige npm-Pakete (Supply-Chain-Angriff) | empfohlen für npm-lastige Projekte |

### DAST — Dynamic / Runtime Scanning

| Tool | Lizenz | EU-OK | Findet | Bei uns im Einsatz |
|---|---|---|---|---|
| **OWASP ZAP** | OSS | ✅ self-host | Live-Site-Scan, XSS, SQLi, etc. | nicht im Einsatz, **empfohlen** |
| **Nuclei** | OSS (ProjectDiscovery) | ✅ self-host | Template-basierte Vuln-Scans, sehr schnell | **empfohlen für CI** |
| **Burp Suite Community** | Free | ✅ lokal | Manueller Pen-Test | bei Bedarf |
| **Detectify** | paid SaaS | ⚠️ SE-Cloud | DAST + EASM | optional |
| **Intruder.io** | paid SaaS | ⚠️ UK-Cloud | DAST einfach | optional |

### Supabase / RLS-spezifisch

| Tool | Lizenz | Findet | Bei uns im Einsatz |
|---|---|---|---|
| **Supabase Database Linter** | built-in | RLS fehlt, Default-Allow, missing index, security definer | ✅ in Supabase Studio (manuell prüfen) |
| **Supabase Security Advisor** | built-in | RLS, Performance, Missing-Index — limitiert (keine JWT/CORS/MFA-Checks) | ✅ Studio → Advisors |
| **Custom curl-Tests** | DIY | Anon-Key kann lesen was er soll | ✅ Standard 008-C |
| **Vibe App Scanner** | $5 einmalig | Externer 5-Min-Scan: RLS + Storage + RPC | empfohlen pro Launch (Second-Opinion) |
| **AuditYourApp** | paid | Tiefer Audit, testet echte API-Calls live | optional |
| **Supabase RLS Checker** | OSS Browser-Extension (Chrome/Firefox) | Live-Erkennung im Browser | optional bei Dev-Sessions |
| **securifyai.co RLS Scanner** | OSS | Offensive-Testing-Ansatz | optional |
| **Continue CLI + Supabase MCP** | OSS / kostenlos | GitHub-Action: täglicher RLS-Audit aller Tabellen via Claude | **empfohlen für daily Cron** |

### Container / Image Scanning

| Tool | Lizenz | EU-OK | Findet | Bei uns im Einsatz |
|---|---|---|---|---|
| **Trivy** | OSS (Aqua) | ✅ self-host | CVEs in Images, IaC, Secrets | **empfohlen für CI** |
| **Grype** | OSS (Anchore) | ✅ self-host | wie Trivy, oft schneller | Alternative |
| **Dockle** | OSS | ✅ self-host | Dockerfile-Best-Practices (root-User, layers, etc.) | **empfohlen ergänzend zu Trivy** |
| **Docker Scout** | built into Docker Desktop | ⚠️ US | CVE-Scan | nice-to-have |

### Server-Hardening / Host-Audit (auf VPS direkt)

| Tool | Lizenz | EU-OK | Findet | Bei uns im Einsatz |
|---|---|---|---|---|
| **Lynis** | OSS (CISOfy NL) | ✅ self-host | Server-Hardening-Audit für Debian/Ubuntu — Kernel, Firewall, SSH-Config, Auditd | **empfohlen monatlich** auf maxone-prod / voltfair-cli |
| **CrowdSec** | OSS (FR) + paid Console | ✅ self-host (Engine) | IDS/IPS, Community-basiertes Block-Listing, Fail2Ban-Nachfolger | **empfohlen** auf allen VPS |
| **Fail2Ban** | OSS | ✅ self-host | klassisches IP-Ban nach Fehlversuchen | aktuell im Einsatz, durch CrowdSec ersetzbar |

### DSGVO / Privacy

| Tool | Lizenz | EU-OK | Findet | Bei uns im Einsatz |
|---|---|---|---|---|
| **Webbkoll** (dataskydd.net) | OSS + Public Service | ✅ SE | Externe Hosts beim Initial-Load, Cookies, TLS | manuell, **empfohlen für 017** |
| **Cookiebot** | paid SaaS | ✅ DK | Cookie-Audit + Consent-Management | optional |
| **Usercentrics** | paid SaaS | ✅ DE | Consent-Management | optional |
| **Bearer** (siehe SAST) | — | ✅ FR | PII-Code-Scan | doppelt empfohlen |

### AI-Code-spezifisch (neu, 2025/26)

| Tool | Lizenz | EU-OK | Findet | Bei uns im Einsatz |
|---|---|---|---|---|
| **Escape.tech** | paid SaaS | ✅ FR | API/AI-App-Scan, Quelle der 5.600-App-Studie | empfohlen evaluieren |
| **PromptArmor** | paid | ⚠️ US | LLM-Sec, Prompt-Injection | optional bei LLM-Apps |
| **Tenzai Security** | paid | ⚠️ US | AI-Code-Audit-Service | optional |
| **Georgia Tech "Vibe Security Radar"** | Forschung | — | öffentliche CVE-Daten zu AI-Tools | als Quelle nutzen |
| **NVIDIA/garak** | OSS Apache 2.0 | ✅ self-host | LLM-Vuln-Scanner: 37+ Probes (DAN, promptinject, leakreplay, xss, malwaregen) | **empfohlen für 025-Test-Set** (Probes als JSONL-Seed, wöchentlicher Cron via VECTOR) |
| **promptfoo** | OSS MIT | ✅ self-host | YAML-deklaratives LLM-Eval + Red-Team mit `owasp:llm`-Preset; läuft als GH-Action | **empfohlen** als CI-Job statt selbst-gepflegtem vitest |
| **protectai/llm-guard** | OSS MIT | ✅ self-host | Runtime-Guard: Anonymize, BanSubstrings, PromptInjection, NoRefusal | **empfohlen** als Wrapper für VECTOR + email-client Edge Function |
| **splx-ai/agentic-radar** | OSS | ✅ self-host | Static-Analyzer für agentische Workflows (LangGraph, CrewAI, MCP-Server-Inventory) | optional für VECTOR-Tool-Drift |
| **microsoft/agent-governance-toolkit** | OSS | ✅ self-host | Zero-Trust Agent-Identity, Policy-Enforcement, Exec-Sandboxing | als Pattern-Quelle für VECTOR↔Supabase |

### Pen-Testing as a Service

| Anbieter | Modell | EU-OK | Bei uns |
|---|---|---|---|
| **HackerOne / Bugcrowd** | Bug-Bounty | ⚠️ US | erst bei höherer Reife |
| **Cobalt.io** | PTaaS | ⚠️ US | optional |
| **DGC / SySS** | klassisch DE | ✅ DE | optional, teuer |

---

## Empfohlene Pflicht-Pipeline (Max' Stack)

Minimal für jedes Projekt mit `status: live`:

| Stufe | Wann | Was | Standard |
|---|---|---|---|
| 1 | Pre-Commit (lokal) | gitleaks | 022 |
| 2 | Pre-Commit (lokal) | semgrep `--severity=ERROR` | 023 |
| 3 | CI (GitHub Actions) | gitleaks + semgrep + npm audit + Trivy (für Image) | 022, 023, 013-A, neu |
| 4 | Pre-Launch (manuell) | Standard 008 komplett, inkl. Section J | 013 |
| 5 | Pre-Launch (manuell) | Webbkoll-Scan auf Staging-URL | 017 (geplant) |
| 6 | Pre-Launch (manuell) | Nuclei oder OWASP ZAP gegen Staging | 020 (geplant) |
| 7 | Live-Continuous | Dependabot + GitHub Secret Scanning + GitHub Code Scanning | optional |
| 8 | Live-Continuous | VECTOR-Cron prüft Cert + DNS + Drift | 019 (geplant) |

---

## Teil 2: Vulnerability Catalog

Jeder Eintrag mit:
- **CWE/OWASP-ID** (wenn vorhanden)
- **Beschreibung**
- **AI-Failure-Rate** (mit Quelle, falls dokumentiert)
- **Real-World-Vorfall** (falls vorhanden)
- **Coverage** (welcher Standard / welches Tool fängt es)

### A. AI-spezifische Code-Lücken (Studienlage 2025/26)

#### A1 — XSS (Cross-Site Scripting)
- **CWE:** CWE-79 / OWASP A03 (Injection)
- **Beschreibung:** User-Input wird ungesanitiert als HTML/JS gerendert
- **AI-Rate:** **86 %** der AI-generierten Samples (Georgetown CSET 2025/26)
- **Vorfall:** in Lovable-/Bolt-/Base44-Apps live (Escape.tech 03/2026)
- **Coverage:** ✅ Standard 013 (semgrep), ✅ Standard 008 Section J Punkt 1

#### A2 — Log Injection
- **CWE:** CWE-117
- **Beschreibung:** Log-Einträge werden mit User-Input konstruiert, Angreifer kann Log-Format manipulieren oder PII einschleusen
- **AI-Rate:** **88 %** Failure (Georgetown CSET)
- **Coverage:** ✅ Standard 013 (semgrep), ✅ Standard 008 Section J Punkt 2

#### A3 — SSRF (Server-Side Request Forgery)
- **CWE:** CWE-918 / OWASP A10
- **Beschreibung:** Server-side `fetch(url)` mit User-kontrollierter URL → Angreifer trifft interne Endpunkte (AWS-Metadata, RFC1918)
- **AI-Rate:** **100 %** über alle 5 getesteten Tools (Cursor, Claude Code, Codex, Replit, Devin) — Tenzai März 2026
- **Coverage:** ✅ Standard 013 (semgrep), ✅ Standard 008 Section J Punkt 3
- **Hinweis:** Claude Code (unser Werkzeug) ist mit auf der Liste — eigene Aufmerksamkeit Pflicht

#### A4 — Hardcoded Secrets im Code
- **CWE:** CWE-798
- **Beschreibung:** API-Keys, Passwörter, Tokens als String-Literal im Code
- **AI-Rate:** **3,2 %** (vs. 1,5 % human, Veracode 100+ LLMs 2026) — Faktor 2,1× häufiger bei KI-Commits
- **Vorfall:** 400 von 5.600 Lovable/Bolt/Base44-Apps mit live API-Keys (Escape.tech 03/2026), inkl. Stripe `sk_live_*`, OpenAI, Supabase Service-Role
- **Coverage:** ✅ Standard 013 (gitleaks), ✅ Standard 008 Section F (Frontend-Bundle), ✅ Section J Punkt 4

#### A5 — Hallucination-basierte Flaws
- **CWE:** keine direkte (Pattern: nicht-existente Library oder fingierter API-Aufruf)
- **Beschreibung:** LLM erfindet Library-Namen, Funktions-Signatur oder API-Endpunkt. Code referenziert etwas, das nicht existiert oder anders funktioniert als angenommen. Spezialfall: **Slopsquatting / Dependency-Confusion** — LLM erfindet Package-Namen, Angreifer registriert genau diesen Namen und schmuggelt Schadcode ein.
- **AI-Rate:** **91,5 %** der vibe-coded Apps in Q1 2026 enthielten mindestens eine Hallucination-Flaw (Assessment 200+ Apps, Quelle: GitClear / ICSE-SEIP 2026)
- **Coverage:** ⚠️ teilweise via Standard 013 (Lockfile-Pflicht), Socket.dev empfohlen für Slopsquatting-Erkennung. **Standard 008 (CONCEPT.md)** erzwingt explizite Stack-Wahl + Reviewer-Prüfung — Hallucinations fallen beim manuellen Code-Re-Read auf. 🔴 **TODO:** automatisierter Library-Existenz-Check in CI.

### B. Klassische OWASP-Top-10 (in AI-Code reproduziert)

#### B1 — Broken Access Control (BOLA / IDOR)
- **CWE:** CWE-639 / OWASP A01 (Platz 1 OWASP Top 10 2021)
- **Beschreibung:** User A kann auf Resourcen von User B zugreifen, weil die ID einfach hochzählbar ist und keine Owner-Prüfung erfolgt
- **Verbreitung:** **94 %** der getesteten Apps mit mindestens einer BOLA-/Access-Control-Lücke (OWASP Top 10 2021 Statistik) — die häufigste Klasse überhaupt
- **Vorfall:** **Enrichlead 2025** — jeder Nutzer konnte fremde Daten ändern + kostenpflichtige Features nutzen → Projekt eingestellt
- **Vorfall:** **Lovable 2026** — BOLA-Lücke blieb 48 Tage offen, Bug-Bounty-Report wurde als „erledigt" geschlossen
- **Coverage:** ✅ Standard 008 Section B (curl User-A vs User-B), ✅ Section J Punkt 7, ✅ Standard 008 (Pen-Test-Light: defensive Außensicht — exposed Files / Admin-Routen / Status-Endpunkte / Header-Hygiene). Echte BOLA mit zwei Test-Usern bleibt manuell in 013-C / Section J.

#### B2 — Vertical Privilege Escalation
- **OWASP:** A01
- **Beschreibung:** Normaler User wird Admin durch Manipulation von Header/Token/Request
- **Coverage:** ✅ Standard 008 Section B

#### B3 — Cryptographic Failures
- **OWASP:** A02
- **Beschreibung:** Schwache Hashes (MD5, SHA1), self-rolled Crypto, fehlende TLS, Plain-Text-Passwords
- **Coverage:** ⚠️ teilweise via semgrep (023), 🔄 keine eigene Sektion, **TODO**

#### B4 — Injection (SQL, NoSQL, Command, LDAP)
- **CWE:** CWE-89, CWE-78
- **Beschreibung:** User-Input direkt in SQL/Shell-Command konkateniert
- **Coverage:** ✅ Standard 013 (semgrep p/owasp-top-ten)

#### B5 — Insecure Design
- **OWASP:** A04
- **Beschreibung:** Fehlende Threat-Modeling, fehlende Sicherheitsanforderungen vor Bauphase
- **Coverage:** 🔄 Standard 008 geplant (CONCEPT.md / Gate 1)

#### B6 — Security Misconfiguration / Default-Allow DB (insb. Supabase RLS)
- **OWASP:** A05
- **Beschreibung:** RLS nicht aktiviert oder Policy = Default-Allow; Admin-Endpunkte ohne Auth; Default-Passwörter. Bei Supabase typische Patterns:
  - RLS komplett aus auf einer Tabelle
  - Policy mit `USING (true)` statt `auth.uid() = user_id`
  - Fehlende `WITH CHECK`-Klausel auf INSERT/UPDATE
  - Views ohne `security_invoker = true`
  - RLS-Policies, die auf `user_metadata` prüfen (vom User editierbar!)
- **Verbreitung:** **83 %** der via Internet exponierten Supabase-DBs haben RLS-Misconfigs (Wiz Research 2026)
- **Vorfall:** **Tea-App / Sapphos 2025** — zwei Datenlecks durch zu weite DB-Permissions, komplette Nutzer-DB downloadbar
- **Vorfall:** **Moltbook Januar 2026** — 1,5 Mio API-Tokens, 35.000 E-Mails, private Nachrichten öffentlich (Supabase ohne RLS, von Wiz nach 3 Tagen entdeckt)
- **CVE:** **CVE-2025-48757** — 170+ Lovable-Apps ohne RLS, Source-Code + DB-Credentials 48 Tage exposed
- **Coverage:** ✅ Standard 008 Section C (RLS-Pflicht, Anon-Key-Test, Supabase-Linter manuell), 🔄 Continue CLI + Supabase MCP als daily Cron empfohlen (siehe Tools-Tabelle)
- **Coverage Container-Layer:** ✅ Standard 015 (Container-Misconfig-Audit) — 7 Pflicht-Klassen pro `docker-compose.yml`: privileged, inline-secrets, `:latest`-Pull, mem_limit, restart, docker.sock, env_file aus `/opt/secrets/`. SSH-first mit Local-Fallback, schließt den dokumentierten 002+004-Compose-Blindspot.

#### B7 — Vulnerable & Outdated Components
- **OWASP:** A06
- **Coverage:** ✅ Standard 008 Section A (`npm audit --production` ohne Critical/High), Dependabot empfohlen

#### B8 — Identification & Authentication Failures
- **OWASP:** A07
- **Beschreibung:** Session-Fixation, schwache Passwort-Reset-Tokens, fehlende MFA, lange Session-Lifetime
- **Coverage:** ✅ Standard 008 Section B

#### B9 — Software & Data Integrity Failures
- **OWASP:** A08
- **Beschreibung:** Fehlende Webhook-Signaturen (z.B. Stripe), unsignierte Updates, Auto-Update von npm-Packages
- **Coverage:** ✅ Standard 008 Section G (Webhook-Signatur-Prüfung), ✅ npm lockfile Pflicht

#### B10 — Security Logging & Monitoring Failures
- **OWASP:** A09
- **Beschreibung:** Vorfälle werden nicht erkannt, weil Logging fehlt oder PII enthält
- **Coverage:** ✅ Standard 008 Section H, I (Logging + Monitoring Pflicht)

### C. DSGVO-/Privacy-Lücken

#### C1 — Tracker ohne Consent
- **Rechtsgrundlage:** TTDSG § 25, DSGVO Art. 6
- **Vorfall:** ständig — auch eigener 30-min-Vibe-Coding-Test 2026-04-27 hatte das Problem
- **Coverage:** ✅ Standard 008 Section D + ✅ Standard 011 (audit.mjs HTML-Pattern-Scan auf GA/GTM/FB-Pixel/Hotjar/Mixpanel/Segment/Amplitude/Intercom/CrazyEgg/LinkedIn/TikTok/YouTube/Vimeo/Maps; Webbkoll für JS-injizierte Tracker manuell)

#### C2 — Google Fonts via CDN
- **Rechtsgrundlage:** **LG München I, Az. 3 O 17493/20** — Schadensersatz an betroffene IP
- **Coverage:** ✅ Standard 008 Section D + ✅ Standard 011 (audit.mjs HTML-Pattern-Scan auf `fonts.googleapis.com` / `fonts.gstatic.com` — am 2026-04-27 hat das Audit repivot + snapflow live als Verstoss geflaggt)

#### C3 — PII in Logs
- **Beschreibung:** E-Mails, IPs, Namen in Server-Logs ohne Notwendigkeit
- **Coverage:** ⚠️ kein expliziter Check, **TODO** (eigener Punkt in Section J oder neu)

#### C4 — Fehlender AVV / DPA
- **Rechtsgrundlage:** DSGVO Art. 28
- **Coverage:** Standard 008 Section D + Standard 009 (data_processors-Registry mit AVV-/DPA-Status, Nachweis-Ort und reviewed_at)

#### C5 — Daten ausserhalb EU
- **Rechtsgrundlage:** DSGVO Kap. V
- **Coverage:** ✅ Standard 008 Section D, ✅ "Germany First"-Prinzip in CLAUDE.md

#### C6 — Externe Embeds ohne 2-Click
- **Beispiel:** YouTube, Vimeo, Maps mit Personenbezug
- **Coverage:** ✅ Standard 008 Section D

#### C7 — PII-Exposure ohne Auth (öffentliche personenbezogene Daten)
- **Rechtsgrundlage:** DSGVO Art. 32 („Stand der Technik") + Art. 33 (72h-Meldepflicht) + Art. 83 (bis 4 % Jahresumsatz)
- **Beschreibung:** Medizinische Daten, Zahlungsinfos, Adressen, Namen direkt per öffentlicher API/URL abrufbar — meist Folge von B6 (RLS-Misconfig) oder Unauth-Routes
- **Vorfall:** Escape.tech-Scan März 2026 — **175 PII-Leaks** in 5.600 Vibe-Coded Apps, inklusive Medical Records und Payment Data, in Produktion (nicht Test)
- **Coverage:** ✅ Standard 008 Section C (RLS) + Section J Punkt 6 (Unauth-Routes-Liste) + ✅ Standard 008 (Pen-Test-Light: prüft `.env`/`.git/`/`backup.sql` exposed — am 2026-04-28 lief der Audit live über alle 8 Domains, 0 Critical-Treffer). Vollständiger Endpunkt-Scan auf personenbezogene Felder bleibt manuell.

### D. AI-Agent-spezifische Risiken (OWASP LLM Top 10, 2025 + Agentic 2026)

> Externe Auditoren mappen über diese Spalten direkt auf die offizielle
> OWASP-Taxonomie. Quelle: `OWASP/www-project-top-10-for-large-language-
> model-applications` (LLM01..LLM10:2025) + `genai.owasp.org/resource/
> owasp-top-10-for-agentic-applications-for-2026/` (ASI01..ASI10:2026).

#### D1 — Prompt Injection (OWASP **LLM01:2025**)
- **Beschreibung:** User-Input wird als Instruktion vom LLM interpretiert, Schutz wird umgangen
- **Coverage:** ✅ Standard 014 (3-Direktiven-Härtung + `<user_message>`-Wrapping + Pflicht-Test-Suite mit ≥10 Payloads)
- **Empfohlene Test-Quelle:** garak `promptinject.HijackHateHumans`, `dan.DanInTheWild`, `dan.AntiDAN`, sowie greshake/llm-security `chat_completion_steering` für indirect-injection (RAG/Telegram/Web-Chat)

#### D2 — Insecure Output Handling (OWASP **LLM02:2025**, jetzt **LLM05:2025** „Improper Output Handling")
- **Beschreibung:** LLM-Output wird ungeprüft als Code/HTML/SQL ausgeführt
- **Coverage:** ✅ Standard 014 (DOMPurify-Pflicht + Tool-Use-Schema mit `enum`-Whitelists statt Freitext-Aktionen)

#### D3 — Sensitive Information Disclosure (OWASP **LLM06:2025**, jetzt teils **LLM07:2025** „System Prompt Leakage")
- **Beschreibung:** LLM gibt System-Prompt, andere User-Daten oder Trainingsdaten preis
- **Coverage:** ✅ Standard 014 (Direktive 2: explizites Verbot der Prompt-Preisgabe inkl. ROT13/Base64/Translation-Bypass)
- **Empfohlene Test-Quelle:** garak `leakreplay.SystemPrompts`

#### D4 — Excessive Agency (OWASP **LLM08:2025**, plus Agentic **ASI06:2026** „Tool Misuse" + **ASI07:2026** „Privilege Compromise") — die Replit-Klasse
- **Beschreibung:** AI-Agent hat zu viele Rechte / zu wenig Genehmigungs-Gates für irreversible Aktionen
- **Vorfall:** **Replit-Agent 2025** — autonomer Agent löschte Prod-DB trotz Anweisung "keine Änderungen". Ursache: keine technische Test/Prod-Trennung
- **Coverage:** ✅ Standard 008 Section E (Test/Prod-Trennung) + ✅ Standard 014 (Approval-Queue über `ops_tasks` für Schreib-Tools)

#### D5 — Agentic Memory Poisoning (Agentic **ASI01:2026**) — VECTOR-spezifisch
- **Beschreibung:** Persistenter Agent-Speicher wird durch eine eingeschleuste Instruktion vergiftet, sodass spätere Sessions die Manipulation reproduzieren
- **Coverage:** ⚠️ teilweise via Standard 014 (Indirect-Input-Wrapping); 🔴 **TODO:** dedizierte Memory-Validierung vor jedem Restore in VECTOR

#### D6 — Cascading Hallucination / Goal Manipulation (Agentic **ASI02:2026** + **ASI03:2026**)
- **Beschreibung:** Halluzinierter Tool-Output wird zur Eingabe der nächsten Agent-Stufe → Fehler kaskadiert; Goal-Override durch geschickte Eingaben
- **Coverage:** ⚠️ teilweise via Standard 014 (Approval-Queue + Whitelists); 🔴 **TODO:** Output-Sanity-Checks zwischen Agent-Hops

### E. Plattform- & Supply-Chain-Lücken

#### E1 — Plattform-Lock-in mit Plattform-Bugs
- **Beschreibung:** Code lebt auf Lovable/Bolt/Base44/v0/Replit. Wenn die Plattform eine Lücke hat, sind alle Apps darauf betroffen — auch wenn der eigene Code sauber ist
- **Vorfall:** **Base44 Juli 2025** — Plattform-Lücke gab Angreifern Zugriff auf fremde private Apps
- **Vorfall:** **Lovable 2026** — drei dokumentierte Security-Incidents, jüngster: BOLA-Lücke 48 Tage offen
- **Coverage:** ✅ Standard 008 Section J Punkt 8 (Plattform-Lock-in-Check), ✅ Standard 010 (Stack-Whitelist + Audit auf Marker/Lockfile)

#### E2 — Bösartige npm-Packages (Supply-Chain)
- **Beschreibung:** Angreifer published Package mit ähnlichem Namen oder kompromittiert legitimes Package
- **Coverage:** ⚠️ teilweise via npm audit, **Socket.dev empfohlen**, kein eigener Standard

#### E3 — Stale Dependencies
- **Coverage:** ✅ Standard 008 Section A (npm audit), Dependabot empfohlen

#### E4 — Packaging-Fehler / Source Code Leak
- **CWE:** CWE-540 (Information Exposure Through Source Code)
- **Beschreibung:** Build-/Bundling-Konfiguration falsch, proprietärer Code landet im Release-Artefakt (npm-Package, Docker-Image, Frontend-Bundle, Source-Maps)
- **Vorfall:** **Anthropic Claude Code CLI 2026-03-31** — 59,8 MB Source Map im npm-Package, ~512.000 Zeilen TypeScript exponiert. Das Tool selbst ist vibe-coded. **Kein Code-Bug, sondern Packaging-Konfig**. SAST hat es nicht gefunden, weil keine Logik-Lücke vorlag.
- **Lehre:** Security braucht auch Packaging-Reviews. Source-Maps in Public-Bundles + npm-Package-Inhalt müssen geprüft werden.
- **Coverage:** ✅ Standard 008 Section F (Source-Maps in Prod deaktiviert/privat) + ✅ Standard 011 (Live-Asset-Scan auf `sourceMappingURL=` Direktive), ⚠️ npm-Package-Inhalt nicht systematisch geprüft

### F. Drift-Klassen (live, schleichend)

#### F1 — DNS-Drift
- **Beschreibung:** Domain zeigt nicht mehr auf eigenen Server (z.B. plansey.app → Lovable, vanfree-Domain → IONOS Parking)
- **Vorfall:** im aktuellen Projekt-Audit gefunden, 2026-04-27 — plansey.app zeigt auf 172.67.165.34 + 104.21.11.40 (Cloudflare) statt eigenen Hetzner-Server
- **Coverage:** ✅ Standard 012 (audit.mjs `dns.resolve4` gegen `KNOWN_SERVER_IPS`-Whitelist; fremde IPs werden mit konkreter IP-Liste gewarnt)

#### F2 — Bundle-Drift (alte URLs / Domains)
- **Beispiel:** repivot lädt `panel.maxone.studio` obwohl auf `.one` migriert
- **Coverage:** ✅ Standard 011 (audit.mjs zieht bis zu 8 Live-Assets pro Domain und scannt auf `*.maxone.studio`-Reste, Plattform-Watermarks, Dev-Hosts, Service-Role-Keys; am 2026-04-27 hat das Audit bei repivot genau diesen Drift live nachgewiesen)

#### F3 — Cert-Ablauf
- **Vorfall:** vanfree (vanfree.de) hat 2026-04-27 TLS-Handshake-Fehler — Audit hat es als FAIL geflaggt; karastelev.de hatte 2026-04-22 Account-Ratelimit-Sprenger durch HTTP-01 (Auslöser für DNS-01-Direktive)
- **Coverage:** ✅ Standard 012 (audit.mjs `tls.connect` zieht Cert, prüft Restlaufzeit (>14d OK / 7-14d WARN / <7d FAIL), Issuer (Let's Encrypt) und Subject/SAN-Match)

#### F4 — Source-Maps in Production
- **Beschreibung:** Source-Maps öffentlich → Reverse-Engineering trivial
- **Coverage:** ✅ Standard 008 Section F + ✅ Standard 011 (Live-Asset-Scan)

#### F5 — Mail-Architektur-Drift (Outbound/Inbound-Kanal-Verwechslung)
- **Beschreibung:** App schickt ausgehende Mail über Stalwart-SMTP statt Brevo HTTP-API; oder Diagnose sucht im falschen System (Stalwart-Logs für Outbound). Pre-Flight-Check für Brevo-Domain-Auth fehlt → Brevo wirft Mails still mit `event=error` weg, DB-Status bleibt `sent`. JMAP-Client strippt `{accountId}`-Template aus `uploadUrl` → Sent-Kopien landen als Orphan-Blobs im Default-Account `"a"`, Stalwart antwortet 200 ohne Side-Effect. Health-Checks mit Fake-Auth-Headers triggern Stalwart-Auto-Ban nach 2 Calls → Self-Inflicted-Outage in Restart-Loop.
- **Vorfall:** **2026-03-24** Stalwart Admin Lockout (Orphan-Container blockiert RocksDB) → Brevo-Credentials in CLI exponiert → Key-Rotation → Downtime aller Projekte
- **Vorfall:** **2026-04-05** Self-Inflicted Fail2Ban Loop — `zentinel-health` schickte alle 2min `Basic healthcheck:invalid` → Stalwart bannte Edge-IP → Restart-Loop bis Max die Timer manuell stoppte
- **Vorfall:** **2026-04-10** Sent-Items-Blackhole + Brevo Silent Rejection — 7 Sent-Kopien als Blob-Orphans in Default-Account verloren (5 Tage); 1 Mail (`max@maxone.one → r.jenau@linagames.de`) von Brevo still rejected weil Domain noch nicht authentifiziert war (Empfänger-Rückfrage 7 Tage später)
- **Vorfall:** **2026-04-27** Falsch-Negativ-Diagnose — Mail-Status-Frage „hat X meine Mail bekommen?" wurde fälschlich aus Stalwart-Logs beantwortet (zeigten nichts → falsches „nein"); korrekte Antwort lag in Brevo Events API
- **Coverage:** ✅ Standard 016 (Mail-Architektur — Pre-Flight-Pflicht, Anti-Pattern-Scan für `uploadUrl.split("{")` / `Basic healthcheck:invalid` / `/.well-known/jmap`-Request / Public-URL aus Edge-Function / fehlender DB-Status `rejected_unauthenticated_domain`). Quelle: [`maxone.one/briefings/ZENTINEL-STALWART-BIBEL.md`](https://github.com/maxone-one/maxone.one/blob/main/briefings/ZENTINEL-STALWART-BIBEL.md) (20 Regeln, lebendiges Dokument).

### G. Strukturelle / Wartbarkeits-Lücken (langfristig sicherheitsrelevant)

Keine klassische CVE — aber wenn die Codebase strukturell zerfällt, multipliziert
jede Bug-Klasse ihre Wirkung. Tech-Debt ist Security-Debt mit Verzögerung.

#### G1 — KI-Code überproportional viele Findings
- **Daten:** AI-co-authored Code hat **2,74× mehr Security-Findings** als
  rein menschlicher Code (CodeRabbit Analyse 470 PRs, 2026)
- **Beschreibung:** KI generiert Code schneller als Reviewer ihn lesen können —
  Findings akkumulieren sich, Backlog wird unbewältigbar
- **Coverage:** ✅ Standard 008 Section A (Black-Box-Anteil Pflicht-Schätzung,
  > 20 % triggert zusätzlichen Review-Pass), ✅ Standard 008 (CONCEPT.md
  vom Menschen) — minimiert Konzept-Lücken, nicht Implementierungs-Lücken

#### G2 — Refactoring-Anteil im Sinkflug
- **Daten:** Refactoring-Anteil an Commits von **25 % (2021) auf < 10 % (2024)**
  gefallen (GitClear Longitudinal Study). Code wird hinzugefügt, fast nie
  konsolidiert.
- **Beschreibung:** Codebase wächst, aber Architektur erodiert. Jeder neue
  Bugfix passiert in einer komplexeren Umgebung als der vorhergehende.
- **Coverage:** 🔴 **TODO** — kein technischer Audit. Mitigation: explizite
  Refactor-Sprints pro Quartal, evtl. Standard 003 „Code-Health-Budget".

#### G3 — Code-Duplikation explodiert
- **Daten:** **4× mehr Code-Duplikation seit 2021** (GitClear). KI-Tools
  generieren bevorzugt copy-paste, nicht abstrahiert.
- **Beschreibung:** Bugfix in einer Kopie führt zu Inkonsistenz mit den
  anderen Kopien — klassische Lücken-Vergrösserung über Zeit.
- **Coverage:** ⚠️ teilweise via SonarQube/jscpd, kein eigener Standard.
  🔴 **TODO** — pre-commit Duplikations-Check evaluieren.

#### G4 — IDE-/Sitzungs-abhängige Routinen (Single Point of Failure)
- **Beschreibung:** Wiederkehrende Routinen (Audits, Backups, Watchdogs,
  Reminders) hängen an einer User-IDE-Sitzung, einer Claude-Code-Session
  oder einem Windows-Task-Scheduler-Eintrag auf dem User-NUC. Sterben
  sobald der User offline ist, das OS Updates fährt, oder die IDE
  wechselt. Failure ist unsichtbar — keine Logs, kein Alarm.
- **Vorfall:** **2026-04-27** — `maxone-standards` Audit-Trigger für
  2026-05-11 hatte vier Optionen, alle vier vom User-NUC abhängig
  (Windows Task Scheduler / WSL crontab / Doppelklick / „läuft eh bei
  Session-Start"). Genau das war Drift-Erzeugung statt Drift-Schutz.
- **Coverage:** ✅ Standard 017 (Routine-Platform) — Audit FAILt bei
  `Register-ScheduledTask`/`schtasks /create`/`wsl crontab` als
  Setup-Anleitung; WARNt bei `*audit*.cmd`/`*scheduled*.cmd` ohne
  Heartbeat-Begleitfile; PASS verlangt Heartbeat-Marker
  (GH-Actions-`schedule:`, systemd-Timer, `pg_cron`, VECTOR-Container).

---

## Teil 3: Coverage-Matrix

Übersicht: was ist hart abgedeckt, was weich, was offen.

| Kategorie | Lücke | Manual (013) | Auto (audit.mjs) | Tool | Status |
|---|---|---|---|---|---|
| AI | XSS | J1 | 023 | semgrep | ✅ hart |
| AI | Log Injection | J2 | 023 | semgrep | ✅ hart |
| AI | SSRF | J3 | 023 | semgrep | ✅ hart |
| AI | Hardcoded Secrets | J4, F | 022 | gitleaks | ✅ hart |
| AI | Hallucination / Slopsquatting | — | 022 (Lockfile) | Socket.dev empfohlen | ⚠️ teilweise, 015 reduziert |
| OWASP | BOLA | B, J7 | 020 (außen) | curl-Skript + Pen-Test-Light | ⚠️ teilweise (außen hart, intern manuell) |
| OWASP | Privilege Escalation | B | — | manuell | ⚠️ manuell |
| OWASP | Crypto Failures | — | teilweise via 023 | semgrep | 🔴 **TODO** |
| OWASP | SQL/Command Injection | — | 023 | semgrep | ✅ hart |
| OWASP | Insecure Design | — | 015 | CONCEPT.md-Audit | ✅ hart (seit 015) |
| OWASP | RLS-Misconfig (B6, DB-Layer) | C | — | curl + Supabase Linter + Continue MCP | ⚠️ manuell, daily Cron empfohlen |
| OWASP | Container-Misconfig (B6, Container-Layer) | — | 028 | js-yaml-Parse + 7 Pflicht-Klassen, SSH-first | ✅ hart (seit 028) |
| OWASP | Vuln Components | A | — | npm audit | ✅ |
| OWASP | Auth-Failures | B | — | manuell | ⚠️ manuell |
| OWASP | Webhook-Sig | G | — | manuell | ⚠️ manuell |
| OWASP | Logging | H, I | — | manuell | ⚠️ manuell |
| DSGVO | Tracker ohne Consent (C1) | D | 017 | HTML-Pattern-Scan + Webbkoll | ✅ hart (seit 017) |
| DSGVO | Google Fonts (C2) | D | 017 | HTML-Pattern-Scan | ✅ hart (seit 017) |
| DSGVO | PII in Logs | — | — | — | 🔴 **TODO** |
| DSGVO | PII-Exposure (Endpunkt) | C, J6 | 020 (außen) | manuell + Pen-Test-Light + Vibe App Scanner | ⚠️ teilweise (`.env`/`.git`/Backup hart, Endpunkt-Scan manuell) |
| DSGVO | AVV / DPA | D | 041 | data_processors-Registry | hart (seit 041) |
| DSGVO | EU-Region | D | — | manuell | ⚠️ manuell |
| DSGVO | Datenfriedhof / Sunset-Drift | — | 014 | SUNSET.md + Container-Tear-Down-Check | ✅ hart (seit 014) |
| LLM01:2025 | Prompt Injection (direct) | — | 025 | System-Prompt-Härtung + Input-Wrapping + Test-Suite (garak-Probes empfohlen) | ✅ hart (seit 025) |
| LLM01:2025 | Prompt Injection (indirect, RAG/Telegram/Email) | — | 029 | Pflicht-Test-Suite mit ≥10 Payloads aus greshake/Giskard/garak | ✅ hart (seit 029) |
| LLM05:2025 | Insecure Output (formerly LLM02) | — | 025 | DOMPurify + Tool-Schema-Pflicht | ✅ hart (seit 025) |
| LLM07:2025 | System-Prompt-Leakage (formerly LLM06) | — | 025 | Direktive 2 im Prompt + Test-Suite | ✅ hart (seit 025) |
| LLM08:2025 | Excessive Agency (Replit-Klasse) | E | 025 | Approval-Queue-Pflicht für Schreib-Tools | ✅ hart (seit 025) |
| ASI01:2026 | Agentic Memory Poisoning | — | — | Memory-Validierung vor Restore | 🔴 **TODO** (VECTOR-spezifisch) |
| ASI02-03:2026 | Cascading Hallucination / Goal Manipulation | — | 025 (teilweise) | Approval-Queue + Output-Sanity zwischen Hops | ⚠️ teilweise |
| Platform | Lovable/Bolt/v0 | J8 | 016 | Marker + Lockfile-Scan | ✅ hart (seit 016) |
| Supply | Bösartige npm | — | — | Socket.dev empfohlen | 🔴 **TODO** |
| Supply | Packaging-Leak (E4) | F | — | manuell | ⚠️ manuell, 018 erweiterbar |
| Drift | DNS (F1) | — | 019 | dns.resolve4 + Server-IP-Whitelist | ✅ hart (seit 019) |
| Drift | Bundle (alte URLs, F2) | — | 018 | Live-Asset-Fetch + Pattern-Scan | ✅ hart (seit 018) |
| Drift | Cert-Ablauf (F3) | — | 019 | tls.connect + Restlaufzeit-Check | ✅ hart (seit 019) |
| Drift | Source-Maps (F4) | F | 018 | Live-Asset-Scan auf sourceMappingURL | ✅ hart (seit 018) |
| Drift | Mail-Architektur-Drift (F5) | — | 030 | Mail-Marker-Scan + Pre-Flight-Pflicht + Anti-Pattern-Scan (Regel 4/14/15/19/20) | ✅ hart (seit 030) |
| Reliability | IDE-/Sitzungs-Drift (G4) | — | 031 | Heartbeat-Marker-Scan + IDE-Trigger-Anti-Pattern-Scan | ✅ hart (seit 031) |
| Struktur | KI-Findings 2,74× (G1) | A | — | Black-Box-% in 013-A | ⚠️ manuell |
| Struktur | Refactoring-Anteil (G2) | — | 024 | git log + Pattern-Match | ✅ hart (seit 024) |
| Struktur | Duplikation 4× (G3) | — | 024 (manuell jscpd) | jscpd in Audit-Cron + Datei-/Funktions-Längen | ⚠️ teilweise (Längen hart, jscpd manuell) |

**Legende:**
- ✅ hart = automatisch erzwungen, Audit blockiert bei Verstoß
- ⚠️ manuell = in der Checkliste, aber kein Audit-Check
- 🔴 TODO = überhaupt nicht abgedeckt, neuer Standard nötig

**Aktuell abgedeckt (hart):** 24 Lücken (XSS, Log-Inj, SSRF, Hardcoded Secrets, Insecure Design via 015, SQL-Inj, Vuln Components, Plattform-Lock-in via 016, Tracker-Consent via 017, Google Fonts via 017, Bundle-Drift via 018, Source-Maps via 018, DNS-Drift via 019, Cert-Ablauf via 019, Sunset-Drift via 014, Refactoring-Anteil via 024, Prompt Injection direct LLM01 via 025, Indirect Prompt Injection LLM01 via 029, Insecure LLM-Output LLM05 via 025, LLM-Sensitive-Disclosure LLM07 via 025, LLM-Excessive-Agency LLM08 via 025, Container-Misconfig B6 via 028, Mail-Architektur-Drift F5 via 030, IDE-/Sitzungs-Drift G4 via 031)
**Teilweise abgedeckt:** 4 Lücken (BOLA via 020 außen, PII-Exposure via 020 außen, Code-Duplikation via 024 — Längen hart, jscpd manuell, Cascading-Hallucination ASI02-03 teilweise via 025)
**Aktuell manuell:** 11 Lücken (Privilege Escalation, Crypto Failures, RLS-Misconfig, Auth-Failures, Webhook-Sig, Logging, AVV/DPA, EU-Region, PII in Logs, Packaging-Leak, KI-Findings 2,74×)
**Aktuell offen:** 3 Lücken (Crypto Failures B3, Bösartige npm E2 / Slopsquatting A5, Agentic Memory Poisoning ASI01 — alle nur Tool-Empfehlung oder TODO, kein eigener Standard)

---

## Teil 4: Roadmap zur Vollabdeckung

Basierend auf der Coverage-Matrix, in Reihenfolge nach Hebelwirkung:

| Standard | Schließt ab | Hebel | Status |
|---|---|---|---|
| ~~**015** CONCEPT.md (Gate 1)~~ | Insecure Design (B5) | sehr hoch — verhindert Klassen vor Code-Zeile 1 | ✅ **erledigt 2026-04-27** |
| ~~**016** Stack-Whitelist~~ | Plattform-Lock-in (E1) | hoch — Lovable/Bolt/Base44 explizit raus | ✅ **erledigt 2026-04-27** |
| ~~**017** DSGVO-Tracker-Audit~~ | Tracker (C1), Google Fonts (C2) | hoch — automatisierbar via HTML-Pattern + Webbkoll | ✅ **erledigt 2026-04-27** |
| ~~**018** Bundle-Drift-Audit~~ | Bundle-Drift (F2), Source-Maps (F4) | hoch — hätte repivot/panel.maxone.studio gefunden | ✅ **erledigt 2026-04-27** |
| ~~**019** Cert + DNS-Realität~~ | DNS-Drift (F1), Cert (F3) | hoch — hat plansey (Cloudflare-IPs) und vanfree (TLS-Handshake-FAIL) live nachgewiesen | ✅ **erledigt 2026-04-27** |
| ~~**020** Pen-Test-Light~~ | BOLA (B1, außen), SSRF (außen), PII-Exposure (C7, außen), Header-Hygiene | hoch — Enrichlead-Klasse außen-automatisiert; SPA-Catch-All-erkennend | ✅ **erledigt 2026-04-28** |
| ~~**014** Sunset~~ | Datenfriedhöfe, AVV-Hygiene, Sunset-Drift | mittel — vanfree/plansey sind aktuelle Anwendungsfälle | ✅ **erledigt 2026-04-28** |
| ~~**021** Re-Review-Reminder~~ | Drift schleichend | niedrig (kostet nichts) — Cron-Reminder + last_review_date in Registry | ✅ **erledigt 2026-04-28** |
| ~~**024** Code-Health-Budget~~ | Refactoring-Anteil (G2), Duplikation (G3), Datei-/Funktions-Längen | mittel — strukturelle Erosion langfristig | ✅ **erledigt 2026-04-28** |
| ~~**025** LLM-App-Spezial~~ | Prompt Injection (D1–D3), Excessive Agency (D4) | hoch — VECTOR + Vector-Chat + Zentinel + SolarProof betroffen | ✅ **erledigt 2026-04-28** |
| ~~**028** Container-Misconfig-Audit~~ | B6 (Container-Layer): privileged, inline-secrets, `:latest`-Pull, mem_limit, restart, docker.sock, env_file aus `/opt/secrets/` | hoch — schließt 002+004-Compose-Blindspot, hat live FAILs an stadtlahnflow + katchi (CI-Pattern unvollständig) und vanfree (`ghcr.io/...:latest`-Pull) gefunden | ✅ **erledigt 2026-04-28** |
| ~~**029** Indirect-Prompt-Injection-Test~~ | LLM01:2025 (indirect via RAG/Telegram/Email/Web/Upload) | hoch — schließt die größte ungetestete LLM-Klasse (Bing/Copilot/ChatGPT-Memory-Klasse), hat live FAILs an vector + voltfair + stadtlahnflow gefunden | ✅ **erledigt 2026-04-28** |
| ~~**030** Mail-Architektur (Outbound=Brevo, Inbound+Sent=Stalwart)~~ | F5 (Mail-Architektur-Drift): Pre-Flight-Pflicht für Brevo-Domain-Auth, JMAP-Template-Erhaltung, Health-Check-Anti-Patterns, interner vs. Public-Hostname | hoch — destilliert 20 Bibel-Regeln aus 4 realen Vorfällen (03-24/04-05/04-10/04-27) in Audit-Checks; verhindert Sent-Blackholes, Self-Bans, Silent-Brevo-Rejections | ✅ **erledigt 2026-04-28** |
| ~~**031** Routine-Platform~~ | G4 (IDE-/Sitzungs-Drift): Cron/Reminder/Watchdog-Routinen NUR auf Heartbeat-Plattform (GH Actions schedule, systemd-Timer, pg_cron) oder via 24/7-Agent (VECTOR) — niemals IDE-/User-NUC-/Claude-Sitzungs-abhängig | hoch — verhindert Single-Point-of-Failure für alle Drift-Detection-Routinen (021/019/020/030); ausgelöst durch eigenen Vorfall 2026-04-27 mit 4 NUC-abhängigen Optionen | ✅ **erledigt 2026-04-28** |
| ~~**041** AVV-/DPA-Registry~~ | C4 (fehlender AVV/DPA): Auftragsverarbeiter-Inventar mit AVV-Status, Nachweis-Ort und reviewed_at in `registry/projects.yml` | hoch - macht DSGVO Art. 28 pruefbar statt nur Launch-Review-Checkbox | erledigt 2026-05-08 |

Plus zu schliessen ohne nummerierten Standard, in Section J / 013 Updates:
- Crypto-Failures (B3) — semgrep-Regelpaket erweitern
- PII in Logs (C3) — Section J Punkt erweitern
- Supply-Chain bösartige Packages + Slopsquatting (E2, A5) — Socket.dev oder OSSF Scorecard ergänzen
- Server-Hardening — Lynis monatlich auf maxone-prod / voltfair-cli, CrowdSec installieren

---

## Teil 5: Empfohlenes Minimal-Setup für Max' Stack

**Stack:** SvelteKit / Next.js + Supabase + TypeScript + Docker + Hetzner +
Traefik + Claude Code (CLI, kein API).

### In GitHub Actions (pro PR — alles kostenlos)

1. **Semgrep CE** — SAST (Standard 013)
2. **gitleaks** — Secret-Scan (Standard 013)
3. **Dependabot** — npm-Dependency-Updates
4. **TruffleHog** — Git-History-Secret-Scan
5. **OWASP ZAP Baseline Scan** — DAST Smoke Test gegen Staging-URL
6. **Trivy** — Container-Image-Scan vor Push

### Täglich (Cron)

7. **Continue CLI + Supabase MCP** — RLS-Audit aller Tabellen, Report nach
   Slack/Mail/Telegram (VECTOR kann das hosten)

### Auf jedem VPS (einmalig + monatlich)

8. **Trivy** für alle laufenden Docker-Images (Cron monatlich)
9. **Lynis** Host-Audit (monatlich)
10. **CrowdSec** statt/zusätzlich zu Fail2Ban

### Vor jedem Go-Live (Standard 008-Lauf)

11. **Vibe App Scanner** ($5) — externer Second-Opinion-Scan
12. **Manueller Curl-Pen-Test** für BOLA (User-A vs User-B) — Section J Punkt 7
13. **Webbkoll-Scan** auf Staging — externe Hosts + Cookies dokumentieren

### Aufwand-Schätzung

- Initial-Setup (alles oben): **1 Arbeitstag** für ein Projekt, Templates
  danach in 2h pro neuem Projekt.
- Laufender Aufwand: ~10 min pro PR, ~30 min pro Launch, ~1 h pro Quartal
  für Lynis-Reports.

---

## Teil 6: Offene strategische Entscheidungen

Diese Punkte sind bewusst offen und werden später entschieden — nicht von
einem Standard erzwungen, sondern bewusst diskutiert.

1. **Self-hosted Supabase vs. Supabase EU Cloud** — DSGVO-Härte vs.
   Betriebsaufwand. Aktuell self-hosted auf maxone-prod. Bei Skalierung
   neu bewerten.

2. **Continue CLI + MCP vs. dedizierter Security-Dienstleister** — der
   Cron erschlägt 80 % der RLS-Klasse, ein menschlicher Pen-Test
   fängt die restlichen 20 %. Frage: ab welchem Umsatz lohnt sich DGC/SySS?

3. **Pen-Test-Frequenz** — einmalig vor Launch (aktuell), jährlich, oder
   bei jedem Major-Release? Standard 008 (Pen-Test-Light) deckt automatisiert
   das Wiederkehrende ab; manueller Tiefen-Pen-Test bleibt diskutabel.

4. **Bug-Bounty-Programm** — öffentlich (HackerOne / Intigriti) oder privat?
   Aktuell zu früh; ab > 1.000 zahlende Nutzer eines Projekts neu prüfen.

5. **Security-Disclosure-Policy** — eigener `/security.txt` mit Kontakt und
   Response-Zeit pro Domain? Würde unter Standard 010 fallen.

6. **DSGVO-Folgenabschätzung (Art. 35)** — ab wann formal? Standard 008
   (CONCEPT.md) enthält die Mindest-Prüfung, aber kein vollständiges DSFA-Template.

---

## Quellen

| Nr | Quelle | Bezug |
|---|---|---|
| 1 | Veracode — "AI-Generated Code Security" Report März 2026 (>100 LLMs getestet) | A1, A4, B1 |
| 2 | Georgetown CSET — AI Code Security Study 2025/26 | A1 (XSS 86 %), A2 (Log-Inj 88 %) |
| 3 | Tenzai Security — "Five-Tool SSRF Test" März 2026 | A3 (SSRF 100 %) |
| 4 | Escape.tech — "5.600 Lovable/Bolt/Base44 App Scan" März 2026 | A4 (400 Secrets), B1 (Lovable BOLA), C7 (175 PII-Leaks), E1 |
| 5 | Georgia Tech — "Vibe Security Radar" (SSLab) 2026 | trending CVEs, 35 CVEs März 2026 |
| 6 | Cloud Security Alliance — "AI-Generated Code Vulnerability Surge 2026" | A4 (3,2 % vs 1,5 %) |
| 7 | CodeRabbit — "AI Code Analysis 470 PRs" 2026 | G1 (2,74× mehr Findings) |
| 8 | GitClear / ICSE-SEIP 2026 — Longitudinal Study | A5 (91,5 % Hallucinations), G2 (Refactoring 25→10 %), G3 (Duplikation 4×) |
| 9 | Wiz Research — "Moltbook Breach Report" Januar 2026 | B6 (83 % Misconfig-Rate, Moltbook 1,5M Tokens) |
| 10 | CVE-2025-48757 — Lovable RLS-Lücke (170+ Apps) | B6 |
| 11 | Anthropic — Claude Code CLI Source-Map-Leak 31.03.2026 | E4 (Packaging) |
| 12 | LG München I, Az. 3 O 17493/20 | C2 Google Fonts |
| 13 | OWASP Top 10 2021 | B-Block |
| 14 | OWASP Top 10 for LLM Applications **v2.0 (2025)** — github.com/OWASP/www-project-top-10-for-large-language-model-applications | D1–D4 (LLM01..LLM10) |
| 14b | OWASP Top 10 for **Agentic Apps 2026** — genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/ | D5–D6 (ASI01..ASI10) |
| 14c | NVIDIA garak (github.com/NVIDIA/garak) — Probe-Suite | D1, D3 Test-Set |
| 14d | promptfoo (github.com/promptfoo/promptfoo) — `owasp:llm`-Preset | D1–D4 CI-Job |
| 14e | greshake/llm-security + Giskard-AI/prompt-injections | Indirect-Injection-Payloads |
| 15 | TTDSG, DSGVO Art. 4/9/28/32/33/35/83, BDSG | C-Block |
| 16 | Fraunhofer IESE — Verantwortungsstatement 2026 | Standard-013-Begründung |
| 17 | Kaspersky — Replit-Agent-Incident-Analyse 2025 | D4 |
| 18 | Eigene Vorfälle: Enrichlead, Tea-App, Moltbook, Replit-Agent, Base44, Lovable | B1, B6, D4, E1 |
| 19 | aquasecurity/trivy — `trivy config` Compose-Ruleset (AVD-DS-XXXX) | B6 (Container-Layer) |
| 20 | bridgecrewio/checkov — `CKV_DOCKER_*` Compose-Ruleset | B6 (Container-Layer) |
| 21 | Stalwart-Orphan-Vorfall 2026-03-24 (CLAUDE.md) — `docker run` ohne `restart:` → Brevo-Key-Exposure, Mail-Downtime | B6 (Standard 015 Begründung) |

**Pflege:** Bei jedem neuen Vorfall (eigene Nachrichten oder LinkedIn/HN/Newsletter)
einen Eintrag ergänzen — Datum, Quelle, betroffene Klasse, Coverage-Status.
