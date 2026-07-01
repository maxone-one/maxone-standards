# 007: Required UI Components (Impressum · Credits · Vector-Widget · Footer · Layout-Qualität)

**Status:** active
**Seit:** etabliert 2026-04-27, One-Liner-Pattern 2026-05-20
**Gilt für:** alle Customer-facing Projekte mit Impressum-Pflicht

## Inhalt

- [A] Impressum aus zentraler API
- [B] Credits aus zentraler API
- [C] Vector-Chat-Widget
- [D] Footer-Standard
- [E] Keine Scrollbalken (Layout-Qualität) + kein Mobile-Overflow (E.2)
- [F] Design-first-Validierung vor dem Bau (nie blind bauen)

---

## A: Impressum aus zentraler API

Das Impressum aller Projekte kommt aus der zentralen API:
```
https://panel.maxone.one/functions/v1/impressum
```

Niemals hardcoded. Cache: `{ next: { revalidate: 3600 } }`.

**Rechtslage (Stand 2026-05-16):** DDG §5 (ersetzt TMG seit 14.05.2024). Impressum muss HTML sein, max. 2 Klicks erreichbar. Niemals PDF.

**Pflicht-Fallback:** bei API-Ausfall lokale Kopie zeigen, niemals "Impressum nicht verfügbar".

**Pflicht-Felder:** `legal_name`, `street/zip/city`, `email`, `vat_id`/`w_id_nr`/`tax_id`. Bei GmbH/UG/AG zusätzlich: `register_court`, `register_number`, `legal_form`.

**Statischer §36-VSBG-Block** (MUSS in jedem Impressum, kommt nicht aus API):
```html
<h2>Verbraucherschlichtung</h2>
<p>Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren
vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
```

**Verboten:**
- ODR-Link (`ec.europa.eu/consumers/odr`), abmahnfähig seit 20.07.2025 (Plattform abgeschaltet)
- Auf `panel.maxone.studio` referenzieren (deprecated seit 2026-04-16)
- §5 TMG erwähnen, nur §5 DDG oder gar keinen Gesetzesverweis

---

## B: Credits aus zentraler API

Jedes Projekt hat eine `/credits`-Route, die aus:
```
https://maxone.one/api/credits/<slug>
```
bezieht. Slug = Projekt-Name aus `registry/projects.yml`.

**Pflicht-Inhalt der `/credits`-Seite:** Studio-Info + CTA zu maxone.one, Tech-Stack (aus API), Werte/Über-uns (aus `credits_global`), Link zu Impressum/Datenschutz.

---

## C: Vector-Chat-Widget

Jedes Customer-facing Projekt bindet das Widget über den Auto-Loader ein, **eine Zeile**, nichts weiter:

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
- Vector mit Restriction-Attributen einschränken (`disabled` etc.), Vector ist überall derselbe Vector

---

## D: Footer-Standard

Jedes Customer-facing Projekt hat einen Footer. Variante einmalig pro Projekt wählen, nie mischen:

| Variante | Wann |
|---|---|
| **Mega** | Vollwertige Produkte mit Marketing-Seiten |
| **Slim** | Web-Apps, interne Tools, Platzhalter |

**Mega, Pflicht-Spalten:** 1. Brand & Kurz-Info (inkl. "Gehostet in Deutschland") · 2-4. Navigation · letzte Spalte: Rechtliches (`/impressum`, `/datenschutz`, ggf. AGB)

**Mega Bottom-Bar:** `© <Jahr>` (dynamisch) · "Entwickelt von [maxone](https://maxone.one)" · Version-Marker (`v: <BUILD_ID.slice(0,8)>` als Link auf GitHub-Commit, siehe Standard 022)

**Slim (einzeilig):**
```
© 2026 ProjektName · Impressum · Datenschutz · Entwickelt von maxone · v: abc12345
```

**Hide-Logik:** Footer nicht auf `/admin/*`, `/dashboard/*`, `/portal/*`, `/onboarding/*`, Print.

**Attribution:**
- "Entwickelt von maxone", B2B-Projekte
- "Ein Projekt von maxone.one", wenn Verbindung zu maxone Marketing-Wert hat
- NIEMALS "maxone studio" (Wortmarke tot seit 2026-05-12)

**Skelette:** [`templates/footer/`](../templates/footer/), `Footer.tsx`, `FooterSlim.tsx`, `GlobalFooter.tsx`, `Footer.svelte`, `FooterSlim.svelte`.

---

## E: Keine Scrollbalken (Layout-Qualität)

Ein Scrollbalken ist ein UI-Defektsignal, kein neutrales Bedienelement. Er bedeutet, dass zu viel Inhalt auf zu wenig Platz gepackt oder der vorhandene Platz nicht effizient genutzt wird. Wo ein Scrollbalken erscheint, wurde das Layout nicht zu Ende gedacht.

**Regel:** Layouts so bauen, dass kein Scrollbalken entsteht. Dichte, mehrspaltige Anordnung statt langer einspaltiger Listen (Grid statt Liste), kompakte Zeilen, vorhandenen Platz bewusst ausnutzen. Bei viel Inhalt zuerst die Informationsdichte erhöhen (mehrspaltig, gruppiert, klappbar), bevor überhaupt gescrollt wird.

**Pflicht-Check:** Vor jedem "fertig" bei UI-Arbeit prüfen, ob irgendwo ein Scrollbalken entsteht. Wenn ja, ist die UI nicht fertig, sondern muss verdichtet werden. Diese Prüfung gehört fest in den Verifikationsschritt jeder Frontend-Aufgabe.

Direktive Max, mehrfach gesagt, verbindlich ab 2026-06-09.

### E.2: Kein horizontaler Überlauf auf Mobile (schwimmende Layouts)

Schwimmende Layouts sind ein No-Go. Jede Seite MUSS bei Handy-Breite (Viewport <= 375px, getestet bei 360 UND 320) ohne horizontalen Scroll und ohne seitliches Driften funktionieren. Mobil wird mit dem Daumen bedient, jedes horizontale Überlaufen fällt sofort auf. Laut Max der Default-Fehler bei KI-gebauten Seiten, muss aufhören.

**Häufigste Wurzel + Fix:**
- Responsive Grids: `grid-template-columns: repeat(auto-fit, minmax(min(Npx, 100%), 1fr))`, NIE `minmax(Npx, 1fr)`. Die feste Min-Breite kann sonst auf schmalen Screens nicht schrumpfen, die Spalte wird breiter als der Viewport.
- `* { min-width: 0; }` (Grid/Flex-Kinder überlaufen sonst via min-content).
- `img, video, svg, table { max-width: 100%; }`. Kein `100vw` (enthält die Scrollbar-Breite).
- Backstop: `html, body { overflow-x: hidden; }`, aber nur als Netz, die Wurzel muss trotzdem stimmen (sonst kaschiert es den Bug).
- SSoT-/Inline-JS, das Grids setzt (z.B. portfolio.js): dieselbe `minmax(min(...,100%),...)`-Regel.

**Pflicht-Check (Playwright, Mobile-Viewport, nach Scroll bis unten):**
```js
const vw = document.documentElement.clientWidth;
const offenders = [...document.querySelectorAll('*')]
  .filter(el => { const r = el.getBoundingClientRect(); return r.right > vw + 1 || r.left < -1; });
// MUSS gelten: document.documentElement.scrollWidth <= vw  UND  offenders.length === 0
```
`getBoundingClientRect` deckt echten Überlauf auch unter `overflow-x:hidden` auf, also nicht nur `scrollWidth` prüfen. Vorfall: maxone-Landingpages schwammen (`minmax(420px,1fr)`-Karten), 2026-06-24.

---

## F: Design-first-Validierung vor dem Bau (nie blind bauen)

**Regel (Max-Direktive 2026-07-01, imperativ):** Jedes neue Projekt und jede neue kundenseitige Oberfläche wird zuerst über ein visuelles Design-/Prototyping-Tool validiert, bevor Produktionscode entsteht. **Niemals blind bauen.** Bestehende Projekte werden retroaktiv nachgezogen (design-validiert und angeglichen), priorisiert nach Kundennähe und UX-Wichtigkeit.

**Werkzeuge (gleichwertig, nach Kontext wählen):**
- **Claude Design** (claude.ai/design), Sync zum Code über `/design-sync` (bidirektional). **Kein Zeichenlimit** im Brief. Stellt vor dem Bau strukturierte Rückfragen (Checkliste unten), die ein guter Brief bereits vollständig vorwegnimmt.
- **Figma Make / Figma-MCP** (design-to-code + code-to-design). **Prompt-Limit 2000 Zeichen**, also verdichten (echte Umlaute sparen Zeichen).
- **Framer** oder ähnliche visuelle Tools.

**Ablauf (Gate, verankert im CONCEPT -> PLAN -> Code-Fluss, Standard 008/029):**
1. Kern-Screens als Design/Prototyp erzeugen.
2. Prüfen: Optik, Flow, selbsterklärend, mobil, Vertrauen (Standard 007 A-E).
3. Erst nach OK bauen.

**Brief-Checkliste (die Dimensionen, die Claude Design abfragt, im Brief immer vorwegnehmen):**
1. Deliverable: interaktiver Prototyp (Screens klickbar verbunden) / statische Hi-Fi-Screens / Varianten zum Vergleich.
2. Viewport-Priorität: mobil zuerst (unser Default) / mobil + Desktop / Desktop zuerst.
3. Interaktivitätsgrad: voll interaktiv / teilweise / rein visuell.
4. Von welchen Screens Varianten gewünscht sind.
5. Typografie-Richtung: neutral-präzise / geometrisch-technisch / humanistisch-freundlich / charaktervolle Grotesk.
6. Datenrealismus: echte Domänen-Namen + realistische Daten (Default, macht testbar) vs. generische Platzhalter. Echte Firmen-/Personendaten nie (DSGVO), öffentliche Namen wie Netzbetreiber sind ok.
7. Preisdarstellung: dezent; bei noch unvalidiertem Preis beide Modelle zeigen, nicht festnageln.
8. Domänen-/Regions-Referenz: Branche, Region, reale Bezugsgrößen für realistische Beispiele.
9. Look/Flow-Vorbild: den gewünschten Effekt NEUTRAL beschreiben, niemals eine fremde Marke nennen (Standard 020, "keine fremden Marken").

**Werkzeug-Details + Stack** (shadcn/Radix/Base UI, Motion, React Hook Form + Zod, Formular-Prinzipien, gsd-ui-* Skills, Playwright-Verifikation): Memory `reference_design_ux_toolchain`.

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

**Layout-Qualität (E):**
- Kein statischer Code-Scan ausreichend (Scrollbalken ist viewport- und runtimeabhängig). Manueller Review-Gate Pflicht: bei UI-Arbeit visuell auf üblichen Viewports prüfen, dass kein ungewollter Scrollcontainer entsteht.
- Heuristik-WARN (optional): lange einspaltige `.map()`-Listen in Übersichts-/Listen-Views ohne Grid-Wrapper als Verdichtungs-Kandidaten melden.
