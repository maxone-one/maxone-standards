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

## Erst-Event-Feier (Achievement-Celebration)

Erste-X-Aktionen werden mit einem kurzen visuellen Moment gefeiert. Detection ist server-seitig über UNIQUE-Constraint abgesichert, niemals über `localStorage`.

### UX-Tiers (pro Projekt konfigurierbar)

| Tier | Stil | Default-Projekte |
|---|---|---|
| **A — Vollfeier** | Konfetti + Toast | vanfree, snapflow, plansey, maxone.one |
| **B — Toast-only** | Toast ohne Konfetti | stadtlahnflow |
| **C — Stille Notification** | Server-seitig geloggt, kein UI-Event | voltfair, kitchen-station |

Tier ist pro Projekt einmal in `lib/pioneer/config.ts` festgelegt, NICHT pro Event — Konsistenz innerhalb eines Projekts hat Vorrang. Quellen-Vergleich der Ist-Implementierungen: `briefings/pioneer-achievement-convergence.md`.

**Drei aktuelle Realisierungen (Stand 2026-05-20, nicht normativ):**

| Projekt | UX-Stil | Tabelle | Datei |
|---|---|---|---|
| SLF | Konfetti + Toast (volle Feier) | `member_milestones` mit `seen_at` | [`FirstTimeConfetti.tsx`](../../stadt-lahn-flow/src/components/milestones/FirstTimeConfetti.tsx), [`milestones.ts`](../../stadt-lahn-flow/src/lib/milestones.ts) |
| vanfree | Grüner Checkmark (mittlere Feier) | — (Detection über `pioneer_scores` Count, race-anfällig) | [`pioneer/profile/page.tsx`](../../vanfree/app/[locale]/(shell)/pioneer/profile/page.tsx) |
| voltfair | Stilles Form-Feedback (keine Feier) | — (Detection über `pioneer_scores` Count, manuell) | [`pioneer-review.ts`](../../voltfair.de/app/actions/pioneer-review.ts) |

Die unten skizzierten Snippets sind ein **Vorschlag in Richtung 053**, nicht der
Ist-Zustand und nicht verbindlich.

### Event-Keys (Pioneer-System)

| Event-Key             | Trigger                                        | Pulse | Broadcast |
|-----------------------|------------------------------------------------|-------|-----------|
| `first_slot`          | `/pioneer/confirm` erfolgreich (Slot belegt)   | 1–50  | ja, bei Milestone-Slots |
| `first_feedback`      | erstes `feedback`-Puls-Event                   | 35    | nein      |
| `first_bug_report`    | erstes `bug_report`-Puls-Event                 | 15    | nein      |
| `first_feature`       | erstes `feature_implemented`-Puls-Event        | 30    | nein      |
| `first_referral`      | erste bestätigte Einladung (Inviter)           | 25    | nein      |

**Milestone-Broadcast** (öffentlich auf `/pioneers`-Wall): Slot-Eintritte bei
**#1, #10, #25, #50** zusätzlich als globales Event. Konfetti feuert bei allen
aktiven Besuchern der Leaderboard-Seite; permanenter Eintrag im Wall-Header
(„#10 erreicht — Early-Stufe voll"). Implementierung via Supabase Realtime auf
`pioneer_milestones`-Tabelle.

### Datenmodell

```sql
create table pioneer_milestones (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid references pioneer_subscribers(id) on delete cascade,
  key text not null,                  -- 'first_slot' | 'first_feedback' | ...
  seen_at timestamptz,                -- NULL = pending, sonst dismissed
  broadcast boolean not null default false,
  created_at timestamptz not null default now(),
  unique (subscriber_id, key)         -- ein Event pro Pioneer-Key
);
```

Der UNIQUE-Constraint ist die einzige Wahrheit. Doppel-Trigger lösen `23505`
aus, was als „schon gefeiert" interpretiert wird (kein Fehler, kein Replay).

### Server-Helper

```ts
// lib/pioneer/milestones.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export type PioneerEvent =
  | 'first_slot' | 'first_feedback' | 'first_bug_report'
  | 'first_feature' | 'first_referral'

export async function markPioneerMilestone(
  subscriberId: string,
  key: PioneerEvent,
  admin: SupabaseClient,
): Promise<boolean> {
  const { error } = await admin
    .from('pioneer_milestones')
    .insert({ subscriber_id: subscriberId, key })
  if (error?.code === '23505') return false // schon gefeiert
  if (error) { console.error('[pioneer] milestone:', error.message); return false }
  return true
}
```

Aufruf direkt nach dem Puls-Event innerhalb derselben Transaktion/RPC, damit
ein gescheiterter Puls-Insert kein „first" markiert.

### Client-Komponente

Eine `<PioneerConfettiQueue>` in `app/(pioneer)/layout.tsx` pollt
`/api/pioneer/milestones/pending`, feuert sequentiell und dismissed via
`POST { ids: [...] }` (setzt `seen_at`).

`fireConfetti()` folgt dem SLF-Pattern: 1500 ms zwei-seitiger Side-Burst +
zentraler Burst mit 80 Partikeln. **Pflicht:** `disableForReducedMotion: true`
in jedem `confetti()`-Call.

```ts
import confetti from 'canvas-confetti'

function fireConfetti() {
  const duration = 1500
  const end = Date.now() + duration
  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899']
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60,  spread: 70, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true })
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
  confetti({ particleCount: 80, spread: 100, origin: { x: 0.5, y: 0.5 }, colors, disableForReducedMotion: true })
}
```

### Toast-Copy (de.json)

```json
"milestones": {
  "first_slot":     { "title": "Slot #{slot} ist deiner!",        "body": "Willkommen im Pioneer-Kreis — du gehörst zu den ersten {n}." },
  "first_feedback": { "title": "Erstes Feedback!",                "body": "Danke — dein Eindruck formt das Produkt." },
  "first_bug_report":{ "title": "Erster Bug gemeldet!",            "body": "Jeder gefundene Bug spart anderen Nerven." },
  "first_feature":  { "title": "Dein Feature ist live!",          "body": "Du hast etwas vorgeschlagen, das jetzt im Produkt steht." },
  "first_referral": { "title": "Erste Einladung angekommen!",     "body": "Dein Pioneer-Kreis wächst — {name} ist dabei." },
  "milestoneSlot":  { "title": "#{slot} erreicht!",               "body": "{tier}-Stufe ist voll. Konfetti für alle." }
}
```

Toast-Wording folgt der maxone-Stimme: kurz, warm, ohne Marketing-Pathos.

### Milestone-Broadcast über Realtime

```ts
// nur auf /pioneers
const channel = supabase.channel('pioneer-milestones')
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'pioneer_milestones',
        filter: 'broadcast=eq.true' },
      (payload) => { fireConfetti(); showWallBanner(payload.new) })
  .subscribe()
```

Der Server setzt `broadcast=true` bei Slot-Insert auf #1/#10/#25/#50.

### Regeln

- **Server-only Detection.** Niemals `localStorage` als First-Time-Quelle —
  Geräte-Wechsel würde Replay erlauben.
- **Einmal pro Pioneer-Key.** UNIQUE-Constraint ist die Wahrheit; keine
  zusätzliche Prüfung in Application-Code, die divergieren kann.
- **`disableForReducedMotion`** ist Pflicht in jedem `confetti()`-Call —
  niemand soll Konfetti-Spam erleben, der das nicht will.
- **Kein Sound, kein Lottie.** SLF-Minimalismus ist absichtlich — kurzer
  visueller Moment, dann weiterarbeiten.
- **Queue, nicht parallel.** Wenn mehrere Milestones gleichzeitig pending sind
  (z.B. Slot-Eintritt + sofortiges Feedback), sequenziell feiern, nicht überlagern.

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

# 4. Konfetti respektiert reduced-motion in JEDEM Call
grep -rn "confetti({" app/ lib/ components/ \
  | grep -v "disableForReducedMotion"   # sollte leer sein

# 5. Keine localStorage-First-Time-Detection (muss server-seitig sein)
grep -rn "localStorage" app/ lib/ \
  | grep -iE "first|seen|milestone|celebrated"   # sollte leer sein

# 6. UNIQUE-Constraint auf pioneer_milestones vorhanden
psql -c "\d pioneer_milestones" | grep -i "subscriber_id, key"   # sollte UNIQUE zeigen
```

---

## Verwandte Standards

- **003** — Secrets-Store (Supabase-Zugangsdaten)
- **044** — SSoT & kein Hardcode (Konstanten aus server-sicheren Modulen)
- **040** — Deutsche Umlaute
