# 010 — Credits aus zentraler API

**Status:** active
**Seit:** etabliert vor 2026-04-27, formalisiert 2026-04-27
**Gilt für:** alle Projekte mit Customer-facing UI

## Regel

Jedes Projekt hat eine `/credits`-Route, die ihre Credits aus der zentralen
API bezieht:

```
https://maxone.one/api/credits/<slug>
```

Der Slug ist der Projekt-Name aus `registry/projects.yml` (z.B. `snapflow`,
`vanfree`, `katchi`).

## Warum

Pro-Projekt-Credits (Tech-Stack, Studio-Info, "Built by maxone studio") plus
Shared-Global (Studio-Werte) liegen in einer einzigen Supabase-Tabelle
(`credits` + `credits_global`) auf maxone.one. Pflege erfolgt zentral im
Admin-Interface (`maxone.one/admin/credits`), Projekte konsumieren nur. Das
verhindert Drift wie bei den Impressum-Daten.

## Wie anwenden

```ts
const CREDITS_API = `https://maxone.one/api/credits/${PROJECT_SLUG}`;

// SSR-fetch mit revalidate, plus Fallback auf lokales Backup
async function getCredits() {
  try {
    const res = await fetch(CREDITS_API, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('credits api down');
    return await res.json();
  } catch {
    return CREDITS_FALLBACK; // letzte erfolgreiche Antwort als JSON-Datei
  }
}
```

**Pflicht-Inhalt der `/credits`-Seite:**
- Studio-Info ("maxone studio") + CTA zu maxone.one
- Tech-Stack des Projekts (kommt aus API)
- Werte / Über uns (kommt aus `credits_global`)
- Link zurück zu Impressum/Datenschutz

## Stand pro Projekt (2026-04-27)

| Projekt | Status |
|---|---|
| snapflow.one | nutzt API ✅ |
| katchi | nutzt API ✅ |
| plansey-engaged | nutzt API ✅ |
| repivot.in | nutzt API ✅ |
| vanfree | nutzt API + Fallback ✅ |
| stadt-lahn-flow | nutzt API ✅ |
| viktoria-from-fotografie | nutzt API (Astro) ✅ |
| SolarProof | lokale `CreditsOverlay.tsx` ❌ |
| plansey (alt) | Legacy ❌ |
| maxone.one | hostet API + Admin, keine eigene `/credits` (ok für Brand-Site) |

## Audit

`scripts/audit.mjs` prüft pro Projekt:
- Existiert eine `/credits`-Route?
- Ruft sie `maxone.one/api/credits/<slug>` auf?
- Falls hardcoded: WARN (sollte API werden)
- Brand-Site `maxone.one`: SKIP
