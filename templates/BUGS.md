# BUGS: <projektname>

## Aktive Bugs

<!-- Neue Einträge hier einfügen. Format: BUG-NNN mit fortlaufender Nummer. -->
<!-- Eintrag anlegen sobald ein Ansatz fehlschlägt oder ein Bug > 1 Session braucht. -->
<!-- **Muster:** optional, Slug für cross-project Erkennung, z.B. `css-var-missing-fallback` -->

---

## Geschlossene Bugs

<!-- Fixe Bugs hierher verschieben. Fehlgeschlagene Ansätze stehen lassen, -->
<!-- sie verhindern dass dieselben Wege erneut probiert werden. -->

---

<!--
BEISPIEL-EINTRAG (löschen):

### BUG-001: Button klickt nicht in Safari
**Status:** investigating
**Erstellt:** 2026-01-15
**Muster:** `safari-pointer-events`
**Symptom:** "Jetzt buchen"-Button reagiert in Safari 17 nicht auf Klicks.
**Root Cause:** pointer-events: none auf Parent-Element durch falsches Tailwind-Conditional.
**Fehlgeschlagene Ansätze:**
- 2026-01-15, Ansatz: z-index erhöht → Warum gescheitert: Problem liegt nicht im Stacking
**Fix:**

---

### BUG-000: Hydration-Fehler bei Datumsanzeige (GESCHLOSSEN)
**Status:** fixed
**Erstellt:** 2026-01-10
**Geschlossen:** 2026-01-11
**Muster:** `ssr-date-hydration`
**Symptom:** React-Hydration-Warning für alle Datums-Komponenten.
**Root Cause:** new Date() auf Server und Client liefert unterschiedliche Timezones.
**Fehlgeschlagene Ansätze:**
- 2026-01-10, Ansatz: suppressHydrationWarning → Warum gescheitert: Warning bleibt, nur versteckt
**Fix:** Datum als ISO-String aus DB mitgeben, Formatierung nur client-seitig via useEffect.
-->
