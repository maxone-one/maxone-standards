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

## Rechtliche Grundlagen (Stand 2026-05-16)

### Gesetzliche Basis — DDG ersetzt TMG (seit 14.05.2024)

Das **Digitale-Dienste-Gesetz (DDG)** ist am 14. Mai 2024 in Kraft getreten
und hat das Telemediengesetz (TMG) vollständig abgelöst. Die
Impressumspflicht ist nun in **§ 5 DDG** geregelt (inhaltlich identisch
mit §5 TMG — nur die Rechtsgrundlage ändert sich).

**Folge für Impressum-Texte:** "Angaben gemäß §5 TMG" ist veraltet.
Empfehlung: Gesetzesverweis weglassen (nicht verpflichtend) oder auf
§5 DDG aktualisieren. Niemals §5 TMG neu einbauen.

### Wer ist betroffen

Jeder, der geschäftsmäßig einen digitalen Dienst (Website, App, Online-Shop)
betreibt und dabei — auch nur gelegentlich — wirtschaftliche Ziele verfolgt.
Privat-Seiten ohne jeglichen kommerziellen Zweck sind ausgenommen. Alle
maxone-Projekte fallen unter die Pflicht.

### Erreichbarkeit des Impressums

Das Impressum muss **leicht erkennbar, unmittelbar erreichbar und ständig
verfügbar** sein (§ 5 DDG). In der Praxis:
- Direkt aus der Navigation erreichbar (max. 2 Klicks von jeder Seite)
- Linktext eindeutig: "Impressum" oder "Kontakt/Impressum"
- Kein versteckter Footer-Link in grauem Text auf grauem Grund
- Kein PDF — HTML ist Pflicht (muss crawlbar und direkt verlinkbar sein)

## Pflicht-Felder (§ 5 DDG, rechtsformabhängig)

Die API liefert alle Daten — das Template **muss** sie rendern. Der Audit
erkennt die Rechtsform aus der Live-API-Response und prüft entsprechend.

### Alle Rechtsformen (Einzelunternehmen, GmbH, UG, AG, …)

| API-Feld | Rechtsgrundlage | Wann Pflicht |
|---|---|---|
| `legal_name` | §5 Abs. 1 Nr. 1 DDG — vollständiger Name | immer |
| `street`, `zip`, `city` | §5 Abs. 1 Nr. 1 DDG — ladungsfähige Anschrift | immer |
| `email` | §5 Abs. 1 Nr. 2 DDG — schnelle elektronische Kommunikation | immer |
| `phone` **oder** zweiter Kanal | §5 Abs. 1 Nr. 2 DDG | wenn kein Kontaktformular |
| `vat_id` | §5 Abs. 1 Nr. 6 DDG — USt-IdNr. | wenn in API vorhanden |
| `w_id_nr` | §5 Abs. 1 Nr. 6 DDG — Wirtschafts-Identifikationsnummer | wenn `vat_id` fehlt und `w_id_nr` in API vorhanden |
| `tax_id` | §5 Abs. 1 Nr. 6 DDG — Steuernummer | wenn weder `vat_id` noch `w_id_nr` vorhanden |

**Hinweis Telefonnummer:** EuGH (C-649/17) und BGH haben bestätigt, dass
eine Telefonnummer nicht zwingend erforderlich ist, wenn ein zweiter
schneller Kommunikationsweg existiert (funktionierendes Kontaktformular,
Fax). Für Rechtssicherheit und zur Vermeidung von Abmahnungen wird die
Angabe einer Telefonnummer dennoch empfohlen.

### Neu: Wirtschafts-Identifikationsnummer (W-IdNr)

Seit November 2024 vergibt das Bundeszentralamt für Steuern (BZSt)
automatisch W-IdNr. an alle umsatzsteuerlich erfassten Unternehmen
(Pflicht in §5 Abs. 1 Nr. 6 DDG).

- **Format:** `DE` + 9 Ziffern + 5-stelliges Unterscheidungsmerkmal,
  z.B. `DE976853412-00001`
- **Hierarchie:** Hat das Unternehmen eine USt-IdNr. UND eine W-IdNr.,
  reicht die Angabe **einer** der beiden im Impressum.
- **Sobald zugeteilt:** muss im Impressum erscheinen — kein Aufschub.
- **API-Feld:** `w_id_nr` in `company_info`-Tabelle und impressum-Edge-Function.
  Sobald Max die W-IdNr. erhält: in Supabase eintragen, API liefert sie
  automatisch an alle Projekte.

### Pseudonym / Markenzeile (seit 2026-05-20)

Einzelunternehmer können neben dem amtlichen Namen eine **Marken-/Pseudonym-Zeile**
führen — sie ersetzt die Rechtsperson nicht, ergänzt sie nur. Im Impressum
erscheint sie zwischen `owner_name` und `street`, damit Empfänger zuordnen
können, unter welcher Marke der Anbieter auftritt.

- **API-Feld:** `pseudonym` in `maxone.company_info` (Key-Value-Eintrag) und
  in der `impressum`-Edge-Function-Response.
- **Format:** Klartext mit den Brand-typischen Trennzeichen (z.B. `- maxone.one -`).
  Niemals die `owner_name`-Zeile überschreiben — Pseudonym ist additiv.
- **Render-Reihenfolge:** `legal_name` → `owner_name` → `pseudonym` → `street`
  → `zip city` → `country`.
- **Optional:** Projekte können das Feld weglassen, wenn `pseudonym` leer ist;
  ein leerer String darf keine Leerzeile produzieren.

### Zusätzlich für Kapitalgesellschaften (GmbH, UG, AG)

Erkennung: API-Response enthält `register_court` **und** `register_number`.

| API-Feld | Rechtsgrundlage | Pflicht |
|---|---|---|
| `register_court` + `register_number` | §5 Abs. 1 Nr. 4 DDG — Handelsregister | immer |
| `legal_form` (GmbH, UG, AG, …) | §5 Abs. 1 Nr. 1 DDG — Rechtsform | immer |
| Vertretungsberechtigte Person | §5 Abs. 1 Nr. 1 DDG — Geschäftsführer | immer |

## Pflicht-Bestandteile jeder Impressum-Seite (statisch)

Zusätzlich zu den dynamischen API-Feldern MUSS jede Impressum-Seite einen
**statischen §36-VSBG-Block** enthalten. Die API liefert diesen Text
bewusst nicht — er ist für alle Projekte identisch und rechtlich statisch:

```
Verbraucherschlichtung

Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren
vor einer Verbraucherschlichtungsstelle teilzunehmen.
```

**Rechtsgrundlage:** §36 Abs. 1 VSBG — gilt für alle Unternehmer mit Website.

### Verbotener ODR-Link (abmahnfähig seit 20.07.2025)

Die EU-Plattform zur Online-Streitbeilegung (`ec.europa.eu/consumers/odr`)
wurde am **20. Juli 2025** abgeschaltet (VO (EU) 2024/3228 hebt ODR-VO
(EU) 524/2013 auf). Ein weiterhin angezeigter Link gilt als Irreführung
nach UWG — **abmahnfähig**. Weder im Quellcode noch im gerenderten HTML
darf der Link erscheinen.

## Häufige Abmahngründe (Risiko-Checkliste)

Seit Umsetzung der EU-Richtlinie zur Stärkung des Verbraucherschutzes
gilt fast **jeder Verstoß** gegen §5 DDG als abmahnfähig (kein
Bagatell-Privileg mehr). Typische Angriffspunkte:

| Fehler | Risiko |
|---|---|
| Veraltete Adresse / E-Mail / Telefon | HOCH — sofort abmahnbar |
| Fehlende oder falsche USt-IdNr / W-IdNr | HOCH |
| ODR-Link noch vorhanden (seit 20.07.2025) | HOCH |
| Impressum nicht innerhalb 2 Klicks erreichbar | MITTEL |
| Nur PDF, kein HTML-Impressum | MITTEL |
| §5 TMG statt §5 DDG erwähnt (wenn Gesetz genannt) | NIEDRIG |
| Fehlende Angaben bei Kapitalgesellschaft (HRB, GF) | HOCH |

## Warum zentrale API

Stammdaten ändern sich (Adresse, Steuer-IdNr., W-IdNr., Geschäftsführer).
Ohne zentrale API müssten 10+ Projekte einzeln aktualisiert werden — mit
Drift-Risiko. Einmal in Supabase (`company_info`-Tabelle) ändern →
alle Projekte liefern automatisch korrekten Stand.

Der §36-VSBG-Block ist NICHT Teil der API — er ist identisch für alle
Projekte und ändert sich nicht mit Stammdaten.

## Wie anwenden

**Empfohlenes Pattern** (Server-Rendering mit Cache, nicht jedes Request neu):

```ts
// Beispiel Next.js App Router
const IMPRESSUM_API = 'https://panel.maxone.one/functions/v1/impressum';

async function getImpressum() {
  const res = await fetch(IMPRESSUM_API, { next: { revalidate: 3600 } });
  return res.json();
}
```

Template-Pflichtblock (statisch, nach den dynamischen Feldern):

```tsx
<section>
  <h2>Verbraucherschlichtung</h2>
  <p>
    Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren
    vor einer Verbraucherschlichtungsstelle teilzunehmen.
  </p>
</section>
```

**Niemals:**
- Impressum-Felder hardcoden (Adresse, Steuer-IdNr., E-Mail usw.)
- API-Call ohne Cache (jedes Request belastet Supabase)
- Auf `panel.maxone.studio` referenzieren — immer `.maxone.one`
- Den §36-VSBG-Block weglassen
- Den alten ODR-Link (`ec.europa.eu/consumers/odr`) anzeigen — abmahnfähig

**Fallback:** Wenn API nicht erreichbar: lokale Kopie des letzten
erfolgreichen Responses anzeigen + Fehler-Log. Niemals
"Impressum nicht verfügbar" — das ist rechtlich unsicher.

## Stand pro Projekt (Stand 2026-05-16)

| Projekt | Impressum | API-Call | ODR entfernt | §36 VSBG | Quelle |
|---|---|---|---|---|---|
| snapflow.one | ✅ | ✅ `.one` | ✅ | ✅ | `src/pages/legal/Impressum.tsx` |
| repivot.in | ✅ | ✅ `.one` | ✅ | ✅ | `frontend/src/pages/landing/Impressum.tsx` |
| vanfree | ✅ | ✅ `.one` | ✅ | ✅ | `app/[locale]/impressum/page.tsx` |
| stadtlahnflow | ✅ | ✅ `.one` | ✅ | ✅ | `src/app/impressum/page.tsx` |
| stadtpunkt | ✅ | ✅ `.one` | ✅ | ✅ | `src/routes/impressum/+page.svelte` |
| plansey-2026 | ✅ | ✅ `.one` | ✅ | ✅ | `app/[locale]/imprint/page.tsx` |
| zentinel | ✅ | ✅ `.one` | ✅ | ✅ | `src/routes/impressum/+page.svelte` |
| maxone.one | ✅ | ✅ `.one` | ✅ | ✅ | `apps/umbrella/src/routes/(marketing)/impressum/+page.svelte` |
| voltfair.de | ✅ | lokal | ✅ | ✅ | `app/(public)/impressum/page.tsx` |
| solarproof | ✅ | ✅ `.one` | ✅ | ✅ | `src/components/ImpressumOverlay.tsx` |
| katchi | – | – | – | – | Projekt paused |
| kitchen-station | – | – | – | – | Internes Tool |
| vector | – | – | – | – | Infra-Projekt |

## Audit

`scripts/audit.mjs` prüft pro Projekt:

1. **API-Call vorhanden?** — sucht `panel.maxone.one/functions/v1/impressum`
   - Gefunden → Basis-Anforderung erfüllt
   - `panel.maxone.studio` → WARN (Migration fällig)
   - `impressum_local_intentional: true` in Registry → akzeptiert

2. **Alter ODR-Link verboten** — sucht `ec.europa.eu/consumers/odr` im Quellcode
   - Gefunden → **FAIL** (abmahnfähig seit 20.07.2025)

3. **§36-VSBG-Erklärung vorhanden?** — sucht `Verbraucherschlichtung` oder
   `Streitbeilegungsverfahren` im Quellcode
   - Fehlt → WARN

4. **Pflichtfelder im Template** (via Live-API-Response):
   - `legal_name`, `street`, `zip`/`city`, `email`/`phone` → WARN wenn fehlt
   - `vat_id` → WARN wenn API liefert, aber Template rendert nicht
   - `w_id_nr` → WARN wenn API liefert, aber Template rendert nicht
   - Kapitalgesellschaft: `register_court`, `register_number` → WARN wenn fehlt

5. **Live-Check** (nur ohne `--local-only`) — ruft `https://<domain>/impressum`
   ab und prüft gerendertes HTML:
   - Alter ODR-Link im HTML → **FAIL** (rechtlich relevante Prüfung)
   - §36-VSBG-Erklärung fehlt im HTML → WARN

Formale Ausnahmen (`registry/exceptions.yml`) für Projekte mit bewusst
lokalen Impressum-Seiten (voltfair) sind korrekt, solange die Seiten
keinen ODR-Link enthalten und die §36-VSBG-Erklärung zeigen.
