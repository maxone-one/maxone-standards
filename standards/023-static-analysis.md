# 023 — Static-Analysis-Pflicht (Semgrep)

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle Projekte beim Übergang `dev` → `live`

## Regel

Vor jedem `live`-Status MUSS `semgrep` mit dem Regelpaket
`p/owasp-top-ten` ohne Findings der Severity `ERROR` durchlaufen.
Findings = HARTER STOPP, bis sie behoben oder einzeln namentlich
freigegeben sind.

Findings der Severity `WARNING` / `INFO` = WARN, dokumentationspflichtig
in `LAUNCH-REVIEW.md` Section J, aber kein Blocker.

## Warum

Die Klassen, die manuelle Code-Review nicht skalierbar abdecken kann und
die in AI-generiertem Code reihenweise auftauchen:

- **XSS:** 86 % der AI-generierten Samples bauen sie ein (Georgetown CSET,
  2025/26).
- **Log Injection:** 88 % Failure-Rate.
- **SSRF:** Tenzai (März 2026) hat fünf AI-Coding-Tools getestet (Cursor,
  Claude Code, Codex, Replit, Devin). **Alle fünf** bauen dieselbe
  SSRF-Lücke ein. 100 %.
- **Path Traversal, SQL Injection, Command Injection:** in jedem
  OWASP-Top-10-Bericht.

Veracode-Studie 2025/26: 45 % der AI-generierten Samples bauen
OWASP-Top-10-Lücken ein, **diese Rate ist von 2025 auf Anfang 2026
nicht gesunken**, trotz Hersteller-Versprechen. Georgia Techs "Vibe Security
Radar" hat im März 2026 35 CVEs direkt auf AI-Coding-Tools zurückgeführt
(Januar: 6, Februar: 15, März: 35 — Kurve steil nach oben).

Manuelle Review findet diese Klassen nicht zuverlässig. Semgrep findet sie
in unter einer Minute pro Projekt.

## Wie anwenden

**1. Lokal vor Commit / vor Launch:**
```bash
semgrep --config=p/owasp-top-ten --severity=ERROR --error .
```

**2. In der CI-Pipeline (GitHub Actions):**
```yaml
- name: Static Analysis
  run: |
    semgrep --config=p/owasp-top-ten --severity=ERROR --error
```

**3. Bei legitimem False-Positive:**
Inline-Kommentar in der Code-Zeile:
```ts
// nosemgrep: javascript.express.security.audit.xss — Input ist statisch aus Config
```
Und in `LAUNCH-REVIEW.md` Section J namentlich auflisten.

**4. Stärker fahren** (optional, später):
- `p/security-audit` (breiter, mehr False Positives)
- `p/javascript`, `p/typescript`, `p/react` (stack-spezifisch)
- Custom-Rules in `.semgrep.yml`

**5. Tools installieren** (siehe `Makefile`):
```bash
make install-tools
```

## Audit

`scripts/audit.mjs` ruft `semgrep --config=p/owasp-top-ten --severity=ERROR --error`
im `path_local` jedes Projekts auf:

- Exit 0 = **PASS** (keine ERROR-Findings)
- Exit 1 = **FAIL** (ERROR-Findings — `semgrep` lokal nochmal ausführen für Details)
- `semgrep` nicht installiert = **SKIP** mit Hinweis auf `make install-tools`
- Timeout (>120s) = **WARN**

WARNING/INFO-Findings werden vom Audit nicht eigenständig erfasst — sie
gehören in den manuellen `LAUNCH-REVIEW.md` Section-J-Pass.
