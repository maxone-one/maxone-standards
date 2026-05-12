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

## Pflicht-Bestandteile jeder Impressum-Seite

Zusätzlich zu den dynamischen API-Feldern (Name, Adresse, Steuerdaten) MUSS
jede Impressum-Seite einen **statischen EU-Streitschlichtungs-Block** enthalten.
Die API liefert diesen Text bewusst nicht als Feld — er ist rechtlich statisch
und gehört in das Template:

```
EU-Streitschlichtung

Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung
(OS) bereit: https://ec.europa.eu/consumers/odr/

Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor
einer Verbraucherschlichtungsstelle teilzunehmen.
```

**Rechtsgrundlage:** Art. 14 ODR-Verordnung (EU) 524/2013 — gilt für alle
Online-Dienste, die Verbrauchern gegenüber tätig sind.

Beide Sätze sind **Pflicht**:
1. Der Link zur OS-Plattform (`https://ec.europa.eu/consumers/odr/`)
2. Die Erklärung zur Nicht-Teilnahme

## Pflicht-Felder im Template (§ 5 TMG, rechtsformabhängig)

Die API liefert alle Daten — das Template **muss** sie auch rendern. Der Audit
erkennt die Rechtsform automatisch aus der Live-API-Response und prüft die
entsprechenden Felder.

### Alle Rechtsformen (Einzelunternehmen, GmbH, UG, AG, …)

| API-Feld | Rechtsgrundlage | Pflicht |
|---|---|---|
| `legal_name` | §5 Abs. 1 Nr. 1 TMG — Name | immer |
| `street` | §5 Abs. 1 Nr. 1 TMG — Anschrift | immer |
| `zip` + `city` | §5 Abs. 1 Nr. 1 TMG — Anschrift | immer |
| `email` **oder** `phone` | §5 Abs. 1 Nr. 2 TMG — schnelle Kommunikation | mind. eines |
| `vat_id` | §5 Abs. 1 Nr. 6 TMG — USt-IdNr. | wenn in API vorhanden |
| `tax_id` | §5 Abs. 1 Nr. 6 TMG — Steuernummer | wenn `vat_id` fehlt und in API vorhanden |

### Zusätzlich für Kapitalgesellschaften (GmbH, UG, AG)

Erkennung: API-Response enthält `register_court` **und** `register_number`.

| API-Feld | Rechtsgrundlage | Pflicht |
|---|---|---|
| `register_court` + `register_number` | §5 Abs. 1 Nr. 4 TMG — Handelsregister | immer |

**Aktueller Stand (2026-05-12):** Einzelunternehmen — nur die universellen Felder werden geprüft.

## Warum zentrale API

Stamm­daten, Geschäftsführer, Anschrift, USt-IdNr. ändern sich gelegentlich.
Wenn jedes der 11+ Projekte eine eigene hardcoded Kopie hat, führt eine
Aktualisierung zu Drift — manche Projekte bleiben auf altem Stand und sind
dann **rechtlich nicht korrekt**. Mit zentraler API: einmal in Supabase
ändern, alle Projekte ziehen frisch.

Der EU-Streitschlichtungs-Block ist NICHT Teil der API, da er pro Betreiber
identisch und zeitlos ist.

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

Template-Pflichtblock (statisch, nach den dynamischen Feldern):

```tsx
<section>
  <h2>EU-Streitschlichtung</h2>
  <p>
    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung
    (OS) bereit:{' '}
    <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
      https://ec.europa.eu/consumers/odr/
    </a>
  </p>
  <p>
    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor
    einer Verbraucherschlichtungsstelle teilzunehmen.
  </p>
</section>
```

**Niemals:**
- Impressum-Felder hardcoden (Geschäftsführer, Adresse, Steuer-IdNr., Email)
- API-Call ohne Cache (jedes Request schlägt auf Supabase auf)
- Auf `panel.maxone.studio` referenzieren — immer `.maxone.one` nutzen
- Den EU-Streitschlichtungs-Block weglassen

**Fallback:** Wenn API nicht erreichbar ist: lokale Kopie des letzten erfolg­
reichen Responses zeigen + Fehler-Log. Niemals "Impressum nicht verfügbar"
zeigen — das ist rechtlich unsicher.

## Stand pro Projekt (Stand 2026-05-12)

| Projekt | Impressum | API-Call | OS-Link | Quelle |
|---|---|---|---|---|
| snapflow.one | ✅ | ✅ `.one` | ✅ | `src/pages/legal/Impressum.tsx` |
| repivot.in | ✅ | ✅ `.one` | ✅ | `frontend/src/pages/landing/Impressum.tsx` |
| vanfree | ✅ | ✅ `.one` | ✅ | `app/[locale]/impressum/page.tsx` |
| stadtlahnflow | ✅ | lokal (`impressum_local_intentional`) | ✅ | `src/app/impressum/page.tsx` (SLF infra-unabhängig) |
| stadtpunkt | ✅ | ✅ `.one` | ✅ | `src/routes/impressum/+page.svelte` |
| plansey-2026 | ✅ | ✅ `.one` | ✅ | `app/[locale]/imprint/page.tsx` |
| zentinel | ✅ | ✅ `.one` | ✅ | `src/routes/impressum/+page.svelte` |
| maxone.one | ✅ | ✅ `.one` | ✅ | `apps/umbrella/src/routes/(marketing)/impressum/+page.server.ts` |
| voltfair.de | ✅ | lokal (eigene Seiten) | ✅ | `app/(public)/impressum/page.tsx` |
| katchi | – | – | – | Projekt paused |
| kitchen-station | – | – | – | Internes Tool |
| solarproof | – | – | – | Static Site, kein Impressum |
| vector | – | – | – | Infra-Projekt |

## Audit

`scripts/audit.mjs` prüft pro Projekt:

1. **API-Call vorhanden?** — sucht `panel.maxone.one/functions/v1/impressum`
   - Gefunden → PASS
   - `panel.maxone.studio` → WARN (Migration fällig)
   - `impressum_local_intentional: true` in Registry → PASS (bewusste lokale Ausnahme)

2. **EU-Streitschlichtungs-Link vorhanden?** — sucht `ec.europa.eu/consumers/odr`
   in allen Impressum-bezogenen Dateien des Projekts
   - Fehlt in einem Projekt mit Impressum-Route → WARN

Formale Ausnahmen (`registry/exceptions.yml`) für Projekte mit bewusst lokalen
Impressum-Seiten (maxone.one, voltfair, plansey, zentinel) sind korrekt, solange
die Seiten den OS-Link enthalten.
