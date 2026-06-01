# Vector-Chat-Widget: Einbindung

Snippet pro Framework. Ziel: in 1 Minute pro Projekt eingebunden.

Quelle: `https://agent.maxone.one/widget/vector-chat.js` (Web-Component).
Standard: [011-vector-chat-widget.md](../../standards/011-vector-chat-widget.md).

## Pflicht

Das Widget gehört in den `<head>` mit `preconnect` + `preload` + `async`,
damit es die LCP nicht blockiert. Der `<vector-chat>`-Tag selbst gehört
ans Ende des `<body>` (oder ins Layout-Root).

## Konfiguration

```html
<vector-chat
  hide-on="/impressum,/datenschutz,/admin"
  user-name="<optional, falls eingeloggt>"
  user-email="<optional, falls eingeloggt>">
</vector-chat>
```

`hide-on` ist Komma-getrennte Liste von Pfad-Präfixen. Pflicht für jedes
Projekt: `/impressum`, `/datenschutz`. Plus alles, wo der Chat optisch
stört (Wizards, Print, Admin).

## Dateien hier

- `index.html.snippet`, für statische HTML-Seiten und Astro/SvelteKit `app.html`
- `next-layout.tsx.snippet`, Next.js App Router (`app/layout.tsx`)
- `svelte-app.html.snippet`, SvelteKit (`src/app.html`)
- `vue-index.html.snippet`, Vue/Vite

Kein Auto-Tooling, kopieren, anpassen, fertig.
