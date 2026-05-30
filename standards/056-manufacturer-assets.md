# Standard 056 — Manufacturer Asset Sourcing (Logos + Produktbilder)

**Status:** Active (2026-05-30)
**Scope:** Alle Projekte die Hersteller-Logos oder Produktbilder von Drittanbietern zeigen (venfree, SLF, voltfair, künftige Katalog-Properties)
**Owner:** Max Karastelev

## Regel

Logos und Produktbilder von Drittherstellern werden **nicht geraten, nicht generiert und nicht hot-linked** von zufälligen URLs. Sie werden systematisch bezogen: Logos über offizielle Presseseiten oder Website-Inspektion, Produktbilder über die Hersteller-Produktseiten per Playwright.

---

## A — Logos

### Bezugsreihenfolge

1. **Pressebereich / Media Kit** (bevorzugt)
   - Google-Suche: `"<Hersteller>" press media kit logo download site:<domain>`
   - Beispiele: Theben → `theben.de/the-company-en-gb/topical-themes/press/`, MDT → `mdt.de/downloads/`

2. **Website-Inspektion mit Playwright**
   ```js
   // Logos im Header der Hersteller-Website finden
   const imgs = Array.from(document.querySelectorAll('img'));
   imgs.filter(img => /logo/i.test(img.src + img.alt + img.className))
     .map(img => ({ src: img.src, w: img.naturalWidth, h: img.naturalHeight }));
   ```

3. **Bekannte stabile URLs** (KNX-Hersteller, Stand 2026-05-30):
   | Hersteller | Logo-URL |
   |---|---|
   | Theben | `https://www.theben.de/themes/theben/images/logo--theben.svg` |
   | MDT | `https://www.mdt.de/_assets/2d7a0a9f7bf302f23c5f91c8fc495140/Images/MDT_Logo.svg` |
   | Gira | `https://www.gira.de/img/logo.svg` |
   | Zennio | `https://www.zennio.com/wp-content/uploads/2026/05/zennio-logo-1.svg` |

### Speicherung

- SVGs lokal unter `public/logos/<slug>.svg` — nie hot-linken (URLs ändern sich ohne Vorwarnung)
- `manufacturers.logo_url` zeigt auf den lokalen Pfad `/logos/<slug>.svg`
- Tochtergesellschaften erben das Logo der Muttergesellschaft (`logo_url = '/logos/zennio.svg'` für `zennio-deutschland`)

---

## B — Produktbilder

### Bezugsreihenfolge

1. **Hersteller-Produktseite via Playwright** — `data-zoom`-Attribut liefert die höchste Auflösung

2. **Bekannte URL-Muster per Hersteller** (Stand 2026-05-30):

   **Theben**
   - Produktseiten-URL: `https://www.theben.de/en/<name-slug>-<order-number>`
   - Beispiel: `https://www.theben.de/en/dmg-2-t-knx-4930270`
   - Bild-CDN: `https://www.theben.de/ocsmedia/optimized/<size>/<filename>.webp`
   - `data-zoom` = `1080x1080`-Variante, `data-srcset` = `480x480`
   - Slug-Formel: Produktname → lowercase, Leerzeichen → `-`, Sonderzeichen entfernen

   **MDT**
   - Produktseiten-URL: `https://www.mdt.de/en/products/product-detail/<kategorie>/<unterkategorie>/<slug>.html`
   - Bild-CDN: `https://www.mdt.de/_assets/…/Images/<filename>` (Pfad via page inspection)

   **Gira**
   - Produktseiten-URL: `https://www.gira.de/produkte/<kategorie>/<bestell-nr>`
   - Bild-CDN: `https://www.gira.de/media/<path>`

   **Zennio**
   - Produktseiten-URL: `https://www.zennio.com/products/<slug>`
   - Bild-CDN: WordPress uploads (`/wp-content/uploads/...`)

3. **Fallback: eibhandel.de oder knxwarehouse.com** — für Produkte ohne eigene Seite beim Hersteller

### Playwright-Snippet (Produktbild extrahieren)

```js
// Auf der Hersteller-Produktseite:
const img = document.querySelector('img[alt*="<Produktname>"]');
const imageUrl = img?.getAttribute('data-zoom')        // beste Qual.
              || img?.getAttribute('data-src')
              || img?.src;
```

### Speicherung

- **Option A (bevorzugt):** `image_url` in `catalog_products` zeigt auf Hersteller-CDN-URL
  - Vorteil: kein Storage-Aufwand, Bilder immer aktuell
  - Risiko: URL kann sich ändern — bei 404-Monitoring (Standard 042) absichern

- **Option B:** Bild herunterladen → Supabase Storage → stabile eigene URL
  - Pflicht wenn: Bild aus Auth-geschütztem Bereich stammt, oder Hersteller Hot-Linking explizit verbietet

- `catalog_products.image_url` ist `text NULL` — bleibt leer wenn kein Bild gefunden

---

## C — Scraping-Prozess (Batch-Update)

### Wann ausführen

- Bei Erstanlage neuer Hersteller im Katalog
- Bei Quarterly-Refresh (Preise + Bilder synchron — Standard 036-B)
- Wenn mehr als 20 % der Produkte eines Herstellers kein `image_url` haben

### Schritt-für-Schritt

```bash
# 1. Produkte ohne Bild abfragen
ssh prod "docker exec vanfree-db psql -U postgres -d postgres -c \
  \"SELECT order_number, name FROM catalog_products WHERE status='approved' AND image_url IS NULL LIMIT 50;\""

# 2. Playwright-Script: Theben-Produkte batch-scrapen
# scripts/scrape-theben-images.mjs (Node 18+ fetch)
# - Slug aus name ableiten, URL bauen, page.goto, data-zoom extrahieren
# - Output: theben-images-{date}.json  { order_number: string, image_url: string }[]

# 3. DB-Update
# UPDATE catalog_products SET image_url = <url> WHERE order_number = <order>;
```

### Wichtig: Keine Phantoms

Vor jedem Scraping-Lauf sicherstellen dass die Produkte in der DB echte Produkte sind
(kein `status='rejected'`). Standard 050-bug-registry Regel: falsches Bild ist schlimmer als kein Bild.

---

## D — Rechtliches

- Logos und Produktbilder bleiben Eigentum der jeweiligen Hersteller
- Verwendung auf venfree.de fällt unter Produktinformations-Darstellung (§ 23 UrhG — freie Benutzung für Abbildungen von Produkten)
- Bei Direktkontakt mit Hersteller (FEGA & Schmitt, Rexel etc.) explizit nach Bildrechten fragen
- Wasserzeichen-freie Bilder aus Pressematerial bevorzugen

---

## Audit-Check

```bash
# Hersteller ohne Logo
SELECT slug FROM manufacturers WHERE logo_url IS NULL;

# Produkte ohne Bild (approved)
SELECT manufacturer, COUNT(*) FROM catalog_products
WHERE status = 'approved' AND image_url IS NULL
GROUP BY manufacturer ORDER BY COUNT(*) DESC;
```

**Ziel:** 0 Hersteller ohne Logo, ≥ 80 % der `approved`-Produkte mit `image_url`.
