# 044 — SSoT & kein Hardcode für geteilte Werte

**Status:** active
**Seit:** 2026-05-17
**Gilt für:** alle Projekte

## Regel

Kein Wert, der in mehr als einem Projekt oder mehr als einer Datei verwendet wird,
darf hardcoded im Komponentencode stehen. Jeder geteilte Wert hat genau eine
kanonische Quelle (SSoT) — alle Konsumenten importieren oder ziehen von dort.

> "Einmal definieren, überall konsumieren."

## Was als geteilter Wert gilt

| Kategorie | Beispiele | Kanonischer Ort |
|-----------|-----------|-----------------|
| Social-Media-Links | GitHub, Instagram, LinkedIn, TikTok, Telegram | `maxone-standards/config/social.ts` → sync → `lib/social.ts` |
| Marken-URLs | `maxone.one`, `voltfair.de`, App-URLs | `lib/constants.ts` pro Projekt, Wert aus ENV wo sinnvoll |
| Rechtliche Texte / Impressum | Firmenname, Adresse, Steuernummer | Zentrale API (→ Standard 009) |
| Secrets & API-Keys | Brevo, INWX, Supabase | `/opt/secrets/` Store (→ Standard 003) |
| Versionsnummern / Build-IDs | `NEXT_PUBLIC_BUILD_ID` | ENV-Injection zur Build-Zeit (→ Standard 042) |
| Farbpaletten / Tokens | Brand-Farben, Radius, Spacing | `tailwind.config` / CSS-Custom-Properties, nie inline |
| Textbausteine | Footer-Attribution, Copyright-Zeile | `lib/constants.ts` oder i18n-Datei |
| Feature-URLs / externe Dienste | Supabase URL, CDN-Base | ENV-Variable, nie im Komponentencode |

## Wie SSoT implementiert wird

### Cross-Repo-Werte (mehrere Projekte)

1. Kanonische Datei in `maxone-standards/config/<name>.ts`
2. Sync-Script `maxone-standards/scripts/sync-<name>.mjs` verteilt sie
3. Jedes Projekt hat `lib/<name>.ts` — generiert, nicht manuell editiert
4. Import im Komponentencode: `import { X } from '@/lib/<name>'`

```bash
# Handle geändert → einmal updaten, überall propagieren:
node maxone-standards/scripts/sync-social.mjs
```

### Projektinterne Werte (ein Projekt, mehrere Dateien)

Definiere in `lib/constants.ts` (Next.js) oder `src/lib/constants.ts` (Vite/SPA):

```ts
// lib/constants.ts
export const BRAND_NAME = "voltfair";
export const BRAND_URL  = "https://voltfair.de";
export const SUPPORT_EMAIL = "hallo@voltfair.de";
```

Import überall: `import { BRAND_NAME } from '@/lib/constants'`

### Umgebungsspezifische Werte

Nutze ENV-Variablen (`process.env.NEXT_PUBLIC_*`, `import.meta.env.VITE_*`).
Niemals URL oder Key direkt im Code, auch nicht in "offensichtlichen" Stellen
wie einem Footer-Link.

## Verboten

```ts
// ❌ hardcoded Social-Link im Footer
<a href="https://github.com/irgendwas">GitHub</a>

// ❌ hardcoded Marken-URL in mehreren Dateien
const url = "https://voltfair.de/api/..."

// ❌ Farbe inline statt aus Design-Token
<div style={{ color: '#16a34a' }}>

// ✅ korrekt
import { SOCIAL_LINKS } from '@/lib/social';
<a href={SOCIAL_LINKS.github.url}>GitHub</a>
```

## Audit-Checks

Der Audit prüft stichprobenartig:

1. **Social-Links:** Keine literalen `github.com/`, `instagram.com/`, `linkedin.com/`-URLs
   außerhalb von `lib/social.ts` und `config/social.ts`
2. **Bekannte tote Handles:** `karastoni`, `tech-frankenstein` in alten Pfaden —
   sollten nirgends mehr vorkommen außer in `lib/social.ts`
3. **Hardcoded Jahre:** `©\s+20\d\d` ohne `new Date().getFullYear()` → WARN
4. **Inline-Secrets:** Wertmuster wie `/[A-Za-z0-9]{32,}/` in Komponentencode → FAIL
   (→ Standard 022 Secret-Scan hat Vorrang)

```js
// audit.mjs — Beispiel-Check
const KNOWN_DEAD_HANDLES = ['karastoni', 'karastokeles', 'tech.frankenstein(?!.*lib/social)'];
```

## Verwandte Standards

- **003** — Secrets-Store (SSoT für Credentials)
- **009** — Impressum-API (SSoT für Rechtsdaten)
- **040** — Deutsche Umlaute (SSoT für ASCII-Fallback-Liste)
- **042** — Version-Marker (SSoT für Build-ID via ENV)
