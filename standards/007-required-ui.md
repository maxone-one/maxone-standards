# 007 — Required UI Components (Impressum · Credits · Vector-Widget · Footer)

**Status:** active
**Seit:** etabliert 2026-04-27, One-Liner-Pattern 2026-05-20
**Gilt für:** alle Customer-facing Projekte mit Impressum-Pflicht

## Inhalt

- [A] Impressum aus zentraler API
- [B] Credits aus zentraler API
- [C] Vector-Chat-Widget
- [D] Footer-Standard

---

## A — Impressum aus zentraler API

Das Impressum aller Projekte kommt aus der zentralen API:
```
https://panel.maxone.one/functions/v1/impressum
```

Niemals hardcoded. Cache: `{ next: { revalidate: 3600 } }`.

**Rechtslage (Stand 2026-05-16):** DDG §5 (ersetzt TMG seit 14.05.2024). Impressum muss HTML sein, max. 2 Klicks erreichbar. Niemals PDF.

**Pflicht-Fallback:** bei API-Ausfall lokale Kopie zeigen — niemals "Impressum nicht verfügbar".

**Pflicht-Felder:** `legal_name`, `street/zip/city`, `email`, `vat_id`/`w_id_nr`/`tax_id`. Bei GmbH/UG/AG zusätzlich: `register_court`, `register_number`, `legal_form`.

**Statischer §36-VSBG-Block** (MUSS in jedem Impressum, kommt nicht aus API):
```html
<h2>Verbraucherschlichtung</h2>
<p>Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren
vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
```

**Verboten:**
- ODR-Link (`ec.europa.eu/consumers/odr`) — abmahnfähig seit 20.07.2025 (Plattform abgeschaltet)
- Auf `panel.maxone.studio` referenzieren (deprecated seit 2026-04-16)
- §5 TMG erwähnen — nur §5 DDG oder gar keinen Gesetzesverweis

---

## B — Credits aus zentraler API

Jedes Projekt hat eine `/credits`-Route, die aus:
```
https://maxone.one/api/credits/<slug>
```
bezieht. Slug = Projekt-Name aus `registry/projects.yml`.

**Pflicht-Inhalt der `/credits`-Seite:** Studio-Info + CTA zu maxone.one, Tech-Stack (aus API), Werte/Über-uns (aus `credits_global`), Link zu Impressum/Datenschutz.

---

## C — Vector-Chat-Widget

Jedes Customer-facing Projekt bindet das Widget über den Auto-Loader ein — **eine Zeile**, nichts weiter:

```html
<script src="https://agent.maxone.one/widget/embed.js" async></script>
```

Am Ende von `<body>` oder im `<head>` mit `async`. Der Loader kümmert sich um Preconnect, Preload, Widget-Script und `<vector-chat>`-Tag.

**Default-Hide-Liste** (eingebaut): `/impressum, /datenschutz, /agb, /widerruf, /privacy, /imprint, /terms`

**Override via `data-*`:**
```html
<!-- Hide-Liste ersetzen -->
<script src="..." data-hide-on="/admin,/portal"></script>
<!-- Hide-Liste ergänzen -->
<script src="..." data-hide-on-extra="/admin"></script>
<!-- Persona manuell -->
<script src="..." data-instance="maxone"></script>
```

**Niemals:**
- Alte URL `agent.maxone.studio` (tot)
- Nur Widget-Script ohne `<vector-chat>`-Tag (stiller Fehlschlag)
- Vector mit Restriction-Attributen einschränken (`disabled` etc.) — Vector ist überall derselbe Vector

---

## D — Footer-Standard

Jedes Customer-facing Projekt hat einen Footer. Variante einmalig pro Projekt wählen, nie mischen:

| Variante | Wann |
|---|---|
| **Mega** | Vollwertige Produkte mit Marketing-Seiten |
| **Slim** | Web-Apps, interne Tools, Platzhalter |

**Mega — Pflicht-Spalten:** 1. Brand & Kurz-Info (inkl. "Gehostet in Deutschland") · 2–4. Navigation · letzte Spalte: Rechtliches (`/impressum`, `/datenschutz`, ggf. AGB)

**Mega Bottom-Bar:** `© <Jahr>` (dynamisch) · "Entwickelt von [maxone](https://maxone.one)" · Version-Marker (`v: <BUILD_ID.slice(0,8)>` als Link auf GitHub-Commit, siehe Standard 022)

**Slim (einzeilig):**
```
© 2026 ProjektName · Impressum · Datenschutz · Entwickelt von maxone · v: abc12345
```

**Hide-Logik:** Footer nicht auf `/admin/*`, `/dashboard/*`, `/portal/*`, `/onboarding/*`, Print.

**Attribution:**
- "Entwickelt von maxone" — B2B-Projekte
- "Ein Projekt von maxone.one" — wenn Verbindung zu maxone Marketing-Wert hat
- NIEMALS "maxone studio" (Wortmarke tot seit 2026-05-12)

**Skelette:** [`templates/footer/`](../templates/footer/) — `Footer.tsx`, `FooterSlim.tsx`, `GlobalFooter.tsx`, `Footer.svelte`, `FooterSlim.svelte`.

---

## Audit

`scripts/audit.mjs` prüft pro Projekt:

**Impressum:**
- `panel.maxone.one/functions/v1/impressum` im Code → PASS; `.studio` → WARN
- `ec.europa.eu/consumers/odr` im Code → **FAIL** (abmahnfähig)
- `Verbraucherschlichtung` im Code → WARN wenn fehlt
- Live-Check: HTML enthält kein ODR-Link → FAIL; §36-Block fehlt → WARN

**Credits:**
- `/credits`-Route existiert und ruft `maxone.one/api/credits/` auf

**Widget:**
- HTML enthält `agent.maxone.one/widget/embed.js` (One-Liner) ODER `vector-chat.js` + `<vector-chat>`-Tag
- Nur `vector-chat.js` ohne Tag → **FAIL**
- `agent.maxone.studio` → **WARN**

**Footer:**
- Footer-Komponente existiert (`Footer.{tsx,svelte,astro,vue}`)
- Enthält Links zu `/impressum` und `/datenschutz`
- Enthält Link zu `maxone.one`
- Enthält `new Date().getFullYear()` (kein hardcoded Jahr)
- Version-Marker: → Standard 022
