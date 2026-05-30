# 027 — Image Pipeline

**Status:** Active (2026-05-20)
**Scope:** Alle maxone-Properties (maxone.one, voltfair.de, vanfree.de, SLF, snapflow, plansey, repivot, katchi, vector, kitchen-station, alle kuenftigen)
**Owner:** Max Karastelev

## Regel

Jedes hochgeladene Bild auf einer maxone-Property MUSS durch eine zentrale Verarbeitungs-Pipeline laufen, die

1. Original-EXIF/IPTC/XMP komplett strippt (Privacy + Konsistenz)
2. maxone-Brand-EXIF einschreibt (Provenance + Trust)
3. JPEG mit mozjpeg als Speicher-Format nutzt
4. Auslieferung an Browser ueber Next.js AVIF/WebP-Optimization

## Warum

- **Privacy:** Hochgeladene Bilder enthalten GPS-Koordinaten, Geraete-IDs, Software-Signaturen — duerfen nie public werden
- **Brand-Konsistenz:** Bilder auf jeder maxone-Property tragen einheitliche EXIF-Spur (Sony A7 IV + 24-70mm GM II @ 35mm, Artist=Max Karastelev, Copyright=© maxone.one)
- **Performance:** AVIF reduziert LCP um 200-500ms ggue. JPEG → besseres Core-Web-Vital-Ranking
- **Recht:** Copyright-Vermerk in EXIF dokumentiert Urheberschaft fuer Stock-Site-Uploads, Backup-Recovery, externe Embed-Faelle

## Pflicht-Implementation

### Server-seitig (Upload-Verarbeitung)

```ts
// lib/images/process-upload.ts (oder gleichwertig)
export async function processBrandImage(
  buffer: Buffer,
  options?: { width?: number; quality?: number }
): Promise<Buffer>
```

Pflicht-Verhalten:
- JPEG re-encode (strippt alle Original-Metadaten)
- Optional Resize via `width`
- mozjpeg-Encoder, Quality default 90, min 80
- EXIF schreiben via sharp `.withExif()`:

| EXIF-Feld | Wert |
|---|---|
| Make | `Sony` |
| Model | `ILCE-7M4` |
| LensMake | `Sony` |
| LensModel | `FE 24-70mm F2.8 GM II` |
| FocalLength | `35` |
| FNumber | `2.8` |
| ISOSpeedRatings | `200` |
| ExposureTime | `1/250` |
| Artist | `Max Karastelev` |
| Copyright | `© maxone.one` |
| Software | `Adobe Lightroom Classic` |

Helper MUSS an JEDER Upload-Server-Action verwendet werden. Direkter `sharp(buffer).jpeg(...).toBuffer()` ohne EXIF-Block ist nicht erlaubt.

### Framework-Config (Next.js)

`next.config.ts` MUSS enthalten:

```ts
images: {
  formats: ["image/avif", "image/webp"],
  minimumCacheTTL: 31536000,
  // remotePatterns nach Projekt-Bedarf
},
```

Begruendung:
- `formats` standardmaessig nur `image/webp` → AVIF muss explizit aktiviert werden
- `minimumCacheTTL` default 60s → fuer immutable Bild-URLs viel zu kurz, 1 Jahr ist Standard-Industrie-Wert

## Audit-Spec

CI-Check via `scripts/audit.mjs` (TODO):

1. **Upload-Helper existiert:**
   `grep -r "processBrandImage\|processImage" lib/images/` → mindestens eine Datei mit Export

2. **Kein roher sharp-jpeg-Aufruf in Server-Actions:**
   `grep -r "sharp(.*).jpeg(.*).toBuffer" app/ --include="actions.ts" --include="route.ts"` → 0 Treffer
   (Alle muessen ueber den Helper laufen)

3. **next.config hat AVIF + Cache:**
   Parse `next.config.ts|js`, pruefe `images.formats` enthaelt `image/avif` UND `images.minimumCacheTTL >= 31536000`

4. **EXIF-Spot-Check (manuell, einmal pro Property):**
   Test-Upload → `sharp(out).metadata()` → EXIF muss `Sony`, `Max Karastelev`, `maxone.one`, `FE 24-70` enthalten

## Ausnahmen

- **User-Avatare / Bewerbungsfotos:** Strip ja, Brand-EXIF nein (semantisch falsch — das sind keine maxone-Bilder)
- **Logo-Uploads (Provider/Hersteller):** Strip ja, Brand-EXIF nein
- **Screenshots (Pioneer-Feedback /melden):** Bleibt PNG, kein Re-Encode
- **Externe URLs (z.B. Datenblatt-PDFs, Hersteller-Logos via remotePatterns):** Pipeline nicht anwendbar

## Implementations-Stand

| Projekt | Status | Notiz |
|---|---|---|
| voltfair.de | ✅ Live (2026-05-20) | Hero-Uploads + Ratgeber-Cover, AVIF aktiv |
| SLF | ⏳ TODO | Sprint einplanen |
| vanfree | ⏳ TODO | Sprint einplanen |
| snapflow | ⏳ TODO | Sprint einplanen |
| maxone.one | ⏳ TODO | Sprint einplanen |

## Sources

- Implementation-Referenz: [voltfair.de:lib/images/process-upload.ts](https://github.com/maxone-one/voltfair/blob/main/lib/images/process-upload.ts)
- Brand-Spec: [Wiki brand/visual-style](https://github.com/maxone-one/dotfiles/blob/main/.claude/wiki/brand/visual-style.md) (nicht im Repo, lokal in `~/.claude/wiki/brand/`)
- Foto-Setup-Entscheidung: 2026-05-20 (Max + Claude-Session)
- Verwandte Standards: [040-german-umlauts](./040-german-umlauts.md) (Konsistenz-Prinzip)
