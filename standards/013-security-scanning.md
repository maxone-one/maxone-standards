# 013 — Security Scanning (gitleaks · Semgrep OWASP)

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle Projekte beim Übergang `dev` → `live` UND in CI-Pipeline

## Inhalt

- [A] Secret-Scan (gitleaks)
- [B] Static Analysis (Semgrep OWASP-Top-10)

---

## A — Secret-Scan (gitleaks)

Vor jedem `live`-Status MUSS `gitleaks detect` ohne Findings durchlaufen. Findings im aktuellen Code = HARTER STOPP.

**Lokal:**
```bash
gitleaks detect --source . --no-banner --redact
```

**CI (GitHub Actions):**
```yaml
- name: Secret-Scan
  run: gitleaks detect --source . --no-banner --redact --report-format json
```

**Pre-Commit-Hook** (empfohlen): `pre-commit` Framework + gitleaks-precommit.

**Bei False-Positive:** Eintrag in `.gitleaksignore` mit Commit+Datei+Regel+Begründung.

**Bei historischen Funden:** Key SOFORT rotieren → `git filter-repo` (History bereinigen) → Force-Push erst NACH Rotation. Niemals umgekehrt.

**Warum:** Veracode-Studie 2026: KI-generierter Code leakt Secrets 2× häufiger als menschlicher Code (3,2 % vs. 1,5 %). Escape.tech: 400 von 5.600 Vibe-Coding-Apps mit exponierten API-Keys live, inklusive `sk_live_*`-Stripe-Keys und Supabase Service-Role-Tokens.

---

## B — Static Analysis (Semgrep)

Vor jedem `live`-Status MUSS `semgrep --config=p/owasp-top-ten` ohne Findings der Severity `ERROR` durchlaufen. Findings = HARTER STOPP bis behoben oder freigegeben.

WARNING/INFO-Findings = dokumentationspflichtig in LAUNCH-REVIEW.md Section J, kein Blocker.

**Lokal:**
```bash
semgrep --config=p/owasp-top-ten --severity=ERROR --error .
```

**CI:**
```yaml
- name: Static Analysis
  run: semgrep --config=p/owasp-top-ten --severity=ERROR --error
```

**Bei False-Positive:**
```ts
// nosemgrep: javascript.express.security.audit.xss — Input ist statisch aus Config
```
Plus Eintrag in LAUNCH-REVIEW.md Section J.

**Tools installieren:** `make install-tools`

**Warum:** Veracode 2025/26: 45 % der KI-generierten Samples bauen OWASP-Top-10-Lücken ein — Rate hat sich nicht verbessert trotz Hersteller-Versprechen. XSS: 86 % Failure-Rate. SSRF: alle 5 getesteten AI-Coding-Tools (Cursor, Claude Code, Codex, Replit, Devin) bauten dieselbe Lücke ein (Tenzai, März 2026).

---

## Audit

`scripts/audit.mjs`:

**gitleaks:** ruft `gitleaks detect --no-git` im `path_local` auf:
- Exit 0 → PASS, Exit 1 → FAIL, nicht installiert → SKIP, Timeout → WARN

**Semgrep:** ruft `semgrep --config=p/owasp-top-ten --severity=ERROR --error` auf:
- Exit 0 → PASS, Exit 1 → FAIL, nicht installiert → SKIP, Timeout (>120s) → WARN
