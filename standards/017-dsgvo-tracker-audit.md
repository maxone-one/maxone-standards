# 017 — DSGVO-Tracker- und Drittdienst-Audit

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle Projekte mit `status: live` und öffentlicher Domain (Customer-facing)

## Regel

Beim Initial-Load der Live-Domain dürfen KEINE personenbezogenen Daten
(IP-Adresse, Cookies, Browser-Fingerprint) an Drittdienste fliessen,
bevor der Nutzer eingewilligt hat. Insbesondere:

- **Google Fonts ausschliesslich lokal** oder über DSGVO-konformes
  Pendant (z.B. `fonts.bunny.net`, lokal gehostet)
- **Tracker (GA, GTM, Facebook Pixel, Hotjar, etc.) erst nach Consent**
- **Externe Embeds (YouTube, Vimeo, Maps) erst nach Consent oder
  Two-Click-Lösung**
- **Vollständige Liste** aller geladenen Drittdienste in `LAUNCH-REVIEW.md`
  Section D dokumentiert (Standard 013)

Das Audit erkennt Drittdienste im **statisch ausgelieferten HTML** —
JS-injektierte Tracker werden manuell mit Webbkoll geprüft.

## Warum

DSGVO Art. 6 + TTDSG § 25: jede Verarbeitung personenbezogener Daten
durch Drittdienste vor Consent ist rechtswidrig. Konkret rechtskräftig:

- **LG München I, Az. 3 O 17493/20** (2022) — Google Fonts via CDN ist
  ohne Consent rechtswidrig, Schadensersatz pro betroffene IP. Folge:
  Abmahnwelle, Streitwerte 100–500 €.
- **CNIL Frankreich** + **Datenschutzbehörde Baden-Württemberg** haben
  ähnliche Bussgelder verhängt.
- **eigener 30-min-Vibe-Coding-Test 2026-04-27** ergab eine optisch
  überzeugende Site mit Google Fonts + GA ohne Consent — Standard-
  Vibe-Coding-Default.

Vibe-Coding-Plattformen (Lovable, Bolt, Base44, v0) liefern Templates
mit Google Fonts hart eingebunden — der Generator weiss nichts von DSGVO.
Der Standard ist defensiv: jeder Verstoss ist eine Wahrscheinlichkeit
für Abmahnung mit Schadensersatz.

Dazu kommt: ein vollständiges Drittdienst-Inventar ist Pflicht für die
Datenschutzerklärung (DSGVO Art. 13/14 — „jeder Empfänger"). Wer das
Inventar nicht kennt, kann keine korrekte Erklärung schreiben.

## Wie anwenden

**1. Bei Gate 1 (Standard 015 CONCEPT.md):**
   - Section „Externe Dienste" listet jeden geplanten Dienst mit
     AVV-Status und Server-Region; Auftragsverarbeiter werden spaeter in
     `registry/projects.yml -> data_processors` nach Standard 041 gespiegelt

**2. Bei Gate 3 (Standard 013 LAUNCH-REVIEW.md):**
   - Section D füllt das vollständige Tracker-Inventar aus
   - Manueller Webbkoll-Scan auf Staging-URL: <https://webbkoll.dataskydd.net>
   - Cookie-Inventar (DevTools → Application → Cookies)
   - Check: alle Tracker erst nach Consent geladen (Network-Tab vor und
     nach Consent-Klick vergleichen)

**3. Konkrete Pflichten:**
   - **Google Fonts:** lokal via `@fontsource/*` (npm) oder selbst-
     gehostete `.woff2`-Dateien. Falls aus historischen Gründen nicht
     möglich: Consent-Banner schaltet Fonts erst nach Klick frei.
   - **Google Analytics / GTM:** Consent-Mode v2 + Anonymize-IP +
     erst-laden-nach-Consent. Alternative: Plausible / Umami / Matomo
     (DSGVO-friendly, EU-self-host).
   - **Facebook Pixel:** nur nach Consent. Empfehlung: weglassen, durch
     UTM-Parameter + serverseitiges Conversion-Logging ersetzen.
   - **YouTube / Vimeo:** Two-Click-Lösung (`<iframe>` erst nach Klick
     einbinden) oder über `youtube-nocookie.com` mit Consent.
   - **Maps:** OpenStreetMap (Leaflet/MapLibre) statt Google Maps,
     Selbst-Hosting der Tile-Server möglich.

**4. Whitelist (eigene Dienste — kein Consent nötig):**
   - `*.maxone.one` (Vector-Chat, Analytics, Panel) — eigene Infra,
     keine Drittdienst-Übermittlung
   - eigene Subdomains der jeweiligen Projekt-Domain
   - `analytics.maxone.one` (Umami) — self-hosted, keine Cookies

**5. Empfohlene Werkzeuge:**
   - **Webbkoll** (`https://webbkoll.dataskydd.net`) — kostenlos, prüft
     externe Hosts, Cookies, TLS, Server-Region. Manuell pro Domain.
   - **Browser DevTools → Network → Domains** — manueller Cross-Check
     vor und nach Consent-Klick
   - **`scripts/audit.mjs` Standard 017** — automatisierter HTML-Scan
     auf bekannte Tracker-Patterns (siehe Audit-Sektion)

## Was das Audit NICHT findet

Das automatisierte Audit ist explizit **defensiv**, nicht vollständig:

- **Async-injektierte Tracker** (Consent-Manager, Tag Manager mit
  bedingtem Laden) erscheinen NICHT im Initial-HTML → werden vom Audit
  nicht gefunden
- **First-Party-Proxies** (z.B. `tracker.example.com` als CNAME auf
  Drittanbieter) werden nicht als Tracker erkannt
- **Server-seitiges Tracking** (Conversions API, Backend-Webhooks) ist
  per Design unsichtbar

→ Das Audit ergänzt, ersetzt aber NICHT den Webbkoll-Scan + manuellen
DevTools-Check vor jedem Live-Gang.

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live` + Domain:

1. Fetch `https://<domain>/` mit Timeout 10s
2. Scan HTML auf bekannte Tracker-Domain-Patterns (regex):
   - **Google Fonts:** `fonts.googleapis.com`, `fonts.gstatic.com`
     → **WARN** (LG München I)
   - **Google Analytics / GTM:** `google-analytics.com`,
     `googletagmanager.com`, `analytics.google.com`
     → **WARN** ("ohne Consent rechtswidrig")
   - **Facebook:** `connect.facebook.net`, `facebook.com/tr`
     → **WARN**
   - **Weitere Tracker:** Hotjar, Mixpanel, Segment, Amplitude,
     Intercom, Crazy Egg → **WARN**
   - **Externe Embeds:** YouTube, Vimeo, Google Maps → **WARN** wenn
     direkt im HTML
3. **Whitelist** (kein Flag): eigene Subdomains, `*.maxone.one`,
   `fonts.bunny.net`, `analytics.maxone.one`, jsDelivr/unpkg/cdnjs als
   reine Asset-CDNs
4. Bei Fetch-Fehler (Timeout, DNS, 5xx) → **WARN** ("Domain nicht
   erreichbar — manueller Webbkoll-Check empfohlen")
5. Wird mit `--local-only` übersprungen (kein Netzwerk)

PASS = keine bekannten Tracker im Initial-HTML.
WARN = Treffer einer Tracker-Klasse, namentlich aufgeführt.
