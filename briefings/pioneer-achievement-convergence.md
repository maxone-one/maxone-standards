kt# Pioneer + Achievement-Celebration — Konvergenz-Analyse

**Status:** Draft, Vorarbeit für die Erweiterung von Standard 052
**Datum:** 2026-05-20
**Geltungsbereich (Ist):** SLF, vanfree, voltfair
**Ziel:** Soll-Modell festlegen, das alle drei Projekte teilen — und das später auf
weitere Projekte (snapflow, katchi, plansey, repivot, kitchen-station, maxone.one)
ausgerollt werden kann.

> Dieses Dokument ist die Soll/Ist-Tabelle plus die offenen Entscheidungen. Es ist
> **kein eigener Standard**. Sobald Max die offenen Punkte entschieden hat, werden
> die Ergebnisse als neue Abschnitte in **Standard 052 — Pioneer-System** ergänzt
> (Datenmodell, Achievement-Tabelle, UX-Tiers). Es gibt keinen separaten
> Celebration-Standard — Achievement-Celebration lebt im selben Standard wie das
> Pioneer-System (Entscheidung 2026-05-20).

---

## Tabelle 1 — Datenmodell-Divergenz

| Achse | SLF | vanfree | voltfair |
|---|---|---|---|
| Achievement-Tabelle | `member_milestones` (vorhanden, mit `seen_at`) | **fehlt** | **fehlt** |
| Score-Tabelle | n/a (Tropfen-System, nicht Pulse) | `pioneer_scores` | `pioneer_scores` |
| Identifier-Spalte | `member_id UUID` (FK auf `members`) | `pioneer_email TEXT` | `pioneer_id UUID` (FK auf `pioneer_signups`) |
| Source-Liste | n/a (5 First-Time-Aktionen statt Source) | `early_slot`, `profile_photo`, `feedback`, `bug_report`, `feature_implemented`, `referral` | `feedback`, `bug_report`, `referral`, `early_adopter`, `profile_photo`, `customer_referral` |
| Ranking-Tiebreaker | n/a | `confirmed_at ASC` | `created_at ASC` |
| Write-Authorization | `service_role` only | `service` (offen — Policy `WITH CHECK (true)`) | `admin`/`superadmin` aus `profiles` |
| Reference-Spalte | n/a | `ref_id TEXT` (frei) | `reference_id uuid` + `note text` + `created_by` |
| Public-Read | Eigene Zeile (über `members.user_id`) | `pioneer_scores_public_read` (alles) | `pioneer_scores_select_all` (alles) |
| First-Time-Detection | UNIQUE `(member_id, key)` in `member_milestones` | über `pioneer_scores` `source`-Vorkommen (count = 1) | über `pioneer_scores` `source`-Vorkommen + Note (manueller Check Z.53–58) |

---

## Tabelle 2 — UX-Divergenz

| Achse | SLF | vanfree | voltfair |
|---|---|---|---|
| Konfetti-Library | `canvas-confetti@1.9.4` | — | — |
| Trigger-Komponente | [`FirstTimeConfetti.tsx`](../../stadt-lahn-flow/src/components/milestones/FirstTimeConfetti.tsx) (Client, in Dashboard-Layout) | Inline-Success-State in [`pioneer/profile/page.tsx`](../../vanfree/app/[locale]/(shell)/pioneer/profile/page.tsx) | nichts (stilles Form-Feedback) |
| Visuelles Element | Konfetti + Toast mit Sparkles-Icon | Grüner `CheckCircle2`-Icon + Text | Success-Form-State, keine Animation |
| First-Time-Wording | [`milestones.ts:MILESTONE_COPY`](../../stadt-lahn-flow/src/lib/milestones.ts) — pro Aktion Title+Body | — | — |
| Reduced-Motion | `disableForReducedMotion: true` in jedem Burst | n/a | n/a |
| Server-Helper | [`markFirstTime()`](../../stadt-lahn-flow/src/lib/milestones.ts) mit 23505-Handling | n/a | implizit (UNIQUE auf `pioneer_scores`-Composite) |
| Sound / Lottie | nichts | nichts | nichts |

---

## Offene Entscheidungen (Max)

Diese Punkte müssen entschieden werden, bevor 052 geschrieben werden kann.

### E1 — Identifier-Typ in `pioneer_scores`
- **SLF:** `member_id UUID` (eigene `members`-Tabelle, kein Pioneer-System)
- **vanfree:** `pioneer_email TEXT`
- **voltfair:** `pioneer_id UUID` mit FK auf `pioneer_signups`

**Empfehlung:** `subscriber_id UUID` mit FK auf `pioneer_subscribers(id)`. UUID-FK ist
robuster gegen E-Mail-Wechsel und kaskadiert sauber. **vanfree muss migrieren** (Spalte
hinzufügen, befüllen via Join über email, dann email-Spalte droppen oder als
Sekundär-Schlüssel behalten).

**Frage Max:** OK so? Oder andere Präferenz?

---

### E2 — Kanonische Source-Liste

Vereinigte Liste aus vanfree + voltfair:

| Source-Key | Definition | vanfree | voltfair | Empfehlung 052 |
|---|---|---|---|---|
| `early_slot` | Slot-Eintritt 1-50 | ja | — | **drin** (vanfree-Master) |
| `early_adopter` | identisch zu `early_slot`? | — | ja | **rename auf `early_slot`** |
| `profile_photo` | Profilfoto verifiziert | ja | ja | **drin** |
| `feedback` | Feedback eingereicht | ja | ja | **drin** |
| `bug_report` | Bug gemeldet | ja | ja | **drin** |
| `feature_implemented` | Feature-Request umgesetzt | ja | — | **drin** |
| `referral` | erfolgreiche Pioneer-Einladung | ja | ja | **drin** |
| `customer_referral` | Kunde geworben (eigene Kategorie) | — | ja | **drin** (voltfair-eigen, aber zukunftsfähig) |

**Frage Max:** `early_adopter` → `early_slot` umbenennen? `customer_referral` als
Standard übernehmen oder nur in voltfair belassen?

---

### E3 — Punkte-Vergabe pro Source

| Source | vanfree | voltfair |
|---|---|---|
| `early_slot` | 1–50 (linear nach Slot, `51 - slot_number`) | unspezifiziert |
| `profile_photo` | 20 | unspezifiziert |
| `feedback` | 35 | 10 |
| `bug_report` | 15 | 15 |
| `feature_implemented` | 30 | — |
| `referral` | 25 | unspezifiziert |
| `customer_referral` | — | 10 |

**Frage Max:** Punkte zentral in 052 festschreiben oder pro Projekt frei?
Empfehlung: zentrale Defaults (vanfree-Werte), Projekt darf nach unten/oben
abweichen, aber muss begründen.

---

### E4 — Write-Authorization

- **SLF:** `service_role` only — sauber
- **vanfree:** `WITH CHECK (true)` — **Loch**, jeder authentifizierte User könnte
  schreiben falls die anon-Key-Pipeline Insert macht (in Praxis nicht, weil
  Server-Actions Admin-Client nutzen, aber RLS sollte das nicht erlauben)
- **voltfair:** explizite Admin-Profile-Check via `EXISTS`

**Empfehlung 052:** `service_role` only — Server-Actions/Edge-Functions schreiben
mit Admin-Client, Admin-Profile-Check wird auf Application-Layer gemacht (nicht
in RLS). Vereinfacht das Modell und passt zu Standard 003 (Secrets-Store).

**Frage Max:** OK so? voltfair müsste seine RLS-Policy lockern (auf
`service_role`-only), Admin-Check zieht in die Server-Action.

---

### E5 — First-Time-Detection: separate Tabelle oder über Score-Count?

- **SLF-Modell:** separate `member_milestones`-Tabelle mit UNIQUE `(member_id, key)`,
  Detection ist atomar (INSERT versucht, 23505 = schon gefeiert)
- **vanfree/voltfair-Modell:** keine separate Tabelle, First-Time = "count of
  `pioneer_scores` where source=X and pioneer=Y equals 1" — **race-anfällig**

**Empfehlung 052:** SLF-Modell auf Pioneer-Welt übertragen:
`pioneer_milestones (subscriber_id, key, achieved_at, seen_at)` mit UNIQUE.
Vorteile: atomarer Insert, `seen_at` für Toast-Queue, sauber von Score
entkoppelt (Score = Punkte-Konto, Milestone = First-Time-Marker, beide werden
in derselben Transaktion geschrieben).

**Frage Max:** OK so? Oder lieber Score-Count-basiert ohne neue Tabelle?

---

### E6 — UX-Pflicht-Level

- **SLF:** Konfetti + Toast (volle Feier)
- **vanfree:** Checkmark (mittlere Feier)
- **voltfair:** stilles Form-Feedback (keine Feier)

**Vorschlag 052 — drei Tiers, projekt-konfigurierbar:**
- **Tier A (Vollfeier):** Konfetti + Toast — Default für Consumer-Apps (vanfree,
  snapflow, maxone.one)
- **Tier B (Toast-only):** Toast ohne Konfetti — für ruhigere Tools (SLF könnte
  hier landen, weil "Tropfen-Tonalität")
- **Tier C (Stille Notification):** keine UI-Feier, aber Server-seitig Milestone
  geloggt — für B2B/Profi-Tools (voltfair, kitchen-station)

Tier ist pro Projekt einmal in einer `pioneer.config.ts` festgelegt, NICHT pro
Event. Konsistenz innerhalb eines Projekts ist wichtig.

**Frage Max:** Drei Tiers sinnvoll, oder lieber genau ein Pflicht-Stil für alle?
Aktuell tendiere ich zu drei Tiers — voltfair-Kundschaft will keine Konfetti.

---

### E7 — Public-Read auf Achievement-Daten

- **SLF:** nur eigene Zeile (über User-Match)
- **vanfree + voltfair:** vollständig öffentlich (für Leaderboard)

**Empfehlung 052:** Pioneer-Welt = öffentliches Leaderboard ist ein Kernfeature.
`pioneer_scores` public-read OK, `pioneer_milestones` aber **eigene Zeile only**
(Milestones sind privat — niemand muss wissen, ob Pioneer #17 sein erstes
Feedback abgegeben hat).

**Frage Max:** OK so?

---

### E8 — Milestone-Broadcast (neu von heute)

Max hat heute "Milestone-Broadcast (#1, #10, #25, #50)" bestätigt.
Implementierung über Supabase Realtime auf `pioneer_milestones` mit
`broadcast=true`-Filter.

Im aktuellen Bestand existiert das **nirgends** — also reine
Neu-Entwicklung. Sollte in 052 mit aufgenommen werden.

**Frage Max:** Broadcast nur für `first_slot`-Milestones bei #1/#10/#25/#50,
oder auch für andere Milestones global (z.B. "1000. Puls vergeben")?

---

## Nächste Schritte

1. **Max beantwortet E1–E8** (oder sagt: alle 8 Empfehlungen OK)
2. Ich erweitere **Standard 052** um die neuen Abschnitte: Datenmodell (`pioneer_scores`-Schema mit `subscriber_id`), Achievement-Tabelle (`pioneer_milestones`), UX-Tiers (A/B/C), Milestone-Broadcast. Der heute provisorisch hinzugefügte "Erst-Event-Feier"-Block wird durch den finalen Abschnitt ersetzt.
3. Migrations-Plan pro Projekt:
   - **SLF:** kein Pioneer-System, bleibt unverändert — aber `member_milestones`-Pattern wird in 052 als Vorbild zitiert
   - **vanfree:** Spalte `subscriber_id` ergänzen, `early_adopter`→`early_slot` n/a, neue Tabelle `pioneer_milestones`, RLS-Policy enger
   - **voltfair:** Rename `early_adopter`→`early_slot`, neue Tabelle `pioneer_milestones`, RLS-Policy auf `service_role`-only

---

## Quellen

- SLF: [`src/lib/milestones.ts`](../../stadt-lahn-flow/src/lib/milestones.ts), [`src/components/milestones/FirstTimeConfetti.tsx`](../../stadt-lahn-flow/src/components/milestones/FirstTimeConfetti.tsx), [`20260519_member_milestones.sql`](../../stadt-lahn-flow/supabase/migrations/20260519_member_milestones.sql)
- vanfree: [`023_pioneer_scores.sql`](../../vanfree/supabase/migrations/023_pioneer_scores.sql), [`app/pioneer/profile-actions.ts`](../../vanfree/app/pioneer/profile-actions.ts)
- voltfair: [`20260302150000_pioneer_gamification.sql`](../../voltfair.de/supabase/migrations/20260302150000_pioneer_gamification.sql), [`app/actions/pioneer-signup.ts`](../../voltfair.de/app/actions/pioneer-signup.ts), [`app/actions/pioneer-review.ts`](../../voltfair.de/app/actions/pioneer-review.ts)
- Standard 052: [`standards/052-pioneer-system.md`](../standards/052-pioneer-system.md)
