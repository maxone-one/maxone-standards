# 011: Live-Domain-Audits (DSGVO-Tracker · Bundle-Drift)

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle Projekte mit `status: live` und öffentlicher Domain

## Inhalt

- [A] DSGVO-Tracker- und Drittdienst-Audit
- [B] Bundle-Drift-Audit

---

## A: DSGVO-Tracker-Audit

Beim Initial-Load der Live-Domain dürfen KEINE personenbezogenen Daten (IP-Adresse, Cookies, Browser-Fingerprint) an Drittdienste fließen, bevor der Nutzer eingewilligt hat.

**Konkrete Pflichten:**
- **Google Fonts:** lokal via `@fontsource/*` oder self-hosted `.woff2`, niemals CDN ohne Consent
- **Tracker (GA, GTM, Facebook Pixel):** erst nach Consent laden (Consent-Mode v2 oder Consent-Banner)
- **Externe Embeds (YouTube, Vimeo, Maps):** Two-Click-Lösung oder `youtube-nocookie.com`
- **Maps:** OpenStreetMap (Leaflet/MapLibre) + self-hosted Tiles statt Google Maps

**Whitelist (kein Consent nötig):** `*.maxone.one`, eigene Subdomains, `fonts.bunny.net`, `analytics.maxone.one` (Umami self-hosted).

**Warum:** DSGVO Art. 6 + TTDSG §25. LG München I (2022): Google Fonts via CDN ohne Consent = rechtswidrig, Schadensersatz pro betroffene IP. Vibe-Coding-Plattformen bauen Google Fonts standardmäßig ein.

**Manueller Check (bei Gate 3):** Webbkoll (`webbkoll.dataskydd.net`), DevTools Network-Tab vor und nach Consent-Klick.

---

## B: Bundle-Drift-Audit

Das live ausgelieferte JS/CSS-Bundle darf nicht enthalten:

- **Veraltete Hostnamen** aus Migrationen (z.B. `panel.maxone.studio`, `agent.maxone.studio`, Migration auf `.one` abgeschlossen 2026-04-16)
- **Source-Maps** in Production (`.map`-Dateien öffentlich abrufbar)
- **Plattform-Wasserzeichen** der Blacklist-Anbieter (`lovable`, `bolt.new`, `base44`, `built with v0`, `replit-agent`)
- **Dev-Hosts und Loopback-URLs** (`localhost:`, `127.0.0.1:`, `host.docker.internal`)
- **Hardkodierte Secrets oder Service-Role-Keys** im gebauten Bundle

**Build-Settings um Source-Maps zu verhindern:**
- Vite: `build.sourcemap: false`
- SvelteKit: `vite.build.sourcemap: 'hidden'` (für Sentry-Upload), nie public
- Next.js: `productionBrowserSourceMaps: false`

**Bei jeder Migration:** Build-Cache leeren (`.vite/`, `.next/cache/`), neu bauen, Audit gegen **Live-Domain** laufen lassen (nicht Repo).

**Warum, Vorfälle:**
- repivot: nach `.studio`→`.one`-Migration lud Browser weiter `panel.maxone.studio/functions/v1/impressum` wegen altem Vite-Cache
- maxone.one: 2 Wochen Source-Maps im Bundle durch `--sourcemap=true` im Prod-Build → TypeScript-Quellcode öffentlich
- Lovable/Bolt-Watermark im Bundle = verlässlicher Indikator für umgangene Verbots-Liste

---

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live` + Domain (mit `--local-only` übersprungen):

**Tracker (A):**
1. Fetch `https://<domain>/` mit Timeout 10s
2. HTML auf bekannte Tracker-Patterns scannen:
   - `fonts.googleapis.com`, `fonts.gstatic.com` → **WARN**
   - `google-analytics.com`, `googletagmanager.com` → **WARN**
   - `connect.facebook.net`, `facebook.com/tr` → **WARN**
   - Hotjar, Mixpanel, Segment, Amplitude, Intercom → **WARN**
   - YouTube, Vimeo, Google Maps (direkt im HTML) → **WARN**

**Bundle-Drift (B):**
1. Fetch `https://<domain>/` + bis zu 8 Assets fetchen (5s Timeout pro Asset)
2. Pro Asset scannen:
   - `*.maxone.studio` → **WARN**
   - `//# sourceMappingURL=` → **WARN**
   - `lovable`, `bolt.new`, `base44`, `built with v0`, `replit-agent` → **FAIL**
   - `localhost:`, `127.0.0.1`, `host.docker.internal` → **WARN**
   - Service-Role-Key-Pattern (`"role":"service_role"`) → **FAIL**
