# 035 — Brand & Kommunikation (Wahrhaftige Unterschrift · Echte Umlaute)

**Status:** active
**Seit:** 2026-04-29
**Gilt für:** alle Projekte, alle Kanäle (Mail, Telegram, SMS, Push, Bot-DMs, Auto-Replies)

## Inhalt

- [A] Wahrhaftige Unterschrift
- [B] Echte Umlaute, niemals ASCII-Ersatz

---

## A — Wahrhaftige Unterschrift

**Es unterzeichnet der, der wirklich verschickt.**

| Wer verschickt | Unterzeichnet als |
|---|---|
| Max persönlich tippt | "Max" / "Liebe Grüße Max" / "Max Karastelev" |
| KI im Auftrag (Claude, Vector, …) | `Vector — KI-Assistent von maxone.one (im Auftrag von Max Karastelev, automatisch versendet)` |
| Bot/Daemon/Cron | `— maxone-watchdog (automatisch)` |

Eine KI darf **nie** unter Max' Namen schreiben. Ein Bot darf **nie** als Person auftreten. Selbst wenn der Inhalt stimmt — die Unterschrift muss die Wahrheit über den Absender sagen.

**Kürzer in Telegram/SMS:** `— Vector (Max' KI), automatisch versendet`

**Implementierung:**
- Telegram-Bots: hardcoded Footer-Block am Ende jeder outbound Message — kein Bypass per Prompt, Code hängt es an
- Mail (`email-client` Edge Function): KI-Disclaimer vor Sponsor-Footer, Pipeline: User-Signatur → KI-Disclaimer → Sponsor-Footer → Send
- Auto-Replies/Onboarding: Versender-Identität niemals "Max" — "maxone Team" oder Bot-Name

**Ausnahme:** Max kann KI-vorgeschlagenen Text 1:1 selbst freigeben und persönlich versenden — dann unterzeichnet er als "Max" (Mensch im Loop = Wahrheit).

**Warum:** Wenn Viktoria eine Nachricht "von Max" bekommt, die Claude geschrieben hat, entstehen falsche Erwartungen, fehlende Verbindlichkeits-Einschätzung, und wenn sie es rausfindet wirkt alles davor manipuliert. Marken-Wert von maxone.one: wir lügen nie. Vorfall 2026-04-29: Telegram-Onboarding an Viktoria From mit "Liebe Grüße Max" — Max: "das ist eine Lüge".

---

## B — Echte Umlaute, niemals ASCII-Ersatz

**Regel:** ä, ö, ü, Ä, Ö, Ü, ß — immer. Niemals ue/ae/oe/ss als Ersatz.

**Gilt überall:** DOM-Text, UI-Labels, ARIA-Attribute, Mail-Subjects, Mail-Bodies, Telegram-Nachrichten, Code-Kommentare, Commit-Messages, PR-Bodies, Memory-Einträge.

**Ausnahmen** (technisch erzwungen): URL-Slugs ohne IDN, bestehende Identifier (DB-Spalten, Enum-Werte), Legacy-Filenames, ENV-Variablen/Konstanten in ALL_CAPS. In allem User-sichtbaren Text keine Ausnahme.

### Drei Schichten zur Durchsetzung

**Schicht 1 — Runtime-Guard** (`src/lib/email-guard.ts`):
```typescript
import ASCII_FALLBACKS from "./ascii-fallbacks.json";
export function assertNoAsciiFallback(parts: GuardableMailParts, context: string): void
```
Wirft `AsciiFallbackError` direkt vor `transport.sendMail`. Kein Bypass möglich.

**Schicht 2 — Repo-Lint** (`scripts/check-umlauts.mjs`):
```bash
npm run check:umlauts:branch   # CI: neue Zeilen gegen main
npm run check:umlauts:all      # Audit: alle getackten Quelltexte
```

**CI-Step:**
```yaml
- name: Lint ASCII-Fallback-Umlaute
  run: npm run check:umlauts:branch
```

**Referenz-Implementierung:** SLF-Projekt (`c:/Users/max/Projects/stadt-lahn-flow`):
- `src/lib/ascii-fallbacks.json` — 84 Einträge (SSoT für Runtime-Guard + Lint)
- `src/lib/email-guard.ts` — Runtime-Guard mit 10 Unit-Tests
- `scripts/check-umlauts.mjs` — CLI-Lint-Tool

**Neues Projekt onboarden:** `ascii-fallbacks.json` + `email-guard.ts` + `check-umlauts.mjs` kopieren, npm-Skripte + CI-Step eintragen.

**Warum:** Vorfall 2026-04-29: Claude versandte Test-Mail mit "koennen", "naechste", "Gruesse" — obwohl CLAUDE.md-Regel existierte. Statische Regeln ohne maschinelle Durchsetzung reichen nicht.

---

## Audit

**Umlaute:** `node scripts/check-umlauts.mjs all` — 0 Treffer erwartet. CI: Exit 1 bei neuen ASCII-Fallbacks in Diff.
