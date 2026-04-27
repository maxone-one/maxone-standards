# Sicherheitslücken-Katalog

**Stand:** 2026-04-27
**Zweck:** Single-Point-of-Reference für jede Lücken-Klasse, die wir in unseren
Projekten gegen halten. Quellen, Real-World-Vorfälle, Coverage-Mapping.
**Pflege:** bei jedem neuen Vorfall / jeder neuen Studie ergänzen.

> Dieses Dokument ist die Begründung für Standard 013, 022, 023 und die
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
| **Semgrep** | OSS + paid | ✅ self-host | XSS, SSRF, Injection, Path-Traversal | ✅ Standard 023 |
| **CodeQL** | GitHub-frei für Public, paid für Private | ⚠️ Cloud | Tiefe semantische Analyse | optional via GitHub Advanced Security |
| **SonarQube** | OSS Community + paid | ✅ self-host | Quality + Security gemischt | nicht im Einsatz |
| **Snyk Code** | Free-Tier + paid | ⚠️ US-Cloud | AI-augmented SAST | nicht im Einsatz |
| **Bearer** | OSS + paid | ✅ FR-Firma, self-host | PII-Handling, DSGVO-Fokus | empfohlen für DSGVO-Pass |
| **DeepSource** | Free + paid | ⚠️ US-Cloud | Auto-PR-Review | nicht im Einsatz |

### Secret Scanning

| Tool | Lizenz | EU-OK | Findet | Bei uns im Einsatz |
|---|---|---|---|---|
| **gitleaks** | OSS | ✅ self-host | Secrets in Code + Git-Historie | ✅ Standard 022 |
| **trufflehog** | OSS + paid (Verifizierung) | ✅ OSS lokal | Secrets + verifiziert ob "live" | optional ergänzend zu gitleaks |
| **GitHub Secret Scanning** | Free für Public, paid Private | ⚠️ Cloud aber GitHub-nativ | Push-Protection (blockt vor Push) | empfohlen aktivieren |
| **GitGuardian** | Free-Tier + paid | ⚠️ FR-Cloud | Echtzeit + History | optional |

### SCA — Dependency / Supply-Chain Scanning

| Tool | Lizenz | EU-OK | Findet | Bei uns im Einsatz |
|---|---|---|---|---|
| **npm audit / pnpm audit** | built-in | ✅ lokal | CVEs in Dependencies | ✅ Standard 013-A |
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
| **Supabase Advisor** | built-in | RLS, Performance, Missing-Index | ✅ Studio → Advisors |
| **Custom curl-Tests** | DIY | Anon-Key kann lesen was er soll | ✅ Standard 013-C |
| Standalone-Tools | — | Keine bekannt für RLS | — |

### Container / Image Scanning

| Tool | Lizenz | EU-OK | Findet | Bei uns im Einsatz |
|---|---|---|---|---|
| **Trivy** | OSS (Aqua) | ✅ self-host | CVEs in Images, IaC, Secrets | **empfohlen für CI** |
| **Grype** | OSS (Anchore) | ✅ self-host | wie Trivy, oft schneller | Alternative |
| **Docker Scout** | built into Docker Desktop | ⚠️ US | CVE-Scan | nice-to-have |

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
| 4 | Pre-Launch (manuell) | Standard 013 komplett, inkl. Section J | 013 |
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
- **Coverage:** ✅ Standard 023 (semgrep), ✅ Standard 013 Section J Punkt 1

#### A2 — Log Injection
- **CWE:** CWE-117
- **Beschreibung:** Log-Einträge werden mit User-Input konstruiert, Angreifer kann Log-Format manipulieren oder PII einschleusen
- **AI-Rate:** **88 %** Failure (Georgetown CSET)
- **Coverage:** ✅ Standard 023 (semgrep), ✅ Standard 013 Section J Punkt 2

#### A3 — SSRF (Server-Side Request Forgery)
- **CWE:** CWE-918 / OWASP A10
- **Beschreibung:** Server-side `fetch(url)` mit User-kontrollierter URL → Angreifer trifft interne Endpunkte (AWS-Metadata, RFC1918)
- **AI-Rate:** **100 %** über alle 5 getesteten Tools (Cursor, Claude Code, Codex, Replit, Devin) — Tenzai März 2026
- **Coverage:** ✅ Standard 023 (semgrep), ✅ Standard 013 Section J Punkt 3
- **Hinweis:** Claude Code (unser Werkzeug) ist mit auf der Liste — eigene Aufmerksamkeit Pflicht

#### A4 — Hardcoded Secrets im Code
- **CWE:** CWE-798
- **Beschreibung:** API-Keys, Passwörter, Tokens als String-Literal im Code
- **AI-Rate:** **3,2 %** (vs. 1,5 % human, Veracode 100+ LLMs 2026)
- **Vorfall:** 400 von 5.600 Lovable/Bolt/Base44-Apps mit live API-Keys (Escape.tech 03/2026), inkl. Stripe `sk_live_*`, OpenAI, Supabase Service-Role
- **Coverage:** ✅ Standard 022 (gitleaks), ✅ Standard 013 Section F (Frontend-Bundle), ✅ Section J Punkt 4

### B. Klassische OWASP-Top-10 (in AI-Code reproduziert)

#### B1 — Broken Access Control (BOLA / IDOR)
- **CWE:** CWE-639 / OWASP A01
- **Beschreibung:** User A kann auf Resourcen von User B zugreifen, weil die ID einfach hochzählbar ist und keine Owner-Prüfung erfolgt
- **Vorfall:** **Enrichlead 2025** — jeder Nutzer konnte fremde Daten ändern + kostenpflichtige Features nutzen → Projekt eingestellt
- **Vorfall:** **Lovable 2026** — BOLA-Lücke blieb 48 Tage offen, Bug-Bounty-Report wurde als „erledigt" geschlossen
- **Coverage:** ✅ Standard 013 Section B (curl User-A vs User-B), ✅ Section J Punkt 7, 🔄 Standard 020 geplant (automatisierter Pen-Test)

#### B2 — Vertical Privilege Escalation
- **OWASP:** A01
- **Beschreibung:** Normaler User wird Admin durch Manipulation von Header/Token/Request
- **Coverage:** ✅ Standard 013 Section B

#### B3 — Cryptographic Failures
- **OWASP:** A02
- **Beschreibung:** Schwache Hashes (MD5, SHA1), self-rolled Crypto, fehlende TLS, Plain-Text-Passwords
- **Coverage:** ⚠️ teilweise via semgrep (023), 🔄 keine eigene Sektion, **TODO**

#### B4 — Injection (SQL, NoSQL, Command, LDAP)
- **CWE:** CWE-89, CWE-78
- **Beschreibung:** User-Input direkt in SQL/Shell-Command konkateniert
- **Coverage:** ✅ Standard 023 (semgrep p/owasp-top-ten)

#### B5 — Insecure Design
- **OWASP:** A04
- **Beschreibung:** Fehlende Threat-Modeling, fehlende Sicherheitsanforderungen vor Bauphase
- **Coverage:** 🔄 Standard 015 geplant (CONCEPT.md / Gate 1)

#### B6 — Security Misconfiguration / Default-Allow DB
- **OWASP:** A05
- **Beschreibung:** RLS nicht aktiviert oder Policy = Default-Allow; Admin-Endpunkte ohne Auth; Default-Passwörter
- **Vorfall:** **Tea-App / Sapphos 2025** — zwei Datenlecks durch zu weite DB-Permissions, komplette Nutzer-DB downloadbar
- **Vorfall:** **Moltbook Januar 2026** — 1,5 Mio API-Tokens, 35.000 E-Mails öffentlich (Supabase ohne RLS)
- **Coverage:** ✅ Standard 013 Section C (RLS-Pflicht, Anon-Key-Test, Supabase-Linter manuell)

#### B7 — Vulnerable & Outdated Components
- **OWASP:** A06
- **Coverage:** ✅ Standard 013 Section A (`npm audit --production` ohne Critical/High), Dependabot empfohlen

#### B8 — Identification & Authentication Failures
- **OWASP:** A07
- **Beschreibung:** Session-Fixation, schwache Passwort-Reset-Tokens, fehlende MFA, lange Session-Lifetime
- **Coverage:** ✅ Standard 013 Section B

#### B9 — Software & Data Integrity Failures
- **OWASP:** A08
- **Beschreibung:** Fehlende Webhook-Signaturen (z.B. Stripe), unsignierte Updates, Auto-Update von npm-Packages
- **Coverage:** ✅ Standard 013 Section G (Webhook-Signatur-Prüfung), ✅ npm lockfile Pflicht

#### B10 — Security Logging & Monitoring Failures
- **OWASP:** A09
- **Beschreibung:** Vorfälle werden nicht erkannt, weil Logging fehlt oder PII enthält
- **Coverage:** ✅ Standard 013 Section H, I (Logging + Monitoring Pflicht)

### C. DSGVO-/Privacy-Lücken

#### C1 — Tracker ohne Consent
- **Rechtsgrundlage:** TTDSG § 25, DSGVO Art. 6
- **Vorfall:** ständig — auch eigener 30-min-Vibe-Coding-Test 2026-04-27 hatte das Problem
- **Coverage:** ✅ Standard 013 Section D, 🔄 Standard 017 geplant (Audit-Automation)

#### C2 — Google Fonts via CDN
- **Rechtsgrundlage:** **LG München I, Az. 3 O 17493/20** — Schadensersatz an betroffene IP
- **Coverage:** ✅ Standard 013 Section D, 🔄 Standard 017 geplant

#### C3 — PII in Logs
- **Beschreibung:** E-Mails, IPs, Namen in Server-Logs ohne Notwendigkeit
- **Coverage:** ⚠️ kein expliziter Check, **TODO** (eigener Punkt in Section J oder neu)

#### C4 — Fehlender AVV / DPA
- **Rechtsgrundlage:** DSGVO Art. 28
- **Coverage:** ✅ Standard 013 Section D

#### C5 — Daten ausserhalb EU
- **Rechtsgrundlage:** DSGVO Kap. V
- **Coverage:** ✅ Standard 013 Section D, ✅ "Germany First"-Prinzip in CLAUDE.md

#### C6 — Externe Embeds ohne 2-Click
- **Beispiel:** YouTube, Vimeo, Maps mit Personenbezug
- **Coverage:** ✅ Standard 013 Section D

### D. AI-Agent-spezifische Risiken (OWASP LLM Top 10, 2025)

#### D1 — Prompt Injection (LLM01)
- **Beschreibung:** User-Input wird als Instruktion vom LLM interpretiert, Schutz wird umgangen
- **Coverage:** teilweise in WIRED-Agent-Prompts (Sicherheits-Block), ⚠️ **kein Standard, TODO**

#### D2 — Insecure Output Handling (LLM02)
- **Beschreibung:** LLM-Output wird ungeprüft als Code/HTML/SQL ausgeführt
- **Coverage:** ⚠️ TODO, fällt ggf. unter A1 (XSS) wenn LLM-Output in HTML rendert

#### D3 — Sensitive Information Disclosure (LLM06)
- **Beschreibung:** LLM gibt System-Prompt, andere User-Daten oder Trainingsdaten preis
- **Coverage:** teilweise in WIRED-Prompts, ⚠️ **kein Standard, TODO**

#### D4 — Excessive Agency (LLM08) — die Replit-Klasse
- **Beschreibung:** AI-Agent hat zu viele Rechte / zu wenig Genehmigungs-Gates für irreversible Aktionen
- **Vorfall:** **Replit-Agent 2025** — autonomer Agent löschte Prod-DB trotz Anweisung "keine Änderungen". Ursache: keine technische Test/Prod-Trennung
- **Coverage:** ✅ Standard 013 Section E (Test/Prod-Trennung, keine Agent-Tools auf Prod-DB)

### E. Plattform- & Supply-Chain-Lücken

#### E1 — Plattform-Lock-in mit Plattform-Bugs
- **Beschreibung:** Code lebt auf Lovable/Bolt/Base44/v0/Replit. Wenn die Plattform eine Lücke hat, sind alle Apps darauf betroffen — auch wenn der eigene Code sauber ist
- **Vorfall:** **Base44 Juli 2025** — Plattform-Lücke gab Angreifern Zugriff auf fremde private Apps
- **Vorfall:** **Lovable 2026** — drei dokumentierte Security-Incidents, jüngster: BOLA-Lücke 48 Tage offen
- **Coverage:** ✅ Standard 013 Section J Punkt 8 (Plattform-Lock-in-Check), 🔄 Standard 016 geplant (Stack-Whitelist)

#### E2 — Bösartige npm-Packages (Supply-Chain)
- **Beschreibung:** Angreifer published Package mit ähnlichem Namen oder kompromittiert legitimes Package
- **Coverage:** ⚠️ teilweise via npm audit, **Socket.dev empfohlen**, kein eigener Standard

#### E3 — Stale Dependencies
- **Coverage:** ✅ Standard 013 Section A (npm audit), Dependabot empfohlen

### F. Drift-Klassen (live, schleichend)

#### F1 — DNS-Drift
- **Beschreibung:** Domain zeigt nicht mehr auf eigenen Server (z.B. plansey.app → Lovable, vanfree-Domain → IONOS Parking)
- **Vorfall:** im aktuellen Projekt-Audit gefunden, 2026-04-27
- **Coverage:** ⚠️ kein Audit, 🔄 Standard 019 geplant

#### F2 — Bundle-Drift (alte URLs / Domains)
- **Beispiel:** repivot lädt `panel.maxone.studio` obwohl auf `.one` migriert
- **Coverage:** ⚠️ kein Audit für Live-Bundle, 🔄 Standard 018 geplant

#### F3 — Cert-Ablauf
- **Coverage:** ⚠️ kein Audit, 🔄 Standard 019 geplant

#### F4 — Source-Maps in Production
- **Beschreibung:** Source-Maps öffentlich → Reverse-Engineering trivial
- **Coverage:** ✅ Standard 013 Section F

---

## Teil 3: Coverage-Matrix

Übersicht: was ist hart abgedeckt, was weich, was offen.

| Kategorie | Lücke | Manual (013) | Auto (audit.mjs) | Tool | Status |
|---|---|---|---|---|---|
| AI | XSS | J1 | 023 | semgrep | ✅ hart |
| AI | Log Injection | J2 | 023 | semgrep | ✅ hart |
| AI | SSRF | J3 | 023 | semgrep | ✅ hart |
| AI | Hardcoded Secrets | J4, F | 022 | gitleaks | ✅ hart |
| OWASP | BOLA | B, J7 | — | curl-Skript | ⚠️ manuell, 020 geplant |
| OWASP | Privilege Escalation | B | — | manuell | ⚠️ manuell |
| OWASP | Crypto Failures | — | teilweise via 023 | semgrep | 🔴 **TODO** |
| OWASP | SQL/Command Injection | — | 023 | semgrep | ✅ hart |
| OWASP | Insecure Design | — | — | — | 🔴 **TODO** (Standard 015) |
| OWASP | RLS-Misconfig | C | — | curl + Supabase Linter | ⚠️ manuell |
| OWASP | Vuln Components | A | — | npm audit | ✅ |
| OWASP | Auth-Failures | B | — | manuell | ⚠️ manuell |
| OWASP | Webhook-Sig | G | — | manuell | ⚠️ manuell |
| OWASP | Logging | H, I | — | manuell | ⚠️ manuell |
| DSGVO | Tracker ohne Consent | D | — | Webbkoll manuell | 🔴 **TODO** (017) |
| DSGVO | Google Fonts | D | — | manuell | 🔴 **TODO** (017) |
| DSGVO | PII in Logs | — | — | — | 🔴 **TODO** |
| DSGVO | AVV / DPA | D | — | Liste pflegen | ⚠️ manuell |
| DSGVO | EU-Region | D | — | manuell | ⚠️ manuell |
| LLM | Prompt Injection | — | — | — | 🔴 **TODO** |
| LLM | Insecure Output | — | — | — | 🔴 **TODO** |
| LLM | Sensitive Disclosure | — | — | — | 🔴 **TODO** |
| LLM | Excessive Agency (Replit) | E | — | manuell | ⚠️ manuell |
| Platform | Lovable/Bolt/v0 | J8 | — | manuell | ⚠️ manuell, 016 geplant |
| Supply | Bösartige npm | — | — | Socket.dev empfohlen | 🔴 **TODO** |
| Drift | DNS | — | — | curl manuell | 🔴 **TODO** (019) |
| Drift | Bundle (alte URLs) | — | — | grep im Live-Bundle | 🔴 **TODO** (018) |
| Drift | Cert-Ablauf | — | — | manuell | 🔴 **TODO** (019) |
| Drift | Source-Maps | F | — | manuell | ⚠️ manuell |

**Legende:**
- ✅ hart = automatisch erzwungen, Audit blockiert bei Verstoß
- ⚠️ manuell = in der Checkliste, aber kein Audit-Check
- 🔴 TODO = überhaupt nicht abgedeckt, neuer Standard nötig

**Aktuell abgedeckt (hart):** 6 Lücken
**Aktuell manuell:** 13 Lücken
**Aktuell offen:** 11 Lücken (großteils geplant in Standards 014–021)

---

## Teil 4: Roadmap zur Vollabdeckung

Basierend auf der Coverage-Matrix, in Reihenfolge nach Hebelwirkung:

| Standard | Schließt ab | Hebel |
|---|---|---|
| **015** CONCEPT.md (Gate 1) | Insecure Design (B5) | sehr hoch — verhindert Klassen vor Code-Zeile 1 |
| **016** Stack-Whitelist | Plattform-Lock-in (E1) | hoch — Lovable/Bolt/Base44 explizit raus |
| **017** DSGVO-Tracker-Audit | Tracker (C1), Google Fonts (C2) | hoch — automatisierbar via Webbkoll |
| **018** Bundle-Drift-Audit | Bundle-Drift (F2) | hoch — hätte repivot/panel.maxone.studio gefunden |
| **019** Cert + DNS-Realität | DNS-Drift (F1), Cert (F3) | hoch — hätte plansey/vanfree gefunden |
| **020** Pen-Test-Light | BOLA (B1), SSRF live | hoch — Enrichlead-Klasse automatisiert |
| **014** Sunset | Datenfriedhöfe, AVV-Hygiene | mittel — gerade jetzt vanfree/plansey |
| **021** Re-Review-Reminder | Drift schleichend | niedrig (kostet nichts) |

Plus zu schliessen ohne nummerierten Standard, in Section J / 013 Updates:
- Crypto-Failures (B3) — semgrep-Regelpaket erweitern
- PII in Logs (C3) — Section J Punkt erweitern
- LLM-Risiken (D1, D2, D3) — eigene Sektion in 013 oder neuer Standard 024
- Supply-Chain bösartige Packages (E2) — Socket.dev oder OSSF Scorecard ergänzen

---

## Quellen

| Nr | Quelle | Bezug |
|---|---|---|
| 1 | Veracode — "AI-Generated Code Security" Report 2026 (>100 LLMs getestet) | A1, A4, B1 |
| 2 | Georgetown CSET — AI Code Security Study 2025/26 | A1 (XSS 86 %), A2 (Log-Inj 88 %) |
| 3 | Tenzai Security — "Five-Tool SSRF Test" März 2026 | A3 (SSRF 100 %) |
| 4 | Escape.tech — "5.600 Lovable/Bolt/Base44 App Scan" März 2026 | A4, B1, E1 |
| 5 | Georgia Tech — "Vibe Security Radar" 2026 | trending CVEs |
| 6 | LG München I, Az. 3 O 17493/20 | C2 Google Fonts |
| 7 | OWASP Top 10 2021 | B-Block |
| 8 | OWASP Top 10 for LLM Applications v1.0 (2023) + v1.1 (2024) | D-Block |
| 9 | TTDSG, DSGVO, BDSG | C-Block |
| 10 | Eigene Vorfälle: Enrichlead, Tea-App, Moltbook, Replit-Agent, Base44, Lovable | B1, B6, D4, E1 |

**Pflege:** Bei jedem neuen Vorfall (eigene Nachrichten oder LinkedIn/HN/Newsletter)
einen Eintrag ergänzen — Datum, Quelle, betroffene Klasse, Coverage-Status.
