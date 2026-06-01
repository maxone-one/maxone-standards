# Recherche: Ähnliche Projekte auf GitHub & Anreicherung von maxone-standards

**Stand:** 2026-04-28
**Auftrag:** Max, "Recherchiere in GitHub, ob du ähnliche Projekte findest und
wie wir diese mit unserem anreichern können, um noch besser zu werden."
**Methode:** Zwei parallele Recherche-Agents (Governance/Standards + AI-Code-
Safety/Compliance), insgesamt 34 Tool-Calls über WebSearch und WebFetch.

---

## Executive Summary

**Es gibt nichts, was genau wie maxone-standards ist.** Die nächsten Verwandten
sind in vier Familien:

1. **OSS-Security-Health-Scorer**, `ossf/scorecard`, `ossf/allstar`, scannen
   GitHub-Repos auf Security-Hygiene (Branch-Protection, Pinned-Deps, etc.).
   Statisch, keine Live-Verify auf Prod-Servern.
2. **IaC/Container-Misconfig-Scanner**, `aquasecurity/trivy`,
   `bridgecrewio/checkov`, `open-policy-agent/conftest`, scannen Compose,
   Dockerfile, Terraform gegen 1000+ Built-in-Rules.
3. **LLM-Red-Team-Tools**, `NVIDIA/garak`, `protectai/llm-guard`,
   `promptfoo/promptfoo`, Probe-Suiten, Runtime-Guards und CI-Red-Team für
   LLM-Apps. **Garak hat 37+ Probes, exakt das was 025 als Test-Set erwartet.**
4. **SRE-/Launch-Readiness-Checklists**, `bregman-arie/sre-checklist`,
   Google SRE Launch Checklist, `pgaijin66/production-readiness-review-document`
  , opinionierte Markdown-Listen ohne Runner.

**Was maxone-standards einzigartig macht:**
- **Live-SSH-Verify gegen 4 echte Prod-Server** (nicht nur Repo-Scan)
- **One-Person-Shop-Realität** (180-Tage-Re-Review, Test-First, VECTOR als
  zweite Augenpaar), fast keine öffentliche Repo deckt das ehrlich ab
- **Incident-driven Standards**, jede Regel hat eine reale Postmortem-Zeile
  (Replit-DB-Drop, HTTP-01-Blast-Radius, Stalwart-Orphan-Container, etc.)
- **Hetero-Stack in einer Registry** (Next/Svelte/Supabase/Stalwart/Traefik/
  LLM-Agent gleichzeitig)

---

## Top-Empfehlungen: sortiert nach Impact/Aufwand

| # | Vorschlag                                                                                            | Inspiration                       | Aufwand | Impact |
|---|------------------------------------------------------------------------------------------------------|-----------------------------------|---------|--------|
| 1 | **VULN-CATALOG mit OWASP-LLM-Top-10:2025 IDs verknüpfen** (LLM01..LLM10)                             | OWASP/www-project-top-10-llm      | XS      | Hoch   |
| 2 | **Standard 025, garak-Probes als Pflicht-Test-Set** (`promptinject.HijackHateHumans`, `dan.AntiDAN`) | NVIDIA/garak                      | S       | Hoch   |
| 3 | **Standard 025, promptfoo OWASP-LLM-Preset als CI-Job** (eine Zeile YAML)                           | promptfoo/promptfoo               | S       | Hoch   |
| 4 | **Standard 025, OWASP Agentic Top 10 (2026) für VECTOR-Layer**                                      | genai.owasp.org/agentic-top-10    | S       | Hoch   |
| 5 | **Standard 028, Container-Misconfig-Audit (trivy config + checkov)**, schließt MEMORY-Blindspot    | aquasecurity/trivy + checkov      | M       | Hoch   |
| 6 | **Standard 029, Indirect-Prompt-Injection-Test** (RAG, Telegram, Web-Chat)                          | greshake/llm-security + Giskard   | M       | Mittel |
| 7 | **`registry/exceptions.yml` formalisieren** (granted_at, expires_until → Auto-FAIL nach Ablauf)      | ossf/allstar                      | M       | Mittel |
| 8 | **Audit-Score 0-10 pro Standard** (statt nur PASS/WARN/FAIL), erlaubt Trend-Diffs                   | ossf/scorecard                    | M       | Mittel |
| 9 | **Audit schreibt Findings als GH-Issues** (label: `audit-finding`)                                   | ossf/allstar                      | M       | Mittel |
| 10| **`templates/orr.md`** (Operational-Readiness-Review) bei jedem neuen Projekt-Onboarding             | adhorn/operational-excellence     | S       | Mittel |
| 11| **Standards in OWASP DevSecOps-Pipeline-Stage-Matrix neu rendern** (pre-commit/build/deploy/runtime) | OWASP/DevSecOpsGuideline          | S       | Niedrig|

---

## Top-5 Repos im Detail

### 1. NVIDIA/garak (~5k stars): direkter Seed für Standard 025
- **URL:** https://github.com/NVIDIA/garak
- **Was:** LLM-Vuln-Scanner mit 37+ Probe-Modulen (DAN, promptinject, xss,
  continuation, malwaregen, leakreplay, ...)
- **Warum:** 025 fordert "≥10 OWASP-LLM-Top-10 Payloads", garak liefert die
  bereits klassifiziert und Apache-2.0-lizensiert.
- **Konkrete Übernahme:** Probes `promptinject.HijackHateHumans`,
  `dan.DanInTheWild`, `dan.AntiDAN`, `leakreplay.SystemPrompts` als Seed-Set
  in `tests/llm-injection.spec.ts` einkippen.

### 2. promptfoo/promptfoo (~7k stars): CI-shaped LLM-Red-Team
- **URL:** https://github.com/promptfoo/promptfoo
- **Was:** Declarative YAML-basiertes LLM-Eval und Red-Team mit `owasp:llm`-
  Preset; läuft als GH-Action.
- **Warum:** Eine Zeile YAML (`plugins: [owasp:llm]`) führt OWASP-LLM-Top-10
  in CI aus. Weniger Code als selbst-gepflegtes vitest-Set.
- **Konkrete Übernahme:** In Standard 025 die Pflicht-Test-Suite optional auf
  `promptfooconfig.yaml` ausweiten, damit kleine Apps nicht 13 vitest-Cases
  pflegen müssen.

### 3. ossf/scorecard + ossf/allstar (~5k + ~1.4k stars)
- **URL:** https://github.com/ossf/scorecard, https://github.com/ossf/allstar
- **Was:** Scorecard scort Repos 0-10 auf ~20 Checks. Allstar enforced auf
  Org-Level via GH-App und öffnet Issues bei Verstößen.
- **Warum:** Scorecard ist der professionelle Bruder von `audit.mjs`. Allstar
  zeigt das "Audit → Issue → Fix"-Pattern statt manuellem Baseline-Diff.
- **Konkrete Übernahme:**
  - 0-10-Score pro Standard (zusätzlich zu PASS/WARN/FAIL) → Trend-Diff
  - `audit.mjs --emit=issues` als Modus, der Findings als GH-Issues anlegt

### 4. aquasecurity/trivy (~25k stars): schließt einen MEMORY-Blindspot
- **URL:** https://github.com/aquasecurity/trivy
- **Was:** Single-Binary-Scanner für Container, IaC, Secrets, SBOM,
  Compose-Misconfig.
- **Warum:** Aktueller MEMORY-Eintrag dokumentiert: 002+004 lokal nicht voll
  prüfbar, Compose liegt nur auf dem Server. Trivy kann via SSH gegen die
  Compose-Files dort laufen → blind spot weg.
- **Konkrete Übernahme:** Standard 028, `audit.mjs` führt
  `ssh root@<srv> "trivy config /opt/<projekt>/docker-compose.yml --format json"`
  aus, parsed Misconfigs, hängt sie an Standards 002+004 an.

### 5. OWASP Top 10 for LLM Applications 2025 + Agentic Apps 2026
- **URL:** https://github.com/OWASP/www-project-top-10-for-large-language-model-applications,
  https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- **Was:** Offizielle OWASP-Taxonomie LLM01..LLM10, plus separate Agentic-Top-10
  (Memory Poisoning, Tool Misuse, Goal Manipulation, ...).
- **Warum:** VULN-CATALOG hat eigene Block-Labels (D1-D4), externe Auditoren
  können das nicht direkt mappen. Pinning auf OWASP-IDs macht das Repo
  industrie-anschlussfähig.
- **Konkrete Übernahme:** Spalte "OWASP-ID" in der LLM-Sektion der
  VULN-CATALOG-Matrix; 025 erweitern um "Agentic-Layer (für VECTOR)" mit den
  10 ASI-Threats als Sub-Sections.

---

## Tools: Drop-in vs. Idea-Borrow

**Drop-in (im CI nutzen):**
- `gitleaks`, bereits in 022 ✅
- `semgrep`, bereits in 023 ✅
- `trivy config`, kann sofort als Standard 028
- `checkov`, alternativ zu trivy, gleiche Klasse
- `promptfoo`, npx, OWASP-LLM-Preset als CI-Job
- `garak`, wöchentlicher offline-Red-Team-Scan via VECTOR-Cron
- `protectai/llm-guard`, Runtime-Lib für VECTOR + email-client Edge-Function

**Idea-Borrow (Pattern kopieren, kein Dep):**
- ossf/scorecard 0-10-Scoring → audit-Summary
- ossf/allstar Auto-Issue → audit.mjs `--emit=issues`
- OPA conftest rego-as-policy → migriere bash-greps zu deklarativen Rules
- OWASP DevSecOps-Pipeline-Stage-Matrix → 27 Standards als Stage-Matrix
- microsoft/agent-governance-toolkit zero-trust-Identity → für VECTOR-zu-
  Supabase-Calls (heute vermutlich ein Service-Role-Key)

---

## Was maxone-standards bereits BESSER macht

1. **Live-Verify gegen Prod-Server**, Scorecard, Allstar, Agentic-Radar
   scannen alle nur den Git-Repo (Konfigurations-Intention). `audit.mjs`
   SSHt in 4 echte Server, inspiziert laufende Container, echte
   `/opt/secrets/`, echte TLS-Certs, echte Traefik-Labels. Das fängt
   **Drift zwischen Repo und Prod**, was statische Scanner strukturell
   nicht können.
2. **Solo-Realität ehrlich abgebildet**, die meisten SRE-Repos
   (sre-checklist, GitLab Handbook, AWS ORR) gehen von 5+ Personen-Teams
   aus. Maxone codet 180-Tage-Re-Review, Test-First, VECTOR als zweite
   Augenpaar, eine Nische, die fast niemand öffentlich beschreibt.
3. **Incident-Lineage**, jede Regel zeigt auf einen realen Vorfall.
   Andere Standards-Repos sind aspirational; maxone ist Narbengewebe.
4. **Hetero-Stack in einer Registry**, Next, Svelte, Supabase Edge,
   Stalwart, Traefik, LLM-Agent in EINEM Pass. Checkov/Scorecard decken
   jeweils nur eine Schicht ab.

---

## Quellen

Hauptquellen aus der Recherche:

- https://github.com/NVIDIA/garak
- https://github.com/protectai/llm-guard
- https://github.com/promptfoo/promptfoo
- https://github.com/OWASP/www-project-top-10-for-large-language-model-applications
- https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- https://github.com/microsoft/agent-governance-toolkit
- https://github.com/greshake/llm-security
- https://github.com/Giskard-AI/prompt-injections
- https://github.com/ossf/scorecard
- https://github.com/ossf/allstar
- https://github.com/aquasecurity/trivy
- https://github.com/bridgecrewio/checkov
- https://github.com/open-policy-agent/conftest
- https://github.com/6mile/DevSecOps-Playbook
- https://github.com/OWASP/DevSecOpsGuideline
- https://github.com/bregman-arie/sre-checklist
- https://sre.google/sre-book/launch-checklist/
- https://github.com/github/scripts-to-rule-them-all
- https://github.com/adhorn/operational-excellence

---

## Vorschlag für nächste Schritte (Priorität nach Impact/Aufwand)

**Sofort (Aufwand XS-S):**
1. VULN-CATALOG.md um OWASP-LLM-Top-10:2025-IDs erweitern (LLM01..LLM10)
2. Standard 025 um konkrete garak-Probes als Pflicht-Seed erweitern
3. Standard 025 um promptfoo `owasp:llm`-Preset als optionalen CI-Job
4. Standard 025 um OWASP Agentic Top 10 für VECTOR-spezifische Threats

**Diese Woche (Aufwand M):**
5. Standard 028 schreiben, Container-Misconfig-Audit via trivy/checkov
   (schließt 002+004-Compose-Blindspot)
6. `registry/exceptions.yml` einführen, formalisierte Ausnahmen mit
   `expires_until`, audit promotet abgelaufene zurück zu FAIL

**Nice-to-Have (Aufwand M):**
7. `audit.mjs --emit=issues`-Mode (Allstar-Pattern)
8. Per-Standard 0-10-Score statt nur Boolean (Scorecard-Pattern)
9. `templates/orr.md` (Operational-Readiness-Review)
