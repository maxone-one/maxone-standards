# 040 — Echte Umlaute, niemals ASCII-Ersatz

**Status:** active
**Seit:** 2026-04-29
**Gilt für:** alle Projekte unter maxone — voltfair, SLF, snapflow, vanfree, repivot, plansey, vector, maxone.one und alle künftigen Projekte

## Regel

**Echte Umlaute immer ausschreiben — ä, ö, ü, Ä, Ö, Ü, ß. Niemals ue/ae/oe/ss als Ersatz.**

Das gilt überall, ohne Ausnahme für User-sichtbaren Text:
- DOM-Text, UI-Labels, Buttons, Fehlermeldungen
- ARIA-Attribute, Alt-Texte, Placeholder
- Mail-Subjects, Mail-Bodys (HTML + Text)
- Telegram- und SMS-Nachrichten
- Code-Kommentare, Doc-Strings
- Commit-Messages, PR-Bodies
- Memory-Einträge, CLAUDE.md-Blöcke

## Warum

ASCII-Ersatz (ue/ae/oe/ss) ist Erbe aus Pre-UTF-8-Zeiten. Heute ist UTF-8 überall Standard. Für deutschsprachige Empfänger wirkt ASCII-Ersatz:
- **unprofessionell** — wie ein schlecht konfiguriertes System
- **schwer lesbar** — "fuer" und "fuer" sind zwei verschiedene optische Einheiten
- **marken-schädlich** — maxone steht für Qualität, nicht für Technikprobleme aus den 90ern

Der unmittelbare Anlass (2026-04-29): Claude versandte eine Test-Mail mit "koennen wir naechste Woche kurz telefonieren? Viele Gruesse" — obwohl die CLAUDE.md-Regel schon existierte. Daraufhin wurde eine maschinell durchsetzbare Verteidigung gebaut (Stufe 1 + 2 unten).

## Ausnahmen (technisch erzwungen)

Nur wo die Technik wirklich zwingt:
- **URL-Slugs ohne IDN** — `ueber-uns`, `naechste-schritte` (Slug-Format ohne Unicode)
- **Bestehende Identifier** — DB-Spalten wie `gueltig_bis`, Enum-Werte, bestehende Variablennamen
- **Legacy-Filenames** — historische Dateinamen, die ohne Rename nicht geändert werden können
- **ENV-Variablen, Konstanten** — `STAEDTE_LISTE`, `UNGUELTIG_NACH` (all-caps Identifier)

**In allem User-sichtbaren Text gibt es keine Ausnahme.**

Bestandscode mit ASCII-Ersatz wird nicht retroaktiv massenhaft korrigiert — aber wenn ein String ohnehin im Diff-Bereich liegt, wird er mitkorrigiert.

## Durchsetzung — Drei Schichten

### Schicht 1: Runtime-Guard (letzter Ausgang vor dem Versand)

`src/lib/email-guard.ts` (Referenz-Implementierung: SLF-Projekt) enthält:

```typescript
import ASCII_FALLBACKS from "./ascii-fallbacks.json";

export function assertNoAsciiFallback(parts: GuardableMailParts, context: string): void
```

Wirft `AsciiFallbackError` direkt vor `transport.sendMail`. **Kein Bypass möglich** — nicht per Prompt, nicht per Template. Der Code sperrt den Versand.

Einbinden pro Projekt:
```typescript
assertNoAsciiFallback({ subject, html, text }, "mein-kontext");
await transport.sendMail({ ... });
```

### Schicht 2: Repo-Lint (Pre-Commit + CI)

`scripts/check-umlauts.mjs` (Referenz-Implementierung: SLF-Projekt) scannt:
- **`staged`-Modus** — `git diff --cached`, für Pre-Commit-Hook
- **`branch`-Modus** — `git diff origin/main...HEAD`, für CI-Step
- **`all`-Modus** — alle getrackten Quelltexte, für Audits

Wortliste in `src/lib/ascii-fallbacks.json` — Single Source of Truth, geteilt zwischen Runtime-Guard und Lint-Script.

Kontextsensitiv: Identifiers (Slug-Trennzeichen `-`/`_`, ALL_CAPS, CamelCase) werden per Heuristik übersprungen.

**CI-Step in `.github/workflows/deploy.yml`:**
```yaml
- name: Lint ASCII-Fallback-Umlaute (neue Zeilen gegen main)
  run: npm run check:umlauts:branch
```

**npm-Skripte in `package.json`:**
```json
"check:umlauts": "node scripts/check-umlauts.mjs",
"check:umlauts:branch": "node scripts/check-umlauts.mjs branch",
"check:umlauts:all": "node scripts/check-umlauts.mjs all"
```

### Schicht 3: Dieser Standard

Der Standard selbst sorgt dafür, dass neue Projekte die Schichten 1 und 2 von Anfang an einbauen.

## Neues Projekt onboarden

Für jedes neue maxone-Projekt:

1. `src/lib/ascii-fallbacks.json` aus dem SLF-Repo kopieren (oder als `@maxone/ascii-fallbacks` einbinden, wenn npm-Paket gebaut wird)
2. `src/lib/email-guard.ts` adaptieren (Pfad zum JSON anpassen)
3. `scripts/check-umlauts.mjs` kopieren (Pfad zum JSON anpassen)
4. npm-Skripte in `package.json` eintragen
5. CI-Step in Deploy-Workflow eintragen

## Audit-Check

```bash
# Im Projekt-Verzeichnis:
node scripts/check-umlauts.mjs all
# → 0 Treffer erwartet (oder nur bekannte Altlasten mit Kommentar)
```

Im CI: `npm run check:umlauts:branch` schlägt fehl (Exit 1), wenn neue Commit-Zeilen ASCII-Fallbacks enthalten.

## Referenz-Implementierung

Vollständige Referenz liegt im SLF-Projekt (`c:/Users/max/Projects/stadt-lahn-flow`):
- `src/lib/ascii-fallbacks.json` — Wortliste (84 Einträge, Stand 2026-05-05)
- `src/lib/email-guard.ts` — Runtime-Guard mit Tests
- `src/__tests__/email-guard.test.ts` — 10 Unit-Tests
- `scripts/check-umlauts.mjs` — CLI-Lint-Tool
- `.github/workflows/deploy.yml` — CI-Integration

## Verstoß-Beispiel

**2026-04-29 — SLF Test-Mail:**
Claude generierte und versandte eine Test-Mail mit `koennen`, `naechste`, `Gruesse` — obwohl CLAUDE.md-Regel existierte. Statische Regeln ohne maschinelle Durchsetzung reichen nicht. Konsequenz: Stufe 1 (Runtime-Guard) und Stufe 2 (Repo-Lint) gebaut und deployed.

## Referenzen

- CLAUDE.md (global): Block "Echte Umlaute, niemals ASCII-Ersatz"
- Standard 035 (Wahrhaftige Unterschrift): ähnliche Durchsetzungs-Philosophie — Regel ohne Code-Enforcement ist zahnlos
