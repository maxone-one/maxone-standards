# 011 — Vector-Chat-Widget in jedem Projekt

**Status:** active
**Seit:** etabliert vor 2026-04-27, formalisiert 2026-04-27, One-Liner-Pattern eingefuehrt 2026-05-20
**Gilt fuer:** alle Projekte mit Customer-facing UI

## Regel

Jedes Customer-facing Projekt bindet das Vector-Chat-Widget ueber den
**zentralen Auto-Loader** ein. Der Loader ist eine Single Source of Truth auf
`agent.maxone.one` — er injiziert Preconnect, Preload, das Widget-Script
**und** den `<vector-chat>`-Tag. Projekte schreiben **eine Zeile**, mehr
nicht.

```html
<script src="https://agent.maxone.one/widget/embed.js" async></script>
```

Diese Zeile gehoert ans Ende von `<body>` (oder in den `<head>` mit `async`).
Nichts weiter ist noetig. Der Loader kuemmert sich um:

1. `<link rel="preconnect">` (Verbindung warmlaufen lassen)
2. `<link rel="preload">` (vector-chat.js high-priority laden)
3. `<script>` vector-chat.js (definiert das Custom Element)
4. `<vector-chat>`-Tag ins DOM (mit Default-Hide-Liste fuer Legal-Routen)

**Default-Hide-Liste** (eingebaut, kein Setup noetig):
`/impressum, /datenschutz, /agb, /widerruf, /privacy, /imprint, /terms`

## Warum

Vector ist auf allen Max-Projekten **derselbe Vector** — gleiches Gedaechtnis,
gleiche Tools, gleiche Faehigkeiten (siehe `/opt/vector/IDENTITY.md`). Nur
Ortskontext (Greeting, Farbe, Hostname-Detection) aendert sich pro Projekt.

Vor 2026-05-20: Embed-Pattern war drei Zeilen (preconnect + preload + script)
plus separater `<vector-chat>`-Tag. Vier Stellen, die korrekt sein muessen —
und wenn der Tag vergessen wird, **stiller Fehlschlag**: das Script registriert
das Custom Element, mountet sich aber nicht selbst. Karastelev.de lief am
2026-05-20 in genau diesen Fehler. Der Auto-Loader macht den Fehler unmoeglich.

## Wie anwenden

### Empfohlen (One-Liner)

```html
<body>
  ...
  <script src="https://agent.maxone.one/widget/embed.js" async></script>
</body>
```

### Override via `data-*`-Attribute

```html
<!-- Hide-Liste ersetzen (NICHT additiv) -->
<script src="https://agent.maxone.one/widget/embed.js" async
        data-hide-on="/admin,/portal,/onboarding"></script>

<!-- Hide-Liste ergaenzen (Default + extra) -->
<script src="https://agent.maxone.one/widget/embed.js" async
        data-hide-on-extra="/admin,/portal"></script>

<!-- Site-Persona manuell binden (sonst hostname-Auto-Detection) -->
<script src="https://agent.maxone.one/widget/embed.js" async
        data-instance="maxone"></script>

<!-- Default-Hide-Liste deaktivieren (z.B. fuer single-route Pages) -->
<script src="https://agent.maxone.one/widget/embed.js" async
        data-no-default-hide></script>
```

### Fallback (manuelles Pattern, nur wenn embed.js nicht passt)

Wenn der Auto-Loader aus irgendeinem Grund nicht passt (Component-Frameworks
mit eigenem Head-Management, CSP-Restriktionen), darf manuell eingebunden
werden — aber dann **alle vier Elemente komplett**:

```html
<head>
  <link rel="preconnect" href="https://agent.maxone.one" crossorigin>
  <link rel="preload" as="script" href="https://agent.maxone.one/widget/vector-chat.js" fetchpriority="high">
</head>
<body>
  ...
  <vector-chat hide-on="/impressum,/datenschutz"></vector-chat>
  <script src="https://agent.maxone.one/widget/vector-chat.js" async></script>
</body>
```

### Niemals

- Eigene React/Svelte-Portierung des Widgets (wie frueher `VectorChat.legacy.tsx`)
- Per `<iframe>` einbinden (Web-Component nutzen)
- Alte URL referenzieren (`agent.maxone.studio` ist tot)
- Nur das Widget-Script ohne `<vector-chat>`-Tag (stiller Fehlschlag —
  siehe `vector/knowledge/briefs/BRIEF-VECTOR-WIDGET-EMBED.md`)
- Vector mit Restriction-Attributen einschraenken (`disabled`, `restricted`,
  hypothetisches `mode=lite` etc.) — Vector ist ueberall derselbe Vector

## Stand pro Projekt

Stand 2026-05-20 (One-Liner-Roll-out beginnt):

| Projekt | Status | Pattern |
|---|---|---|
| maxone.one | ✅ | 3-Zeilen (alt) — migrieren |
| voltfair.de | ✅ | 3-Zeilen + User-Context — migrieren |
| stadt-lahn-flow | ✅ | 3-Zeilen mit hide-on — migrieren |
| snapflow.one | ✅ | 3-Zeilen — migrieren |
| katchi | ✅ | 3-Zeilen — migrieren |
| repivot.in | ✅ | 3-Zeilen — migrieren |
| vanfree | ✅ | JS-injected | App-Code |
| plansey | ✅ | 3-Zeilen — migrieren |
| solarproof | ✅ | 3-Zeilen — migrieren |
| kitten.karastelev.de | ✅ | 3-Zeilen + `instance="maxone"` — migrieren |
| karastelev.de | ✅ | 3-Zeilen (gefixt 2026-05-20) — migrieren |
| schreibstudio | ✅ | Svelte-Component — migrieren |
| vector | – | hostet Widget selbst |
| kitchen-station | – | internes Tool, kein Customer-facing |

Migration ist inkrementell: bei naechstem Diff-Touch pro Projekt auf
One-Liner umstellen. Alte 3-Zeilen-Pattern bleiben funktional — sie sind
nicht falsch, nur ausfuehrlich.

## Audit

`scripts/audit-vector-embed.mjs` probt alle konfigurierten Live-URLs:

1. HTTP GET, Status 200?
2. HTML enthaelt entweder:
   - `agent.maxone.one/widget/embed.js` (One-Liner ✅) ODER
   - `agent.maxone.one/widget/vector-chat.js` + `<vector-chat>`-Tag (3-Zeilen ✅)
3. Wenn nur `vector-chat.js` ohne Tag: **FAIL** (stiller Fehlschlag)
4. Wenn `agent.maxone.studio`: **WARN** (tote URL)
5. Wenn weder noch: **FAIL** (kein Widget)

Output: Tabelle pro URL mit ✅/⚠️/❌ und Diagnose-Hinweis.

## Robustheit & Failure-Modes

Der One-Liner ist Single-Point-of-Failure: alles haengt an `agent.maxone.one`.
Das ist Absicht — Vector ist die zentrale Identitaet, kein "nice to have".

**Failure-Mode 1: `agent.maxone.one` down.** Kein Widget. Akzeptiert — bei
echtem Vector-Down haben wir groessere Probleme als das Widget.

> **Wachschicht:** maxone-watchdog probt aktuell `agent.maxone.one/health`
> + `/api/version`. **TODO (offen 2026-05-20):** zwei zusaetzliche Probes
> in Uptime-Kuma (`watchdog.maxone.one/dashboard`) anlegen:
> - `https://agent.maxone.one/widget/embed.js` — HTTP 200, alle 60s
> - `https://agent.maxone.one/widget/vector-chat.js` — HTTP 200, alle 60s
>
> Das deckt Failure-Mode 1 (Bundle nicht erreichbar) zusaetzlich zum
> Service-Health-Check ab. Push-Alert bei Down. Kein HTML-Fallback.

**Failure-Mode 2: Compliance-CSP.** Strikte `script-src`-Direktive ohne
`agent.maxone.one` blockt embed.js. Aktuell trifft uns das nirgends.

> **Reagieren wenn auftritt:** Projekte mit strikter CSP brauchen
> `script-src 'self' agent.maxone.one;` oder eigenes Hosting des
> Widget-Bundles. Wird hier vermerkt sobald ein Projekt CSP einfuehrt:
> _(noch keine Eintraege)_

**Adblocker:** kein Vermerk — Nutzer mit Adblockern sind nicht Zielgruppe
fuer Vector-Chat.

## Quellen

- Bundle: `/opt/vector/public/widget/` (bind-mounted in `vector-green`/`vector-blue`)
- Brief: `vector/knowledge/briefs/BRIEF-VECTOR-WIDGET-EMBED.md`
- Identitaet: `/opt/vector/IDENTITY.md`
- Standard verwandt: 009-impressum-widget, 010-credits-api
