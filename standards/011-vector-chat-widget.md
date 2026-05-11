# 011 — Vector-Chat-Widget in jedem Projekt

**Status:** active
**Seit:** etabliert vor 2026-04-27, formalisiert 2026-04-27
**Gilt für:** alle Projekte mit Customer-facing UI

## Regel

Jedes Customer-facing Projekt bindet das Vector-Chat-Widget ein. Das Widget
ist eine Web-Component, die zentral auf `agent.maxone.one` gehostet ist und
projekt-spezifisch Auto-Detection per Hostname macht.

```
https://agent.maxone.one/widget/vector-chat.js
```

## Warum

Vector ist auf allen Max-Projekten **derselbe Vector** — gleiches Gedächtnis,
gleiche Tools, gleiche Fähigkeiten (siehe IDENTITY.md auf maxone-prod). Nur
Ortskontext (Greeting, Farbe, Hostname-Detection) ändert sich pro Projekt.
Der Chat ist primärer Support-Kanal über alle Projekte hinweg — wenn er auf
manchen Sites fehlt, gibt's dort keinen Self-Service.

## Wie anwenden

**Empfohlenes Pattern** (im `<head>` mit Preconnect + async):

```html
<head>
  <link rel="preconnect" href="https://agent.maxone.one" crossorigin>
  <link rel="preload" as="script" href="https://agent.maxone.one/widget/vector-chat.js" crossorigin>
  <script src="https://agent.maxone.one/widget/vector-chat.js" async crossorigin></script>
</head>
<body>
  <vector-chat
    hide-on="/impressum,/datenschutz,/admin,/portal"
    user-name="<eingeloggter User, falls vorhanden>"
    user-email="<eingeloggter User, falls vorhanden>">
  </vector-chat>
</body>
```

**Niemals:**
- Eine eigene React/Svelte-Portierung schreiben (wie früher `VectorChat.legacy.tsx`)
- Das Widget per `<iframe>` einbinden (Web-Component nutzen)
- Auf einer alten URL referenzieren (`agent.maxone.studio` ist tot)

**`hide-on`** Pflicht setzen für: Admin-Routes, Onboarding-Wizards, Print-
Views, Impressum/Datenschutz (rechtliche Pages dürfen kein Chat zeigen, das
verändert die Seite).

**User-Context** durchreichen wo eingeloggte User existieren — das gibt Vector
im Chat sofort den Kontext "wer fragt".

## Stand pro Projekt

Stand 2026-04-27 (initial-audit): 7/9 Projekte hatten kein Widget — entgegen
ursprünglicher Annahme. Recherche-Bericht hatte halluziniert.

Stand 2026-04-27 (nach Roll-out): alle 9 Customer-facing Projekte ✅

| Projekt | Status |
|---|---|
| maxone.one | ✅ (hostet Widget mit) |
| voltfair.de | ✅ + User-Context |
| stadt-lahn-flow | ✅ (in `src/app/layout.tsx`) |
| snapflow.one | ✅ (in `index.html`) |
| katchi | ✅ (in `index.html`) |
| repivot.in | ✅ (in `frontend/index.html`) |
| vanfree | ✅ (in `app/layout.tsx`) |
| plansey | ✅ (in `plansey-2026/app/[locale]/layout.tsx`) |
| solarproof | ✅ (in `index.html`) |
| vector | – (hostet Widget selbst) |
| kitchen-station | – (internes Tool, kein Customer-facing) |

## Audit

`scripts/audit.mjs` prüft pro Projekt:
- Grep im Repo nach `agent.maxone.one/widget/vector-chat.js`
- Falls nicht gefunden: FAIL
- Falls auf alter URL (`agent.maxone.studio`): WARN
- Falls eigene React/Svelte-Variante: WARN (auf Web-Component umstellen)
