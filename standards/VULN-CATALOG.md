# Sicherheitslücken-Katalog

**Stand:** 2026-04-27 (erweitert mit User-Material 2026-04-27)
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
| **gitleaks** | OSS | ✅ self-host | Secrets in Code + Git-Historie | ✅ Standard 022 |
| **trufflehog** | OSS + paid (Verifizierung) | ✅ OSS lokal | Secrets + verifiziert ob "live" | optional ergänzend zu gitleaks |
| **GitHub Secret Scanning** | Free für Public, paid Private | ⚠️ Cloud aber GitHub-nativ | Push-Protection (blockt vor Push) | empfohlen aktivieren |
| **GitGuardian** | Free-Tier (25 Devs) + paid | ⚠️ FR-Cloud | Live-Monitoring, Pre-Commit, History | optional |
| **git-secrets** (AWS Labs) | OSS | ✅ self-host | Pre-Commit-Hook für Secret-Patterns | Alternative zu gitleaks |

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
| **Supabase Security Advisor** | built-in | RLS, Performance, Missing-Index — limitiert (keine JWT/CORS/MFA-Checks) | ✅ Studio → Advisors |
| **Custom curl-Tests** | DIY | Anon-Key kann lesen was er soll | ✅ Standard 013-C |
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
- **AI-Rate:** **3,2 %** (vs. 1,5 % human, Veracode 100+ LLMs 2026) — Faktor 2,1× häufiger bei KI-Commits
- **Vorfall:** 400 von 5.600 Lovable/Bolt/Base44-Apps mit live API-Keys (Escape.tech 03/2026), inkl. Stripe `sk_live_*`, OpenAI, Supabase Service-Role
- **Coverage:** ✅ Standard 022 (gitleaks), ✅ Standard 013 Section F (Frontend-Bundle), ✅ Section J Punkt 4

#### A5 — Hallucination-basierte Flaws
- **CWE:** keine direkte (Pattern: nicht-existente Library oder fingierter API-Aufruf)
- **Beschreibung:** LLM erfindet Library-Namen, Funktions-Signatur oder API-Endpunkt. Code referenziert etwas, das nicht existiert oder anders funktioniert als angenommen. Spezialfall: **Slopsquatting / Dependency-Confusion** — LLM erfindet Package-Namen, Angreifer registriert genau diesen Namen und schmuggelt Schadcode ein.
- **AI-Rate:** **91,5 %** der vibe-coded Apps in Q1 2026 enthielten mindestens eine Hallucination-Flaw (Assessment 200+ Apps, Quelle: GitClear / ICSE-SEIP 2026)
- **Coverage:** ⚠️ teilweise via Standard 022 (Lockfile-Pflicht), Socket.dev empfohlen für Slopsquatting-Erkennung. **Standard 015 (CONCEPT.md)** erzwingt explizite Stack-Wahl + Reviewer-Prüfung — Hallucinations fallen beim manuellen Code-Re-Read auf. 🔴 **TODO:** automatisierter Library-Existenz-Check in CI.

### B. Klassische OWASP-Top-10 (in AI-Code reproduziert)

#### B1 — Broken Access Control (BOLA / IDOR)
- **CWE:** CWE-639 / OWASP A01 (Platz 1 OWASP Top 10 2021)
- **Beschreibung:** User A kann auf Resourcen von User B zugreifen, weil die ID einfach hochzählbar ist und keine Owner-Prüfung erfolgt
- **Verbreitung:** **94 %** der getesteten Apps mit mindestens einer BOLA-/Access-Control-Lücke (OWASP Top 10 2021 Statistik) — die häufigste Klasse überhaupt
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
- **Coverage:** ✅ Standard 013 Section C (RLS-Pflicht, Anon-Key-Test, Supabase-Linter manuell), 🔄 Continue CLI + Supabase MCP als daily Cron empfohlen (siehe Tools-Tabelle)

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

#### C7 — PII-Exposure ohne Auth (öffentliche personenbezogene Daten)
- **Rechtsgrundlage:** DSGVO Art. 32 („Stand der Technik") + Art. 33 (72h-Meldepflicht) + Art. 83 (bis 4 % Jahresumsatz)
- **Beschreibung:** Medizinische Daten, Zahlungsinfos, Adressen, Namen direkt per öffentlicher API/URL abrufbar — meist Folge von B6 (RLS-Misconfig) oder Unauth-Routes
- **Vorfall:** Escape.tech-Scan März 2026 — **175 PII-Leaks** in 5.600 Vibe-Coded Apps, inklusive Medical Records und Payment Data, in Produktion (nicht Test)
- **Coverage:** ✅ Standard 013 Section C (RLS) + Section J Punkt 6 (Unauth-Routes-Liste). 🔴 **TODO:** automatisierter Endpunkt-Scan auf personenbezogene Felder (Standard 020 geplant)

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

#### E4 — Packaging-Fehler / Source Code Leak
- **CWE:** CWE-540 (Information Exposure Through Source Code)
- **Beschreibung:** Build-/Bundling-Konfiguration falsch, proprietärer Code landet im Release-Artefakt (npm-Package, Docker-Image, Frontend-Bundle, Source-Maps)
- **Vorfall:** **Anthropic Claude Code CLI 2026-03-31** — 59,8 MB Source Map im npm-Package, ~512.000 Zeilen TypeScript exponiert. Das Tool selbst ist vibe-coded. **Kein Code-Bug, sondern Packaging-Konfig**. SAST hat es nicht gefunden, weil keine Logik-Lücke vorlag.
- **Lehre:** Security braucht auch Packaging-Reviews. Source-Maps in Public-Bundles + npm-Package-Inhalt müssen geprüft werden.
- **Coverage:** ✅ Standard 013 Section F (Source-Maps in Prod deaktiviert/privat), ⚠️ npm-Package-Inhalt nicht systematisch geprüft, 🔄 Standard 018 (Bundle-Drift-Audit) erweiterbar

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

### G. Strukturelle / Wartbarkeits-Lücken (langfristig sicherheitsrelevant)

Keine klassische CVE — aber wenn die Codebase strukturell zerfällt, multipliziert
jede Bug-Klasse ihre Wirkung. Tech-Debt ist Security-Debt mit Verzögerung.

#### G1 — KI-Code überproportional viele Findings
- **Daten:** AI-co-authored Code hat **2,74× mehr Security-Findings** als
  rein menschlicher Code (CodeRabbit Analyse 470 PRs, 2026)
- **Beschreibung:** KI generiert Code schneller als Reviewer ihn lesen können —
  Findings akkumulieren sich, Backlog wird unbewältigbar
- **Coverage:** ✅ Standard 013 Section A (Black-Box-Anteil Pflicht-Schätzung,
  > 20 % triggert zusätzlichen Review-Pass), ✅ Standard 015 (CONCEPT.md
  vom Menschen) — minimiert Konzept-Lücken, nicht Implementierungs-Lücken

#### G2 — Refactoring-Anteil im Sinkflug
- **Daten:** Refactoring-Anteil an Commits von **25 % (2021) auf < 10 % (2024)**
  gefallen (GitClear Longitudinal Study). Code wird hinzugefügt, fast nie
  konsolidiert.
- **Beschreibung:** Codebase wächst, aber Architektur erodiert. Jeder neue
  Bugfix passiert in einer komplexeren Umgebung als der vorhergehende.
- **Coverage:** 🔴 **TODO** — kein technischer Audit. Mitigation: explizite
  Refactor-Sprints pro Quartal, evtl. Standard 024 „Code-Health-Budget".

#### G3 — Code-Duplikation explodiert
- **Daten:** **4× mehr Code-Duplikation seit 2021** (GitClear). KI-Tools
  generieren bevorzugt copy-paste, nicht abstrahiert.
- **Beschreibung:** Bugfix in einer Kopie führt zu Inkonsistenz mit den
  anderen Kopien — klassische Lücken-Vergrösserung über Zeit.
- **Coverage:** ⚠️ teilweise via SonarQube/jscpd, kein eigener Standard.
  🔴 **TODO** — pre-commit Duplikations-Check evaluieren.

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
| OWASP | BOLA | B, J7 | — | curl-Skript | ⚠️ manuell, 020 geplant |
| OWASP | Privilege Escalation | B | — | manuell | ⚠️ manuell |
| OWASP | Crypto Failures | — | teilweise via 023 | semgrep | 🔴 **TODO** |
| OWASP | SQL/Command Injection | — | 023 | semgrep | ✅ hart |
| OWASP | Insecure Design | — | 015 | CONCEPT.md-Audit | ✅ hart (seit 015) |
| OWASP | RLS-Misconfig (B6) | C | — | curl + Supabase Linter + Continue MCP | ⚠️ manuell, daily Cron empfohlen |
| OWASP | Vuln Components | A | — | npm audit | ✅ |
| OWASP | Auth-Failures | B | — | manuell | ⚠️ manuell |
| OWASP | Webhook-Sig | G | — | manuell | ⚠️ manuell |
| OWASP | Logging | H, I | — | manuell | ⚠️ manuell |
| DSGVO | Tracker ohne Consent | D | — | Webbkoll manuell | 🔴 **TODO** (017) |
| DSGVO | Google Fonts | D | — | manuell | 🔴 **TODO** (017) |
| DSGVO | PII in Logs | — | — | — | 🔴 **TODO** |
| DSGVO | PII-Exposure (Endpunkt) | C, J6 | — | manuell + Vibe App Scanner | ⚠️ manuell, 020 geplant |
| DSGVO | AVV / DPA | D | — | Liste pflegen | ⚠️ manuell |
| DSGVO | EU-Region | D | — | manuell | ⚠️ manuell |
| LLM | Prompt Injection | — | — | — | 🔴 **TODO** |
| LLM | Insecure Output | — | — | — | 🔴 **TODO** |
| LLM | Sensitive Disclosure | — | — | — | 🔴 **TODO** |
| LLM | Excessive Agency (Replit) | E | — | manuell | ⚠️ manuell |
| Platform | Lovable/Bolt/v0 | J8 | — | manuell | ⚠️ manuell, 016 geplant |
| Supply | Bösartige npm | — | — | Socket.dev empfohlen | 🔴 **TODO** |
| Supply | Packaging-Leak (E4) | F | — | manuell | ⚠️ manuell, 018 erweiterbar |
| Drift | DNS | — | — | curl manuell | 🔴 **TODO** (019) |
| Drift | Bundle (alte URLs) | — | — | grep im Live-Bundle | 🔴 **TODO** (018) |
| Drift | Cert-Ablauf | — | — | manuell | 🔴 **TODO** (019) |
| Drift | Source-Maps | F | — | manuell | ⚠️ manuell |
| Struktur | KI-Findings 2,74× (G1) | A | — | Black-Box-% in 013-A | ⚠️ manuell |
| Struktur | Refactoring-Anteil (G2) | — | — | — | 🔴 **TODO** |
| Struktur | Duplikation 4× (G3) | — | — | jscpd / SonarQube | 🔴 **TODO** |

**Legende:**
- ✅ hart = automatisch erzwungen, Audit blockiert bei Verstoß
- ⚠️ manuell = in der Checkliste, aber kein Audit-Check
- 🔴 TODO = überhaupt nicht abgedeckt, neuer Standard nötig

**Aktuell abgedeckt (hart):** 7 Lücken (XSS, Log-Inj, SSRF, Hardcoded Secrets, Insecure Design via 015, SQL-Inj, Vuln Components)
**Aktuell manuell:** 16 Lücken
**Aktuell offen:** 12 Lücken (großteils geplant in Standards 014, 016–021, 024)

---

## Teil 4: Roadmap zur Vollabdeckung

Basierend auf der Coverage-Matrix, in Reihenfolge nach Hebelwirkung:

| Standard | Schließt ab | Hebel | Status |
|---|---|---|---|
| ~~**015** CONCEPT.md (Gate 1)~~ | Insecure Design (B5) | sehr hoch — verhindert Klassen vor Code-Zeile 1 | ✅ **erledigt 2026-04-27** |
| **016** Stack-Whitelist | Plattform-Lock-in (E1) | hoch — Lovable/Bolt/Base44 explizit raus | offen |
| **017** DSGVO-Tracker-Audit | Tracker (C1), Google Fonts (C2) | hoch — automatisierbar via Webbkoll | offen |
| **018** Bundle-Drift-Audit | Bundle-Drift (F2), Packaging-Leak (E4) | hoch — hätte repivot/panel.maxone.studio gefunden | offen |
| **019** Cert + DNS-Realität | DNS-Drift (F1), Cert (F3) | hoch — hätte plansey/vanfree gefunden | offen |
| **020** Pen-Test-Light | BOLA (B1), SSRF live, PII-Exposure (C7) | hoch — Enrichlead-Klasse automatisiert | offen |
| **014** Sunset | Datenfriedhöfe, AVV-Hygiene | mittel — gerade jetzt vanfree/plansey | offen |
| **021** Re-Review-Reminder | Drift schleichend | niedrig (kostet nichts) | offen |
| **024** Code-Health-Budget | Refactoring-Anteil (G2), Duplikation (G3) | mittel — strukturelle Erosion langfristig | offen |
| **025** LLM-App-Spezial | Prompt Injection (D1–D3) | hoch wenn LLM-Apps gebaut werden | offen |

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

1. **Semgrep CE** — SAST (Standard 023)
2. **gitleaks** — Secret-Scan (Standard 022)
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

### Vor jedem Go-Live (Standard 013-Lauf)

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
   bei jedem Major-Release? Standard 020 (Pen-Test-Light) deckt automatisiert
   das Wiederkehrende ab; manueller Tiefen-Pen-Test bleibt diskutabel.

4. **Bug-Bounty-Programm** — öffentlich (HackerOne / Intigriti) oder privat?
   Aktuell zu früh; ab > 1.000 zahlende Nutzer eines Projekts neu prüfen.

5. **Security-Disclosure-Policy** — eigener `/security.txt` mit Kontakt und
   Response-Zeit pro Domain? Würde unter Standard 026 fallen.

6. **DSGVO-Folgenabschätzung (Art. 35)** — ab wann formal? Standard 015
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
| 14 | OWASP Top 10 for LLM Applications v1.0 (2023) + v1.1 (2024) | D-Block |
| 15 | TTDSG, DSGVO Art. 4/9/28/32/33/35/83, BDSG | C-Block |
| 16 | Fraunhofer IESE — Verantwortungsstatement 2026 | Standard-013-Begründung |
| 17 | Kaspersky — Replit-Agent-Incident-Analyse 2025 | D4 |
| 18 | Eigene Vorfälle: Enrichlead, Tea-App, Moltbook, Replit-Agent, Base44, Lovable | B1, B6, D4, E1 |

**Pflege:** Bei jedem neuen Vorfall (eigene Nachrichten oder LinkedIn/HN/Newsletter)
einen Eintrag ergänzen — Datum, Quelle, betroffene Klasse, Coverage-Status.
