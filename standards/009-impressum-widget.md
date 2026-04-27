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

## Stand pro Projekt (2026-04-27)

| Projekt | Status | URL |
|---|---|---|
| snapflow.one | nutzt API | `panel.maxone.studio` ❌ (auf .one migrieren) |
| repivot.in | nutzt API | `panel.maxone.studio` ❌ |
| plansey-engaged | nutzt API | `panel.maxone.studio` ❌ |
| vanfree | nutzt API + 1h Cache | `panel.maxone.studio` ❌ |
| stadt-lahn-flow | lokale Daten ❌ | — (auf API umstellen) |
| maxone.one | unklar / lokal? | — |
| katchi | nicht gefunden | — |
| voltfair.de | nicht gefunden | — |
| SolarProof | nicht gefunden | — |
| plansey (alt) | PHP-Legacy | — |

## Audit

`scripts/audit.mjs` prüft pro Projekt:
- Existiert eine Impressum-Route? (`*/impressum*`, `*/imprint*`)
- Wenn ja: ruft sie `panel.maxone.one/functions/v1/impressum` auf?
- Falls noch `panel.maxone.studio`: WARN (Migrations-Pflicht)
- Falls hardcoded: FAIL
