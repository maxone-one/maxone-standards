# 022 — Secret-Scan-Pflicht

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle Projekte beim Übergang `dev` → `live` UND in jeder CI-Pipeline

## Regel

Vor jedem `live`-Status MUSS `gitleaks detect` ohne Findings im aktuellen
Working-Tree durchlaufen. Findings im aktuellen Code = HARTER STOPP. Findings
nur in der Git-Historie = WARN mit Pflicht zur Key-Rotation, kein Blocker.

Kein "in nächster Iteration", kein `.gitleaksignore`-Trick ohne
schriftlich begründeten Eintrag.

## Warum

- Veracode hat über 100 LLMs getestet (2026): AI-generierter Code leakt Secrets
  doppelt so oft wie menschlicher Code (3,2 % vs. 1,5 % der Samples).
- Escape.tech hat 5.600 produktiv deployte Lovable/Bolt/Base44-Apps gescannt
  (März 2026): **400 mit exponierten API-Keys live**, inklusive Stripe `sk_live_*`,
  OpenAI-Keys und Supabase Service-Role-Tokens.
- Standard 013 Section F prüft nur das Frontend-Bundle (`grep "sk_" dist/`).
  Backend-Code, Migrations, Seed-Scripts, Test-Fixtures und vor allem die
  Git-Historie waren blind.
- Ein Secret in der Git-Historie ist kompromittiert — auch wenn es im aktuellen
  Code gelöscht wurde. `git log -p` reicht für jeden Angreifer.

## Wie anwenden

**1. Lokal vor Commit:**
```bash
gitleaks detect --source . --no-banner --redact
```

**2. In der CI-Pipeline (GitHub Actions):**
```yaml
- name: Secret-Scan
  run: |
    gitleaks detect --source . --no-banner --redact --report-format json
```

**3. Pre-Commit-Hook (empfohlen):**
- `pre-commit` Framework + [gitleaks-precommit](https://github.com/gitleaks/gitleaks#pre-commit)

**4. Bei legitimem False-Positive:**
- Eintrag in `.gitleaksignore` mit `<commit>:<file>:<rule>:<secret-snippet>`
  und Begründung als Kommentar

**5. Bei historischen Funden:**
- Betroffenen Key SOFORT rotieren (siehe globale Regel "Secrets Hierarchie")
- Git-Historie bereinigen: `bfg --delete-files <file>` oder `git filter-repo`
- Force-Push erst nach Rotation, nie davor (Angreifer sieht Git-Pull-Mirror)

**6. Tools installieren** (siehe `Makefile`):
```bash
make install-tools
```

## Audit

`scripts/audit.mjs` ruft `gitleaks detect --no-git` (nur Working-Tree) im
`path_local` jedes Projekts auf:

- Exit 0 = **PASS** (keine Findings im aktuellen Code)
- Exit 1 = **FAIL** (Findings — sofort handeln)
- `gitleaks` nicht installiert = **SKIP** mit Hinweis auf `make install-tools`
- Timeout (>60s) = **WARN**

History-Scan (`gitleaks detect` ohne `--no-git`) ist optional und wird in
einer späteren Audit-Iteration als WARN-Stufe ergänzt.
