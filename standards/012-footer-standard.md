# 012 — Footer-Standard

**Status:** proposed (zur Diskussion mit Max)
**Seit:** 2026-04-27
**Gilt für:** alle Customer-facing Projekte

## Regel (Vorschlag)

Jedes Customer-facing Projekt hat einen Footer mit fester Struktur. Die
Implementierung ist pro Framework angepasst (React/Svelte/Astro/...), die
**Inhalts-Struktur** ist überall identisch.

## Warum

Aktuell hat jedes Projekt einen eigenen Footer mit eigener Struktur, eigenen
Links, eigener Attribution. Bei Audit-Recherche 2026-04-27 gefunden: 9
Footer-Komponenten, alle anders strukturiert. Das ist:
- Schlechtes Branding (kein Wiedererkennungswert über Projekte)
- Compliance-Risiko (manche Footer haben /datenschutz, andere nicht)
- Wartungs-Albtraum (jede Änderung an "Powered by"-Text ist 9× Arbeit)

## Pflicht-Inhalt

**3 Spalten oder 1 Spalte (responsive):**

1. **Brand & Kurz-Info**
   - Logo + Projekt-Name
   - 1–2 Sätze Beschreibung
   - Optional: "Made in Germany 🇩🇪"

2. **Navigation**
   - Hauptlinks des Projekts (wie im Header, gekürzt)

3. **Rechtliches**
   - `/impressum` (Pflicht)
   - `/datenschutz` (Pflicht)
   - `/agb` falls Verträge
   - `/credits` (siehe Standard 010)

**Bottom-Bar (separater Bereich):**
- `© <Jahr> <Projekt-Name>` — Jahr dynamisch aus `new Date().getFullYear()`
- "Entwickelt von [maxone studio](https://maxone.one)" — mit Link
- Optional: Build-ID / Version (für Debugging)

## Hide-Logik

Footer wird **nicht** angezeigt auf:
- `/admin/*`, `/dashboard/*`, `/portal/*` — interne Bereiche
- `/onboarding/*` — Wizards (verwirrt)
- Print-Views (`@media print { footer { display: none; } }`)

Pattern (analog zu `stadt-lahn-flow/GlobalFooter.tsx`): ein Wrapper, der via
`EXCLUDED_PREFIXES` entscheidet, ob gerendert wird.

## Wie anwenden

Pro-Framework-Skelett liegt in `templates/footer/`:
- `templates/footer/Footer.tsx` (React)
- `templates/footer/Footer.svelte` (Svelte)
- `templates/footer/Footer.astro` (Astro)

Skelett kopieren, Brand-Texte austauschen, Navigation einsetzen, fertig.
Niemals von Grund auf neu schreiben.

## Stand pro Projekt (2026-04-27)

Alle Customer-facing Projekte haben einen Footer, aber Drift ist erheblich.
Migration zum Standard erfolgt **bei nächstem Touch** des jeweiligen Projekts —
nicht als Big-Bang.

## Audit

`scripts/audit.mjs` prüft pro Projekt:
- Existiert eine Footer-Komponente? (`Footer.{tsx,svelte,astro,vue}`)
- Enthält sie Links zu `/impressum` und `/datenschutz`?
- Enthält sie "maxone studio" oder einen Link zu maxone.one?
- Enthält sie `new Date().getFullYear()` (kein hardcoded Jahr)?

## Offen für Max

- Soll "Made in Germany" Pflicht oder optional sein?
- Wie soll die "Entwickelt von"-Attribution genau aussehen — Link, Logo, Text?
- Bei Kundenprojekten: Footer-Attribution erlaubt oder nur dezent?
