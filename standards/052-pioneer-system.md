# 052 — Pioneer-System

**Status:** active
**Seit:** 2026-05-19
**Gilt für:** vanfree (Referenz-Implementierung); übertragbar auf andere maxone-Projekte

## Konzept

Das Pioneer-System ist ein limitiertes Early-Adopter-Programm: eine feste Anzahl nummerierter
Slots, ein endlicher Puls-Pool und eine öffentliche Leaderboard-Wall. Es erzeugt Dringlichkeit
(feste Obergrenze) und Transparenz (öffentliche Profile).

> Kernprinzip: **Feste Menge, öffentliche Reihenfolge, permanenter Status.**

---

## Konstanten — immer aus einem server-sicheren Modul

```ts
// lib/pioneer/pool.ts  (kein 'use client'!)
export const PIONEER_POOL_TOTAL = 21_000   // maximale Pulse insgesamt
export const PIONEER_MAX_SLOTS  = 50       // maximale Slot-Anzahl
```

**Verboten:** Konstanten aus einem `'use client'`-File in einem Server Component importieren.
Das macht den Wert auf dem Server `undefined` → ICU-Interpolation schlägt fehl → Raw-Key wird
gerendert (z.B. `Pioneers.slotsUsed`).

```ts
// ❌ Server Component importiert aus 'use client' File
import { PIONEER_MAX_SLOTS } from '@/components/PioneerCounter'

// ✅ Server Component importiert aus plain TS-Modul
import { PIONEER_MAX_SLOTS } from '@/lib/pioneer/pool'
```

Client Components dürfen weiterhin aus `@/components/PioneerCounter` importieren.

---

## Datenmodell

| Tabelle / View             | Zweck                                                  |
|----------------------------|--------------------------------------------------------|
| `pioneer_subscribers`      | Anmeldungen (E-Mail, Slot-Nummer, Bestätigung)        |
| `pioneer_scores`           | Einzelne Puls-Events pro Pioneer und Quelle           |
| `pioneer_leaderboard`      | View: aggregiert Scores, berechnet Rang + `display_name` |

### Puls-Quellen und Punkte

| `source`              | Punkte    | Beschreibung                              |
|-----------------------|-----------|-------------------------------------------|
| `early_slot`          | 1 – 50    | Je früher der Slot, desto mehr             |
| `profile_photo`       | 20        | Profilfoto hochgeladen + verifiziert      |
| `feedback`            | 35        | Feedback eingereicht                      |
| `bug_report`          | 15        | Bug-Report eingereicht                    |
| `feature_implemented` | 30        | Feature-Request umgesetzt                 |
| `referral`            | 25        | Erfolgreiche Einladung                    |

---

## Pioneer-Stufen (Tiers)

Stufen basieren auf dem **Eintrittsdatum (`confirmed_at`)** — niemals auf der Slot-Nummer, niemals auf Pulse. Stufen sind permanent.

> **Regel:** `getTier(slot)` ist verboten. `pioneer_tier` wird im Leaderboard-View aus der
> `confirmed_at`-Reihenfolge berechnet und vom Frontend direkt gelesen.
>
> **Trennung:** `users.tier` ist das **Zugangs-Tier** (Subscription-Level: `'founding' | 'lifetime' | ...`).
> Alle Pioneers bekommen `users.tier = 'founding'` (höchster Zugang). Das Pioneer-Badge-Tier
> (`pioneer_tier`) ist davon völlig unabhängig und liegt ausschließlich im Leaderboard-View.

| Stufe      | Eintrittposition  | Farbe / Border-Klasse                     |
|------------|-------------------|-------------------------------------------|
| Founding   | 1 – 10 bestätigt  | `text-primary / border-primary/30`        |
| Early      | 11 – 25 bestätigt | `text-foreground / border-border`         |
| Pioneer    | 26 – 50 bestätigt | `text-muted-foreground / border-border`   |

**Ranking** (Leaderboard-Position #1, #2, …) wird **ausschließlich nach Pulse** bewertet:
```sql
RANK() OVER (ORDER BY total_pulse DESC, confirmed_at ASC)
```
Tier und Ranking sind unabhängig voneinander.

---

## Routen

| Route                  | Sichtbarkeit | Beschreibung                              |
|------------------------|--------------|-------------------------------------------|
| `/pioneer`             | öffentlich   | Signup-Seite, Slot-Counter, Vision        |
| `/pioneer/confirm`     | token-gated  | E-Mail-Bestätigung via Token              |
| `/pioneer/profile`     | token-gated  | Profil-Bearbeitung nach Bestätigung       |
| `/pioneers`            | öffentlich   | Leaderboard-Wall (Podest + Tabelle)       |
| `/pioneers/[slot]`     | öffentlich   | Individuelles Pioneer-Profil              |

---

## Sitemap

Pioneer-Profile (`/pioneers/[slot]`) werden dynamisch aus der DB in die Sitemap aufgenommen:

```ts
// app/sitemap.ts
const { data } = await service
    .from('pioneer_subscribers')
    .select('slot_number, confirmed_at')
    .eq('confirmed', true)
    .not('slot_number', 'is', null)
    .order('slot_number', { ascending: true })
```

Priorität: `0.5`, `changeFrequency: 'weekly'`.

---

## Deutsch: Puls (Singular) / Pulse (Plural)

| Kontext                            | Korrekt              | Falsch         |
|------------------------------------|----------------------|----------------|
| Einzelner Punkt                    | „1 Puls"             | „1 Pulse"      |
| Mehrere Punkte                     | „50 Pulse"           | „50 Puls"      |
| Komposita (Wortstamm = Singular)   | „Puls-Pool"          | „Pulse-Pool"   |
| Komposita                          | „Puls-Stand"         | „Pulse-Stand"  |
| Komposita                          | „Puls-Aktivität"     | „Pulse-Aktivität" |
| Singular mit Artikel               | „Jeder Puls ist…"    | „Jeder Pulse…" |

### ICU-Plural-Pattern für next-intl (de.json)

Für dynamische Mengen, die 1 sein können:

```json
"someKey": "{n, plural, one {# Puls} other {# Pulse}}"
```

Beispiele:
```json
"totalPulse":   "{total, plural, one {# Puls vergeben} other {# Pulse vergeben}}",
"profileMetaDesc": "{name} ist Pioneer #{slot} bei venfree.de — {pulse, plural, one {# Puls} other {# Pulse}}.",
"successMsg":   "+{points, plural, one {# Puls} other {# Pulse}} an {label} vergeben"
```

Hardcoded Beträge ≥ 2 (z.B. `+5 Pulse`, `+15 Pulse`) benötigen kein ICU-Plural.

---

## Avatar-Größen in der Leaderboard-Tabelle

Avatar-Container in Tabellenzeilen nutzen `self-stretch` + `fill`-Modus damit
das Bild die volle Zeilenhöhe ohne Leerraum ausfüllt:

```tsx
// 'xl'-Größe: stretcht auf Zeilenhöhe, rounded-xl statt rounded-full
<div className="w-14 self-stretch relative rounded-xl overflow-hidden border border-border shrink-0 min-h-14">
    <Image src={url} alt={name} fill className="object-cover" unoptimized />
</div>
```

Der umschließende `<Link>` braucht `items-stretch` statt `items-start`.

---

## Audit-Checks

```bash
# 0. Kein getTier(slot)-Pattern — Tier immer aus DB lesen
grep -rn "getTier(" app/   # sollte leer sein

# 1. Keine 'use client' Import für Pioneer-Konstanten in Server Components
grep -rn "PIONEER_MAX_SLOTS\|PIONEER_POOL_TOTAL" app/ \
  | grep -v "use client\|PioneerCounter\|node_modules" \
  | grep "PioneerCounter"   # sollte leer sein für Server Components

# 2. Keine compound "Pulse-" in de.json (außer in Strings, die bewusst als Brand verwendet werden)
grep "Pulse-" messages/de.json   # sollte leer sein

# 3. Keine hardcoded >Pulse< (Einheits-Label) in JSX — t('tablePulse') verwenden
grep ">Pulse<" app/   # sollte leer sein
```

---

## Verwandte Standards

- **003** — Secrets-Store (Supabase-Zugangsdaten)
- **044** — SSoT & kein Hardcode (Konstanten aus server-sicheren Modulen)
- **040** — Deutsche Umlaute
