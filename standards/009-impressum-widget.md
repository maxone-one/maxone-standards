# 009 — Impressum aus zentraler API

**Status:** active
**Seit:** etabliert vor 2026-04-27, formalisiert 2026-04-27
**Gilt für:** alle Projekte mit Impressum-Pflicht (D-Live-Sites)

## Regel

Das Impressum aller Projekte wird **nicht hardcoded** in jedem Projekt
gepflegt. Alle Projekte ziehen das Impressum zur Render-/Build-Zeit aus der
zentralen API:

```
https://panel.maxone.one/functions/v1/impressum
```

> **Achtung Migration:** Bestehende Projekte rufen aktuell
> `https://panel.maxone.studio/functions/v1/impressum` auf. Diese URL ist
> seit 2026-04-16 deprecated (Standard 008). Bei jedem Touch eines Projekts
> die URL auf `.maxone.one` umstellen.

## Warum

Stamm­daten, Geschäftsführer, Anschrift, USt-IdNr. ändern sich gelegentlich.
Wenn jedes der 11+ Projekte eine eigene hardcoded Kopie hat, führt eine
Aktualisierung zu Drift — manche Projekte bleiben auf altem Stand und sind
dann **rechtlich nicht korrekt**. Mit zentraler API: einmal in Supabase
ändern, alle Projekte ziehen frisch.

## Wie anwenden

**Empfohlenes Pattern** (Server-Rendering mit Cache, nicht jedes Request neu):

```ts
// Beispiel Next.js App Router
const IMPRESSUM_API = 'https://panel.maxone.one/functions/v1/impressum';

let cache = null;
let cacheUntil = 0;

async function getImpressum() {
  if (cache && Date.now() < cacheUntil) return cache;
  const res = await fetch(IMPRESSUM_API, { next: { revalidate: 3600 } });
  cache = await res.json();
  cacheUntil = Date.now() + 3600 * 1000;
  return cache;
}
```

**Niemals:**
- Impressum-Felder hardcoden (Geschäftsführer, Adresse, Steuer-IdNr., Email)
- API-Call ohne Cache (jedes Request schlägt auf Supabase auf)
- Auf `panel.maxone.studio` referenzieren — immer `.maxone.one` nutzen

**Fallback:** Wenn API nicht erreichbar ist: lokale Kopie des letzten erfolg­
reichen Responses zeigen + Fehler-Log. Niemals "Impressum nicht verfügbar"
zeigen — das ist rechtlich unsicher.

## Stand pro Projekt

Initial-Audit 2026-04-27: 4 Projekte nutzten API mit `.studio` (Standard 008
verletzt), 5 weitere hatten lokales/kein Impressum.

Nach Migration 2026-04-27:

| Projekt | Status | Quelle |
|---|---|---|
| snapflow.one | ✅ API `.one` | `src/pages/legal/Impressum.tsx` |
| repivot.in | ✅ API `.one` | `frontend/src/pages/landing/Impressum.tsx` |
| plansey-engaged | ✅ API `.one` | `src/pages/Impressum.tsx` |
| vanfree | ✅ API `.one` + 1h Cache | `app/impressum/page.tsx` + `app/datenschutz/page.tsx` |
| stadt-lahn-flow | ⚠ lokal in `lib/impressum-data.ts` | (bewusste Ausnahme — SLF infra-unabhängig) |
| katchi | ⚠ Brand-Link, kein API-Call | (auf API umstellen wenn nächster Touch) |
| voltfair.de | ⚠ lokal | (auf API umstellen) |
| plansey | ⚠ Brand-Link, kein API-Call | (auf API umstellen) |
| solarproof | – kein Impressum | (Brand-Site, evtl. nicht nötig) |
| maxone.one | – hostet API selbst | – |
| kitchen-station | – internes Tool | – |

## Audit

`scripts/audit.mjs` prüft pro Projekt:
- Existiert eine Impressum-Route? (`*/impressum*`, `*/imprint*`)
- Wenn ja: ruft sie `panel.maxone.one/functions/v1/impressum` auf?
- Falls noch `panel.maxone.studio`: WARN (Migrations-Pflicht)
- Falls hardcoded: FAIL
