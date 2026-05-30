# 020 — Brand & Kommunikation (Wahrhaftige Unterschrift · Echte Umlaute · Kein Gedankenstrich · Fließender Schreibstil)

**Status:** active
**Seit:** 2026-04-29
**Gilt für:** alle Projekte, alle Kanäle (Mail, Telegram, SMS, Push, Bot-DMs, Auto-Replies, Chat, UI-Texte, Docs)

## Inhalt

- [A] Wahrhaftige Unterschrift
- [B] Echte Umlaute, niemals ASCII-Ersatz
- [C] Kein Gedankenstrich
- [D] Fließender Schreibstil, kein KI-Aufzählungsstil

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

## C — Kein Gedankenstrich

**Regel:** Den Gedankenstrich (—) niemals verwenden. Keine Ausnahmen.

**Gilt für:** alles ohne Einschränkung. E-Mails, Nachrichten, UI-Texte, Landingpages, Blogs, Docs, Commit-Messages, PR-Bodies, Code-Kommentare, Chat-Antworten, Memory-Einträge, technische Specs.

**Ersatz:** Komma, Punkt oder Doppelpunkt. Satz bei Bedarf umstrukturieren.

**Warum:** Gedankenstriche sind durch KI-generierte Texte in Verruf geraten und wirken sofort maschinell. Dreifach verstoßen (2026-05-27, 2026-05-28, 2026-05-30) trotz bestehender CLAUDE.md-Regel.

---

## D — Fließender Schreibstil, kein KI-Aufzählungsstil

**Regel:** KI schreibt standardmäßig in kurzen, aufzählenden Sätzen. Das fällt auf. Max schreibt fließend und in leicht verständlichen Sätzen. Dieser Stil ist verbindlich für alle Texte die maxone.one, Claude oder andere Agenten im Auftrag von Max produzieren.

**Was das bedeutet:** Gedanken werden in Sätzen verbunden, nicht abgehackt. Fakten und Haltung kommen im selben Atemzug. Kein Bullet-Point-Denken, keine "Ich kann X, ich kann Y, ich kann Z"-Reihung. Zusammenhänge werden erklärt, nicht nummeriert.

**Gilt für:** alle vom Menschen lesbaren Texte — Anschreiben, Profile, E-Mails, UI-Texte, Zusammenfassungen, Chat-Antworten, Dokumentation.

**Referenz (Max' eigene Formulierungen):**
"Gelernter Handwerker mit einer ausgeprägten Leidenschaft für Digitalisierung, innovative Technologien und automatisierte Prozesse, die das Leben erleichtern und effizienter gestalten. Ich bringe mein Know-how aus Handwerk, technischer Praxis, Online-Marketing, Automation und Smart-Home-Technologien überall dort ein, wo es sinnvoll ist und echten Mehrwert schafft."

"Ich bin KI-Spezialist mit Schwerpunkt Agent-Entwicklung, Prompt Engineering und LLM-Integration. Alles, was ich in den letzten fünf Monaten gebaut habe, läuft in Produktion: ein Multi-Channel-KI-Agent, eine vollständige Mail-Infrastruktur, ein MCP-Server für ELSTER-Anbindung. Kein Tutorial, kein Demo-Modus."

**Was zu vermeiden ist:** Kurze abgehackte Sätze hintereinander. Listen wo Fließtext passt. Aussagen die wie Stichpunkte klingen. Der typische KI-Aufzählungsstil.

**Warum:** 2026-05-30, Max: "KI schreibt gerne in kurzen, aufzählenden Sätzen. Ja, wenn es mir aufgefallen ist, fällt es auch anderen auf."

---

## Audit

**Umlaute:** `node scripts/check-umlauts.mjs all` — 0 Treffer erwartet. CI: Exit 1 bei neuen ASCII-Fallbacks in Diff.
**Gedankenstrich:** `grep -r " — " src/` in Textdateien — 0 Treffer erwartet.
