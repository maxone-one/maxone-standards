# 037 — Tech-Stack-Currency: Dependencies aktuell halten

**Status:** active
**Seit:** 2026-05-11
**Gilt für:** alle Projekte mit `package.json` / `requirements.txt` / `Cargo.toml` / vergleichbarem Manifest. Aktive UND pausierte Projekte (pausierte mindestens 1× pro Quartal).

## Regel

Dependency-Drift wird **proaktiv** gepflegt, nicht erst wenn ein Security-Fix einen Major-Sprung erzwingt. Pflicht-Kadenz pro Repo:

- **Patch + Minor: alle 4–6 Wochen** in einem PR — `npm update` (oder pip/cargo-Pendant) deckt Caret-Range, `package.json` muss nicht angefasst werden. Bei grünem `tsc` + `build` + Tests ohne Rückfrage merge + deploy.
- **Major-Bumps: einzeln**, pro Paket eigener PR. Vorher CHANGELOG + Migration-Guide lesen. Reihenfolge nach Abhängigkeit: Build-Tools (vite, typescript) vor Lint-Tools (eslint), Lint vor App-Code (lucide, day-picker).
- **Security-Fix mit `npm audit` high/critical:** separater PR, nicht im Feature-Branch parken.

Verstoß-Definition: Wenn ein Projekt nach 3+ Monaten ohne Sweep nur für Feature-Arbeit angefasst wird und `npm outdated` 30+ Pakete zeigt, hat die Kadenz versagt → erst Sweep, dann Feature.

## Warum

Drift sammelt sich still an. Drei Failure-Modes, die diese Regel verhindert:

**1. Erzwungener Notfall-Major.** Eine kritische Sicherheitslücke in Paket X v3 hat einen Fix in v5. Wer auf v3 sitzt mit 2 Jahren Bestandscode, muss in Panik durch v4→v5 Migration unter Zeitdruck. Wer regelmäßig sweept, war zum Lücken-Zeitpunkt auf v5.x oder einen kleinen Hop entfernt.

**2. Unfixbare Pakete.** Manche Pakete werden vom Maintainer aus dem öffentlichen Registry **entfernt** (xlsx/SheetJS 2024 — high-severity Prototype-Pollution + ReDoS, kein Fix per `npm`, Maintainer hostet selbst). Wer drauf sitzt, muss migrieren (exceljs, papaparse, oder CDN) — das ist immer Aufwand, aber bei jahrelanger Drift kombiniert mit kaputten Build-Tools wird's ein Wochen-Projekt statt Tage.

**3. Stack-Whitelist-Drift (Standard 016).** Whitelist-Komponenten haben Versions-Bandbreiten ("React ≥18", "Vite ≥5"). Ohne Sweeps fällt ein Projekt aus dem unterstützten Korridor → bei Audit-Time muss erst geupgraded werden, dann auditiert.

Empirie 2026-05-11: snapflow.one zeigte 29 Patch/Minor + 8 Major-Updates outstanding. Sweep dauerte ~30 Min (Minor/Patch in einem PR), Test-Lauf grün, deployed. Vergleich: ähnlicher Stand in einem 2-Jahre-ungewarteten Repo würde dasselbe in Tagen kosten.

## Wie anwenden

### 1. Sweep starten

Pro Repo, zu Beginn der Session bevor Feature-Arbeit:

```bash
git status                  # sauber?
git pull --rebase
npm outdated                # was ist drift?
npm audit                   # was ist sicherheitsrelevant?
```

Wenn `npm outdated` >5 Patch/Minor oder das Repo >6 Wochen ohne Sweep: erst Sweep.

### 2. Minor + Patch in einem PR

```bash
git checkout -b chore/deps-sweep-2026-05
npm update                  # caret-range hop, package.json bleibt
npm run build               # muss grün sein
npx tsc --noEmit            # muss grün sein
npm test -- --run           # Bestandsfails notieren (siehe Caveat unten)
git add package-lock.json
git commit -m "chore(deps): minor+patch sweep 2026-05"
gh pr create --title "chore(deps): minor+patch sweep 2026-05" --body "..."
```

PR-Body listet die wichtigsten Bumps (`npm outdated`-Diff vor/nach). Wenn alles grün → merge + deploy ohne Rückfrage.

**Caveat — Bestandsfails:** Wenn `npm test` schon vor dem Sweep rote Tests hatte, im PR notieren ("7 Tests waren bereits rot, nicht durch Sweep verursacht — siehe Commit abc123"). Bestandsfails NICHT im Sweep-PR fixen — separater PR, sonst vermischt sich Cause-of-failure-Analyse.

### 3. Major-Bumps einzeln

Pro Major-Paket:

1. CHANGELOG lesen (`gh release view <package>@<v>` oder GitHub-Release-Page)
2. Migration-Guide lesen falls dokumentiert
3. Eigener Branch: `chore/deps-major-<package>-v<X>`
4. `npm install <package>@<X>`
5. Breaking Changes anpassen
6. `tsc` + `build` + Tests grün
7. PR mit explizit benannten Breaking Changes + Migration-Schritten im Body
8. Merge + Deploy einzeln, **niemals mehrere Majors in einem PR**

Reihenfolge nach Abhängigkeit:

| Layer | Beispiele | Reihenfolge |
|---|---|---|
| Compiler / Build-Tools | typescript, vite, esbuild, webpack | **zuerst** |
| Test-Runner | vitest, jest, jsdom | nach Build |
| Lint-Tools | eslint, eslint-plugin-* | nach Test |
| Type-Definitions | @types/* | parallel zu Build |
| Runtime | react, vue, svelte | nach Build |
| App-Code Libraries | lucide-react, react-day-picker, date-fns | **zuletzt** |

### 4. Unfixbare / vom Registry entfernte Pakete

Wenn `npm audit` einen Vuln meldet UND `npm update` / Major-Bump das Paket nicht fixt:

1. Prüfen: ist das Paket noch im npm-Registry? (`npm view <package>`)
2. Wenn entfernt oder >1 Jahr nicht maintained: **Migration auf Alternative** planen. Eigener PR mit:
   - Vor/Nach-API-Vergleich
   - Bundle-Size-Impact
   - Test-Coverage-Check der gewechselten Stellen
3. Beispiele:
   - `xlsx` (SheetJS) → `exceljs` oder SheetJS-CDN
   - `request` (deprecated 2020) → `node-fetch` oder native `fetch`
   - `moment` (legacy) → `date-fns` oder native `Intl.DateTimeFormat`

### 5. Pausierte Projekte

Mindestens 1× pro Quartal: `npm outdated` + `npm audit` Snapshot. Wenn keine Vulns + <10 Minor-Drifts → kein Sweep nötig, nur Snapshot dokumentieren (Repo-Issue oder LIVING.md-Eintrag). Wenn Vulns: Sweep, auch im pausierten State.

### 6. Skip-Bedingungen

Sweep darf übersprungen werden wenn:
- Repo ist als `status: sunset` markiert (Standard 014) — kein Lebenszyklus mehr
- Repo ist `archive`-only Mirror (z.B. `specs-archive`)
- Repo hat keinen Lockfile (statisches Doku-Repo)

## Audit

`scripts/audit.mjs` prüft pro Projekt:

- **Drift-Schwelle:** `npm outdated --json` parsen — wenn >20 Patch/Minor → **WARN** ("Sweep überfällig"); >50 → **FAIL**
- **Audit-Schwelle:** `npm audit --json` parsen — `high`/`critical` mit Fix-Available → **WARN**; ohne Fix-Available (z.B. xlsx) → **WARN** mit Migrations-Hinweis
- **Last-Sweep-Marker:** `git log --oneline --grep "chore(deps)"` — letzter Sweep > 90 Tage her → **WARN** ("Kadenz verletzt")
- **Mehrere Majors in einem PR:** `git log -p` der letzten 5 Sweep-PRs — wenn ein PR mehr als 1 Major-Bump bumped → **WARN** ("Major-Bumps müssen einzeln")
- **package.json Major-Bump ohne CHANGELOG-Referenz im PR-Body:** falls PR-Bodies durchsucht werden können → **INFO**

## Was das Audit NICHT findet

- Ob die Tests nach dem Sweep wirklich repräsentativ waren (Test-Coverage-Sache)
- Ob ein "scheinbarer Minor" doch breaking war (Semver-Verstoß des Maintainers) → manuelles Smoke
- Ob Bestandsfails fälschlich dem Sweep zugeschrieben wurden → Commit-Diff-Lesen
- Ob ein deferrter Major-Bump (z.B. lucide v1, react-day-picker v10) gerechtfertigt deferrt ist → Kontext-Frage

## Verhältnis zu anderen Standards

- **016 (Stack-Whitelist):** definiert WELCHE Pakete erlaubt sind. 037 hält die erlaubten aktuell.
- **022 (Secret-Scan) / 023 (Static-Analysis):** Gate-3-Audits. 037 senkt die Wahrscheinlichkeit, dass Gate-3 erst Dependencies upgrade-blockieren muss.
- **018 (Bundle-Drift-Audit):** prüft das **gebaute Bundle** auf veraltete Hosts/Quellen. 037 verhindert, dass das Bundle veraltete Pakete enthält.
- **024 (Code-Health-Budget):** Refactor-Quote ≥15 %. Dependency-Sweeps zählen als Refactor-Arbeit.

## Quellen

- xlsx/SheetJS Off-Registry-Move: <https://docs.sheetjs.com/docs/getting-started/installation/nodejs>
- npm semver caret semantics: <https://docs.npmjs.com/cli/v10/configuring-npm/package-json#dependencies>
- Erfahrungs-Trigger 2026-05-11: snapflow.one Sweep nach Erkenntnis, dass Stack-Drift still anwächst (xlsx-Vuln war Auslöser, 29 Patch/Minor + 8 Major outstanding)
