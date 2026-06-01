# Footer-Templates

Pro-Framework-Skelett für den Footer-Standard 012. Destilliert aus den
besten existierenden Footern (snapflow, maxone.one, voltfair), minus dem
Drift, plus Korrekturen (z.B. "maxone.one" statt "maxone.studio" gemäß
Standard 008).

## Struktur

3 Spalten + Bottom-Bar:

1. **Brand**, Logo, Projektname, 1-2 Sätze Beschreibung, "Gehostet in DE"
2. **Navigation**, projekt-spezifische Hauptlinks
3. **Rechtliches**, `/impressum`, `/datenschutz`, Cookie-Settings, optional `/agb`

Bottom-Bar:
- `© <Jahr> <Projekt>`, `new Date().getFullYear()`
- "Entwickelt von [maxone studio](https://maxone.one)"
- Optional: Version, Changelog-Button

## Hide-Logik

Footer **nicht** anzeigen auf: `/admin/*`, `/dashboard/*`, `/portal/*`,
`/onboarding/*`, Print-Views. Pattern: ein `GlobalFooter`-Wrapper, der
per Pathname-Check entscheidet.

## Dateien

- `Footer.tsx`, React (Next.js / Vite)
- `Footer.svelte`, Svelte/SvelteKit
- `Footer.astro`, Astro
- `GlobalFooter.tsx`, Wrapper mit Hide-Logik (React-Variante)

## Benutzung

1. Skelett kopieren ins Projekt (`src/components/Footer.tsx` o.ä.)
2. Brand-Texte ersetzen (`<PROJEKT>`, Beschreibung)
3. Navigation-Links projekt-spezifisch anpassen
4. Im Layout/Root einbinden (Wrapper bevorzugen, Hide-Logik!)
