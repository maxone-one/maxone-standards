# 012 — Footer-Standard

**Status:** active
**Seit:** 2026-04-27
**Aktualisiert:** 2026-05-17 — Mega/Slim-Trennung, Version-Marker (→ 042), "maxone studio" → "maxone"
**Gilt für:** alle Customer-facing Projekte

## Regel

Jedes Customer-facing Projekt hat einen Footer. Zwei Varianten — welche ein
**Projekt** bekommt, wird einmalig entschieden und gilt dann auf **allen** Seiten
des Projekts identisch:

| Variante | Wann |
|----------|------|
| **Mega** | Vollwertige Produkte mit Marketing-Seiten und Inhalt |
| **Slim** | Web-Apps, interne Tools, Platzhalter-Projekte |

**Niemals Mega und Slim gemischt innerhalb eines Projekts.** Entweder oder.

Die Implementierung ist pro Framework angepasst (React/Svelte/…), die
**Inhalts-Struktur** ist überall identisch.

## Mega — Pflicht-Inhalt

**3–5 Spalten (responsive, auf Mobile gestapelt):**

1. **Brand & Kurz-Info**
   - Logo + Projekt-Name
   - 1–2 Sätze Beschreibung
   - 🇩🇪 "Gehostet in Deutschland" (Pflicht bei EU-Kunden)

2. **Navigation** (1–3 projekt-spezifische Spalten)
   - Hauptlinks des Projekts, strukturiert nach Thema
   - Spaltenbezeichnung in `h3`/`h4`

3. **Rechtliches** (eigene Spalte, immer ganz rechts)
   - `/impressum` — Pflicht
   - `/datenschutz` — Pflicht
   - `/agb` oder `/nutzungsbedingungen` — falls Verträge vorhanden

**Bottom-Bar:**
- `© <Jahr> <Projekt-Name>` — Jahr dynamisch via `new Date().getFullYear()`
- "Entwickelt von [maxone](https://maxone.one)" — mit Link, kleiner Text
- Version-Marker (→ Standard 042): `v: <BUILD_ID.slice(0,8)>` als `<a>` auf GitHub-Commit

## Slim — Pflicht-Inhalt

**Einzeilig (auf Mobile zweizeilig):**

```
© 2026 ProjektName  ·  Impressum  ·  Datenschutz  [· weitere Legal]
                                    Entwickelt von maxone  ·  v: abc12345
```

- `© <Jahr> <Projekt-Name>` — Pflicht
- `/impressum` — Pflicht
- `/datenschutz` — Pflicht
- "Entwickelt von [maxone](https://maxone.one)" — Pflicht
- Version-Marker (→ Standard 042) — Pflicht wenn `NEXT_PUBLIC_BUILD_ID` gesetzt

## Hide-Logik

Footer (beide Varianten) wird **nicht** angezeigt auf:
- `/admin/*`, `/dashboard/*`, `/portal/*` — interne Bereiche
- `/onboarding/*` — Wizards
- Print-Views: `@media print { footer { display: none !important; } }`

Pattern: `GlobalFooter`-Wrapper mit `EXCLUDED_PREFIXES`-Array entscheidet
per Route, ob gerendert wird. Skelett: `templates/footer/GlobalFooter.tsx`.

## Attribution

- **"Entwickelt von maxone"** — für B2B-Projekts-Footer (plansey, voltfair, repivot, snapflow, …)
- **"Ein Projekt von maxone.one"** — wenn die Verbindung zu maxone Marketing-Wert hat (SLF, katchi)
- **NIEMALS "maxone studio"** — Wortmarke tot seit 2026-05-12

## Version-Marker

Version wird aus `NEXT_PUBLIC_BUILD_ID` (Next.js) bzw. `PUBLIC_BUILD_ID` (SvelteKit)
gelesen — zur Build-Zeit eingebacken. Falls Projekt semver-basiert (`FULL_VERSION` aus
`lib/version.ts`): semver-String ist ebenfalls konform. Details: Standard 042.

## Skelette

Skelette in [`templates/footer/`](../templates/footer/):

| Datei | Inhalt |
|-------|--------|
| `Footer.tsx` | Mega — React (Next.js/Vite/RR) |
| `FooterSlim.tsx` | Slim — React |
| `GlobalFooter.tsx` | Wrapper mit Hide-Logik |
| `Footer.svelte` | Mega — SvelteKit |
| `FooterSlim.svelte` | Slim — SvelteKit |

Skelett kopieren, Brand-Texte austauschen, Navigation einsetzen. Niemals neu erfinden.

## Audit

`scripts/audit.mjs` prüft pro Projekt:

- Existiert eine Footer-Komponente? (`Footer.{tsx,svelte,astro,vue}`)
- Enthält sie Links zu `/impressum` und `/datenschutz`?
- Enthält sie einen Link zu `maxone.one`?
- Enthält sie `new Date().getFullYear()` (kein hardcoded Jahr)?
- Version-Marker: → prüft Standard 042

## Stand (2026-05-17)

| Projekt | Variante | Version | Konform |
|---------|----------|---------|---------|
| stadtlahnflow | Mega | ✅ NEXT_PUBLIC_BUILD_ID | ✅ |
| voltfair | Mega | ✅ APP_VERSION (semver) | ✅ |
| repivot | Mega | ✅ FULL_VERSION (semver) | ✅ |
| snapflow | Mega | ✅ FULL_VERSION (semver) | ✅ |
| plansey | Mega | ⚠️ fehlt noch | → wird migriert |
| maxone.one | Mega | ⚠️ fehlt noch | → nächster Touch |
| vanfree | Mega | ✅ NEXT_PUBLIC_BUILD_ID | ✅ |
| stadtpunkt | Slim | ⚠️ fehlt noch | → nächster Touch |
